#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import argparse
from mcp_server import HttpMcpServer

def main():
    parser = argparse.ArgumentParser(description='Start HTTP-4-MCP middleware server')
    parser.add_argument('--host', help='Server host address')
    parser.add_argument('--port', type=int, help='Server port')
    parser.add_argument('--config', default='config/config.json', help='Global config file path')
    parser.add_argument('--apis', default='config/apis.json', help='API config file path')
    
    args = parser.parse_args()
    
    # Check if config file exists
    if not os.path.exists(args.apis):
        print("Error: API config file does not exist")
        sys.exit(1)
    
    # Create and start the server
    server = HttpMcpServer(config_path=args.config, apis_path=args.apis)
    server.run(host=args.host, port=args.port)

if __name__ == "__main__":
    main() 