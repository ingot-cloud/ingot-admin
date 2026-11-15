# 管理台同源密码登录

平台与租户各在自己的管理宿主提供 `/login/`。用户直接访问、收藏或长停留后，可在当前页面完成密码登录与组织选择；不再依赖独立登录 App 和浏览器 ticket/complete。

2026-10-31 用户确认两端登录、退出、切换组织和多标签页本地验收通过；这是已验收开发基线，不表示生产环境已发布。

- [页面规格](./spec.md)。
- [原登录接口定义（未修改部分）](../../../changes/archive/2026/20261031-ingot-login-same-origin/API.md)、[来源摘要](../../../changes/archive/2026/20261031-ingot-login-same-origin/SOURCES.md)。
- [验收记录](../../../changes/archive/2026/20261031-ingot-login-same-origin/VALIDATION.md)。
- 源码：[登录页面](../../../../plugins/auth/src/pages/login/IndexPage.vue)、[认证流](../../../../packages/auth-core/src/flow.ts)、[宿主会话](../../../../packages/admin-core/src/auth/session.ts)。
- [公共挑战](../../common/gateway-challenge/spec.md)、[网络身份约束](../../packages/network-query/spec.md)。

变更来源：20260827-security-challenge-verification 保留412设计；20261031-ingot-login-same-origin 接管当前宿主、事务、恢复及退出。独立视觉细项继续由外观 change 跟踪。

- [登录页视觉与配色验收](../../../changes/archive/2026/20261030-ingot-login-appearance/README.md)
- [统一登录错误提示（20261106-ingot-login-error-feedback）](../../../changes/archive/2026/20261106-ingot-login-error-feedback/README.md)（2026-11-06 用户验收通过）

当前租户菜单走[直接组织切换](../../org/organization-switch/README.md)，恢复/注销以[会话上下文](../../security/session-context/README.md)为准；[组织切换及账本归档](../../../changes/archive/2026/20261112-security-tenant-organization-switch/README.md)保留本地/三VM验收，性能和目标环境门禁继续独立阻断发布。

当前恢复、注销与上下文契约以[主变更接口修订](../../../changes/archive/2026/20261112-security-tenant-organization-switch/API.md)和当前页面规格为准；后端公开接口是唯一权威，旧登录API只保留未修改部分的来源。
