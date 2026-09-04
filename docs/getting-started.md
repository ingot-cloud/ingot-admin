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

应用依赖 packages 的 `dist` 类型声明。未构建时会出现：

```
error TS2307: Cannot find module '@ingot/shared' or its corresponding type declarations.
```

开发时修改 packages 可用：

```bash
pnpm dev:admin-with-shared
```

### 4. 启动默认后台

```bash
pnpm dev:admin
```

登录应用：

```bash
pnpm dev:login
```

默认 admin 注册 platform、security、org、member 全部官方插件。裁剪方式见 [App 开发](./app-development.md)。

### 5. 生产构建

```bash
pnpm build:admin
pnpm build:login
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
├── apps/admin|auth|create-app
├── plugins/platform|security|org|member
├── packages/admin-core|admin-common|shared|http-client|vite-config
└── examples/admin-plugin
```

## 相关文档

- [开发模式](./development-model.md)
- [插件开发](./plugin-development.md)
- [App 开发](./app-development.md)
- [菜单 view_path](./menu-view-path.md)
- [添加新 Package](./add-new-package.md)
- [TypeScript 配置模板](./typescript-config-template.md)
- [Monorepo 构建优化](./monorepo-build-optimization.md)
