# 20260904-packages-net-interceptor-extension

> 状态：completed

## 协作模式

一人全栈（前端内部能力，无后端接口变更）

## 背景与动机

共享 `@ingot/http-client` 已落地，但拦截器仍带迁移残留，App 只能配置 `baseURL` / 超时。上一轮为老项目升级留下了 `usePaging` / `manualProcessingFailure` 兼容层。本版本面向新项目，需要：可组合拦截器、App 按 order 追加拦截器、删除旧分页与旧请求选项，并补齐网络模块文档。

## 目标

- 拦截器改为 `order: number` + 可选 `rejected` + `define*Interceptor` 工厂
- App 通过 `bootstrapAdminApp({ net.interceptors })` 追加拦截器，不能替换 core 拦截器或 failure hooks
- 删除 `manualProcessingFailure` / `manualProcessingAbort` / `usePaging` 及同文件兼容导出
- 含手机号搜索走 `useServerPaging`，Query Key 用敏感指纹而非明文
- 新增 `docs/network.md`，业务文档只保留新 API

## 范围

### In Scope

- `@ingot/http-client` 拦截器 API 与旧请求选项删除
- admin-core / auth 拦截器改用工厂；删除死聚合器
- `InNetConfig.interceptors` 与 `Http.configure` 重建 client
- `snapshotQueryParams` 敏感指纹；member / platform 用户列表迁移
- 删除 `usePaging.ts`、AutoImport / 约定保留名
- `docs/network.md` 与相关工程/编码文档

### Out of Scope

- 插件级全局拦截器注册
- 替换、关闭或重排 core 安全拦截器；覆盖 failure hooks
- 给 auth 再做一套 `bootstrapAdminApp` 式扩展
- 乐观更新、Query 持久化、把登录 / PKCE / 412 / 上传下载改成 Query

## 输入来源

- 接口文档：无（不改后端契约）
- 需求文档：对话确认的计划
- 后端来源：无

## 工件

- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

- 含手机号列表必须先有敏感指纹，再迁 `useServerPaging`，否则缓存会串单
- `Http.configure` 重建 client 后必须重新绑定 412 重试

## 相关链接

- 前序归档：[20260903-packages-network-query-modernization](../../archive/2026/20260903-packages-network-query-modernization/)
- 已上线规格：[specs/current/packages/network-query](../../../current/packages/network-query/)

## 完成记录

- 完成日期：2026-09-04
- 关联提交或 PR：
- 更新的 current capability：`packages/network-query`；并更正 `packages/app-plugins-shared-scaffold` 中已删除的 `usePaging`
- 与原设计的差异：导出 `InterceptorOrder` / `AdminNetInterceptorOrder`；请求与响应都是 order 越小越先执行
- 取消原因：
