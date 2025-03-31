import argparse
import json
 
import httpx
import uvicorn
from mcp.server import FastMCP, Server
from mcp.server.sse import SseServerTransport
from starlette.applications import Starlette
from starlette.routing import Route, Mount
 
mcp = FastMCP("sse_WeatherServer")
 
QWEATHER_API_KEY = "05a3e2c04b65416e912088b76a7a487e"
# 城市搜索API地址
QWEATHER_CITY_LOOKUP_URL = "https://geoapi.qweather.com/v2/city/lookup"
# 实时天气API地址
QWEATHER_BASE_URL = "https://devapi.qweather.com/v7/weather/now"
USER_AGENT = "weather-app/1.0"

async def get_location_id(city):
    """
    从和风天气API获取城市的locationId
    :param city: 城市名称（中文或英文）
    :return: 城市的locationId；若发生错误，返回None
    """
    params = {
        "location": city,
        "key": QWEATHER_API_KEY,
        "lang": "zh"
    }
    headers = {"User-Agent": USER_AGENT}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(QWEATHER_CITY_LOOKUP_URL, params=params, headers=headers, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            if data.get("code") == "200" and data.get("location") and len(data["location"]) > 0:
                return data["location"][0]["id"], data["location"][0]["name"]
            else:
                return None, None
        except Exception as e:
            return None, None
 
async def get_weather(city):
    """
    从和风天气API获取天气信息
    :param city: 城市名称（中文或英文）
    :return: 天气数据字典；若发生错误，返回包含error信息的字典
    """
    # 先获取城市的locationId
    location_id, location_name = await get_location_id(city)
    
    if not location_id:
        return {"error": f"无法找到城市'{city}'的位置ID"}
    
    params = {
        "location": location_id,  # 使用locationId而不是城市名
        "key": QWEATHER_API_KEY,
        "lang": "zh",
        "unit": "m"
    }
    headers = {"User-Agent": USER_AGENT}
 
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(QWEATHER_BASE_URL, params=params, headers=headers, timeout=30)
            response.raise_for_status()
            data = response.json()
            # 添加城市名称到返回数据中
            if "now" in data:
                data["city_name"] = location_name
            return data
        except httpx.HTTPStatusError as e:
            return {"error": f"HTTP请求错误：{e}"}
        except Exception as e:
            return {"error": f"发生错误：{e}"}
 
def format_weather_data(data):
    """
    格式化天气数据
    :param data: 天气数据字典
    :return: 格式化后的字符串；若发生错误，返回包含error信息的字符串
    """
 
    #  如果传入的是字符串，则先转换成字典
    if isinstance(data, str):
        data = json.loads(data)
 
    if "error" in data:
        return data["error"]
    
    # 检查API返回的状态码
    if data.get("code") != "200":
        return f"获取天气数据失败，错误码：{data.get('code')}"
    
    now = data["now"]
    city = data.get("city_name", "未知城市")
    weather = now["text"]
    temperature = now["temp"]
    humidity = now["humidity"]
    wind_dir = now["windDir"]
    wind_speed = now["windSpeed"]
    
    return f"城市：{city}\n天气：{weather}\n温度：{temperature}°C\n湿度：{humidity}%\n风向：{wind_dir}\n风速：{wind_speed}km/h"
 
 
@mcp.tool(
    name="get_weather_tool",
    description="""获取指定城市的实时天气信息，包括温度、湿度、天气状况、风向和风速。
    
    该工具使用两步查询流程：
    1. 首先通过城市名称获取城市的精确位置ID
    2. 然后使用位置ID查询实时天气数据
    
    示例用法：
    - 获取"北京"的天气信息
    - 获取"上海"的实时天气状况
    - 查询"广州"的温度和湿度
    
    返回格式化的天气信息文本，包含城市名称、天气状况、温度、湿度、风向和风速。"""
)
async def get_weather_tool(city: str):
    """
    获取城市的天气信息
    :param city: 城市名称（支持中文或英文）
    :return: 格式化的天气信息字符串；若发生错误，返回包含error信息的字符串
    """
    weather_data = await get_weather(city)
    return format_weather_data(weather_data)
 
 
def create_starlette_app(mcp_server: Server, *, debug: bool = False):
    """创建 Starlette 应用能通过sse提供mcp服务"""
    sse = SseServerTransport("/messages/")
 
    async def handle_sse(request):
        async with sse.connect_sse(
            request.scope,
            request.receive,
            request._send,
        ) as (read_stream,write_stream):
            await mcp_server.run(
                read_stream,
                write_stream,
                mcp_server.create_initialization_options(),
            )
 
    return Starlette(
        debug=debug,
        routes=[
            Route("/sse", endpoint=handle_sse),
            Mount("/messages/", app=sse.handle_post_message),
        ],
    )
 
 
 
if __name__ == "__main__":
    mcp_server = mcp._mcp_server
 
    parser = argparse.ArgumentParser(description='Run MCP SSE-based server')
    parser.add_argument("--host", default="0.0.0.0", help="MCP server host")
    parser.add_argument("--port", default=18082, type=int, help="MCP server port")
    args = parser.parse_args()
 
    starlette_app = create_starlette_app(mcp_server, debug=True)
    uvicorn.run(starlette_app, host=args.host, port=args.port)
 
 
 
 
 