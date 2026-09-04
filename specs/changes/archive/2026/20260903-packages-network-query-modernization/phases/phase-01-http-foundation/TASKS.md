# Phase 1：共享 HTTP Client 与兼容适配

## 实现

- [x] 使用仓库 package 脚手架创建 `@ingot/http-client`，补齐构建、类型检查和测试配置
- [x] 定义 `HttpClient`、`HttpRequestConfig`、`RequestOptions`、`ApiError` 与工厂接口
- [x] 实现响应归一化以及 business/http/network/timeout/cancelled 错误分类
- [x] 实现可组合拦截器和请求生命周期 hooks，不依赖 Vue、Pinia、Element Plus
- [x] 为外部 AbortSignal、遗留 CancelManager 与取消错误建立明确优先级
- [x] admin-core net 切换到共享 client，保留当前公共 `Http/request` 导出
- [x] auth net 切换到共享 client，保留登录应用当前调用接口
- [x] 保持信封解密、kid 刷新、412 挑战与业务码的处理顺序
- [x] 将 NProgress 改为前台请求引用计数，后台/静默请求不参与
- [x] 将 `manualProcessing*` 映射到新请求选项并标记 deprecated

## 测试与门禁

- [x] 单测成功、业务失败、401、网络、超时、取消和并发进度
- [x] 集成测试信封 whole/field/query、kid 重试和 412 挑战重试
- [x] admin-core/auth type-check、unit test、build 通过
- [ ] 未迁移页面的请求、提示和路由取消行为无回归
