#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
HTTP-4-MCP Server Configuration Tool UI
Provides visual interface for API configuration
"""

import json
import os
import traceback
from typing import Dict, List, Optional, Union

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import httpx
import asyncio

# Create FastAPI application
app = FastAPI(title="HTTP-4-MCP Configuration Tool")

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Set up Jinja2 templates
templates = Jinja2Templates(directory="static/templates")

# Model definitions
class ApiParamModel(BaseModel):
    type: str
    desc: str
    required: bool = False
    default: Optional[str] = None

class ApiResponseFieldModel(BaseModel):
    path: str
    desc: Optional[str] = None

class ApiToolModel(BaseModel):
    name: str
    description: str
    url: str
    method: str = "GET"
    params: Dict[str, ApiParamModel] = {}
    headers: Dict[str, str] = {}
    response: Dict[str, Union[str, ApiResponseFieldModel]] = {}
    response_mode: str = "metadata"  # 可选值: "normal", "metadata"

class ApiConfigModel(BaseModel):
    tools: List[ApiToolModel]

# API configuration path
API_CONFIG_PATH = "config/apis.json"

# 确保配置目录存在
os.makedirs(os.path.dirname(API_CONFIG_PATH), exist_ok=True)

# API routes
@app.get("/api/config", response_model=ApiConfigModel)
async def get_config():
    """Get current API configuration"""
    try:
        # 如果文件不存在，返回空配置
        if not os.path.exists(API_CONFIG_PATH):
            return {"tools": []}
            
        with open(API_CONFIG_PATH, "r", encoding="utf-8") as f:
            config = json.load(f)
        return config
    except Exception as e:
        error_detail = f"Failed to read configuration: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # 服务器端日志记录
        raise HTTPException(status_code=500, detail=f"读取配置失败: {str(e)}")

@app.post("/api/config", response_model=ApiConfigModel)
async def save_config(config: ApiConfigModel):
    """Save API configuration"""
    try:
        # 确保目录存在
        os.makedirs(os.path.dirname(API_CONFIG_PATH), exist_ok=True)
        
        # 保存配置
        with open(API_CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(config.dict(), f, ensure_ascii=False, indent=2)
        
        return config
    except Exception as e:
        error_detail = f"Failed to save configuration: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # 服务器端日志记录
        raise HTTPException(status_code=500, detail=f"保存配置失败: {str(e)}")

@app.post("/api/tool")
async def add_tool(tool: ApiToolModel):
    """Add new tool"""
    try:
        # 确保配置目录存在
        os.makedirs(os.path.dirname(API_CONFIG_PATH), exist_ok=True)
        
        # 读取当前配置
        if os.path.exists(API_CONFIG_PATH):
            with open(API_CONFIG_PATH, "r", encoding="utf-8") as f:
                try:
                    config_data = json.load(f)
                    current_config = ApiConfigModel(**config_data)
                except json.JSONDecodeError:
                    # 如果文件损坏，创建新配置
                    current_config = ApiConfigModel(tools=[])
        else:
            # 如果文件不存在，创建新配置
            current_config = ApiConfigModel(tools=[])
        
        # 检查工具名称是否已存在
        for existing_tool in current_config.tools:
            if existing_tool.name == tool.name:
                raise HTTPException(status_code=400, detail=f"工具 '{tool.name}' 已存在")
        
        # 添加新工具
        current_config.tools.append(tool)
        
        # 保存更新后的配置
        with open(API_CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(current_config.dict(), f, ensure_ascii=False, indent=2)
        
        return {"status": "success", "message": f"工具 '{tool.name}' 已添加"}
    except HTTPException:
        raise
    except Exception as e:
        error_detail = f"Failed to add tool: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # 服务器端日志记录
        raise HTTPException(status_code=500, detail=f"添加工具失败: {str(e)}")

@app.delete("/api/tool/{tool_name}")
async def delete_tool(tool_name: str):
    """Delete tool"""
    try:
        # 确保配置文件存在
        if not os.path.exists(API_CONFIG_PATH):
            raise HTTPException(status_code=404, detail="配置文件不存在")
            
        # 读取当前配置
        with open(API_CONFIG_PATH, "r", encoding="utf-8") as f:
            config_data = json.load(f)
            current_config = ApiConfigModel(**config_data)
        
        # 查找并删除工具
        original_length = len(current_config.tools)
        current_config.tools = [tool for tool in current_config.tools if tool.name != tool_name]
        
        if len(current_config.tools) == original_length:
            raise HTTPException(status_code=404, detail=f"工具 '{tool_name}' 不存在")
        
        # 保存更新后的配置
        with open(API_CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(current_config.dict(), f, ensure_ascii=False, indent=2)
        
        return {"status": "success", "message": f"工具 '{tool_name}' 已删除"}
    except HTTPException:
        raise
    except Exception as e:
        error_detail = f"Failed to delete tool: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # 服务器端日志记录
        raise HTTPException(status_code=500, detail=f"删除工具失败: {str(e)}")

@app.post("/api/reload")
async def reload_config():
    """Notify server to reload configuration"""
    try:
        # 发送请求到服务器的重载端点
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get("http://localhost:8000/admin/reload")
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                raise HTTPException(status_code=e.response.status_code, 
                                   detail=f"服务器返回错误: {e.response.text}")
            except httpx.RequestError as e:
                raise HTTPException(status_code=500, 
                                   detail=f"无法连接到MCP服务器: {str(e)}")
    except Exception as e:
        error_detail = f"Failed to reload configuration: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # 服务器端日志记录
        raise HTTPException(status_code=500, detail=f"重载配置失败: {str(e)}")

# 测试请求API
@app.post("/api/test_request")
async def test_request(request_data: dict):
    try:
        url = request_data.get("url")
        method = request_data.get("method", "GET")
        headers = request_data.get("headers", {})
        params = request_data.get("params", {})
        body = request_data.get("body", {})
        
        if not url:
            raise HTTPException(status_code=400, detail="URL不能为空")
        
        # 准备请求参数
        request_kwargs = {
            "method": method,
            "url": url,
            "headers": headers
        }
        
        # 根据请求方法处理参数
        if method == "GET":
            # GET请求参数应该已经包含在URL中，前端已处理
            pass
        elif method in ["POST", "PUT", "PATCH"]:
            # 对于POST/PUT请求，添加JSON主体
            if body:
                request_kwargs["json"] = body
        
        # 使用httpx发送实际请求
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                print(f"发送API测试请求: {method} {url}")
                print(f"请求头: {headers}")
                if body:
                    print(f"请求体: {body}")
                
                response = await client.request(**request_kwargs)
                print(f"API测试请求响应: {response.status_code} {response.text}")
                
                try:
                    # 尝试解析为JSON
                    result = response.json()
                    return {
                        "success": True,
                        "status_code": response.status_code,
                        "data": result
                    }
                except:
                    # 如果不是JSON，返回文本
                    return {
                        "success": True,
                        "status_code": response.status_code,
                        "data": {
                            "content": response.text,
                            "raw_response": True
                        }
                    }
            except httpx.HTTPStatusError as e:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "error": f"HTTP错误: 状态码 {e.response.status_code}"}
                )
            except httpx.RequestError as e:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "error": f"请求错误: {str(e)}"}
                )
    
    except Exception as e:
        error_detail = f"Test request failed: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # 服务器端日志记录
        return JSONResponse(
            status_code=500, 
            content={"success": False, "error": f"测试请求失败: {str(e)}"}
        )

# 错误处理中间件
@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        error_detail = f"Unhandled exception: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # 服务器端日志记录
        
        if isinstance(e, HTTPException):
            return JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail}
            )
        
        return JSONResponse(
            status_code=500,
            content={"detail": f"服务器内部错误: {str(e)}"}
        )

# Home page
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Configuration tool homepage with Apple Design + Pixel style + emojis"""
    return templates.TemplateResponse("index.html", {"request": request})

# Run configuration tool server
def run_config_ui(host="0.0.0.0", port=8001):
    """Run configuration tool UI server"""
    import uvicorn
    uvicorn.run(app, host=host, port=port) 