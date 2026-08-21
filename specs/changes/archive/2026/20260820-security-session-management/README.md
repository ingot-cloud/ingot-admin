# 20260820-security-session-management

> 状态：completed

## 协作模式

前后端分离

## 背景与动机

Auth 旧接口 `/auth/token/**`（在线 Token 列表、按 jti 下线、按用户下线）已删除且无兼容层。安全中心改为会话管理：以 `sid` 标识会话，并新增并发策略维护。管理台「安全中心 / 在线用户」页需对接新接口，路由与菜单不变。

前端鉴权走 session，不传 Bearer Token；网关用 session 换 token 后再转发到 `ingot-service-security`。

## 目标

- 在线用户页改为扁平会话列表（一行一个会话），按 `sid` / 用户下线
- 同页增加「并发策略」Tab，维护 GLOBAL / CLIENT / USER_TYPE 策略
- 查询前置校验 `clientId` 或 `userId`；Client 选择器绑 `clientId`，无客户端查询权限时手填

## 范围

### In Scope

- `/platform/security/onlinetoken` 页面改造（会话 Tab + 并发策略 Tab）
- 会话与并发策略的 api / models / 枚举
- 删除旧 `/api/auth/token/**` 前端封装

### Out of Scope

- 不改路由、菜单 path、菜单权限码 `platform:security:onlinetoken`
- 不改 ingot-login 的 `concurrent_session_limit` / `session_policy_unavailable` 文案
- 不在前端请求头加 `Authorization: Bearer`

## 输入来源

- 接口文档：inbox `API.md`（原文移入，未重写）
- 需求文档：无；由 Agent 根据接口与对话整理 `REQUIREMENTS.md`
- 后端来源：`ingot-service-security` Platform API（Phase 03 会话 + Phase 04 并发策略）

## 工件

- [接口](./API.md)
- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

- 列表查询必须带 `clientId` 或 `userId`，否则后端拒绝
- `GET /auth/client/page` 需要 `platform:develop:client:query`，无权限时退化为手填 clientId
- 按 Client 分页时 `total` 是在线用户数，多会话模式下当页条数可能大于 `size`
- DELETE 下线接口参数必须走 query，不能走 body

## 相关链接

-

## 完成记录

- 完成日期：2026-08-20
- 关联提交或 PR：
- 更新的 current capability：`security/session-management`
- 与原设计的差异：无
- 取消原因：
