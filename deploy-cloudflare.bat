@echo off
echo ========================================
echo   Cloudflare Workers 快速部署脚本
echo ========================================
echo.

echo [1/6] 检查 Wrangler CLI...
where wrangler >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] Wrangler CLI 未安装
    echo 正在安装 Wrangler CLI...
    call npm install -g wrangler
    if %errorlevel% neq 0 (
        echo [错误] 安装失败，请手动运行: npm install -g wrangler
        pause
        exit /b 1
    )
)
echo [完成] Wrangler CLI 已安装
echo.

echo [2/6] 登录 Cloudflare...
wrangler login
if %errorlevel% neq 0 (
    echo [错误] 登录失败
    pause
    exit /b 1
)
echo [完成] 已登录 Cloudflare
echo.

echo [3/6] 创建 KV 命名空间...
wrangler kv:namespace create "CONFIG_KV"
if %errorlevel% neq 0 (
    echo [警告] KV 命名空间创建失败，可能已存在
)
echo [完成] KV 命名空间已准备
echo.

echo [4/6] 创建 R2 存储桶（可选）...
wrangler r2 bucket create "aiclient-storage"
if %errorlevel% neq 0 (
    echo [警告] R2 存储桶创建失败，可能已存在
)
echo [完成] R2 存储桶已准备
echo.

echo [5/6] 部署 Worker...
call npm run deploy:cf
if %errorlevel% neq 0 (
    echo [错误] Worker 部署失败
    pause
    exit /b 1
)
echo [完成] Worker 已部署
echo.

echo [6/6] 部署 Pages（静态 UI）...
call npm run deploy:pages
if %errorlevel% neq 0 (
    echo [警告] Pages 部署失败，请检查 static 目录
)
echo [完成] Pages 已部署
echo.

echo ========================================
echo   部署完成！
echo ========================================
echo.
echo 下一步：
echo 1. 访问 Pages URL 查看 UI
echo 2. 在 UI 中配置 API 密钥
echo 3. 测试 API 端点
echo 4. 查看 Cloudflare Dashboard 监控日志
echo.
pause
