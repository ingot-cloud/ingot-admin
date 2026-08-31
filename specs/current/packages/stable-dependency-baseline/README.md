# 稳定依赖基线

## 概述

workspace 统一 Node.js 22 / pnpm 10 与 Vue 生态稳定版本。两个应用通过 pnpm catalog 引用公共运行时依赖；页面功能、路由与加密协议不因基线升级而改变。

## 相关源码

- [package.json](../../../../package.json)
- [pnpm-workspace.yaml](../../../../pnpm-workspace.yaml)
- [.nvmrc](../../../../.nvmrc)
- [.gitlab-ci.yml](../../../../.gitlab-ci.yml)
- [apps/ingot-admin/package.json](../../../../apps/ingot-admin/package.json)
- [apps/ingot-login/package.json](../../../../apps/ingot-login/package.json)
- [packages/hooks/package.json](../../../../packages/hooks/package.json)

## 对接接口

本次无后端接口变化。

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-08-31 | [20260829-packages-stable-dependency-baseline](../../../changes/archive/2026/20260829-packages-stable-dependency-baseline/) | 建立 Node 22 / Vue 3.5 / Vite 8 / TypeScript 6 稳定依赖基线 |
