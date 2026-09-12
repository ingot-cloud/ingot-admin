# 设计：RBAC / 菜单 / 数据权限前端对接

接口字段表见 [API.md](./API.md)，此处只写前端怎么做。

## 技术方案

一次性切换，不兼容旧字段。权限码与菜单解耦：菜单树只负责侧栏和动态路由，页内能力只认 `GET /v1/auth/user/permissions` 已展开的具体码。

登录后由 `ensureSessionBootstrap()` 并行打 info / menus / permissions，用 in-flight Promise 去重。`UserInfoGuard` 与 `DynamicRouterGuard` 都等待这次结果，禁止每个 `beforeEach` 再打接口。切组织仍走重新登录，自然重新 bootstrap。

权限匹配改为精确码；`v-auth` 仍允许角色编码作为产品态展示（如超管），但默认按钮放行不再用角色。不从 token 解析 RBAC。不按 `expiresAt` `setInterval`。可选：`visibilitychange` / focus 且已过 `expiresAt` 时静默刷新权限；`version` 变化再拉一次 menus。

HTTP：`S0403` / 403 视为明确无权限，刷新权限以对齐按钮，不登出。`AuthorizationSnapshot.Unavailable` / 503 提示「授权服务暂时不可用，请稍后重试」，刷新权限，**不得**把 store 清空成 `[]`。

配置顺序与后端建议一致：资源目录 → 权限绑定 `resourceId` → 菜单 `permissionIds` → 角色绑权限 → 角色 data-rules。

已拍板：

- 平台 data-rules 不提供 CUSTOM（避免租户部门 ID）；组织入口提供全部 `scopeType`，CUSTOM 用 `BizDeptSelect`
- 组织角色表单删除 `scopeType` / `scopes`，保留 `filterDept`；角色模型也不再保留这两列，避免研发按角色 CRUD 配置范围
- `CreateAppPermissionAPI` 返回类型改为 `Promise<R<string>>`（权限 ID），供菜单快捷新建使用
- 前端 ID 继续用 `string`，与现有雪花 ID 一致
- `AuthorityTypeEnum` 留在 `admin-common`，仅 member 继续用；platform 权限页改 `nodeType`

## 对接映射

| 接口（见 API.md） | 前端 | 说明 |
|-------------------|------|------|
| GET `/v1/auth/user/info` | `packages/admin-core/src/api/common/user.ts` `UserInfoAPI` | 去掉对 `authorities` 的任何假设 |
| GET `/v1/auth/user/menus` | 同上 `UserMenuAPI` | 只喂路由 / 侧栏，不再刮 `permissionCode` |
| GET `/v1/auth/user/permissions` | 同上新增 `UserPermissionsAPI` | bootstrap 写入 `usePermissions` |
| CRUD `/v1/platform/config/apps` | `plugins/platform/.../api/platform/config/app.ts` | 增加 `defaultAccessMode` |
| CRUD `.../apps/{id}/resources` | 同上新增 `AppResourceListAPI` 等 | 应用详情新 Tab |
| CRUD `.../apps/{id}/menus` | 既有菜单 API | body 改 `permissionIds` + `permissionMatchMode` |
| CRUD `.../apps/{id}/permissions` | 既有权限 API | 创建带 `nodeType` / `resourceId`，创建返回 ID |
| GET `/v1/platform/config/permission/tree` | `api/platform/config/authority.ts` | 只读树改 `nodeType` |
| GET/PUT `/v1/platform/config/role/{id}/permissions` | 既有 `BindAuthorityAPI` / `GetBindAuthoritiesAPI` | body 仍 `{ setIds }` |
| GET/PUT `/v1/platform/config/role/{id}/data-rules` | `api/platform/config/role.ts` 新增 | 平台默认层 |
| GET/PUT `/v1/org/role/{id}/permissions` | `plugins/org/.../api/org/role.ts` | 树字段改 `nodeType` |
| GET/PUT `/v1/org/role/{id}/data-rules` | 同上新增 | 仅租户追加层 |

前缀均为 `/api/pms`。

## 数据模型

- `packages/admin-core/src/models/security.ts`：新增 `UserEffectivePermissionVO`；`UserInfo` 不增加 `authorities`
- `packages/admin-core/src/models/menu.ts`：删除 `permissionId` / `permissionCode`；增加 `permissionIds: string[]`、`permissionMatchMode`
- `packages/admin-core/src/models/enums/menuEnums.ts`：`MenuType` 去掉 `Button`；路由过滤不再依赖 `"9"`（防御性过滤可保留但表单不提供）
- `plugins/platform/src/models/application.ts`：`defaultAccessMode`；详情已有 `rootPermissionId` / `rootPermissionCode`
- `plugins/platform/src/models/enums/appEnums.ts`：新增 `AppDefaultAccessModeEnum`（`Open="0"` / `Closed="1"`）；`PermissionNodeTypeEnum` 删除 `Navigation`
- `plugins/platform/src/models/authority.ts`：删除 `type` / `sourceType` / `sourceId` / `managed` / `readOnly`；增加 `resourceId`；创建 DTO 增加 `resourceId` / `status`
- 新增 `plugins/platform/src/models/resource.ts`：`PlatformResource`、创建 / 更新 DTO
- 新增角色 data-rule 模型（platform / org 共用结构，org 多 `tenantId` / `platformRole`）
- `DataScopeTypeEnum` 已是数字枚举，data-rules 直接复用；文案可改为「全部 / 指定部门 / 本部门及下级 / 本部门 / 仅本人」
- `plugins/org/src/models/authority.ts`：删除 `type`，增加 `nodeType` / `resourceId`；`platformRoleBind` 字段名与后端 JSON `platformRoleBind` 对齐（现有 `PlatformRoleBind` 一并修正）
- `plugins/org/src/models/role.ts` / `plugins/platform/src/models/role.ts`：删除角色级 `scopeType` / `scopes` / `scopeTypeText`，范围只在 data-rules

