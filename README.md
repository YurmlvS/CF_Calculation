# CF_Calculation

结构力学计算工具集，当前基于 `React 18 + TypeScript + Vite 5 + Tauri 2` 构建，并提供独立的 Node.js API 服务。项目可以作为浏览器/桌面计算工具使用，也可以通过 HTTP API 接收参数并返回结构化计算结果或 Word 报告。

## 功能概览

- 前端计算界面：支持计算模块切换、参数输入、示意图展示、结果展示和导出。
- 桌面应用：通过 Tauri 2 打包为本地桌面应用。
- 已注册计算模块：
  - `y_brace`：Y 撑复核验算。
  - `structural_beam_biaxial`：结构梁双向受力验算。
- 前端导出：
  - 各模块保留自身的 Word、LaTeX、PDF 导出能力。
- API 服务：
  - 基于 Express。
  - 使用 `x-api-key` 做简单鉴权。
  - 使用 zod/自定义校验返回字段级错误。
  - 支持 `y_brace` 与 `structural_beam_biaxial` 的 schema/calculate 接口。
  - 当前服务端 `.docx` 报告接口仅支持 `y_brace`，暂不提供服务端 PDF。

## 项目结构

```text
CF_Calculation/
├─ src/                         # 前端应用与通用计算模块
│  ├─ App.tsx
│  ├─ components/               # 前端通用组件
│  ├─ modules/                  # 计算模块注册与具体模块
│  │  ├─ index.ts               # 模块注册表
│  │  ├─ types.ts               # 统一模块接口
│  │  ├─ y-brace/               # Y 撑计算、展示与前端导出
│  │  ├─ structural-beam-biaxial/# 结构梁双向受力验算
│  │  └─ triangle/              # 三角形模块代码，目前未注册启用
│  └─ utils/
├─ server/                      # Node.js API 服务
│  ├─ index.ts                  # API 启动入口
│  ├─ app.ts                    # Express app、鉴权、路由
│  ├─ yBrace/                   # Y 撑 API schema、校验、报告、docx
│  ├─ structuralBeamBiaxial/    # 结构梁 API schema、校验、JSON 报告
│  └─ __tests__/                # API 测试
├─ src-tauri/                   # Tauri 桌面应用配置与 Rust 入口
├─ docker/                      # Nginx 静态部署配置
├─ Dockerfile
├─ docker-compose.yml
├─ package.json
├─ tsconfig.json
└─ tsconfig.server.json
```

## 安装依赖

```bash
npm install
```

建议使用 Node.js 18+；Docker 镜像使用 Node.js 20。

## 前端开发与构建

```bash
npm run dev          # 启动 Vite 开发环境
npm run build        # 构建前端静态资源
npm run preview      # 预览构建产物
npm run tauri dev    # 启动 Tauri 桌面开发环境
npm run tauri build  # 构建桌面应用
```

## API 服务

API 是独立 Node.js 服务，不依赖浏览器 DOM，也不会启动 Tauri。

### 启动

PowerShell 示例：

```powershell
$env:API_KEY="your-secret-key"
npm run api:dev
```

默认监听：

```text
http://0.0.0.0:7034
```

环境变量：

```text
API_KEY   必填，请求鉴权密钥
API_PORT  可选，默认 7034
API_HOST  可选，默认 0.0.0.0
```

除 `GET /api/health` 外，所有业务接口都需要请求头：

```text
x-api-key: your-secret-key
```

### 脚本

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

健康检查，无需鉴权。

```json
{
  "success": true,
  "status": "ok"
}
```

### GET /api/y-brace/schema

返回 `y_brace` 的参数字段、默认参数和计算目标。

### POST /api/y-brace/calculate

传入 Y 撑参数，返回结构化计算结果和 JSON 报告。

```json
{
  "calcTarget": "both",
  "params": {
    "n": 4800,
    "m": 2144,
    "mu": 1,
    "R": 25.151,
    "materialSpec": "8号槽钢",
    "k": 0.5,
    "f": "Q355"
  }
}
```

`calcTarget` 可选值：

```text
both    同时验算弱轴和强轴
weak    只验算弱轴，需提供 I 或选择内置型材
strong  只验算强轴，需提供 IPrime 或选择内置型材
```

Y 撑支持内置型材选择；选择内置 `materialSpec` 时，`A`、`I`、`IPrime` 会由材料库自动补齐。`f` 支持 `Q235`/`205` 和 `Q355`/`295`。

### POST /api/y-brace/reports/docx

传入与 `/api/y-brace/calculate` 相同的请求体，实时返回 Word 报告文件。

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
      "materialSpec": "8号槽钢",
      "k": 0.5,
      "f": "Q355"
    }
  }'
