# 账号保护规格

本文写已上线的页面行为；接口细节见归档 change 的 [API.md](../../../changes/archive/2026/20260825-security-account-protection/API.md)，不要在此维护完整接口表。

## 概述

平台管理员在「安全中心 / 账号保护」维护账号相关安全策略。页面为单页多 Tab（对齐凭证策略 / 访问防护）；当前仅「账号锁定」Tab，左右两栏分别配置 B 端、C 端登录失败自动锁定。前端鉴权走 session，不传 Bearer Token。后续账号保护能力继续加 Tab，不新增子菜单。

## 范围

### In Scope

- 页面 `/platform/security/account-protection`（菜单自行配置；建议权限 `platform:security:account:lockout:query`）
- Tab：账号锁定
- B 端（`userType=0`）与 C 端（`userType=1`）策略的查看与分别保存
- B 端允许永久锁定；C 端禁止

### Out of Scope

- 账号保护的其它 Tab
- 手动解锁已锁定账号、查看锁定中账号列表
- 强制刷新 / 广播失效按钮
- 新增 / 删除策略行

## 用户场景

### 场景 1：查看 B / C 两端锁定策略

- **角色**：平台管理员
- **前置条件**：已登录管理台，具备账号保护菜单
- **步骤**：打开「安全中心 / 账号保护」，默认落在「账号锁定」Tab
- **预期结果**：左右两栏分别展示 B 端管理员、C 端会员策略；缺行时该栏空态，不伪造提交

### 场景 2：分别保存某一端策略

- **角色**：平台管理员（写操作需 `platform:security:account:lockout:update` 或超级管理员）
- **前置条件**：对应栏有策略数据
- **步骤**：该栏「编辑」→ 修改启用、失败次数、锁定时长、滑动窗口、提示起始次数、备注 → 确认保存
- **预期结果**：只提交该栏 `userType`；成功提示「账号锁定策略将在数秒内生效」；已锁定账号不会自动解锁

### 场景 3：永久锁定仅对 B 端开放

- **角色**：平台管理员
- **前置条件**：处于账号锁定 Tab 的编辑态
- **步骤**：B 端可勾选「永久锁定」（时长为 0）；C 端无该选项，时长须 ≥ 1
- **预期结果**：C 端无法提交永久锁定

## 功能需求

### REQ-001：账号保护单页与账号锁定 Tab

系统 SHALL 以「安全中心 / 账号保护」单页承载策略，账号锁定为页内 Tab，不是子菜单。后续能力只加 Tab。

**验收标准：**

- [x] 入口 `plugins/security/src/pages/account-protection/IndexPage.vue`
- [x] canonical viewPath `security.account.protection`
- [x] 无「账号锁定」子菜单

### REQ-002：B / C 两栏独立维护

系统 SHALL 在账号锁定 Tab 用左右两栏分别维护两端策略，各自 PUT，禁止合并一次请求。无新增、无删除。

**验收标准：**

- [x] 进 Tab 一次拉取全部策略
- [x] 两栏互不影响，各自编辑与保存
- [x] 保存后刷新展示，提示热更新生效

### REQ-003：锁定时长约束与前端校验

系统 SHALL 仅允许 B 端永久锁定（`lockDurationMinutes = 0`）。C 端时长 ≥ 1。`maxAttempts` ≥ 1、`attemptWindowMinutes` ≥ 1、`1 ≤ hintAfterAttempts ≤ maxAttempts`。

**验收标准：**

- [x] B 端可勾选永久锁定；C 端不展示该选项
- [x] 无更新权限时隐藏编辑/保存，只读展示

## 非功能需求

- 前端不在请求头加 `Authorization: Bearer`；由网关用 session 换 token
- 不调用 Inner Feign `/inner/security/account/lockout-policies`
- 未访问的 Tab 不发请求（`visitedTabs` 懒挂载）

## 依赖与约束

- 账号锁定策略接口见归档 [API.md](../../../changes/archive/2026/20260825-security-account-protection/API.md)
- 菜单由运营在菜单管理配置，不在本仓库落库
- 用户类型复用 `SessionUserTypeEnum`（`"0"` / `"1"`）

## 验收标准

- [x] 账号保护单页可打开，默认账号锁定 Tab
- [x] B / C 两栏可独立查看与保存
- [x] 永久锁定仅 B 端可用；无新增/删除/强制刷新
