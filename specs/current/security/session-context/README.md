# 浏览器会话上下文与注销

管理宿主基于实际HttpOnly Cookie与me接纳身份，按contextVersion/身份纪元隔离旧请求；注销未知时保留待确认状态。服务端持久账本是认证事实，浏览器通知和本地存储不能证明登录成功。

- [当前行为](./spec.md)、[登录](../../ingot-login/password-login/spec.md)、[直接组织切换](../../org/organization-switch/spec.md)
- [后端账本权威](../../../../../ingot/specs/current/security/session-ledger/SPEC.md)
- [归档与验收](../../../changes/archive/2026/20261112-security-tenant-organization-switch/README.md)、[最终证据](../../../changes/archive/2026/20261112-security-tenant-organization-switch/LEDGER-F14-RECOVERY-AT-ONLY.md)
- [独立性能门禁](../../../changes/active/20261115-security-session-ledger-performance/README.md)、[目标环境发布验收](../../../../../ingot/specs/changes/active/20261031-security-same-origin-release-acceptance/README.md)

已验收开发基线；性能和目标验收未通过，正式发布仍阻断。
