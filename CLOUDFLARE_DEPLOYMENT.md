# Cloudflare Workers + Pages 部署指南

## 前置条件

- Node.js >= 20.0.0
- Cloudflare 账号（免费即可）
- Wrangler CLI 工具

## 快速开始

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 创建 KV 命名空间

```bash
wrangler kv:namespace create "CONFIG_KV"
```

复制返回的 ID，更新 `wrangler.toml` 中的 `id` 字段。

### 4. 创建 R2 存储桶（可选）

```bash
wrangler r2 bucket create "aiclient-storage"
```

### 5. 更新配置文件

编辑 `wrangler.toml`，替换以下占位符：

```toml
[[kv_namespaces]]
binding = "CONFIG_KV"
id = "your-actual-kv-namespace-id"  # 替换为实际的 KV ID
```

### 6. 部署 Worker

```bash
npm run deploy:cf
```

### 7. 部署 Pages（静态 UI）

```bash
npm run deploy:pages
```

## 详细配置

### wrangler.toml 配置说明

```toml
name = "aiclient-2-api"              # Worker 名称
main = "src/cloudflare/worker.js"     # 入口文件
compatibility_date = "2024-09-23"       # 兼容性日期
compatibility_flags = ["nodejs_compat"]  # 启用 Node.js 兼容

[limits]
cpu_ms = 30000                         # CPU 时间限制（毫秒）

[vars]
ENVIRONMENT = "production"               # 环境变量

[[kv_namespaces]]
binding = "CONFIG_KV"                   # KV 绑定名称
id = "your-kv-namespace-id"            # KV 命名空间 ID

[[r2_buckets]]
binding = "STORAGE"                      # R2 绑定名称
bucket_name = "aiclient-storage"          # R2 存储桶名称

[triggers]
crons = ["*/15 * * * *"]               # Cron 表达式（每15分钟）

[site]
bucket = "./static"                      # 静态文件目录
```

### 环境变量

在 Cloudflare Dashboard 中设置以下环境变量：

| 变量名 | 说明 | 默认值 |
|-------|------|---------|
| `REQUIRED_API_KEY` | API 密钥 | `123456` |
| `MODEL_PROVIDER` | 默认模型提供商 | `gemini-cli-oauth` |
| `PROXY_URL` | 代理地址（可选） | `null` |
| `LOG_ENABLED` | 启用日志 | `true` |

## 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare 部署架构                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────┐         ┌───────────────────────┐  │
│   │ Cloudflare Pages │         │ Cloudflare Workers    │  │
│   │                 │  API    │                       │  │
│   │ - 静态 UI      │ ──────▶ │ - /v1/*              │  │
│   │ - index.html   │         │ - /v1beta/*          │  │
│   │ - CSS/JS       │         │ - /api/*             │  │
│   │                 │         │ - 流式 AI 响应       │  │
│   └─────────────────┘         │                       │  │
│                               │ 存储: KV + R2        │  │
│                               │ 定时: Cron Triggers   │  │
│                               └───────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 本地开发

### 开发 Worker

```bash
npm run dev:cf
```

访问 http://localhost:3000 测试。

### 开发 Pages

```bash
npm run pages:dev
```

## 命令参考

| 命令 | 说明 |
|------|------|
| `npm run deploy:cf` | 部署 Worker 到生产环境 |
| `npm run deploy:cf:dev` | 部署 Worker 到开发环境 |
| `npm run dev:cf` | 本地开发 Worker |
| `npm run deploy:pages` | 部署 Pages 到生产环境 |
| `npm run pages:dev` | 本地开发 Pages |

## 限制和注意事项

### Cloudflare Workers 限制

| 特性 | 限制 |
|------|------|
| CPU 时间（免费版） | 10 ms/请求 |
| CPU 时间（付费版） | 30s（默认）~ 5分钟（最大） |
| 墙钟时间 | 无限制 ✅ |
| 内存 | 128 MB |
| 请求大小 | 100 MB |
| WebSocket 服务器 | 需要 Durable Objects（付费） |
| 文件系统 | 不支持，使用 KV/R2 |

### 不支持的功能

以下功能在 Cloudflare Workers 上不可用或需要适配：

- ❌ WebSocket 服务器（需要 Durable Objects）
- ❌ 文件系统读写（使用 KV/R2 替代）
- ❌ 子进程管理（Workers 自动扩展）
- ❌ 多端口 OAuth 回调（使用路由区分）

### 已适配的功能

- ✅ HTTP 请求处理
- ✅ 流式 AI 响应（SSE）
- ✅ 配置管理（KV 存储）
- ✅ OAuth 认证
- ✅ 定时任务（Cron Triggers）
- ✅ 插件系统

## 故障排除

### 部署失败

**错误：Script startup exceeded CPU time limit**

- 减少全局初始化代码
- 将初始化逻辑移到 handler 内部

**错误：Exceeded CPU Time Limits**

- 升级到付费计划以增加 CPU 时间限制
- 优化代码，减少 CPU 密集型操作

### KV 读取失败

检查 KV 命名空间 ID 是否正确配置：

```bash
wrangler kv:namespace list
```

### R2 上传失败

确保 R2 存储桶已创建：

```bash
wrangler r2 bucket list
```

## 成本估算

### 免费计划

- 100,000 请求/天
- 10 ms CPU 时间/请求
- KV 存储：1 GB
- R2 存储：10 GB

### 付费计划

- 无限请求
- 30s CPU 时间/请求（可扩展到 5 分钟）
- KV 存储：100 GB
- R2 存储：无限

## 下一步

部署完成后：

1. 访问 Pages URL 查看 UI
2. 在 UI 中配置 API 密钥
3. 测试 API 端点
4. 监控 Worker 日志

## 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [KV 存储文档](https://developers.cloudflare.com/kv/)
- [R2 存储文档](https://developers.cloudflare.com/r2/)