```

响应头：

```text
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename*=UTF-8''...
```

### GET /api/structural-beam-biaxial/schema

返回 `structural_beam_biaxial` 的参数字段、默认参数和计算目标。

### POST /api/structural-beam-biaxial/calculate

传入结构梁双向受力验算参数，返回最不利截面、双向受弯、斜截面受剪等结构化结果和 JSON 报告。

```json
{
  "calcTarget": "all",
  "params": {
    "h": 500,
    "b": 250,
    "l": 10,
    "q": 20,
    "F": 50,
    "concreteGrade": "C30",
    "steelGrade": "HRB400\\HRBF400\\RRB400",
    "xRebarCount": 4,
    "xRebarDiameter": 20,
    "yRebarCount": 4,
    "yRebarDiameter": 18
  }
}
```

`calcTarget` 可选值：

```text
all    默认完整计算
worst  最不利点判定
rebar  纵向受拉钢筋截面面积计算
shear  斜截面受剪验算
```

结构梁模块支持混凝土、钢筋材料和钢筋根数/直径的内置选项；选择内置选项时，`fc`、`ft`、`fy`、`Aux`、`Auy` 可自动归一化补齐。选择 `custom` 时需要手动传入对应数值。

## 校验规则

通用规则：

- 请求体必须包含 `params` 对象。
- 所有参与计算的数值必须是有限正数。
- 鉴权失败返回 `401`，参数校验失败返回 `400`，计算未产生结果返回 `422`。

Y 撑规则：

- `calcTarget` 只允许 `both`、`weak`、`strong`。
- 基础必填参数：`n`、`m`、`mu`、`R`、`A`、`f`。
- `weak` 需要 `I`；`strong` 需要 `IPrime`；`both` 同时需要 `I` 和 `IPrime`。
- 若选择内置 `materialSpec`，`A`、`I`、`IPrime` 由材料库补齐。
- `k` 可不传，默认 `0.5`；传入时必须在 `0.1 ~ 0.9` 之间。

结构梁规则：

- `calcTarget` 只允许 `all`、`worst`、`rebar`、`shear`。
- 必填参数：`h`、`b`、`l`、`q`、`F`、`fc`、`ft`、`fy`、`Aux`、`Auy`。
- `h` 和 `b` 必须大于 `40`。
- `concreteGrade`、`steelGrade` 可以选择内置材料或 `custom`。
- 钢筋根数/直径可以选择内置规格或 `custom`；内置组合会自动计算 `Aux`、`Auy`。

错误响应示例：

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

结构梁双向受力验算补充：

- `/api/structural-beam-biaxial/schema` 会返回新增输入 `a` 和只读显示字段 `horizontalB`。
- `/api/structural-beam-biaxial/calculate` 的 `params.a` 表示水平集中力作用点位，必须满足 `0 < a < l`；服务端返回的 `normalizedParams.horizontalB = l - a`。
- 水平力作用下支座弯矩按 `M_y1 = max[-F a b^2/l^2, F b a^2/l^2]`，集中力处弯矩按 `M_y2 = F a^2 b^2/l^3` 参与验算。

## Docker 部署

当前 Docker 配置会同时部署前端静态页面和 Node.js API 服务：

```text
前端页面  http://<服务器IP>:7055
API 服务  http://<服务器IP>:7056
```

`docker-compose.yml` 中测试用 API 密钥为：

```text
test_api
```

使用 Docker Compose：

```bash
docker compose up -d --build
```

直接使用 Dockerfile 的多目标构建：

```bash
docker build --target frontend -t cf-calculation-web:latest .
docker build --target api -t cf-calculation-api:latest .
```

分别启动：

```bash
docker run -d --name cf-calculation-web \
  -p 7055:7055 \
  --restart unless-stopped \
  cf-calculation-web:latest

docker run -d --name cf-calculation-api \
  -p 7056:7056 \
  -e API_KEY=test_api \
  --restart unless-stopped \
  cf-calculation-api:latest
```

## 开发说明

- 前端模块通过 `src/modules/index.ts` 注册，主界面只依赖统一 `CalcModule` 接口。
- 纯计算逻辑位于各模块的 `calculate.ts`，API 会复用这些计算函数。
- 前端导出逻辑位于各模块的 `exportUtils.ts`，部分能力依赖浏览器 DOM。
- 服务端 Y 撑 Word 报告生成位于 `server/yBrace/docxReport.ts`，不依赖 `document`、`window`、`file-saver` 或 canvas。
- `structural_beam_biaxial` 当前 API 返回 JSON 报告，不提供服务端 `.docx` 下载接口。

## 验证

```bash
npm run api:test
npm run build
```

## 用户反馈模块配置

前端顶部“用户反馈”按钮会提交到 `POST /api/feedback`。该接口面向浏览器用户公开提交，不需要 `x-api-key`；服务端会做字段校验、写入 PostgreSQL，并在写入成功后异步推送钉钉机器人。

环境变量：

```text
FEEDBACK_DATABASE_URL       必填，PostgreSQL 连接串，例如 postgresql://user:password@host:5432/tools-feedback
FEEDBACK_DATABASE_SSL       可选，远程数据库要求 SSL 时设置为 true
FEEDBACK_AUTO_INIT_TABLE    可选，设置为 true 时服务端会按下方 4 列结构自动创建 feedback 表
DINGTALK_WEBHOOK_URL        可选，钉钉机器人 webhook 地址
DINGTALK_SECRET             可选，钉钉机器人加签 secret
VITE_FEEDBACK_API_BASE_URL  可选，前端和 API 分域部署时填写 API 基础地址；同源部署留空
```

建议手动建库建表，数据库名称为 `tools-feedback`，表名称为 `feedback`：

```sql
CREATE TABLE IF NOT EXISTS feedback (
  "反馈类型" TEXT NOT NULL,
  "反馈内容" TEXT NOT NULL,
  "联系方式" TEXT NOT NULL,
  "提交时间" TIME WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIME
);
```

还需要在 PostgreSQL 上创建应用专用账号，并授予 `feedback` 表的 `INSERT` 权限；如果开启 `FEEDBACK_AUTO_INIT_TABLE=true`，该账号还需要 `CREATE` 权限。钉钉机器人使用“加签”安全设置时，将 secret 填入 `DINGTALK_SECRET` 即可，服务端会自动追加 `timestamp` 和 `sign`。
