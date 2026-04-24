# CF_Calculation

结构力学计算工具集，当前基于 `React 18 + TypeScript + Vite 5 + Tauri 2` 构建，同时新增了独立的 Node.js API 服务。项目既可以作为浏览器/桌面计算工具使用，也可以通过 HTTP API 接收用户数据并返回计算结果或 Word 报告。

## 功能概览

- 前端计算界面：支持模块切换、参数输入、结构示意图、计算结果展示。
- 桌面应用：通过 Tauri 2 打包为本地桌面应用。
- 计算模块：
  - `y_brace`：Y 撑复核验算。
  - `triangle`：直角三角形勾股定理计算。
- 报告导出：
  - 前端支持模块自带的 Word/PDF 导出能力。
  - API 第一版仅支持 `y_brace`，返回 JSON 结果和 `.docx` Word 报告，不提供 PDF。
- API 服务：
  - 基于 Express。
  - 使用 `x-api-key` 做简单鉴权。
  - 使用 zod/自定义校验返回字段级错误。

## 项目结构

```text
CF_Calculation/
├─ src/                         # 前端应用与通用计算模块
│  ├─ App.tsx
│  ├─ components/               # 前端通用组件
│  ├─ modules/                  # 计算模块注册与具体模块
│  │  ├─ index.ts               # 模块注册表
│  │  ├─ types.ts               # 统一模块接口
│  │  ├─ y-brace/               # Y 撑计算、前端结果、前端导出
│  │  └─ triangle/              # 三角形计算、前端结果、前端导出
│  └─ utils/
├─ server/                      # Node.js API 服务
│  ├─ index.ts                  # API 启动入口
│  ├─ app.ts                    # Express app、鉴权、路由
│  ├─ yBrace/
│  │  ├─ schema.ts              # API 对外 schema 元信息
│  │  ├─ validation.ts          # 请求参数校验
│  │  ├─ report.ts              # JSON 报告文本结构
│  │  └─ docxReport.ts          # 服务端 Word 报告生成
│  └─ __tests__/                # API 测试
├─ src-tauri/                   # Tauri 桌面应用配置与 Rust 入口
├─ docker/                      # Nginx 静态部署配置
├─ Dockerfile
├─ docker-compose.yml
├─ package.json
├─ tsconfig.json                # 前端 TypeScript 配置
└─ tsconfig.server.json         # API TypeScript 配置
```

## 安装依赖

```bash
npm install
```

建议使用 Node.js 18+。

## 前端开发与构建

启动浏览器开发环境：

```bash
npm run dev
```

构建前端静态资源：

```bash
npm run build
```

预览构建产物：

```bash
npm run preview
```

启动 Tauri 桌面开发环境：

```bash
npm run tauri dev
```

构建桌面应用：

```bash
npm run tauri build
```

## API 服务用法

API 是独立的 Node.js 服务，不依赖浏览器 DOM，也不会启动 Tauri。第一版只开放 `y_brace` 模块。

### 启动 API

PowerShell 示例：

```powershell
$env:API_KEY="your-secret-key"
npm run api:dev
```

默认监听：

```text
http://0.0.0.0:7034
```

可选环境变量：

```text
API_KEY   必填，请求鉴权密钥
API_PORT  可选，默认 7034
API_HOST  可选，默认 0.0.0.0
```

所有业务接口都需要请求头：

```text
x-api-key: your-secret-key
```

`GET /api/health` 不需要鉴权，用于健康检查。

### API 脚本

```bash
npm run api:dev      # 本地开发启动 API
npm run api:build    # 编译 API 到 dist-server/
npm run api:start    # 运行编译后的 API
npm run api:test     # 编译并运行 API 测试
```

生产运行示例：

```bash
npm run api:build
API_KEY=your-secret-key npm run api:start
```

Windows PowerShell：

```powershell
npm run api:build
$env:API_KEY="your-secret-key"
npm run api:start
```

## API 接口

### GET /api/health

健康检查。

响应示例：

```json
{
  "success": true,
  "status": "ok"
}
```

### GET /api/y-brace/schema

返回 `y_brace` 的参数字段、默认值和计算目标。

请求头：

```text
x-api-key: your-secret-key
```

响应包含：

```json
{
  "success": true,
  "moduleId": "y_brace",
  "paramFields": [],
  "defaultParams": {},
  "calcTargets": [],
  "defaultCalcTarget": "both"
}
```

### POST /api/y-brace/calculate

传入参数，返回结构化计算结果和报告文本。

请求头：

