# 网络请求与服务端状态

## 概述

admin 与 auth 共用无 UI 的 `@ingot/http-client` 做传输与错误归一化。管理台用 TanStack Vue Query 管理列表、详情、树和选项；页面仍导出具名 `XxxAPI`。公网 HTTP/2 在外层 TLS 终止代理；应用容器 Nginx 对 gateway 使用 HTTP/1.1 keepalive。

## 相关源码

- [packages/http-client](../../../../packages/http-client)
- [packages/admin-core/src/net](../../../../packages/admin-core/src/net)
- [packages/admin-core/src/query](../../../../packages/admin-core/src/query)
- [apps/auth/src/net](../../../../apps/auth/src/net)
- [apps/admin/proxy.conf](../../../../apps/admin/proxy.conf)
- [apps/auth/proxy.conf](../../../../apps/auth/proxy.conf)
- [docs/composable-admin-runtime.md](../../../../docs/composable-admin-runtime.md)
- [docs/create-app.md](../../../../docs/create-app.md)
- [.agents/skills/ingot-coding-standards/api-conventions.md](../../../../.agents/skills/ingot-coding-standards/api-conventions.md)

## 对接接口

本次不改变后端接口契约，无独立 `API.md`。设计与验收见归档 [20260903-packages-network-query-modernization](../../../changes/archive/2026/20260903-packages-network-query-modernization/)。

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-09-04 | [20260903-packages-network-query-modernization](../../../changes/archive/2026/20260903-packages-network-query-modernization/) | 抽取 HTTP Client、引入 Vue Query、逐域迁移服务端状态、容器 keepalive |
