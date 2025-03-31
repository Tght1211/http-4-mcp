# 🚀 HTTP-4-MCP 中间件服务器

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/Python-3.8+-green.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)

</div>

## 🌟 项目介绍

HTTP-4-MCP 是一个强大的中间件服务器，它能够将普通的 HTTP 接口 **魔法般地转换** 为 MCP（Model Control Protocol）接口。通过简单的配置，让你的 HTTP API 秒变 MCP 工具！

### ✨ 主要特性

- 🔄 **HTTP 转 MCP**：一键转换 HTTP API 为 MCP 接口
- 📝 **JSON 配置**：简单直观的配置方式
- 🌊 **SSE 支持**：实时数据流传输
- 🎨 **可视化配置**：拖拽式界面，像玩游戏一样配置 API
- 🔥 **热重载**：配置即时生效，无需重启
- 📊 **完整监控**：详细的日志和错误追踪
- 🛡️ **安全可靠**：内置错误处理和参数校验

## 👨‍💻 作者信息

<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-tght1211-181717?style=for-the-badge&logo=github)](https://github.com/tght1211)
[![Gitee](https://img.shields.io/badge/Gitee-tght1211-C71D23?style=for-the-badge&logo=gitee)](https://gitee.com/tght1211)

</div>

## 📸 系统演示

<div align="center">

### 🖥️ 直观的可视化配置界面

![可视化配置界面](image/image.png)

### 🔄 强大的API转换功能

![API转换功能](image/image1.png)

### 📊 支持cURL导入

![支持cURL导入](image/image2.png)

### 🚀 工具描述

![工具描述](image/image3.png)

</div>

## 🚀 快速开始

### 📦 安装

```bash
# 克隆仓库
git clone https://gitee.com/tght1211/http-for-mcp-server.git
# or git clone https://github.com/tght1211/http-for-mcp-server.git

cd http-for-mcp-server

# 安装依赖（推荐使用 uv 包管理器）
uv venv
uv pip install -r requirements.txt
```

### 🎮 启动服务

```bash
# 激活虚拟环境
.venv/Scripts/activate  # Windows
source .venv/bin/activate  # Linux/Mac

# 启动主服务器
uv run run.py

# 启动配置界面（可选）
uv run run_config_ui.py
```

## 🎯 使用方法

### 1️⃣ 配置 API

#### 方式一：🎨 可视化配置（推荐）

1. 访问 `http://localhost:8002`
2. 点击 "添加新接口"
3. 填写配置参数
4. 一键保存生效！

#### 方式二：📝 JSON 配置

```json
{
  "tools": [
      {
          "name": "weather_api",
          "description": "获取指定城市的实时天气信息，包括温度、湿度、天气状况、风向和风速。\n    \n    该工具使用两步查询流程：\n    1. 首先通过城市名称获取城市的精确位置ID\n    2. 然后使用位置ID查询实时天气数据\n    \n    示例用法：\n    - 获取\"北京\"的天气信息\n    - 获取\"上海\"的实时天气状况\n    - 查询\"广州\"的温度和湿度\n    \n    返回格式化的天气信息文本，包含城市名称、天气状况、温度、湿度、风向和风速。",
          "url": "https://devapi.qweather.com/v7/weather/now",
          "method": "GET",
          "params": {
              "location": {
                  "type": "string",
                  "desc": "City name or ID",
                  "required": true,
                  "default": "101010100"
              },
              "key": {
                  "type": "string",
                  "desc": "API key",
                  "required": true,
                  "default": "05a3e2c04b65416e912088b76a7a487e"
              },
              "lang": {
                  "type": "string",
                  "desc": "Language",
                  "required": false,
                  "default": "zh"
              },
              "unit": {
                  "type": "string",
                  "desc": "Unit system",
                  "required": false,
                  "default": "m"
              }
          },
          "headers": {
              "User-Agent": "weather-app/1.0"
          },
          "response": {
              "code": {
                  "path": "code",
                  "desc": "响应状态码"
              },
              "updateTime": {
                  "path": "updateTime",
                  "desc": "数据更新时间"
              },
              "fxLink": {
                  "path": "fxLink",
                  "desc": "详细天气信息链接"
              },
              "now": {
                  "path": "now",
                  "desc": "实时天气数据对象"
              },
              "now_obsTime": {
                  "path": "now.obsTime",
                  "desc": "实际观测时间"
              },
              "now_temp": {
                  "path": "now.temp",
                  "desc": "当前温度（摄氏度）"
              },
              "now_feelsLike": {
                  "path": "now.feelsLike",
                  "desc": "体感温度（摄氏度）"
              },
              "now_icon": {
                  "path": "now.icon",
                  "desc": "天气图标代码"
              },
              "now_text": {
                  "path": "now.text",
                  "desc": "天气现象文字描述"
              },
              "now_wind360": {
                  "path": "now.wind360",
                  "desc": "风向360度角度"
              },
              "now_windDir": {
                  "path": "now.windDir",
                  "desc": "风向方位描述"
              },
              "now_windScale": {
                  "path": "now.windScale",
                  "desc": "风力等级"
              },
              "now_windSpeed": {
                  "path": "now.windSpeed",
                  "desc": "风速（公里/小时）"
              },
              "now_humidity": {
                  "path": "now.humidity",
                  "desc": "相对湿度百分比"
              },
              "now_precip": {
                  "path": "now.precip",
                  "desc": "降水量（毫米）"
              },
              "now_pressure": {
                  "path": "now.pressure",
                  "desc": "大气压（百帕）"
              },
              "now_vis": {
                  "path": "now.vis",
                  "desc": "能见度（公里）"
              },
              "now_cloud": {
                  "path": "now.cloud",
                  "desc": "云量百分比"
              },
              "now_dew": {
                  "path": "now.dew",
                  "desc": "露点温度（摄氏度）"
              }
          },
          "response_mode": "metadata"
      }
  ]
}
```

### 2️⃣ 连接 MCP

```python
# SSE 连接地址
ws_url = "http://localhost:8000/mcp/sse"
```

## 🛠️ 项目结构

```
📦 http-for-mcp-server
 ┣ 📂 config/            # 配置文件
 ┣ 📂 demo/             # 示例代码
 ┣ 📂 static/           # 静态资源
 ┣ 📜 mcp_server.py     # 主服务器
 ┣ 📜 config_ui.py      # 配置界面
 ┣ 📜 run.py           # 启动脚本
 ┗ 📜 requirements.txt  # 依赖清单
```

## 📚 配置参考

### 🔧 全局配置

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| 🌐 host | 服务器地址 | "0.0.0.0" |
| 🔌 port | 服务器端口 | 8000 |
| 🐛 debug | 调试模式 | false |
| 📝 log_level | 日志级别 | "info" |

## 🎉 特别功能

### 🔄 cURL 导入

直接粘贴 cURL 命令，自动生成配置：

```bash
curl -X GET 'https://api.example.com/weather?city=beijing'
```

### 🎨 像素风界面

- 🎮 游戏化的配置体验
- 🎯 拖拽式参数设置
- 📊 实时请求测试
- 🔄 自动生成配置

## 🤝 贡献指南

1. 🍴 Fork 本仓库
2. 🔧 创建特性分支
3. 📝 提交改动
4. 🚀 推送分支
5. 📬 提交 Pull Request

## 📞 获取帮助

- 📧 提交 Issue
- 💬 加入讨论组
- 📚 查看 Wiki

## 📄 开源协议

本项目采用 MIT 协议 - 详见 [LICENSE](LICENSE) 文件

---

<div align="center">
⭐️ 如果这个项目帮助到你，请给一个 star！⭐️
</div>

