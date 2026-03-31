# CF_Calculation — 结构力学计算器

Y撑复核验算工具，基于 **React 18 + TypeScript + Vite 5 + Tauri 2** 构建。

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
│   ├── App.tsx                 # 根组件（状态管理 + 组件组合）
│   ├── index.css               # 全局样式（内置 Tailwind 等效工具类）
│   │
│   ├── types/
│   │   └── index.ts            # CalcParams / CalcResult / CalcTarget 类型
│   │
│   ├── constants/
│   │   └── phiTable.ts         # φ 稳定系数查表 CSV 数据
│   │
│   ├── utils/
│   │   ├── phiUtils.ts         # buildPhiTable() / getPhi() 查表工具
│   │   ├── calculate.ts        # 核心验算逻辑（纯函数，可独立测试）
│   │   └── exportUtils.ts      # exportToPDF() / exportToWord()
│   │
│   └── components/
│       ├── Navbar.tsx          # 顶部导航栏
│       ├── DiagramPanel.tsx    # Konva.js 动态绘图区（左半屏）
│       ├── ParamsPanel.tsx     # 参数输入面板（模块选择 + 输入表单）
│       └── ResultPanel.tsx     # 结果报告 + KaTeX 公式 + 导出按钮
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

## 开发环境要求

| 工具 | 版本要求 |
|------|---------|
| Node.js | ≥ 18 |
| Rust / Cargo | stable (通过 [rustup](https://rustup.rs/) 安装) |
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

- **KaTeX**：通过 npm 安装为正式依赖，CSS 在 `index.html` 中引入。
- **Konva.js**：通过 CDN (`unpkg`) 动态加载，保持轻量（可后续迁移为 npm 包）。
- **html2pdf.js**：通过 CDN 动态加载，用于 PDF 导出。
- **CSS**：`index.css` 内置了所有 Tailwind 等效工具类，**无需安装 Tailwind**。

---

## 扩展新模块

1. 在 `src/types/index.ts` 中添加新的参数接口。
2. 在 `src/utils/` 下添加对应的计算函数。
3. 在 `src/components/` 下创建新的表单/结果组件。
4. 在 `src/App.tsx` 中按 `currentModule` 条件渲染新组件。
5. 如需调用系统 API（文件读写等），在 `src-tauri/src/lib.rs` 中添加 `#[tauri::command]`。
