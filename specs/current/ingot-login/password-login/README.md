# 管理台同源密码登录

平台与租户各在自己的管理宿主提供 `/login/`。用户直接访问、收藏或长停留后，可在当前页面完成密码登录与组织选择；不再依赖独立登录 App 和浏览器 ticket/complete。

2026-10-31 用户确认两端登录、退出、切换组织和多标签页本地验收通过；这是已验收开发基线，不表示生产环境已发布。

- [页面规格](./spec.md)。
- [API副本与来源](../../../changes/archive/2026/20261031-ingot-login-same-origin/API.md)、[来源摘要](../../../changes/archive/2026/20261031-ingot-login-same-origin/SOURCES.md)。
- [验收记录](../../../changes/archive/2026/20261031-ingot-login-same-origin/VALIDATION.md)。
- 源码：[登录页面](../../../../plugins/auth/src/pages/login/IndexPage.vue)、[认证流](../../../../packages/auth-core/src/flow.ts)、[宿主会话](../../../../packages/admin-core/src/auth/session.ts)。
- [公共挑战](../../common/gateway-challenge/spec.md)、[网络身份约束](../../packages/network-query/spec.md)。

变更来源：20260827-security-challenge-verification 保留412设计；20261031-ingot-login-same-origin 接管当前宿主、事务、恢复及退出。独立视觉细项继续由外观 change 跟踪。

- [登录页视觉与配色验收](../../../changes/archive/2026/20261030-ingot-login-appearance/README.md)
