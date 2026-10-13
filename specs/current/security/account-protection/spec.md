# 账号保护规格

## 概述

平台管理员在安全中心 `/security/account-protection` 查看和维护 B 端管理员、C 端会员的登录失败自动锁定策略，canonical viewPath 为 `security.account.protection`。页面采用 Settings 原型，两个页级 Tab 分别承载 B/C 策略，默认 B 端；正文使用共享居中布局。接口与精确权限见归档 [平台能力矩阵](../../../changes/archive/2026/20261012-iam-platform-capability-completion/API.md) 和 [账号保护 API](../../../changes/archive/2026/20260825-security-account-protection/API.md)。

## 范围

- B 端（`userType=0`）与 C 端（`userType=1`）策略的查看、编辑和分别保存
- 正式入口、精确 read/update 权限、激活请求与独立草稿
- 不提供新增/删除策略、手动解锁、锁定账号列表或强制刷新入口

## 用户场景

### 场景 1：按需查看两端策略

- **角色**：具有 `iam-platform:lockout-policy:read` 的平台管理员
- **步骤**：打开账号保护页，默认查看 B 端；选择「C 端锁定策略」
- **预期结果**：仅激活的用户类型请求现有单项接口；缺少策略时展示空态，不伪造提交；隐藏面板不请求

### 场景 2：独立维护某一端

- **角色**：具有 `iam-platform:lockout-policy:update` 的维护人员
- **步骤**：预览 → 编辑 → 修改字段 → 确认保存，或取消
- **预期结果**：只提交当前 userType，成功仅失效对应策略并回到预览；失败保留草稿；取消恢复服务端快照。已访问 Tab 切换保留各自草稿，互不合并提交

### 场景 3：永久锁定与只读

- **角色**：维护或只读人员
- **步骤**：查看两端约束或尝试维护
- **预期结果**：永久锁定仅 B 端可用；只读没有编辑/保存入口，撤销写权限后退出编辑

## 功能需求

### REQ-001：两个页级 Tab

系统 SHALL 使用「B 端锁定策略」「C 端锁定策略」两个页级 Tab，默认 B 端，各自懒挂载独立面板。读取缓存同时隔离用户类型与身份，隐藏面板在失效时不请求。

### REQ-002：预览与独立保存

系统 SHALL 默认预览，显式进入编辑；取消恢复、失败留草稿、成功回预览。保存处理器复核精确 update 权限，只失效当前 detail key。保存提示热更新，已锁定账号不会自动解锁。

### REQ-003：锁定约束

系统 MUST 仅允许 B 端永久锁定（`lockDurationMinutes=0`）。C 端时长 ≥ 1；`maxAttempts` ≥ 1、`attemptWindowMinutes` ≥ 1、`1 ≤ hintAfterAttempts ≤ maxAttempts`。

### REQ-004：共享正文布局

系统 SHALL 在 InFormContent 中使用默认 840px 最大宽度与工作区居中；窄容器自动收缩，字段与操作区共用边界，预览/编辑一致。页头与页级 Tab 保持工作区宽度，不新增滚动层。

## 依赖与约束

- 前端通过 session 鉴权，不调用 Inner Feign
- 用户类型复用 SessionUserTypeEnum（`"0"` / `"1"`）
- 布局与操作分层见 [管理台 UI 体验](../../common/admin-ui-experience/spec.md)
- 页面归属见 [平台能力](../../base/platform-capabilities/spec.md)

## 验收标准

- [x] 正式入口、默认 B 端及两 Tab 按需读取可用
- [x] 两端独立草稿、保存与失效互不影响
- [x] 永久锁定仅 B 端可用，只读与撤权行为正确
- [x] 居中正文在宽窄容器和明暗主题中不裁切
- [x] 2026-10-13 用户确认相关变更验证完成
