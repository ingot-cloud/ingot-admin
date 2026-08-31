# 稳定依赖基线规格

本文写已上线的工具链与依赖行为；设计细节见归档 [DESIGN.md](../../../changes/archive/2026/20260829-packages-stable-dependency-baseline/DESIGN.md)。

## 概述

monorepo 使用一套可复现的 Node.js / pnpm / Vue 生态版本。公共运行时依赖由 catalog 单一来源声明，两个应用安装结果一致。升级不改变页面功能、后端接口、权限模型和加密协议。

## 范围

### In Scope

- Node.js 22、pnpm 10、根 manifest、GitLab CI 与 tsconfig 基线
- Vue、Element Plus、Pinia、Vue Router、Vite、UnoCSS、VueUse 及配套类型/质量工具
- catalog 公共版本、共享 package 的 Vue peer dependency、必要的传递依赖 overrides
- 升级引入的兼容修复：开发代理 rewrite、`crypto-js` CJS 预构建、动态路由兜底 matcher、表格组件公开插槽

### Out of Scope

- TypeScript 7
- TinyMCE 8
- 替换 `webcrypto-liner`、`crypto-js` 或改变 HYBRID 信封加密协议
- 替换 `beautify-qrcode` 或改变二维码视觉输出
- 页面功能、后端接口、权限模型和路由结构调整
- `20260829-packages-composable-admin-runtime` 的后台运行时拆包

## 用户场景

### 场景 1：开发者安装与构建

- **角色**：前端开发者、CI runner
- **前置条件**：本机或镜像为 Node.js 22.17.0 兼容版本，pnpm 10.12.4
- **步骤**：在仓库根执行 `pnpm install --frozen-lockfile`，再 `pnpm build:packages` 与应用 type-check / production build
- **预期结果**：依赖解析唯一；不出现已废弃 `baseUrl` / `moduleResolution: node10` 错误；构建通过

### 场景 2：用户访问现有应用

- **角色**：管理台和登录应用用户
- **前置条件**：升级后的 `ingot-admin`、`ingot-login` 已部署或本地启动
- **步骤**：登录、刷新、访问动态路由和常用 Element Plus 页面，再退出登录
- **预期结果**：登录态、菜单、路由、页签、组件交互与视觉表现与升级前一致

### 场景 3：后续维护者升级公共依赖

- **角色**：依赖维护者
- **前置条件**：改动落在 catalog 中已有的公共依赖
- **步骤**：在 `pnpm-workspace.yaml` 的 catalog 调整版本，应用 manifest 继续使用 `catalog:`
- **预期结果**：两个应用解析到同一版本；`pnpm.overrides` 不承担主版本管理

## 功能需求

### REQ-001：工具链与 CI 一致

系统 SHALL 约束 Node.js `>=22.17.0 <23`、pnpm `10.12.4`。`.nvmrc`、`.node-version` 与 GitLab CI 镜像均为 `22.17.0`；CI 用 corepack 启用同一 pnpm 版本并以 `--frozen-lockfile` 安装。

**验收标准：**

- [x] 根 `packageManager` / `engines` 与 CI 一致
- [x] `pnpm install --frozen-lockfile` 可复现

### REQ-002：公共依赖单一来源

系统 SHALL 在 `pnpm-workspace.yaml` catalog 声明两个应用共用的运行时依赖；应用通过 `catalog:` 引用。`pnpm.overrides` 仅保留传递依赖的安全或兼容补丁。

**验收标准：**

- [x] Vue / Element Plus / Pinia / Vue Router / UnoCSS / VueUse 在两个应用安装结果一致
- [x] `@ingot/hooks` 将 Vue 声明为 peer dependency（`^3.5.0`），devDependency 使用 catalog
- [x] overrides 仅覆盖 `elliptic`、`rollup`、`defu`、`lodash` / `lodash-es`

### REQ-003：TypeScript 6 与 Bundler 解析

系统 SHALL 使用 TypeScript 6.0.3 与 vue-tsc 3.3.11。应用 tsconfig 使用 `moduleResolution: "Bundler"`，删除已废弃的 `baseUrl`，不把 `ignoreDeprecations` 作为长期方案。

**验收标准：**

- [x] 全部 tsconfig 不再使用 `baseUrl` 或 `moduleResolution: node10/node`
- [x] `InTable` / `InRadioTable` 声明固定工具栏插槽与动态列插槽，CLI 与编辑器类型检查一致

### REQ-004：构建与路由兼容行为

系统 SHALL 保持现有页面与加密协议不变，并保留升级后必须的兼容行为。

**验收标准：**

- [x] Vite 8 开发代理把 `/api/pms/...` 转发为 `/pms/...`，不产生双斜杠
- [x] 开发期对 `crypto-js` 启用 Vite 8 `legacy.inconsistentCjsInterop`，验证码 AES 可动态加载
- [x] 动态路由启动阶段提供临时 matcher，注入成功后移除，避免 Vue Router 5 `VUE_ROUTER_R0004`
- [x] Element Plus 类型与 locale 只从公开入口导入

## 非功能需求

- 质量门禁：`pnpm check`（packages build + type-check + lint + 单测）与 `pnpm build` 必须通过
- ESLint 10 将升级前已有的约 214 条历史类型债务保留为 warning；结构性错误与新增错误仍为 error
- 生产依赖审计应优于升级前；当前剩余例外为 `webcrypto-liner > elliptic@6.6.1` 的上游低危 `GHSA-848j-6mx2-7j84`

## 依赖与约束

当前稳定版本（同一 minor 内可前进补丁；新的 major/minor 须另开 change）：

| 依赖 | 版本 |
|------|------|
| Node.js | 22.17.0（约束 `>=22.17.0 <23`） |
| pnpm | 10.12.4 |
| Vue / compiler-sfc / shared | 3.5.42 |
| Element Plus | 2.14.5 |
| Pinia | 4.0.3 |
| Vue Router | 5.3.0 |
| Vite | 8.2.2 |
| UnoCSS | 66.8.1 |
| VueUse | 14.4.0 |
| TypeScript | 6.0.3 |
| vue-tsc | 3.3.11 |
| ESLint | 10.9.1 |
| Vitest | 4.1.11 |
| Playwright | 1.62.1 |
| TinyMCE | 7.9.3 |

后续 `packages-composable-admin-runtime` 须基于本基线重审，不得回退版本。

## 验收标准

- [x] 本地、workspace 与 CI 的 Node.js / pnpm 约束一致
- [x] catalog 为公共运行时版本单一来源
- [x] `pnpm check` 与 `pnpm build` 通过
- [x] 生产审计剩余例外已记录
- [ ] 登录/退出、状态持久化、动态路由、Element Plus 核心交互、自定义 SVG、TinyMCE、二维码和暗色模式的人工 smoke 仍建议在发布前执行
