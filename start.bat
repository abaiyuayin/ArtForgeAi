@echo off
chcp 65001 >nul
REM 启动 ArtForgeAI 开发服务器
REM 切换到项目目录
cd /d "%~dp0\artforgeai-web"
REM 使用 4178 端口启动 Vite 开发服务器（避免 5173 端口被系统保留）
npm run dev -- --port 4178
pause
