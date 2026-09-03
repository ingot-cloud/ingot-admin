# 20260902-packages-view-path-canonical

> 状态：completed

## 协作模式

架构与菜单编辑交互；需求和设计来自 2026-09-02 对话确认。无新增后端 HTTP 接口；需后端按说明迁移 `platform_menu.view_path` 并原样落库。

## 背景与动机

页面注册仍带 `@/` 文件路径与 `ingot.admin.*` / `ingot.base.*` 兼容层。布局在 core 里硬编码。菜单创建不选已扫描视图，后端常按 `path` 拼旧文件路径。插件化之后这些兼容既不能反映真实目录，也增加维护成本。

## 目标

- 只注册 canonical 键：官方 `{domain}.*`，布局 `layout.*`，系统 `common.*`，App 本地用 `appCode`（`-` 转 `.`）。
- 布局与页面同一套 `IndexPage.vue` 扫描。
- 创建/编辑菜单时从 registry 选择页面或布局；`view_path` 只读；菜单类型给默认可改 `path`；目录不给默认 `path`。
- 去掉全部 `@/` 与旧 semantic 别名。
- 产出后端迁移与落库说明。

## 范围

### In Scope

- `definePluginPages` 去掉 legacy；官方插件 prefix 改为域名。
- core / App 本地布局扫描；插件 `layouts` 字段。
- 菜单编辑器选择器与只读 `viewPath`。
- create-app 本地插件工厂，prefix 与 `main.ts` `appCode` 同源。
- `docs/menu-view-path.md` 及运行时/插件/脚手架文档。

### Out of Scope

- 新后端列出页面 API。
- 把已有菜单树当选择器选项。
- 用菜单 `path` 当组件查找键。

## 输入来源

- 接口文档：无；菜单仍为既有 CRUD 与 `GET /api/pms/v1/auth/user/menus`
- 需求文档：2026-09-02 计划确认
- 后端来源：`platform_menu.view_path` 数据迁移，无 wire shape 变更

## 工件

- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

- 去掉 `@/` 后必须先迁库，否则全部页面 unavailable。
- 选择器只反映当前运行 App 已加载插件。
- 后端若在 `custom_view_path=0` 时按 path 回填，会覆盖前端提交的编码。

## 相关链接

- [当前 App 插件化规格](../../../../current/packages/app-plugins-shared-scaffold/spec.md)
- [项目宪章](../../../../CONSTITUTION.md)

## 完成记录

- 完成日期：2026-09-03
- 关联提交或 PR：
- 更新的 current capability：`packages/app-plugins-shared-scaffold`；`security/session-management`、`security/access-protection`、`security/account-protection` 的 viewPath
- 与原设计的差异：core 布局仍按 `layouts/{slot}/IndexPage.vue` 扫描；宿主 `optimizeDeps.exclude` `@ingot/admin-core`，避免预构建改写 glob 键。`PLUGIN_UNAVAILABLE_PAGE_KEY` 为 `common.plugin.unavailable`（`-` 按公式编成 `.`）。用户于 2026-09-03 要求归档。
- 取消原因：
