# 平台成员联系资料独立存储

- 状态：validating（用户于2026-10-06批准实施，开发和自动化完成；人工验收待执行）
- 主change状态保持implementing，不更新current；用户后续已明确要求提交代码，人工验收仍待执行。

平台人员的`phone/email`是平台联系资料，列表/详情/PATCH从平台成员表读写，不再修改账号登录信息。字段名称和HTTP结构保持，成员版本、字段策略及错误处理沿用现有流程。账号管理和本人账号设置保持账号级资料语义，租户人员不改。

添加平台成员保留原两步与只读账号定位信息，创建时从关联账号一次复制初始联系方式；前端将这两个值明确标为初始联系资料，并说明创建后独立维护。详情和列表标为联系手机号/联系邮箱，不调整角色、用户组、选择器和其他布局。

- [x] PC03：创建/详情/列表文案及公共类型注释、接口文档和后端权威来源同步。
- [x] PC04：相关前端回归、类型检查、只读lint及平台构建。
- [ ] PC05：人工添加/编辑/清空联系方式，核对与全局账号、租户资料相互独立，字段脱敏/隐藏/可编辑权限保持。

部署先执行后端提供的一次性迁移，再发布后端和前端；新库使用最新完整初始化SQL，不执行迁移。迁移、回填和回退规则见[后端权威增量原文](./sources/BACKEND_PLATFORM_MEMBER_CONTACTS_REFINEMENT.md)。

2026-10-06验证：`pnpm --filter @ingot/platform-plugin exec vitest run src/pages/iam/personnel/components/MemberDrawers.test.ts src/pages/iam/personnel/components/GroupWorkspace.test.ts`（2文件/4项）、`pnpm --filter @ingot/admin-common --filter @ingot/platform-plugin type-check`、本次4个修改源文件的只读ESLint、`pnpm --filter @ingot/admin-platform-app build`、`pnpm check:boundaries`和`pnpm check:docs`通过。构建存在原有图标扫描/crypto外置等警告，未扩展修改。

人工验证：添加成员核对初始复制；在成员详情修改及清空联系手机号/邮箱，列表和组成员显示一致；全局登录资料和租户资料保持原值。再修改账号联系资料，平台成员不自动同步；使用受限身份验证隐藏、脱敏、只读和版本冲突行为。