```text
content-type: application/json
x-api-key: your-secret-key
```

请求体：

```json
{
  "calcTarget": "both",
  "params": {
    "n": 4800,
    "m": 2144,
    "mu": 1,
    "R": 25.151,
    "A": 9.24,
    "I": 16.6,
    "IPrime": 101,
    "k": 0.5,
    "f": 205
  }
}
```

`calcTarget` 可选值：

```text
both    同时验算弱轴和强轴
weak    只验算弱轴，需要 I
strong  只验算强轴，需要 IPrime
```

成功响应包含：

```json
{
  "success": true,
  "moduleId": "y_brace",
  "calcTarget": "both",
  "input": {},
  "normalizedParams": {},
  "result": {},
  "conclusion": {
    "isSafe": true,
    "message": "验算通过，满足要求。"
  },
  "report": {
    "title": "Y撑复核验算书",
    "generatedAt": "2026-04-24T00:00:00.000Z",
    "parameters": [],
    "sections": [],
    "conclusion": {}
  }
}
```

### POST /api/y-brace/reports/docx

传入同样的请求体，实时返回 Word 报告文件。

响应头：

```text
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename*=UTF-8''...
```

curl 示例：

```bash
curl -X POST http://localhost:7034/api/y-brace/reports/docx \
  -H "content-type: application/json" \
  -H "x-api-key: your-secret-key" \
  -o y_brace_report.docx \
  -d '{
    "calcTarget": "both",
    "params": {
      "n": 4800,
      "m": 2144,
      "mu": 1,
      "R": 25.151,
      "A": 9.24,
      "I": 16.6,
      "IPrime": 101,
      "k": 0.5,
      "f": 205
    }
  }'
```

## 参数校验规则

- `calcTarget` 只允许 `both`、`weak`、`strong`。
- 基础必填参数：`n`、`m`、`mu`、`R`、`A`、`f`。
- `weak` 需要 `I`。
- `strong` 需要 `IPrime`。
- `both` 同时需要 `I` 和 `IPrime`。
- 所有数值参数必须是有限正数。
- `k` 可不传，默认 `0.5`；传入时必须在 `0.1 ~ 0.9` 之间。

校验失败返回 `400`：

```json
{
  "success": false,
  "error": {
    "code": "validation_failed",
    "message": "请求参数校验失败",
    "issues": [
      {
        "field": "params.n",
        "code": "positive_number_required",
        "message": "n 必须大于 0"
      }
    ]
  }
}
```

鉴权失败返回 `401`：

```json
{
  "success": false,
  "error": {
    "code": "unauthorized",
    "message": "缺少或无效的 x-api-key"
  }
}
```

## Docker 部署

当前 Docker 配置会同时部署前端静态页面和 Node.js API 服务：

```text
前端页面  http://<服务器IP>:7033
API 服务  http://<服务器IP>:7035
```

API 服务需要配置 `API_KEY` 环境变量。

### 使用 Docker Compose

```bash
API_KEY=your-secret-key docker compose up -d --build
```

Windows PowerShell：

```powershell
$env:API_KEY="your-secret-key"
docker compose up -d --build
```

访问：

```text
http://<服务器IP>:7033
http://<服务器IP>:7035/api/health
```

### 直接使用 Docker

Dockerfile 使用多目标构建：

```bash
# 构建前端镜像
docker build --target frontend -t cf-calculation-web:latest .

# 构建 API 镜像
docker build --target api -t cf-calculation-api:latest .
```

分别启动：

```bash
docker run -d --name cf-calculation-web \
  -p 7033:7033 \
  --restart unless-stopped \
  cf-calculation-web:latest

docker run -d --name cf-calculation-api \
  -p 7035:7035 \
  -e API_KEY=your-secret-key \
  --restart unless-stopped \
  cf-calculation-api:latest
```

## 开发说明

- 前端模块通过 `src/modules/index.ts` 注册，主界面只依赖统一 `CalcModule` 接口。
- `y_brace` 的核心计算函数位于 `src/modules/y-brace/calculate.ts`，API 会复用这部分纯计算逻辑。
- 前端导出逻辑仍位于各模块的 `exportUtils.ts`，其中部分能力依赖浏览器 DOM。
- 服务端报告生成位于 `server/yBrace/docxReport.ts`，不会使用 `document`、`window`、`file-saver` 或 canvas。
- API 第一版不实现 PDF，也不会在响应中返回 PDF 字段。

## 验证

运行 API 测试：

```bash
npm run api:test
```

运行前端构建：

```bash
npm run build
```