## 组件与页面影响

### Bootstrap（packages/admin-core）

```text
packages/admin-core/src/
├── api/common/user.ts
├── stores/modules/auth.ts          # permissions 改为码列表 + 快照元数据
├── stores/modules/router.ts        # fetchRoutes 不再 updatePermissions(menus)
├── router/guard/userGuard.ts
├── router/guard/dynamicGuard.ts
├── directive/authDirective.ts      # 权限精确匹配
├── components/table/actionRanking.ts
├── components/table/InTableActions.vue
└── net/failure.ts                  # 403 / 503
```

新增 `ensureSessionBootstrap()`（建议放 `stores/modules/auth.ts` 或 `hooks/biz/useSessionBootstrap.ts`）：

1. 已完成则直接返回
2. `Promise.all([UserInfoAPI, UserMenuAPI, UserPermissionsAPI])`
3. 写入 user / roles / menus / permissions
4. 失败不把 permissions 写成空数组冒充游客

刷新权限：`refreshPermissions({ refreshMenusIfVersionChanged })`。403 / 503 / 可见性过期走这条，不走全量 bootstrap。

`v-auth` / `auth-any` / `auth-all`：权限码 `===`；角色编码仍可命中 `roles`（产品态）。`InTableActions` 允许列表改为「权限精确码 ∪ 角色编码」，去掉 `startsWith` 前缀放大。

### 应用配置（plugins/platform）

```text
plugins/platform/src/pages/config/app/
├── home/                 # 列表增加 defaultAccessMode 列与创建表单
└── detail/
    ├── IndexPage.vue     # Tab：基本信息 / 菜单 / 权限 / 资源
    └── components/
        ├── BasicInfoPanel.vue
        ├── MenuPanel.vue
        ├── MenuEditDrawer.vue      # 去掉 Button；多选 ACTION + matchMode
        ├── PermissionPanel.vue     # 去掉 managed/readOnly；展示 resource
        ├── PermissionEditDrawer.vue
        ├── ResourcePanel.vue       # 新增
        └── ResourceEditDrawer.vue  # 新增
```

菜单编辑：当 `menuType=菜单` 且 `accessMode=需权限` 时，树选择同应用 ACTION（过滤 GROUP / 通配）；`permissionMatchMode` 用 `InPicker` 或单选。提供「快捷新建权限」：调创建权限 API，用返回 ID 加入 `permissionIds`。目录 / 开放页提交前把 `permissionIds` 置空。

权限编辑：创建可选资源下拉（本应用资源列表）；根节点不可删（无 pid 或 code 以 `:**` 结尾且为应用根时禁用删除）。

资源 Tab：四件套内嵌面板（表格 + 抽屉），不新开路由。

### 只读树

- `pages/config/permission`：列 `type` → `nodeType`
- `pages/config/menu`：列 `permissionCode` → 展示 `permissionIds` 数量或「开放」

### 角色

平台 `pages/config/role`：行操作增加「数据范围」，打开 `DataRuleDrawer`。

组织 `pages/contacts/role/components/LeftContent.vue`：角色节点菜单增加「数据范围」（平台预设角色也可追加本租户层）。`RoleDrawer` 删除数据权限 / 数据范围表单项。

`DataRuleDrawer` 放平台页私有组件，组织页可复制一份或抽到各自 `components/`（官方插件不得互相依赖，禁止 org 引用 platform 组件）。两份 UI 对齐：表格列出 `permissionId` / `resourceId` / `scopeType` / `scopes`，保存整体替换 `items`。组织抽屉顶部说明「仅本租户追加规则，不能修改平台默认」。

绑权对话框：勾选语义保持「父选中则只提交上层 ID」；展示改用 `nodeType`，不再读 `managed`。

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| Monorepo 边界 | ✅ | bootstrap 进 `packages/admin-core`；页面留在各自插件；org / platform 不互相依赖 |
| 页面四件套 | ✅ | 应用详情新资源面板放 `detail/components/`；不新开独立路由 |
| API 层 XxxAPI + `R<T>` | ✅ | 新增函数带 `API` 后缀；platform 用既有 `request` |
| 类型安全、无 any | ✅ | BindAuthDialog 里现有 `node: any` 触达时改为节点类型 |
| UnoCSS、无 scss | ✅ | 新 UI 用原子类 |
| 输入先行、施工门禁 | ✅ | 本 change 确认后再改业务代码 |
| 不提前改 current | ✅ | 验收后写 `current/base/rbac-data-authorization` |

## 备选方案

- 继续从菜单 `permissionCode` 刮权限：否。后端菜单不再给按钮码，且通配不会出现在菜单上。
- 按 `expiresAt` 每 30 秒拉权限：否。后端明确禁止；拦请求靠业务 API。
- 组织页合并展示平台默认 + 租户追加并一起提交：否。租户 GET 不含平台层，且租户不能改平台层。
- 资源做成独立菜单页：否。配置顺序挂在应用下，Tab 更接近现有详情结构。

## 开放问题

- [x] 平台 data-rules 是否开放 CUSTOM：否
- [x] 组织角色表单旧 `scopeType`：删除，改 data-rules
- [ ] 菜单快捷新建权限的默认 `nodeType` 固定为 ACTION（实现时按此做，若产品要 GROUP 再改）
