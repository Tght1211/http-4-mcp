#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Start HTTP-4-MCP Configuration Tool UI
带有Apple设计风格和像素艺术的UI界面
"""

import argparse
import os
import sys
import subprocess
from config_ui import run_config_ui

def check_environment():
    """检查环境和权限"""
    try:
        # 运行权限检查脚本
        result = subprocess.run([sys.executable, 'check_permissions.py'], 
                                capture_output=True, text=True)
        
        # 打印检查结果
        print(result.stdout)
        
        if result.returncode != 0:
            print("[!] 权限检查未通过，请解决问题后再启动")
            print(result.stderr)
            return False
        
        return True
    except Exception as e:
        print(f"[-] 权限检查失败: {str(e)}")
        return False

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Start HTTP-4-MCP Configuration Tool UI')
    parser.add_argument('--host', default='0.0.0.0', help='Server host address')
    parser.add_argument('--port', type=int, default=8002, help='Server port')
    parser.add_argument('--skip-checks', action='store_true', help='Skip environment checks')
    
    args = parser.parse_args()
    
    # 检查环境
    if not args.skip_checks:
        if not check_environment():
            print("[*] 提示: 使用 --skip-checks 参数可以跳过环境检查")
            sys.exit(1)
    
    # 确保静态文件目录存在
    os.makedirs("static/css", exist_ok=True)
    os.makedirs("static/js", exist_ok=True)
    os.makedirs("static/img", exist_ok=True)
    os.makedirs("static/templates", exist_ok=True)
    
    # 确保配置目录存在
    os.makedirs("config", exist_ok=True)
    
    # 显示启动信息
    print("*** Starting HTTP-4-MCP Configuration Tool UI ***")
    print(f"[+] Server running at: http://{args.host}:{args.port}")
    print("[+] UI Style: Apple Design + Pixel Art")
    print("[*] Press CTRL+C to quit")
    
    try:
        run_config_ui(host=args.host, port=args.port)
    except KeyboardInterrupt:
        print("\n[*] Server stopped")
        sys.exit(0)
    except Exception as e:
        print(f"\n[-] 启动失败: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 