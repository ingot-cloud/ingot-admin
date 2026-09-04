# 网络请求与服务端状态规格

本文写已上线的请求与缓存行为。设计细节见归档 [DESIGN.md](../../../changes/archive/2026/20260903-packages-network-query-modernization/DESIGN.md)。本次无后端接口变更。

## 概述

共享 HTTP Client 只做传输、归一化、错误分类、取消与可组合拦截器。TanStack Query 管理 admin 的服务端读取状态；鉴权、412 挑战和信封加密仍在 admin/auth 适配器。页面 API 保持具名 `XxxAPI` 与 `Promise<R<T>>`。

## 范围

### In Scope

- `@ingot/http-client` 与 admin/auth 适配器
- QueryClient 默认策略、Query Key、`useServerPaging`、`queryAdminData`
- 官方插件列表/详情/树/选项迁移到 Query
- 容器 Nginx `upstream` keepalive、`nginx -t`、去掉未监听的 `EXPOSE 443`
- 协议边界：浏览器 HTTP/2 vs 容器到 gateway 的 HTTP/1.1

### Out of Scope

- 改后端接口、业务码、挑战或信封协议
- 在应用容器终止公网 TLS 或启用明文 h2c
- 全局 6 请求并发队列
- Query 持久化、离线 Mutation、SSR
- 把登录、PKCE、412、密码、上传下载和含手机号的即时搜索改成 Query
- 删除已废弃的 `usePaging` / `transformPageAPI` / `useConfirm*` 公共导出

## 用户场景

### 场景 1：读取并复用列表或详情

- **角色**：管理后台用户
- **前置条件**：已登录 admin
- **步骤**：进入列表或详情、翻页、返回已访问页面
- **预期结果**：同一 Query Key 并发只打一次网；30 秒内新鲜缓存可复用；首次加载与后台刷新可区分（表格 `:loading` 用 `fetching`）

### 场景 2：编辑后列表更新

- **角色**：具备写权限的管理员
- **步骤**：在抽屉或行内提交创建、修改、删除或状态切换
- **预期结果**：写请求不自动重试；成功后按 Key 失效相关列表/详情并重拉；失败只提示一次

### 场景 3：改筛选或离开页面

- **角色**：管理后台用户
- **步骤**：输入筛选但不点搜索；或在请求未完成时换页/卸载
- **预期结果**：输入变化不立刻请求；无参搜索提交条件并回第一页；旧请求随 AbortSignal 取消且不弹取消错误

### 场景 4：公网与容器协议

- **角色**：部署人员
- **步骤**：浏览器访问公网 HTTPS；容器反代 `/api/` 到 gateway
- **预期结果**：HTTP/2 由外层 TLS 代理协商；容器 `listen 3000` 明文 HTTP/1.1，到 gateway 复用 keepalive

### 场景 5：HTTP/1.1 客户环境

- **角色**：只能使用 HTTP/1.1 的用户
- **步骤**：页面同时发出超过浏览器可即时发送数量的独立请求
- **预期结果**：浏览器排队后请求仍全部完成；前端不因协议探测或全局信号量死锁

## 功能需求

### REQ-001：HTTP Client 分层

共享 HTTP Client SHALL 不依赖 Vue、Pinia 或 Element Plus。页面仍 `import request from "@/net"` 或 `@ingot/admin-core`。API 第三参可选 `RequestOptions`（`signal`、`feedback`、`progress`）。

**验收标准：**

- [x] 包名为 `@ingot/http-client`
- [x] 业务失败归一化为 `ApiError`；取消错误不弹全局提示
- [x] `manualProcessingFailure` 仍可用，等价 `feedback: "silent"`，已标记废弃

### REQ-002：Query 职责与缓存

Query SHALL 只缓存 `R<T>.data`，驻留内存。默认 `staleTime` 30 秒、`gcTime` 10 分钟、不随窗口聚焦刷新、重连后刷新过期查询。引用数据可覆盖为 5 分钟；会话等实时数据为 0。

**验收标准：**

- [x] Key 为 `[domain, resource, operation, scope, params]`，参数经 `snapshotQueryParams`
- [x] Token、密码、手机号不进 Key
- [x] Query 请求使用 `silentQueryRequest`（`feedback/progress: "silent"`）
- [x] 命令式读缓存使用 `queryAdminData`（`QueryClient.query`），不用已废弃的 `fetchQuery`
- [x] 登出先取消 Query 再 `clear` 缓存

### REQ-003：分页与写操作

列表 SHALL 使用 `useServerPaging`：维护编辑中 `condition` 与已提交条件；`search()` / 无参 `fetchData()` 提交并回第一页；翻页保留上一页 `placeholderData`。写成功后 `invalidateQueries`，不只依赖再点搜索。

**验收标准：**

- [x] 表格 `:loading` 使用 `fetching`
- [x] Mutation 默认不重试；`useMutation` 才 silent，由 MutationCache 提示
- [x] 命令式 CUD（非 Mutation）保持全局 feedback
- [x] member / platform 含手机号的用户列表仍用 `usePaging`

### REQ-004：协议与并发

HTTP/2 SHALL 配在浏览器连接的 TLS 终止点。应用容器 `proxy.conf` 使用 `upstream ingot_gateway { keepalive 32; }`，`/api/` 保持 HTTP/1.1、空 Connection 与路径改写。SHALL NOT 在全局 net 硬编码 6 连接上限。

**验收标准：**

- [x] admin / auth / create-app 模板 Dockerfile 不 `EXPOSE 443`，构建执行 `nginx -t`
- [x] 无全局请求信号量
- [x] 公网是否已协商 `h2` 由外层代理环境保证，不作为仓库内门禁

### REQ-005：迁移边界

登录、PKCE、412 挑战执行、密码提交、上传下载保持命令式。仅转发 API 的 Pinia Store 已移除；客户端 UI 状态留在页面。旧分页 Hooks 保留导出并标记 deprecated。

**验收标准：**

- [x] 官方插件可读列表/树/选项已迁 Query（用户列表 phone 除外）
- [x] `useConfirm*` 业务调用已清零
- [x] `pnpm check` 通过

## 非功能需求

- Query 重试最多 1 次，且仅网络 / 超时 / 502–504
- NProgress 只计前台请求，静默 Query 不参与
- 401、签退、412、信封加解密与 kid 轮换语义不变
- `@tanstack/vue-query` 锁定 catalog `5.102.2`

## 依赖与约束

- 页面不得直接依赖 `@ingot/http-client` 的 UI 无关细节以外的适配逻辑
- 嵌套 Key 不得调用不存在的 `resourceKeys.trees()` / `searches()`
- 删除 `usePaging` 公共导出留给后续版本化 change
- 公网 HTTP/2 配置在仓库外

## 验收标准

- [x] admin 与 auth 复用共享 HTTP Client，差异由适配器注入
- [x] 具名 `XxxAPI` 与 `Promise<R<T>>` 保持不变
- [x] 官方插件服务端读取走 Query；敏感即时搜索保持命令式
- [x] 容器 Nginx keepalive 与协议边界已写入部署文档
- [x] `pnpm check` 通过
