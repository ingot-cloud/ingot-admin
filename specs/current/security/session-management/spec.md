# 会话管理规格

本文写已上线的页面行为；接口细节见归档 change 的 [API.md](../../../changes/archive/2026/20260820-security-session-management/API.md)，不要在此维护完整接口表。

## 概述

平台管理员在「安全中心 / 在线用户」查看与强制下线在线会话，并维护并发会话策略。会话以 `sid` 为下线入参；前端鉴权走 session，不传 Bearer Token。

## 范围

### In Scope

- 页面 `/platform/security/onlinetoken`（菜单权限 `platform:security:onlinetoken`；路由与菜单 path 未改）
- 源码 `plugins/security/src/pages/sessions`
- canonical viewPath `security.sessions`
- Tab：在线会话、并发策略
- 按 sid / 按用户强制下线
- 并发策略 GLOBAL / CLIENT / USER_TYPE 的查看与维护

### Out of Scope

- 不改路由、菜单 path、菜单权限码
- 登录应用对 `concurrent_session_limit` / `session_policy_unavailable` 的文案

## 用户场景

### 场景 1：查询在线会话并强制下线

- **角色**：平台管理员
- **前置条件**：已登录管理台，具备在线用户菜单
- **步骤**：打开「在线会话」Tab → 选择客户端或填写用户 ID → 搜索 → 对某行按 sid 下线，或下线该用户会话
- **预期结果**：一行一个会话；下线后刷新列表；按 sid 已不在线时提示；按用户下线提示撤销数量

### 场景 2：查看会话详情

- **角色**：平台管理员
- **前置条件**：列表中有目标会话
- **步骤**：点击「详情」
- **预期结果**：抽屉展示 sid / jti / UA 等字段；会话已不存在时提示并刷新列表

### 场景 3：维护并发策略

- **角色**：平台管理员（写操作需 `platform:security:session:policy:update` 或超级管理员）
- **前置条件**：打开「并发策略」Tab
- **步骤**：查看列表；新增或编辑（scope 联动 clientId / userType）；GLOBAL 不可删除
- **预期结果**：保存后提示下次登录生效；`maxSessions=0` 展示为「不限制」

## 功能需求

### REQ-001：扁平会话列表

系统 SHALL 以一行一个会话展示在线会话，操作绑定 `sid` 而非 `jti`。

**验收标准：**

- [x] 表格不再使用「用户行 + 展开 tokens」
- [x] 强制下线按 sid；返回 false 时提示「会话已不在线」
- [x] 按用户下线提示「已下线 N 个会话」

### REQ-002：查询前置条件

系统 SHALL 在未指定 `clientId` 且未指定 `userId` 时不发起列表请求。按登录 IP 过滤时必须同时有 `clientId`。

**验收标准：**

- [x] 缺少 clientId 与 userId 时提示，不发请求
- [x] 仅填 IP 未选客户端时提示
- [x] 仅按 Client 查询时提示「按在线用户翻页」
- [x] 列表/详情走 Query 且 `staleTime: 0`；下线成功后失效会话列表

### REQ-003：展示兜底与时间

系统 SHALL 将会话时间从 ISO-8601 UTC 转为本地时间；`lastAccessAt` 文案为「最近凭据活动」。名称为空时用 username / userId、tenantId 兜底，且不禁用下线。

**验收标准：**

- [x] 时间本地化；最近凭据活动文案正确
- [x] 名称缺失时仍可下线

### REQ-004：并发策略 Tab

系统 SHALL 在同一页面提供并发策略维护，不新增菜单。GLOBAL 策略不可删除；编辑为全量提交。

**验收标准：**

- [x] 同页 Tab，无新路由
- [x] GLOBAL 置顶且禁用删除
- [x] `maxSessions=0` 展示「不限制」
- [x] 保存提示下次登录生效、已在线会话不受影响

## 非功能需求

- 前端不在请求头加 `Authorization: Bearer`；由网关用 session 换 token
- 下线类 DELETE 参数走 query，不走 body
- 无 `platform:develop:client:query` 且非超级管理员时，客户端改为手填 `clientId`

## 依赖与约束

- 会话与策略接口见归档 [API.md](../../../changes/archive/2026/20260820-security-session-management/API.md)
- 客户端列表复用 `GET /auth/client/page`（`ClientPageAPI`）；租户 / Client 选择器来自 `@ingot/admin-common`，不依赖 platform 插件
- 菜单权限沿用 `platform:security:onlinetoken`

## 验收标准

- [x] 在线会话查询、详情、按 sid / 用户下线可用
- [x] 并发策略列表与新增/编辑/删除（GLOBAL 除外）可用
- [x] 路由与菜单 path 未改
- [x] canonical viewPath `security.sessions`
