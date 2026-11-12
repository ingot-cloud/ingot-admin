# 平台头像菜单移除切换组织

> 状态：completed
> 归档日期：2026-11-12

2026-11-12 用户直接要求移除平台端右上角头像菜单中的组织切换操作。本 change 按该明确修复授权实施，不消费 inbox。

范围为 `apps/admin-platform/src/header.ts` 的头像菜单配置；保留个人资料、修改密码、退出登录。租户端与共享菜单默认配置继续沿用现有行为。无 API、路由、数据模型或部署兼容性变更。

工件：[需求](./REQUIREMENTS.md)、[设计](./DESIGN.md)、[任务](./TASKS.md)。

相关基线：[顶栏 APP 配置](../../../../current/packages/app-header/spec.md)。现有帮助中心、IAM 历史调用清理和权限树滚动修复均无代码冲突。

2026-11-12 approved → implementing：按已记录的单项删除方案开始实施。

2026-11-12 实现与限定自动化验证完成，进入 validating。平台头像菜单显式列表现为个人资料、修改密码、退出登录，租户列表仍保留 SwitchOrg。无设计偏离。

## 验证记录

使用本机已有 Node 22.17.0 与 Corepack 缓存的 pnpm 10.12.4 执行，未安装或更新依赖：

- 平台应用 `type-check` 通过。
- `resolveHeaderConfig.test.ts` 与 `InUserDropdown.test.ts` 共 2 个文件、15 项测试通过，覆盖显式列表完整替换默认菜单、菜单渲染和受限账号行为。
- 改动源码 ESLint、源码和 change 工件 Prettier 检查通过，`git diff --check` 通过。
- 源码核对：平台菜单仅 Profile / FixPwd / Logout；租户菜单仍含 SwitchOrg。
- 2026-11-12 用户确认「测试通过，归档并提交代码」，页面复测验收通过。

## 完成记录

- 完成日期：2026-11-12。
- 实现提交：`4aeccb6`（平台头像菜单移除组织切换入口）。
- 已更新 [顶栏当前页面行为](../../../../current/packages/app-header/spec.md) 与能力变更记录。
- 所有任务完成，状态由 validating 改为 completed，归档至 `specs/changes/archive/2026/20261112-base-platform-user-menu/`。
- 最终实现与批准设计一致，无迁移事项。
