# 20260827-security-challenge-verification

> 状态：completed

## 协作模式

前后端分离

## 背景与动机

L4 访问防护把挑战策略标为「可只读、前端可隐藏」。L6 启用执行面：网关对匹配策略且无有效 PassToken 的请求返回 **412 `CHALLENGE_REQUIRED`**。管理台必须可配置挑战策略；**所有经网关的前端请求**必须按 412 响应 `data` 动态拉码 / 验码 / 重试，不能写死路径或 Header 名，也不能只在登录页处理。

前端鉴权走 session，不传 Bearer Token。

## 目标

- 访问防护页增加「挑战策略」Tab，支持 CRUD，写成功提示热更新
- login / admin 全局拦截 412，按响应 `data` 动态拉码、验码、原样重试
- 去掉业务请求随带 `_vc_code` / `captchaVerification` 的旧模型

## 范围

### In Scope

- `ingot-admin`：访问防护「挑战策略」Tab（列表 + 抽屉 CRUD）
- 挑战策略 api / models / 枚举；复用既有路径分组与 `PatternListEditor`
- `@ingot/utils` 挑战契约解析与同 scope 队列；login / admin axios 全局 412 拦截 + `ChallengeHost`
- 写操作成功文案「规则将在数秒内生效」；可选强制刷新仍用既有全域广播按钮

### Out of Scope

- 网关 Nacos 开关（`ingot.security.challenge.enabled` / `policy.mode`）的管理台配置
- 抽取 anji `verifition` SDK 到 `packages/`（412 契约已抽到 `@ingot/utils`）
- SMS / EMAIL 挑战类型、`/vc/slider/**`、把 PassToken 写入 JSON body
- 表单展示已废弃字段 `failureDimension` / `failureThreshold` / `failureWindowSec`

## 输入来源

- 接口文档：inbox `API.md`（原文移入，未重写）
- 需求文档：无；由 Agent 根据接口与现有访问防护 / 登录实现整理 `REQUIREMENTS.md`
- 后端来源：`ingot-service-security` Platform API（挑战策略）；执行面 `ingot-gateway`（412 / `/vc/image`）
- 文档标注 Change：`20260827-security-challenge-verification`（L6）

## 工件

- [接口](./API.md)
- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

- 412 响应体用 `msg` 而非统一 `message`，拦截器需兼容，且 **不要** 把 412 当普通业务失败 toast
- 信封加密请求重试前必须恢复明文 body/query，PassToken / scope 只追加到 Header
- 412 `data` 缺字段则不当作挑战；拉码/验码 URL 与 Header 名禁止写死
- 多种 `scope` 并发 412 时串行弹窗，禁止把 `login` token 用到 `anon`
- 菜单已有「访问防护」，本期只加 Tab，不新增子菜单

## 相关链接

- 网关其它策略（限流 / 名单）见接口文档指向的 L4 归档（本仓库可能无该副本）
- 既有页面：`apps/ingot-admin/src/pages/platform/security/access-protection/`
- 既有登录：`apps/ingot-login/src/pages/oauth2/challenge/password/`

## 完成记录

- 完成日期：2026-08-29
- 关联提交或 PR：
- 更新的 current capability：`security/access-protection`、`common/gateway-challenge`、`ingot-login/password-login`
- 与原设计的差异：施工中按用户更新的 API.md，PassToken / scope 从 query 改为 Header；挑战策略 `id` 前端按 string 存储；路径任意方法提交 `ANY`
- 取消原因：
