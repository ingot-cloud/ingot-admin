# 菜单 view_path 编码约定

给后端与运维：`platform_menu.view_path` 存的是前端 page registry 的查找键，**不是**源码路径，也不是菜单 `path`。

前端已去掉 `@/pages/**`、`@/layouts/**`、`ingot.admin.*`、`ingot.base.*` 兼容。未迁库的旧值会打开「插件未安装」页。

菜单 HTTP 接口不变。请**原样保存**前端提交的 `view_path`，不要在 `custom_view_path=0` 时按 `path` 再拼 `@/pages{path}/IndexPage.vue`。

## path 与 view_path

| 字段 | 含义 | 例 |
|------|------|------|
| `path` | 浏览器 URL | `/platform/security/sessions` |
| `view_path` | 组件键 | `security.sessions` |

二者独立。创建菜单时前端会给页面一个默认可改 path（`/` + 键里的 `.` 换成 `/`），目录不自动填 path。

## 编码公式

只针对 `**/IndexPage.vue`：

```text
相对目录去掉 IndexPage.vue → `/` 变 `.`、`-` 变 `.` → 拼 prefix
```

| 来源 | prefix | 例 |
|------|--------|------|
| `plugins/platform/src/pages/` | `platform` | `dashboard/IndexPage.vue` → `platform.dashboard` |
| `plugins/security/src/pages/` | `security` | `access-protection/IndexPage.vue` → `security.access.protection` |
| `plugins/org/src/pages/` | `org` | `contacts/user/IndexPage.vue` → `org.contacts.user` |
| `plugins/member/src/pages/` | `member` | `user/IndexPage.vue` → `member.user` |
| `packages/admin-core/src/layouts/{slot}/` | `layout` | `main/IndexPage.vue` → `layout.main` |
| `packages/admin-core/src/pages/common/` | `common` | `plugin-unavailable` → `common.plugin.unavailable`（不要配到业务菜单） |
| App 本地 `src/pages/` | `appCode` 的 `-` 改 `.` | `ingot-admin` + `demo/overview` → `ingot.admin.demo.overview` |
| App 本地 `src/layouts/` | `{appPrefix}.layout` | `ingot-admin` + `workbench` → `ingot.admin.layout.workbench` |

不要给官方页面再加一层 `ingot.`。`layout`、`common` 以及 `platform` / `security` / `org` / `member` 不要拿去当 appCode。

## 交互创建

管理台菜单编辑从当前运行 App 已扫描的页面/布局里选择，提交 `view_path` 且 `custom_view_path=1`。后端原样落库。

选择器列出的是**正在跑的这个 admin** 的插件，不是被配置应用的远程插件清单。

## 现有数据迁移（menu_type=1 页面）

```sql
UPDATE platform_menu
SET
  custom_view_path = 1,
  view_path = CASE view_path
    WHEN '@/pages/platform/config/app/home/IndexPage.vue' THEN 'platform.config.app.home'
    WHEN '@/pages/platform/config/app/detail/IndexPage.vue' THEN 'platform.config.app.detail'
    WHEN '@/pages/platform/config/role/IndexPage.vue' THEN 'platform.config.role'
    WHEN '@/pages/platform/config/menu/IndexPage.vue' THEN 'platform.config.menu'
    WHEN '@/pages/platform/config/permission/IndexPage.vue' THEN 'platform.config.permission'
    WHEN '@/pages/platform/config/dict/IndexPage.vue' THEN 'platform.config.dict'
    WHEN '@/pages/platform/admin/user/IndexPage.vue' THEN 'platform.admin.user'
    WHEN '@/pages/platform/org/tenant/IndexPage.vue' THEN 'platform.org.tenant'
    WHEN '@/pages/platform/develop/qrcode/IndexPage.vue' THEN 'platform.develop.qrcode'
    WHEN '@/pages/platform/develop/client/IndexPage.vue' THEN 'platform.develop.client'
    WHEN '@/pages/platform/develop/social/IndexPage.vue' THEN 'platform.develop.social'
    WHEN '@/pages/platform/develop/id/IndexPage.vue' THEN 'platform.develop.id'
    WHEN '@/pages/platform/security/credential/IndexPage.vue' THEN 'security.credential'
    WHEN '@/pages/platform/security/sessions/IndexPage.vue' THEN 'security.sessions'
    WHEN '@/pages/platform/security/access-protection/IndexPage.vue' THEN 'security.access.protection'
    WHEN '@/pages/platform/security/account-protection/IndexPage.vue' THEN 'security.account.protection'
    WHEN '@/pages/platform/member/user/IndexPage.vue' THEN 'member.user'
    WHEN '@/pages/platform/member/role/IndexPage.vue' THEN 'member.role'
    WHEN '@/pages/org/contacts/user/IndexPage.vue' THEN 'org.contacts.user'
    WHEN '@/pages/org/contacts/dept/IndexPage.vue' THEN 'org.contacts.dept'
    WHEN '@/pages/org/contacts/role/IndexPage.vue' THEN 'org.contacts.role'
    WHEN '@/pages/org/contacts/auth/IndexPage.vue' THEN 'org.contacts.auth'
    WHEN '@/pages/org/contacts/structure/IndexPage.vue' THEN 'org.contacts.structure'
    ELSE view_path
  END,
  updated_at = NOW()
WHERE menu_type = '1'
  AND deleted_at IS NULL
  AND view_path LIKE '@/pages/%';
```

目录（`menu_type='0'`）：

```sql
UPDATE platform_menu
SET
  view_path = CASE view_path
    WHEN '@/layouts/InAppLayout.vue' THEN 'layout.main'
    WHEN '@/layouts/InSimpleLayout.vue' THEN 'layout.simple'
    WHEN '@/layouts/InIFrameLayout.vue' THEN 'layout.iframe'
    WHEN '@/layouts/InExtLinkLayout.vue' THEN 'layout.external'
    ELSE view_path
  END,
  updated_at = NOW()
WHERE menu_type = '0'
  AND deleted_at IS NULL
  AND view_path LIKE '@/layouts/%';
```

按钮（`menu_type='9'`）的 `view_path` 前端路由不用，可不动。

迁完后不应再有 `menu_type='1'` 且 `view_path LIKE '@/pages/%'` 的行。若有 Dashboard 菜单，改为 `platform.dashboard`。
