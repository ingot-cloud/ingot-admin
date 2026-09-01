# App 插件化与共享包规格

本文写已上线的组合与脚手架行为；接口细节见归档 [API.md](../../../changes/archive/2026/20260831-app-plugins-shared-scaffold/API.md)。

## 概述

平台业务页住在 `ingot-admin`。该 App 导出 `adminPlugin`，既可独立 `dev/build`，也可被 `target-project` 等宿主 `plugins: [adminPlugin, …]` 打进同一 SPA。`@ingot/admin-base`、`@ingot/utils`、`@ingot/crypto`、`@ingot/hooks` 已删除。

## 范围

### In Scope

- 官方 App 插件导出与组合构建
- `@ingot/shared`（utils + crypto + hooks）
- 静态菜单与后端动态菜单合并
- 本地 `create-app` 脚手架

### Out of Scope

- 真实 `ingot-ops` 业务（仅占位）
- 运行时远程加载插件 / 微前端
- 将 `ingot-login` 改为管理台插件

## 用户场景

### 场景 1：平台 App 独立部署

- **角色**：平台管理员
- **前置条件**：启动 `ingot-admin`
- **步骤**：登录后访问原有 platform / org / dashboard 页
- **预期结果**：行为与迁出 `admin-base` 之前等价

### 场景 2：项目 App 组合官方插件

- **角色**：项目开发者
- **前置条件**：`target-project` 依赖 `ingot-admin`
- **步骤**：`plugins: [adminPlugin, targetPlugin]` 后构建或开发
- **预期结果**：单 SPA 内同时可用平台页与项目页；共享 Router / Pinia

### 场景 3：静态 + 动态菜单

- **角色**：项目开发者
- **前置条件**：插件或 App 声明 `staticMenus`，后端返回用户菜单
- **步骤**：启动后查看侧栏
- **预期结果**：静态在前、动态在后；同 `path` / `routeName` 冲突则启动失败；仅静态时 Demo 菜单仍可见

### 场景 4：可视化创建 App

- **角色**：项目开发者
- **前置条件**：本地执行 `pnpm create:app`（`127.0.0.1:5801`）
- **步骤**：填写 appCode / 端口，勾选 `ingot-admin`，生成
- **预期结果**：写入新的 `apps/<appCode>`；已有目录拒绝覆盖

## 功能需求

### REQ-001：业务页归属 App 插件

系统 SHALL 把平台业务页放在 `apps/admin`，并通过 `adminPlugin` 导出；宿主通过 workspace 依赖组合。仓库根包名为 `@ingot/workspace`，不得与 App 名 `ingot-admin` 冲突。

**验收标准：**

- [x] `@ingot/admin-base` 已移除
- [x] `ingot-admin` 独立构建与 `target-project` 组合构建均通过

### REQ-002：共享工具包

系统 SHALL 以 `@ingot/shared`（含 `./crypto`、`./hooks`）替代原 utils / crypto / hooks 三包。`admin-core` 与 `ingot-login` 依赖该包。

**验收标准：**

- [x] login 与 admin-core 构建通过
- [x] `pnpm test:pack` 验证 shared / vite-config / admin-core 发布产物可独立消费

### REQ-003：静态与动态菜单混合

系统 SHALL 在启动时合并 App/插件 `staticMenus` 与 `UserMenuAPI` 动态菜单；冲突报错。

**验收标准：**

- [x] `mergeMenuTrees` / `defineStaticMenus` 有单测
- [x] `target-project` 示例静态菜单（D/E/F）随插件注册

### REQ-004：本地脚手架

系统 SHALL 提供 `apps/create-app` Web UI 与 `pnpm create:app:cli`，复用 `scripts/lib/scaffold-app.mjs`，只写入 `apps/` 下不存在的目录。

**验收标准：**

- [x] 可勾选 `ingot-admin`；`ingot-ops` 占位不可选
- [x] 生成物 `main.ts` 包含对应官方插件 import

## 非功能需求

- 组合方 Vite 必须能编译官方 App 内的 Vue SFC 与 `import.meta.glob`
- create-app 仅限本地，不得暴露到公网

## 依赖与约束

- 官方 App 插件只依赖 `@ingot/admin-core` 与 `@ingot/shared`，不得反向依赖其他业务 App
- 页面稳定键优先 `ingot.admin.*`，兼容 `ingot.base.*` 与 `@/pages/**`

## 验收标准

- [x] 独立 admin、组合 target、login 生产构建通过
- [x] 类型检查与 admin-core / target 单测通过
- [x] create-app UI 与共享 scaffold 可生成新 App
