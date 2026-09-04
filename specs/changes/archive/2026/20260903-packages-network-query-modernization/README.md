# 20260903-packages-network-query-modernization

> 状态：completed

## 协作模式

一人全栈（前端基础设施、业务迁移与部署配置协同）。

## 背景与动机

管理端当前由 `packages/admin-core/src/net/` 提供 Axios、业务码、鉴权失效、网关挑战、
信封加密、NProgress 与请求取消，登录应用在 `apps/auth/src/net/` 维护另一套相近实现。
页面侧普遍使用 `usePaging` 和手工 Promise 回调维护服务端状态，缺少统一的缓存、同请求去重、
精确失效和过期请求取消能力。

部署侧由应用容器 Nginx 在明文 `3000` 端口提供 SPA 与 `/api/` 反向代理，公网 HTTPS 由外层
反向代理终止。浏览器到公网入口应使用 HTTP/2 多路复用；容器内连接继续使用 HTTP/1.1
keepalive。协议优化必须与前端服务端状态治理分层处理，不能在请求模块中硬编码浏览器连接上限。

## 目标

- 抽取 admin 与 auth 可共享、无 Vue/UI 依赖的 HTTP Client 底座，消除底层重复实现。
- 在 admin runtime 引入 TanStack Vue Query，统一服务端状态、缓存、取消、重试和失效。
- 保持 API 层具名 `XxxAPI` 函数与显式 `Promise<R<T>>`，支持渐进迁移。
- 外层 HTTPS 入口启用并验证 HTTP/2；容器内 Nginx 到 gateway 使用 HTTP/1.1 keepalive。
- 在只使用 HTTP/1.1 的客户环境中保持功能正确，不设置全局 6 请求并发队列。
- 分阶段迁移全部 admin 插件，登录、挑战、上传下载等命令式流程保持不缓存。

## 范围

### In Scope

- 新增共享 HTTP Client package、标准错误、请求选项、取消与进度生命周期。
- admin-core 与 auth 的请求适配器迁移，保持鉴权、挑战和信封加密语义。
- TanStack Vue Query 依赖、QueryClient runtime、类型注册、默认策略和开发调试。
- Query Key/Options/Mutation 工厂约定与服务端分页 Hook。
- 平台应用管理、在线会话管理试点，以及后续 admin-common/member/org/platform/security 迁移。
- 外层 HTTP/2 验证要求、容器 Nginx upstream keepalive、Docker 与脚手架配置同步。
- 单元、集成、构建、协议和并发验收。

### Out of Scope

- 修改后端接口、业务码、网关挑战协议或信封加密协议。
- 在应用容器内终止公网 TLS，或要求 gateway 必须升级为 HTTP/2。
- 在全局 HTTP Client 中检测协议并硬编码 6 请求并发队列。
- Query 缓存持久化、离线 Mutation、SSR hydration。
- 将 Pinia 中的客户端状态、权限状态和 UI 设置全部迁入 Query。
- 强制将登录、PKCE、挑战、密码提交、上传下载和敏感即时搜索改成 Query。

## 输入来源

- 接口文档：无；本次不改变后端接口契约，因此不创建 `API.md`。
- 需求文档：用户在 2026-09-03 对话中确认的 Net/TanStack Query 与 HTTP/2 合并方案。
- 后端来源：无。

## 工件

- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)
- [分阶段任务](./phases/README.md)

## 风险与依赖

- 公网 HTTP/2 由仓库外的 TLS 终止代理负责，需要运维提供配置权限或验证结果。
- Query 会放大之前被手工流程隐藏的缓存 Key、重复提示和错误分类问题，必须先完成基础设施再迁移页面。
- 信封解密、kid 轮换和 412 挑战存在严格拦截器顺序，抽取 HTTP Client 时必须以集成测试锁定。
- HTTP/2 消除浏览器 HTTP/1.1 同源连接瓶颈，但可能把并发压力传递给 gateway 和下游服务，需联动观察容量。
- `@tanstack/vue-query` 类型可能在 patch 版本修正，必须精确锁定并通过独立依赖变更升级。

## 相关链接

- https://tanstack.com/query/latest/docs/framework/vue
- https://nginx.org/en/docs/http/ngx_http_v2_module.html
- https://www.rfc-editor.org/rfc/rfc9113.html

## 完成记录

- 完成日期：2026-09-04
- 关联提交或 PR：
- 更新的 current capability：`packages/network-query`；并更新 `packages/app-plugins-shared-scaffold`、`security/session-management`、`security/access-protection`、`security/account-protection`
- 与原设计的差异：含手机号的用户列表仍用命令式 `usePaging`；命令式读缓存使用 `queryAdminData`（`QueryClient.query`）；公网 HTTP/2 依赖外层 TLS 代理，不阻塞归档
- 取消原因：
