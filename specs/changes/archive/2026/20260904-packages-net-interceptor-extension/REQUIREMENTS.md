# 需求：网络拦截器扩展与废弃清理

相对 [current/packages/network-query](../../../current/packages/network-query/spec.md) 的增量。

## 场景与页面

### 场景 1：App 追加请求头

- **角色**：独立管理台 App 作者
- **入口**：`bootstrapAdminApp({ net.interceptors })`
- **步骤**：注册 `order: AdminNetInterceptorOrder.request.header + 2` 的请求拦截器，写入自定义头
- **预期结果**：请求在 Header 之后、Envelope 之前带上该头；不能关闭信封或鉴权提示

### 场景 2：含手机号的用户列表

- **角色**：管理后台用户
- **入口**：会员用户列表、平台管理员用户列表
- **步骤**：用不同手机号搜索
- **预期结果**：两次结果互不串缓存；DevTools Query Key 无明文手机号；筛选/翻页与其它列表一样用 `useServerPaging`

### 场景 3：静默请求

- **角色**：插件 / core 适配器作者
- **步骤**：公钥拉取、挑战校验等需要自行处理失败的请求
- **预期结果**：只传 `feedback: "silent"`；不再存在 `manualProcessingFailure`

## 验收标准

- [x] App 只能追加拦截器，不能替换 core 拦截器或 hooks
- [x] 旧请求选项与 `usePaging` 公共导出已删除
- [x] 含手机号列表走 Query，Key 有敏感指纹、无明文
- [x] `docs/network.md` 覆盖 http-client 与 admin-core net

## ADDED

### REQ-A001：App 按 order 追加拦截器

`InNetConfig` SHALL 接受 `interceptors.request` / `interceptors.response`。bootstrap 时与 core 拦截器合并后按 order 稳定排序（同 order 时 core 在前）。

**验收标准：**

- [x] `bootstrapAdminApp({ net.interceptors })` 可追加请求/响应拦截器
- [x] 业务页面仍 `import request from "@/net"`
- [x] 从 `@ingot/admin-core` 可导入 `defineRequestInterceptor` / `defineResponseInterceptor`

### REQ-A002：敏感 Query Key 指纹

`snapshotQueryParams` SHALL 剥掉明文敏感字段，并对剥掉的值写入不可逆短指纹，使不同手机号对应不同 Key。

**验收标准：**

- [x] 同非敏感条件 + 不同 phone → Key 不同
- [x] Key 中不含明文手机号
- [x] 无敏感字段时现有列表 Key 行为不变

## MODIFIED

### REQ-M001：REQ-001 → 拦截器工厂与仅新选项

`PreFilter` / `PostFilter` 使用 `order: number`，`rejected` 可选。`RequestOptions` 仅 `signal` / `feedback` / `progress`。

**变更说明：** 删除 `manualProcessingFailure` / `manualProcessingAbort` 兼容映射。

**验收标准：**

- [x] 调用点改为 `feedback: "silent"`
- [x] Axios 扩展类型不再声明旧字段

### REQ-M002：REQ-003 → 全部列表使用 useServerPaging

含手机号的用户列表 SHALL 使用 `useServerPaging`，不再使用 `usePaging`。

**变更说明：** 敏感参数靠指纹区分缓存，不再用命令式分页规避 Key。

**验收标准：**

- [x] member / platform 用户列表已迁移
- [x] 写成功后按 Query Key 失效

## REMOVED

### REQ-R001：REQ-005 中的 usePaging 兼容层

**移除原因：** 本版本面向新项目，不保留旧分页、`transform*`、`useConfirm*` 公共导出。
