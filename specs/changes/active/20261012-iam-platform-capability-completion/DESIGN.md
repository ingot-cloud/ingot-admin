# 设计

## 导航和模块

平台治理：组织与租户（租户）；应用与配置（应用、套餐、共享角色）；平台管理（账号、人员、授权、平台审计）；系统设置（字典）。安全中心四个页面；组织安全合规保留成员访问策略和组织审计。

| 页面         | 插件目录（src/pages）            | URL                             | canonical 注册键                 |
| ------------ | -------------------------------- | ------------------------------- | -------------------------------- |
| 字典         | platform/settings/dictionaries   | /platform/settings/dictionaries | platform.settings.dictionaries   |
| 凭证         | security/credential-policies     | /security/credential-policies   | security.credential.policies     |
| 账号保护     | security/account-protection      | /security/account-protection    | security.account.protection      |
| 访问防护     | security/access-protection       | /security/access-protection     | security.access.protection       |
| 会话         | security/sessions                | /security/sessions              | security.sessions                |
| 平台审计     | platform/iam/authorization-audit | /platform/authorization-audit   | platform.iam.authorization.audit |
| 组织审计     | org/iam/authorization-audit      | /org/authorization-audit        | org.iam.authorization.audit      |
| 成员访问策略 | org/iam/member-policies          | /org/member-policies            | org.iam.member.policies          |

字典 API/query 迁入 settings/dictionaries。公共审计组件以固定域、精确 read 操作、数据查询适配器为参数，不依赖任何插件。租户宿主移除 security 装配/依赖。正式 URL 显式配置，不修改通用默认路径生成器。

## 授权

安全中心完整 ResourceKey 明确为 PLATFORM / platform:security；六资源 credential-policy（CRUD）、lockout-policy（read/update）、login-failure-policy（read/update）、session（read/revoke）、session-policy（read/update）、security-policy（CRUD）。保留 iam-platform:* 码。生成器及内置注册显式关联，Security 接入 AuthorizationAccess / RequireIamAction，读取最长30秒、写入 fresh，执行检查 ALL，不开放降级。

字典按钮绑定 read/create/update/delete，排序和启停为 update，内置约束不变。跨目录选择器按独立读取权限。多 Tab 按 read ANY 开放，只显示授权 Tab，并只请求激活面板。IAM 两域审计固定域，成员策略分别绑定 read/update/preview。

## 升级和兼容

已有库按自然键预检新增/移动/冲突；资源、操作、页面 ID 不变。事务内暂存菜单操作关联，临时资源桥接复合外键，迁移目标页面并恢复关联；混合应用自定义引用等不可安全处理情况中止。路径/注册键/routeName/父目录定向更新，其他人工设置保留。停用空旧安全目录，保留自定义子页。重跑无修改、冲突回滚，不关闭外键。普通角色历史不变。

发布：备份/停写 → 补丁 → 同批 IAM/Security/前端 → 授权及路由缓存失效 → bootstrap。回滚按备份恢复对应目录及关联，不重建库。

## 宪章符合性

apps 仅装配，plugins 纵向业务，packages 仅无页面复用；没有插件间依赖。按 ISO 时间、精确权限和统一查询规范实现。

## 实现说明

020 补丁按应用域、注册键和精确操作输出清单，可设置 @iam_capability_dry_run=TRUE 在事务末尾回滚。IAM 菜单表没有持久化 redirect 字段；前端目录 redirect 随新菜单树派生，本轮同时更新八页代码导航和测试夹具。脚本不改角色版本、授权分配、委派上限或历史审计；普通角色使用既有发布及分配流程。

迁移保留菜单人工 access_mode、图标、排序、显隐、缓存、props、route_params；仅访问防护、会话管理和成员访问策略的 match_mode 按批准的多 read ANY 规则调整。跨应用自定义安全操作引用必须先人工拆分，补丁拒绝静默删除。
