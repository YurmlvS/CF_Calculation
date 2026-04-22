# CF_Calculation

结构力学计算工具集，支持按模块切换不同计算方案。项目基于 `React 18 + TypeScript + Vite 5 + Tauri 2` 构建，适合在浏览器中调试，也可以打包为桌面应用。

当前内置模块：

- `y_brace`：Y 撑复核验算
- `triangle`：直角三角形勾股定理计算

## 功能概览

- 支持多计算模块统一注册、切换和渲染
- 支持 Konva 绘制结构示意图
- 支持 KaTeX 渲染计算结果中的数学公式
- 支持导出 Word 与 PDF 报告
- `y_brace` 模块额外支持“导出 KaTeX 版” `.docx`
  说明：当前实现已改为使用 `docx` 的 Word 原生公式对象导出，不再把公式截图为图片嵌入

## 技术栈

- 前端：`React 18`、`TypeScript`、`Vite 5`
- 桌面壳：`Tauri 2`
- 文档导出：`docx`、`file-saver`、`html2pdf.js`
- 公式渲染：`KaTeX`
- 图形绘制：`Konva.js`

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动前端开发环境

```bash
npm run dev
```

### 3. 启动 Tauri 桌面开发环境

需要本地安装 Rust/Cargo。

```bash
npm run tauri dev
```

### 4. 构建项目

```bash
npm run build
```

### 5. 构建桌面应用

```bash
npm run tauri build
```

## 环境要求

| 工具 | 建议版本 |
| --- | --- |
| Node.js | 18+ |
| npm | 9+ |
| Rust / Cargo | stable |
| Tauri CLI | 已包含在 `devDependencies` 中 |

## 项目结构

```text
CF_Calculation/
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ components/
│  │  ├─ Navbar.tsx
│  │  ├─ DiagramPanel.tsx
│  │  ├─ ParamsPanel.tsx
│  │  └─ ResultPanel.tsx
│  ├─ constants/
│  ├─ types/
│  ├─ utils/
│  └─ modules/
│     ├─ index.ts
│     ├─ types.ts
│     ├─ y-brace/
│     │  ├─ index.ts
│     │  ├─ params.ts
│     │  ├─ calculate.ts
│     │  ├─ DiagramPanel.tsx
│     │  ├─ ResultPanel.tsx
│     │  └─ exportUtils.ts
│     └─ triangle/
│        ├─ index.ts
│        ├─ params.ts
│        ├─ calculate.ts
│        ├─ DiagramPanel.tsx
│        ├─ ResultPanel.tsx
│        └─ exportUtils.ts
└─ src-tauri/
   ├─ tauri.conf.json
   ├─ Cargo.toml
   └─ src/
```

## 架构说明

项目采用模块化注册架构，`App.tsx` 不直接耦合具体计算逻辑，而是通过模块接口动态分发：

1. `src/modules/types.ts` 定义统一的 `CalcModule` 接口
2. 每个模块目录各自维护参数定义、计算逻辑、绘图组件、结果组件和导出逻辑
3. `src/modules/index.ts` 负责注册全部模块
4. `App.tsx` 根据当前模块动态渲染对应的 `DiagramPanel`、`ResultPanel` 和导出能力

这样做的好处是：

- 新增模块时对现有模块影响小
- 计算逻辑与 UI 逻辑边界清晰
- 各模块可以拥有自己的导出实现

## 导出说明

### Word 导出

- 各模块均可导出普通 Word 报告
- `y_brace` 的“导出 KaTeX 版”会生成 `.docx`
- 该版本中的公式使用 Word 原生公式对象，便于后续在 Word 中继续编辑

### PDF 导出

- PDF 导出依赖运行时动态加载 `html2pdf.js`
- 导出内容基于页面结果区渲染

## 模块扩展

新增一个计算模块时，推荐按下面步骤进行：

1. 在 `src/modules/` 下创建新目录，例如 `src/modules/my-module/`
2. 实现本模块的：
   `params.ts`、`calculate.ts`、`DiagramPanel.tsx`、`ResultPanel.tsx`、`exportUtils.ts`、`index.ts`
3. 在 `src/modules/index.ts` 中导入并注册该模块
4. 保持模块默认导出符合 `CalcModule` 接口

完成后，模块会自动接入主界面的模块切换流程。

## 开发说明

- KaTeX 作为 npm 依赖安装，在结果组件中渲染公式
- Konva 目前通过运行时脚本方式加载，由 `App.tsx` 统一管理加载状态
- PDF 导出插件通过动态注入脚本加载
- 当前样式不依赖 Tailwind 构建流程，主要通过现有 CSS 和类名组织

## 后续可改进方向

- 为更多模块补充“Word 原生公式版”导出
- 统一导出模板与报告样式
- 补充自动化测试与示例数据
- 为模块增加更完整的 README 或使用示例
