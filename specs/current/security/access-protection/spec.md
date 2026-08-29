# 访问防护规格

本文写已上线的页面行为；接口细节见归档 change 的 [API.md](../../../changes/archive/2026/20260827-security-challenge-verification/API.md)，不要在此维护完整接口表。

## 概述

平台管理员在「安全中心 / 访问防护」维护网关策略。页面为单页多 Tab。挑战策略 Tab 可配置匹配路径后的滑块挑战（ALWAYS / 限流后）。写成功提示热更新。前端鉴权走 session，不传 Bearer Token。全局 412 拦截见 [网关挑战](../../common/gateway-challenge/spec.md)。

## 范围

### In Scope

- 页面 `pages/platform/security/access-protection`（菜单既有，不新增子菜单）
- Tab：挑战策略（列表 + 抽屉 CRUD）
- 权限共用 `platform:security:policy:*`
- 页头既有「强制刷新策略」（全域广播）

### Out of Scope

- 路径分组 / 限流 / 黑白名单 / 违规升级 / 登录失败保护 / 封禁审计的细节（既有 Tab，非本变更引入）
- 网关 Nacos 开关（`ingot.security.challenge.enabled` / `policy.mode`）的管理台配置
- SMS / EMAIL 挑战类型

## 用户场景

### 场景 1：查看挑战策略列表

- **角色**：平台管理员（`platform:security:policy:query` 或超级管理员）
- **前置条件**：已登录管理台，具备访问防护菜单
- **步骤**：打开「安全中心 / 访问防护」→「挑战策略」Tab
- **预期结果**：拉取全部策略，按 `priority` 升序；停用行仍在列表中；remote 生产能看到种子 `login-always`

### 场景 2：新增 / 编辑 / 删除

- **角色**：平台管理员（create / update / delete 或超级管理员）
- **前置条件**：处于挑战策略 Tab
- **步骤**：新建或行内编辑；分组与内联路径二选一；删除走抽屉删除
- **预期结果**：POST 新增、PUT 带字符串 `id`；删除路径使用原样字符串 id，不转 number；成功提示「规则将在数秒内生效」

### 场景 3：表单约束

- **角色**：平台管理员
- **前置条件**：打开新建/编辑抽屉
- **步骤**：填写编码、触发、类型、scope、TTL、剩余次数、路径或分组
- **预期结果**：`trigger` 为 `always` / `on_rate_limit`；类型仅 SLIDER / IMAGE；scope 非空且 ≤64；TTL 与 remaining ≥ 1；路径不得 `/vc`；任意 HTTP 方法提交 `ANY`。不展示废弃失败阈值。验码失败上限 / 拉黑时长可填，旁注网关不执行

## 功能需求

### REQ-001：挑战策略 Tab

系统 SHALL 在访问防护页内用 Tab 维护挑战策略，不新增子菜单。未访问的 Tab 不发请求。

**验收标准：**

- [x] 源码在 `access-protection/`，面板 `ChallengePolicyPanel`
- [x] 权限共用 `platform:security:policy:*`

### REQ-002：分组与路径二选一

系统 SHALL 在关联分组时忽略内联 `patternList`；配置内联路径时清空分组。路径 method 任意时提交 `ANY`。

**验收标准：**

- [x] 分组与路径互斥
- [x] 路径不得匹配 `/vc`、`/vc/**`

### REQ-003：主键按字符串传递

系统 SHALL 将挑战策略 `id` 按字符串存储与提交（后台 bigint，JSON 字符串），禁止转 number。

**验收标准：**

- [x] 删除 URL 与 PUT body 中的 id 保持原样字符串

## 非功能需求

- 前端不在请求头加 `Authorization: Bearer`
- 不调用 Inner Feign
- 写成功提示「规则将在数秒内生效」

## 依赖与约束

- 挑战策略接口见归档 [API.md](../../../changes/archive/2026/20260827-security-challenge-verification/API.md)
- 路径分组复用既有 `GET /groups` 与 `PatternListEditor`
- 全局 412 行为见 [网关挑战](../../common/gateway-challenge/spec.md)

## 验收标准

- [x] 访问防护可打开挑战策略 Tab 并完成 CRUD
- [x] 写成功提示热更新；删除 id 不丢精度
- [x] 任意方法提交 `ANY`；`/vc` 路径被拒绝
