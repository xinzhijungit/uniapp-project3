#!/bin/bash
echo "正在停止占用端口3000的进程..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

echo "正在启动服务器..."
cd /Users/xiaoping/Desktop/智慧西安开发/uniapp-project/server
node src/index.js