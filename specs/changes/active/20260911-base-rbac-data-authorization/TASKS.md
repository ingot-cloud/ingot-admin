# 任务：RBAC / 菜单 / 数据权限前端对接

> `[P]` 表示可与其他 `[P]` 任务并行执行。

## 准备

- [x] 确认本 change README 状态为 `approved`（开工后改为 `implementing`）
- [x] 阅读本 change 的 [API.md](./API.md) 与 [REQUIREMENTS.md](./REQUIREMENTS.md)
- [x] 阅读 [CONSTITUTION.md](../../../CONSTITUTION.md) 与 [in-coding-standards](../../../../.agents/skills/in-coding-standards/SKILL.md)
- [x] 确认 DESIGN.md 的页面路径与对接映射

## 实现

### 1. Bootstrap 与鉴权运行时（admin-core）

- [x] `UserPermissionsAPI`；`UserEffectivePermissionVO` 模型
- [x] `ensureSessionBootstrap()`：并行 info / menus / permissions，in-flight 去重
- [x] `usePermissions` 改为写入具体权限码 + `version` / `generatedAt` / `expiresAt`；删除从菜单刮 `permissionCode`
- [x] `useRouterStore.fetchRoutes` 不再调用 `updatePermissions(menus)`
- [x] `UserInfoGuard` / `DynamicRouterGuard` 等待 bootstrap，路由切换不重复请求
- [x] `refreshPermissions`：切回前台且过 `expiresAt`、以及 403 / 503 时调用；`version` 变了再拉 menus
- [x] `v-auth` / `auth-any` / `auth-all` 与 `filterActionsByPermission` 改为权限精确匹配；角色编码仅作产品态
- [x] `failure.ts`：403 不登出；503 `AuthorizationSnapshot.Unavailable` 提示重试且不清空权限
- [x] 菜单模型改为 `permissionIds` + `permissionMatchMode`；`MenuType` 去掉 Button（路由侧忽略 `"9"`）

### 2. 应用 / 菜单 / 权限配置（platform）

- [x] [P] 枚举：`AppDefaultAccessModeEnum`；`PermissionNodeTypeEnum` 删除 Navigation
- [x] [P] 权限模型去掉 `type` / `managed` / `readOnly` / `sourceType`；增加 `resourceId`
- [x] 应用创建 / 更新 / 列表 / 详情读写 `defaultAccessMode`
- [x] 应用详情新增资源 Tab：API + `ResourcePanel` / `ResourceEditDrawer`；更新不可改 `code`
- [x] 权限树 / 编辑：只传 `nodeType`；可选 `resourceId`；创建返回 ID；去掉托管 / 只读门禁；根权限不可删
- [x] 菜单编辑：去掉 Button；受保护页多选 ACTION + `permissionMatchMode`；目录 / 开放页清空 `permissionIds`；快捷新建权限
- [x] 菜单 / 权限表格展示对齐新字段
- [x] 全量权限树「类型」列改为 `nodeType`；全量菜单树不再展示 `permissionCode`

### 3. 角色绑权与数据规则

- [x] [P] 平台 `GetRoleDataRulesAPI` / `SetRoleDataRulesAPI` + `DataRuleDrawer`
- [x] [P] 组织同样 API（租户层）+ 抽屉；文案说明不能改平台默认
- [x] 平台入口 `scopeType` 不含 CUSTOM；组织入口含 CUSTOM + `BizDeptSelect`
- [x] 组织 `RoleDrawer` 删除 `scopeType` / `scopes`，保留 `filterDept`
- [x] 平台/组织角色模型删除 `scopeType` / `scopes` / `scopeTypeText`，范围只走 data-rules
- [x] 绑权树改用 `nodeType`；修正 org `platformRoleBind` 字段名；触达的 `any` 改为节点类型
- [x] `BindAuthorityAPI` body 保持 `{ setIds }`

### 4. 测试与回归

- [x] admin-core：bootstrap / 权限匹配 / 403·503 处理单测
- [x] 更新 `route.spec.ts`、`actionRanking.test.ts`、`failure.test.ts`、`InTableActions.test.ts` 等触及用例
- [x] 更新 platform：`app/home`、`app/detail`、`permission`、`menu`、`role` 的页面契约测试（含资源 Tab）
- [x] 更新 org：`contacts/role`、`contacts/auth` 测试
- [x] BindAuthDialog 去掉 `any`

## 验证

- [ ] 满足 REQUIREMENTS.md 验收标准
- [x] 对接行为与 API.md 一致：不传已删除字段，不读 `authorities`
- [ ] 本地构建通过（`pnpm build:packages` + 相关 app / plugin 测试）
- [x] admin-core / platform / org 相关单测与 platform、org type-check 已通过
- [ ] 手动：登录 bootstrap 只打三次；权限树无 `type`；菜单无 Button；503 不登出
- [x] member 权限页未误改

## 收尾

- [ ] 更新 `current/base/rbac-data-authorization/spec.md`（页面行为，不要合并整份 API.md）
- [ ] 在 capability README 记录变更 ID，并链到归档后的 `API.md`
- [ ] README 状态改为 `completed`，将变更目录移至 `changes/archive/2026/20260911-base-rbac-data-authorization/`
