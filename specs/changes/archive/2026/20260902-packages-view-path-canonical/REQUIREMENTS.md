# 需求：canonical viewPath 与菜单视图选择器

## 场景与页面

### 场景 1：用已有页面创建菜单

- **角色**：平台管理员
- **入口**：应用详情 → 菜单管理 → 添加菜单
- **步骤**：类型选菜单；下拉选择已扫描页面；确认只读 `view_path` 与默认可改 `path`
- **预期结果**：提交的 `view_path` 为 canonical 编码；`path` 可改；不再手填 `@/`

### 场景 2：用布局创建目录

- **角色**：平台管理员
- **入口**：同上，类型为目录
- **步骤**：下拉选择布局；不自动填 `path`，自行填写 URL
- **预期结果**：`view_path` 为 `layout.*` 或 App 本地 `{appPrefix}.layout.*`

### 场景 3：登录打开业务页

- **角色**：后台用户
- **入口**：侧栏菜单
- **步骤**：打开已迁库的菜单
- **预期结果**：按 `view_path` 精确匹配到页面；旧 `@/` 显示插件未安装

## ADDED

### REQ-A001：canonical 键无全局 ingot. 前缀

官方页面 `{domain}.*`，布局 `layout.*`，系统页 `common.*`，App 本地 `{appCode 转点号}.*`。

**验收标准：**

- [x] 会话页键为 `security.sessions`
- [x] Dashboard 为 `platform.dashboard`
- [x] 标准布局为 `layout.main`
- [x] 不注册 `@/`、`ingot.admin.*`、`ingot.base.*`

### REQ-A002：布局与页面同一套扫描

**验收标准：**

- [x] core 布局为 `layouts/{main,simple,iframe,external}/IndexPage.vue`
- [x] 插件可声明 `layouts`，与 `pages` 共用查找表但带 kind
- [x] App 本地布局 prefix 为 `{appCodeAsDots}.layout`

### REQ-A003：菜单编辑选择已注册视图

**验收标准：**

- [x] 目录/菜单可从同一下拉选择布局或页面（含 App 本地）
- [x] `view_path` 只读
- [x] 菜单类型自动填 `'/' + key.replaceAll('.', '/')`，用户改过不覆盖
- [x] 目录类型不自动填 `path`
- [x] 按钮不选视图；内嵌/外链绑定 `layout.iframe` / `layout.external`
- [x] 不列出 `common.plugin.unavailable` 与已有菜单树

### REQ-A004：后端说明文档

**验收标准：**

- [x] `docs/menu-view-path.md` 含公式、对照表、迁库 SQL 与原样落库要求
