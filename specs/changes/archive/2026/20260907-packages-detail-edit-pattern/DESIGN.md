# 设计：详情查看/编辑标准

## 技术方案

在 `@ingot/admin-core` 落地可组合标准，而不是只改成员页抽屉：

- `InBizTabs` / `InBizTabsHeader`：墨条宽度跟文案、顶部圆角且半条压线 + `before-change`
- `InDetailDrawer`：标题、identity、Tab、查看/编辑 footer、离开守卫
- `InDetailIdentity`、`InDescriptionList`
- `useDetailEditSession`：`editing` / 进入 / 退出 / `confirmLeave`
- `InDrawer` 增加 `layout="pinned"`，仅详情壳层开启
- 成员页拆成 `CreateDrawer.vue` 与 `DetailDrawer.vue`；编辑态头像在 `InDetailIdentity` 悬停上传
- 公共确认框收敛到 `openConfirmDialog` / `Confirm`：视口居中、自定义内容、`showClose`、标题左侧 `icon`；离开确认复用该 API，默认警告图标且 `showClose: false`
- `InDialog` 同步标题左侧 `#icon`、`showClose` 与 `align-center`，表单对话框仍用该组件
- 下拉菜单（`.in-dropdown` / `.el-dropdown__popper`）无箭头、无分割线，边框/圆角/阴影走 Token

颜色与动效一律走 Token，组件内不写死 `#3370ff` / `#1f2329`。

## 对接映射

接口见 [API.md](./API.md)。

| 接口（见 API.md） | 前端 | 说明 |
|-------------------|------|------|
| GET `/detail/{id}` | `plugins/org/src/api/org/user.ts` `UserProfileAPI`；`OrgUserProfileQueryOptions` | 详情资料 |
| PUT `/api/pms/v1/org/user` | `UpdateUserAPI` | 保存 / 暂停恢复 |
| DELETE `/api/pms/v1/org/user/{id}` | `RemoveUserAPI` | 删除 |
| POST `/api/pms/v1/org/user` | `CreateUserAPI` | 添加成员 |
| 部门树 | `OrgDeptTreeQueryOptions` | 查看态部门名 |

页面：`plugins/org/src/pages/contacts/user/`。

## 数据模型

沿用 `UserPageItemVO`、`OrgUserProfileVO`、`UserDTO`。身份区头像取列表行；资料加载后合并 profile。部门 id 在前端树中解析为名称，找不到则显示 id。

## 组件与页面影响

| 路径 | 职责 |
|------|------|
| `packages/admin-core/src/components/tabs/` | Tab 墨条与拦截 |
| `packages/admin-core/src/components/drawer/` | `InDrawer` pinned、`InDetailDrawer` |
| `packages/admin-core/src/components/description/` | 只读字段 |
| `packages/admin-core/src/components/detail/` | 身份区 |
| `packages/admin-core/src/hooks/components/useDetailEditSession.ts` | 编辑会话 |
| `packages/admin-core/src/utils/confirm-dialog.ts` | 公共确认框 |
| `packages/admin-core/src/components/InDialog.vue` | 声明式对话框：图标、关闭开关、居中 |
| `plugins/org/src/pages/contacts/user/components/CreateDrawer.vue` | 添加成员 |
| `plugins/org/src/pages/contacts/user/components/DetailDrawer.vue` | 成员详情 |

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| 跨插件复用进 packages | ✅ | 标准在 admin-core |
| 三层目录与依赖方向 | ✅ | org → packages |
| 页面四件套 | ✅ | 不改 IndexPage 拆分约定 |
| 类型安全 / 无 any | ✅ | 新代码严格类型 |
| UnoCSS 优先、禁 scss | ✅ | 组件用 postcss + Token |
| 施工门禁 | ✅ | 独立 change，不改 foundation/rollout 范围 |

## 备选方案

- 只改成员 `EditDrawer`：无法成为平台标准，否决。
- 新建独立 Tab 组件而不改 `InBizTabs`：业务页尚未使用 `InBizTabs`，直接升级即可。

## 开放问题

无。
