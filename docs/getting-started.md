# 首次构建流程

本文档说明如何首次设置和启动 Ingot Admin。架构说明见 [开发模式](./development-model.md)。

## 前置要求

- **Node.js**: `>=22.17.0 <23`
- **pnpm**: `10.12.4`

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd ingot-admin
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 构建基础包

首次运行前必须构建 `packages/`：

```bash
pnpm build:packages
```

有正式主题包时，`pnpm build:admin` 会在 packages 之后构建 `themes/`；目录为空则跳过。

应用依赖 packages 的 `dist` 类型声明。未构建时会出现：

```
error TS2307: Cannot find module '@ingot/shared' or its corresponding type declarations.
```

开发时修改 packages 可用：

```bash
pnpm dev:admin-with-shared
```

### 4. 启动后台与登录

本机 DEV 用四个 `*.localhost` 隔离 Cookie（与 Nacos `in-bff-apps.yml` 一致）。浏览器直接回环，不必写 `/etc/hosts`。

租户管理台（http://tenant.localhost:5798）与租户登录（http://tenant-login.localhost:1798）：

```bash
pnpm dev:admin
pnpm dev:login
```

平台管理台（http://platform.localhost:5799）与平台登录（http://platform-login.localhost:1799）：

```bash
pnpm dev:admin-platform
pnpm dev:login-platform
```

`pnpm dev` 会并行启动上述四个应用。请用上述 `*.localhost` 打开，不要用光杆 `localhost:端口`。租户后台是 `apps/admin`（org/security），平台后台是 `apps/admin-platform`（platform/security）。Member 不默认混入。裁剪方式见 [App 开发](./app-development.md)。登录链路见后端 `docs/modules/authorization-server/BFF-AUTH-FLOW.md`。

### 5. 生产构建

```bash
pnpm build:admin
pnpm build:admin-platform
pnpm build:login
pnpm build:login-platform
pnpm build
```

插件没有独立 production build，由 App 构建时编译选中的源码。

## 常见问题

### 找不到 `@ingot/shared`

先执行 `pnpm build:packages` 或 `pnpm build:shared`。

### 改了 packages 但页面没更新

使用 `pnpm dev:admin-with-shared`，或再跑一次 `pnpm build:packages`。

### 类型检查失败

```bash
pnpm build:packages
pnpm type-check
```

### 清理后重建

```bash
pnpm install
pnpm build:packages
pnpm dev:admin
```

## 目录

```
ingot-admin/
├── apps/admin|auth|dev-portal
├── plugins/platform|security|org|member
├── packages/admin-core|admin-common|shared|http-client|vite-config
└── examples/admin-plugin|admin-theme
```

## 相关文档

- [开发模式](./development-model.md)
- [网络请求](./network.md)
- [插件开发](./plugin-development.md)
- [App 开发](./app-development.md)
- [主题开发](./theme-development.md)
- [菜单 view_path](./menu-view-path.md)
- [添加新 Package](./add-new-package.md)
- [TypeScript 配置模板](./typescript-config-template.md)
- [Monorepo 构建优化](./monorepo-build-optimization.md)
