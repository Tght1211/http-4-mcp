#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import logging
import os
from typing import Any, Dict, List, Optional, Union

import httpx
import uvicorn
from mcp.server import FastMCP, Server
from mcp.server.sse import SseServerTransport
from pydantic import BaseModel, Field
from starlette.applications import Starlette
from starlette.routing import Route, Mount

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger("mcp_server")

# Model definitions
class ApiParam(BaseModel):
    type: str
    desc: str
    required: bool = False
    default: Any = None

class ApiResponseField(BaseModel):
    path: str
    desc: Optional[str] = None

class ApiTool(BaseModel):
    name: str
    description: str
    url: str
    method: str = "GET"
    params: Dict[str, ApiParam]
    headers: Dict[str, str] = Field(default_factory=dict)
    response: Dict[str, Union[str, ApiResponseField]] = Field(default_factory=dict)
    response_transform: Optional[Dict[str, Any]] = None
    response_mode: str = "metadata"  # 可选值: "normal", "metadata"

class ApiConfig(BaseModel):
    tools: List[ApiTool]

# Utility functions
def get_nested_value(data, path):
    keys = path.split('.')
    result = data
    for key in keys:
        if isinstance(result, dict) and key in result:
            result = result[key]
        else:
            return None
    return result

def load_api_config(config_path):
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config_data = json.load(f)
        return ApiConfig(**config_data)
    except Exception as e:
        logger.error(f"Failed to load API configuration: {e}")
        raise

async def make_http_request(tool, params, timeout=30):
    # Process request parameters
    processed_params = {}
    for name, param_config in tool.params.items():
        if name in params:
            processed_params[name] = params[name]
        elif param_config.default is not None:
            processed_params[name] = param_config.default
        elif param_config.required:
            raise ValueError(f"Missing required parameter: {name}")
    
    # Use headers directly
    headers = tool.headers.copy()
    
    # Make request
    async with httpx.AsyncClient() as client:
        try:
            if tool.method.upper() == "GET":
                response = await client.get(
                    tool.url, 
                    params=processed_params, 
                    headers=headers, 
                    timeout=timeout
                )
            elif tool.method.upper() == "POST":
                response = await client.post(
                    tool.url, 
                    json=processed_params, 
                    headers=headers, 
                    timeout=timeout
                )
            elif tool.method.upper() == "PUT":
                response = await client.put(
                    tool.url, 
                    json=processed_params, 
                    headers=headers, 
                    timeout=timeout
                )
            elif tool.method.upper() == "DELETE":
                response = await client.delete(
                    tool.url, 
                    params=processed_params, 
                    headers=headers, 
                    timeout=timeout
                )
            else:
                raise ValueError(f"Unsupported HTTP method: {tool.method}")
            
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"HTTP request error: {e}")
            raise

def transform_response(data, mapping, response_mode="metadata"):
    if not mapping:
        return data
    
    # 检查是否需要处理为元数据格式
    if response_mode == "metadata":
        return create_metadata_response(data, mapping)
    
    # 原始的转换逻辑 - 普通模式
    result = {}
    for output_key, source in mapping.items():
        # 支持新旧两种格式
        if isinstance(source, str):
            path = source
        else:
            path = source.path
        
        result[output_key] = get_nested_value(data, path)
    
    return result

def create_metadata_response(data, mapping):
    """
    将原始数据和映射转换为包含元数据的新格式
    """
    # 创建元数据对象
    metadata = {
        "field_paths": {},
    }
    
    # 将原始数据复制到元数据中
    for key, value in data.items():
        metadata[key] = value
    
    # 处理映射生成field_paths
    for output_key, source in mapping.items():
        # 提取路径和描述
        if isinstance(source, str):
            path = source
            desc = output_key  # 如果没有描述，使用输出键作为描述
        else:
            path = source.path
            desc = source.desc if source.desc is not None else output_key
        
        # 转换@arr和@arr_格式为[]格式
        normalized_path = normalize_path(path, output_key)
        
        # 添加到field_paths
        metadata["field_paths"][normalized_path] = desc
    
    # 创建最终响应
    return {
        "__metadata__": metadata
    }

