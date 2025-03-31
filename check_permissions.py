#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
检查并修复配置目录权限
"""

import os
import sys
import stat
import shutil

CONFIG_PATH = "config/apis.json"
CONFIG_DIR = os.path.dirname(CONFIG_PATH)

def check_and_fix_permissions():
    """检查并修复配置目录权限"""
    print("[*] 检查配置目录权限...")
    
    # 确保配置目录存在
    if not os.path.exists(CONFIG_DIR):
        try:
            print("[+] 创建配置目录: " + CONFIG_DIR)
            os.makedirs(CONFIG_DIR, exist_ok=True)
        except Exception as e:
            print("[-] 创建目录失败: " + str(e))
            return False
    
    # 检查目录权限
    try:
        # 尝试创建测试文件
        test_file = os.path.join(CONFIG_DIR, "test_write.tmp")
        with open(test_file, 'w') as f:
            f.write("Test")
        
        # 如果成功，删除测试文件
        os.remove(test_file)
        print("[+] 配置目录权限正常，可以读写文件")
        return True
    except Exception as e:
        print("[!] 配置目录权限问题: " + str(e))
        
        # 尝试修复权限
        try:
            print("[*] 尝试修复权限...")
            
            # 在Windows上，我们尝试通过icacls命令修复
            if sys.platform.startswith('win'):
                username = os.environ.get('USERNAME', '')
                if username:
                    os.system(f'icacls "{os.path.abspath(CONFIG_DIR)}" /grant "{username}":F /T')
            # 在Unix/Linux/Mac上，我们使用chmod
            else:
                os.chmod(CONFIG_DIR, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
            
            print("[+] 权限已修复")
            return True
        except Exception as e:
            print("[-] 权限修复失败: " + str(e))
            print("\n建议手动解决权限问题：")
            print(f"1. 确保用户对目录 '{os.path.abspath(CONFIG_DIR)}' 有完全访问权限")
            print("2. 如果问题仍然存在，尝试以管理员身份运行程序")
            return False

def check_config_file():
    """检查配置文件是否存在且有效"""
    if not os.path.exists(CONFIG_PATH):
        print("[*] 配置文件不存在，将在应用启动时自动创建")
        return True
    
    try:
        # 尝试读取文件
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            content = f.read()
            import json
            json.loads(content)  # 检查JSON格式是否有效
        print("[+] 配置文件有效")
        return True
    except Exception as e:
        print("[!] 配置文件可能损坏: " + str(e))
        
        # 备份并创建新文件
        try:
            backup_path = f"{CONFIG_PATH}.bak"
            print("[*] 备份当前配置文件到 " + backup_path)
            shutil.copy2(CONFIG_PATH, backup_path)
            
            print("[*] 创建新的配置文件")
            with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
                f.write('{"tools": []}')
            
            print("[+] 配置文件已重置")
            return True
        except Exception as e:
            print("[-] 修复配置文件失败: " + str(e))
            return False

if __name__ == "__main__":
    print("==== HTTP-4-MCP 配置工具 - 权限和配置检查 ====")
    perm_ok = check_and_fix_permissions()
    config_ok = check_config_file()
    
    if perm_ok and config_ok:
        print("\n[+] 所有检查通过，可以启动应用")
        sys.exit(0)
    else:
        print("\n[!] 检查未通过，需要手动解决问题后再启动应用")
        sys.exit(1) 