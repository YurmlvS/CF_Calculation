# CF_Calculation — 结构力学计算器

结构验算工具集，支持多套计算方案的动态切换，基于 **React 18 + TypeScript + Vite 5 + Tauri 2** 构建。

当前已内置模块：
- **Y撑复核验算**（`y_brace`）
- **直角三角形勾股定理计算**（`triangle`）

---

## 目录结构

```
CF_Calculation/
├── index.html                  # HTML 入口（KaTeX CSS 在此引入）
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts              # Vite 配置（含 Tauri 推荐选项）
├── .gitignore
│
├── src/                        # React 前端源码
│   ├── main.tsx                # ReactDOM 入口
│   ├── App.tsx                 # 根组件（三列布局 + 模块动态分发）
│   ├── index.css               # 全局样式（内置 Tailwind 等效工具类）
│   │
│   ├── types/
│   │   └── index.ts            # 全局共享类型（CalcResult 等）
│   │
│   ├── constants/
│   │   └── phiTable.ts         # φ 稳定系数查表 CSV 数据（共享）
│   │
│   ├── utils/                  # 全局通用工具（不依赖具体模块）
│   │   ├── phiUtils.ts         # buildPhiTable() / getPhi() 查表工具
│   │   ├── calculate.ts        # 基础计算辅助函数
│   │   └── exportUtils.ts      # exportToPDF() / exportToWord() 通用实现
│   │
│   ├── components/             # 全局共享 UI 组件
│   │   ├── Navbar.tsx          # 顶部导航栏
│   │   ├── DiagramPanel.tsx    # Konva.js 绘图区基础包装
│   │   ├── ParamsPanel.tsx     # 参数输入面板（模块选择 + 动态表单）
│   │   └── ResultPanel.tsx     # 结果报告容器（KaTeX 公式 + 导出按钮）
│   │
│   └── modules/                # 计算模块（每个子目录为一套独立方案）
│       ├── index.ts            # 模块注册表（新模块在此导入 & 注册）
│       ├── types.ts            # CalcModule 接口 & 各 Props 类型定义
│       │
│       ├── y-brace/            # Y撑复核验算模块
│       │   ├── index.ts        # 模块入口（实现 CalcModule 接口）
│       │   ├── params.ts       # 参数字段定义 & 默认值
│       │   ├── calculate.ts    # 核心验算逻辑（纯函数）
│       │   ├── phiTable.ts     # 模块私有 φ 查表数据
│       │   ├── phiUtils.ts     # 模块私有 φ 查表工具
│       │   ├── DiagramPanel.tsx # Konva.js 结构示意图
│       │   ├── ResultPanel.tsx  # KaTeX 公式结果报告
│       │   └── exportUtils.ts  # PDF / Word 导出（模块专用）
│       │
│       └── triangle/           # 直角三角形勾股定理计算模块
│           ├── index.ts        # 模块入口（实现 CalcModule 接口）
│           ├── params.ts       # 参数字段定义 & 默认值
│           ├── calculate.ts    # 勾股定理计算逻辑（纯函数）
│           ├── DiagramPanel.tsx # Konva.js 三角形示意图
│           ├── ResultPanel.tsx  # 计算结果报告
│           └── exportUtils.ts  # PDF / Word 导出（模块专用）
│
└── src-tauri/                  # Tauri 2 Rust 后端
    ├── tauri.conf.json         # 应用配置（窗口、devUrl、bundle 等）
    ├── build.rs                # Tauri 构建脚本
    ├── Cargo.toml              # Rust 依赖
    └── src/
        ├── main.rs             # 二进制入口
        └── lib.rs              # Tauri Builder + 命令注册
```

---

## 架构说明

本项目采用**插件化模块**架构，App.tsx 不直接包含任何计算逻辑：

1. **`src/modules/types.ts`** 定义 `CalcModule` 接口——每套计算方案必须实现该接口。
2. **`src/modules/index.ts`** 是模块注册表，负责将各模块汇总并暴露给 App。
3. **App.tsx** 根据当前选中的 `moduleId` 动态渲染对应模块的 `DiagramPanel`、`ResultPanel`，并调用其 `calculate`、`exportToWord`、`exportToPDF`。
4. 每个模块目录**自包含**：参数定义、计算逻辑、绘图组件、结果组件、导出功能全部封装在模块内部，互不干扰。

---

## 开发环境要求

| 工具 | 版本要求 |
|------|---------|
| Node.js | ≥ 18 |
| Rust / Cargo | stable（通过 [rustup](https://rustup.rs/) 安装） |
| Tauri CLI | 通过 `npm` 安装（已在 devDependencies） |

---

## 常用命令

```bash
# 安装前端依赖
npm install

# 仅启动 Vite 前端开发服务器（浏览器调试）
npm run dev

# 启动 Tauri 开发窗口（需要 Rust 环境）
npm run tauri dev

# 打包生产版前端
npm run build

# 打包 Tauri 桌面应用（生成安装包）
npm run tauri build
```

> **首次运行 `tauri dev` 时**，Cargo 会自动下载并编译 Rust 依赖，耗时较长（5~10 分钟），之后会缓存加速。

---

## 技术说明

- **KaTeX**：通过 npm 安装为正式依赖，CSS 在 `index.html` 中引入；各模块的 `ResultPanel` 使用 `katex.renderToString()` 渲染公式。
- **Konva.js**：通过 CDN (`unpkg`) 在运行时动态加载，`isKonvaLoaded` 状态由 App 统一管理后传入各模块的 `DiagramPanel`。
- **html2pdf.js**：通过 CDN 动态懒加载，用于 PDF 导出；`exportUtils.ts` 中包含加载保障与样式还原逻辑。
- **CSS**：`index.css` 内置了所有 Tailwind 等效工具类，**无需安装 Tailwind**。

---

## 扩展新计算模块

只需四步，无需修改 App.tsx 或任何现有模块：

1. **创建模块目录** `src/modules/<your-module>/`，参考 `y-brace/` 或 `triangle/` 的文件结构。
2. **实现 `CalcModule` 接口**（`src/modules/types.ts`），在 `index.ts` 中导出默认对象。
3. **在注册表中注册**：打开 `src/modules/index.ts`，导入并追加到 `modules` 数组。
4. 新模块会自动出现在导航栏的模块选择列表中。

> 如需调用系统 API（文件读写等），在 `src-tauri/src/lib.rs` 中添加 `#[tauri::command]` 并在前端通过 `@tauri-apps/api` 调用。