def normalize_path(path, output_key):
    """
    将路径格式从data.items@arr和data.items@arr_property转换为data.items[]和data.items[].property
    """
    # 如果输出键包含@arr后缀但不包含@arr_，表示这是数组
    if "@arr" in output_key and "@arr_" not in output_key:
        return f"{path}[]"
    # 如果输出键包含@arr_后缀，表示这是数组元素的属性
    elif "@arr_" in output_key:
        # 从路径中提取基础路径和属性名
        parts = path.split(".")
        property_name = parts[-1]
        base_path = ".".join(parts[:-1])
        return f"{base_path}[].{property_name}"
    # 其他情况保持原样
    else:
        return path

# MCP Server class
class HttpMcpServer:
    def __init__(self, config_path="config/config.json", apis_path="config/apis.json"):
        self.config_path = config_path
        self.apis_path = apis_path
        self.config = self._load_config()
        self.api_config = load_api_config(apis_path)
        
        # Create MCP server
        self.mcp = FastMCP("http_mcp_server")
        self._register_tools()
        
        # Create Starlette app
        self.app = self._create_starlette_app()
    
    def _load_config(self):
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return {
                "host": "0.0.0.0",
                "port": 8000,
                "debug": False,
                "log_level": "info",
                "max_workers": 10,
                "timeout": 30
            }
    
    def _register_tools(self):
        for tool_config in self.api_config.tools:
            self._register_tool(tool_config)
    
    def _register_tool(self, tool_config):
        async def tool_handler(**kwargs):
            try:
                logger.info(f"📢 HTTP-4-MCP Tool ✨【{tool_config.name}】✨ called with kwargs: {kwargs}")
                # Make HTTP request
                response_data = await make_http_request(
                    tool_config,
                    kwargs,
                    timeout=self.config.get("timeout", 30)
                )
                # logger.info(f"HTTP-4-MCP Tool {tool_config.name} response: {response_data}")
                # Transform response
                if tool_config.response:
                    transformed_data = transform_response(
                        response_data, 
                        tool_config.response,
                        response_mode=tool_config.response_mode
                    )
                    # logger.info(f"HTTP-4-MCP Tool {tool_config.name} transformed data: {transformed_data}")
                    return transformed_data
                
                return response_data
            except Exception as e:
                logger.error(f"❌ HTTP-4-MCP Tool ✨【{tool_config.name}】✨ execution failed: {e}")
                return {"error": str(e)}
        

        base_description = "返回的数据是一个类似下面的json对象，请根据这个json对象生成对应的mcp工具的描述。field_paths是对下面的字段的描述，你需要从json中找出你需要的内容\n"
        base_template = "{\"__metadata__\":{\"field_paths\":{\"code\":\"响应码\",\"location[]\":\"数组\",\"location[].name\":\"名称\",},\"code\":\"200\",\"location\":[{\"name\":\"杭州\",}]}}\n"
        base_params = "我的入参有:" + str(tool_config.params) + "\n"
        # Register to MCP server
        self.mcp.tool(
            name=tool_config.name,
            description=tool_config.description + base_description + base_template + base_params
        )(tool_handler)
        
        logger.info(f"🐖 HTTP-4-MCP Registered API tool: ✨{tool_config.name}✨")
    
    def _create_starlette_app(self):
        mcp_server = self.mcp._mcp_server
        sse = SseServerTransport("/messages/")
        
        async def handle_sse(request):
            async with sse.connect_sse(
                request.scope,
                request.receive,
                request._send,
            ) as (read_stream, write_stream):
                await mcp_server.run(
                    read_stream,
                    write_stream,
                    mcp_server.create_initialization_options(),
                )
        
        async def reload_config(request):
            try:
                self.api_config = load_api_config(self.apis_path)
                self._register_tools()
                return {"status": "success", "message": "Configuration reloaded successfully"}
            except Exception as e:
                logger.error(f"Failed to reload config: {e}")
                return {"status": "error", "message": str(e)}
        
        app = Starlette(
            debug=self.config.get("debug", False),
            routes=[
                Route("/mcp/sse", endpoint=handle_sse),
                Mount("/messages/", app=sse.handle_post_message),
                Route("/admin/reload", endpoint=reload_config)
            ],
        )
        
        return app
    
    def run(self, host=None, port=None):
        host = host or self.config.get("host", "0.0.0.0")
        port = port or self.config.get("port", 8000)
        
        logger.info(f"Starting HTTP-4-MCP middleware server at http://{host}:{port}")
        uvicorn.run(
            self.app,
            host=host,
            port=port,
            log_level=self.config.get("log_level", "info")
        ) 