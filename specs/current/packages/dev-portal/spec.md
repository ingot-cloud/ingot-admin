# 开发者中心规格

本文写已上线的文档门户与本地创建入口行为。脚手架分层与 App 组合见 [App 插件化与共享包](../app-plugins-shared-scaffold/spec.md)。主题创建位置见 [管理台主题](../admin-theme/spec.md)。本地 HTTP／CLI 字段表见归档 [API.md](../../../changes/archive/2026/20260909-packages-dev-portal/API.md)，不在此维护。

## 概述

开发者通过 `pnpm dev:portal`（默认 `http://127.0.0.1:5801`）阅读中文手册、搜索、查看从源码生成的组件／模块参考，并在本地预览或生成 App、插件、主题。`pnpm build:portal` 产出可静态部署的站点；静态站不调用本地写入 API。

## 范围

### In Scope

- `apps/dev-portal` / `@ingot/dev-portal` 与 VitePress 默认主题（sticky 顶栏、侧栏、搜索、明暗）
- 指南、参考、创建页与文档页同一套布局
- 全局 `In*` 组件与公共包导出的参考页（构建时从源码提取）
- 隔离 iframe 演示（固定 demo id，不发真实业务请求）
- `/create/app`、`/create/plugin`、`/create/theme` 向导：配置、预览、生成、接入步骤
- CLI：`create:app:cli`、`create:plugin:cli`、`create:theme:cli` 与 Web 共用引擎
- 静态部署只读，显示本地运行指引

### Out of Scope

- 在线下载模板包、远程插件市场、运行时远程加载
- 自动改写已有 App、自动安装依赖、自动执行生成后命令
- auth 模板或 auth 主题协议
- 把任意函数做成可视化编辑器

## 用户场景

### 场景 1：查阅文档与组件契约

- **角色**：前端开发者
- **前置条件**：打开门户
- **步骤**：搜索或从导航进入指南／组件／公共能力／官方插件
- **预期结果**：创建页与文档页顶栏、侧栏一致；组件页列出从源码分析出的 Props／事件／插槽／公开方法；模块页列出包导出的 JSDoc 与签名

### 场景 2：本地创建 App

- **角色**：需要独立后台的开发者
- **前置条件**：仓库内执行 `pnpm dev:portal` 或 `pnpm create:app`
- **步骤**：填写 appCode 与配置，预览文件树，确认后生成
- **预期结果**：写入 `apps/<appCode>`；不覆盖已有目录；始终有约定本地插件；官方插件可选；生成后给出接入步骤，不自动 install

### 场景 3：本地创建插件或主题

- **角色**：扩展框架的开发者
- **前置条件**：本地门户或对应 CLI
- **步骤**：创建 `plugins/<id>` 或 `themes/<id>`，按向导选择 Demo／Token／Shell
- **预期结果**：不修改现有 App；给出宿主依赖、注册与构建接入步骤

### 场景 4：静态部署查阅

- **角色**：只读文档的使用者
- **前置条件**：`pnpm build:portal` 后按站点 base 部署
- **步骤**：打开文档、搜索、演示 iframe、创建页
- **预期结果**：可浏览默认配置与文档；创建页提示需本地运行才能写入；不请求本地文件 API

## 功能需求

### REQ-001：统一门户布局

系统 SHALL 使用 VitePress 默认主题扩展。创建页不得使用独立非 sticky 页头。

**验收标准：**

- [x] 导航含指南、组件、公共能力、工程、创建工具
- [x] `/create/*` 与文档页共用 sticky 顶栏、侧栏、搜索与明暗开关
- [x] 向导 Element Plus 控件跟随站点明暗 token

### REQ-002：从源码生成公开参考

系统 SHALL 在构建时扫描全局组件与公共包 exports，生成参考正文。新增未覆盖公开项使 `check:docs` 失败。

**验收标准：**

- [x] 组件参考含 Props／`defineModel`／事件／插槽／`defineExpose` 方法及关联类型（能从 SFC 与相对导入分析出的部分）
- [x] 模块参考含 JSDoc 与签名；含 `@ingot/shared/crypto`、`@ingot/shared/hooks` 子路径
- [x] 官方插件页含 canonical 与 `in-page-header` 说明
- [x] 可独立运行组件有 iframe 演示；其余注明限制

### REQ-003：本地生成、静态只读

系统 SHALL 将写入限制在本地开发服务。Web 与 CLI 共用校验、预览与生成。

**验收标准：**

- [x] 预览不写目标目录；创建拒绝覆盖与路径逃逸
- [x] 静态站 `canWrite=false`，不调用 `/__dev-portal/api`
- [x] 生成后不自动安装依赖或修改其它 App

## 非功能需求

- 门户 Vite 与 VitePress 版本锁定在门户包内，不升级业务 catalog Vite 8
- 演示与文档 SSR 隔离，不启动 `bootstrapAdminApp`
- 不把本机路径、凭据写入静态产物

## 依赖与约束

- 依赖已归档 themes workspace 与脚手架分层
- 不改变现有 `apps/admin`、`apps/auth` 业务行为

## 验收标准

- [x] 本地门户可搜索、导航、使用三个向导
- [x] 静态构建可部署；创建页只读提示明确
- [x] `pnpm check:docs` 校验覆盖清单与演示入口
- [x] 未把测试生成物留在正式 `apps/`、`plugins/`、`themes/`
