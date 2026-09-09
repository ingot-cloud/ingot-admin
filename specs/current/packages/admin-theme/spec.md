# 管理台主题规格

本文写已上线的主题选择、Token 与主布局外壳行为。共享组件视觉基线见 [管理台 UI 基础设施](../admin-ui-foundation/spec.md)。App 启动与脚手架见 [App 插件化与共享包](../app-plugins-shared-scaffold/spec.md)。前端公开协议见归档 [DESIGN.md](../../../changes/archive/2026/20260908-packages-admin-theme/DESIGN.md)。

## 概述

每个管理台 App 在 `bootstrapAdminApp` 中选择一套 `InAdminTheme`。未配置时回退到 `defaultAdminTheme`。仓库内新增正式主题位于 `themes/<id>/`，包名为 `@ingot/theme-<id>`；默认主题、Token 合并与布局宿主仍在 `@ingot/admin-core`。主题覆盖 `--in-*` Token，并可替换主布局 Shell 与顶栏、导航、面包屑、页脚展示部件。默认顶栏的五区内容由 APP `header` 配置，见 [顶栏 APP 配置](../app-header/spec.md)。内容区路由出口、KeepAlive、滚动恢复、菜单权限和设置开关仍由核心负责。使用者可切换浅色 / 深色，但不能在运行时更换主题 ID。

## 范围

### In Scope

- `defineAdminTheme` / `defaultAdminTheme` / `InAdminAppOptions.theme`
- 浅色、深色 Token 合并与 `html[data-in-theme]` 根样式
- `InAdminThemeLayout`、默认 Shell、`useAdminTheme`、`useAdminShell`
- App `shellSlots`（header-start / header-end / sidebar-top / sidebar-bottom）
- `useAdminShell().header` 供自定义 `parts.header` 读取 APP 顶栏配置
- admin 与 create-app 显式选择默认主题
- `themes/<id>/` 仓库内正式主题目录与 `@ingot/theme-<id>` 包名
- `examples/admin-theme` 独立主题包示例

### Out of Scope

- 在线上传、远程加载、主题市场或终端用户选择主题包
- 业务页面模板替换
- `apps/auth` 登录应用
- `layout.simple` / `layout.iframe` / `layout.external` 的主题替换入口

## 用户场景

### 场景 1：安装并启用主题

- **角色**：项目开发者
- **前置条件**：已有符合协议的主题包（仓库内 `themes/<id>/` 的 `@ingot/theme-<id>`，或外部 npm 包）
- **步骤**：在 App `package.json` 声明依赖，引入主题与 CSS，在启动配置传入 `theme`，重新构建部署
- **预期结果**：全后台使用该主题外观与壳层编排；业务插件和后端菜单不改；未选择的主题不进入模块图

### 场景 2：使用默认主题

- **角色**：后台管理员
- **前置条件**：应用使用 `defaultAdminTheme` 或未配置 `theme`
- **步骤**：浏览 `layout.main` 页面，在设置中切换浅深色
- **预期结果**：白顶栏、灰画布侧栏、白工作面；刷新后明暗偏好保持；主题 ID 不变

### 场景 3：保留项目独立 layout

- **角色**：项目开发者
- **前置条件**：App 或插件注册了专用 layout
- **步骤**：启动并选择自定义主题
- **预期结果**：独立 layout 结构不被替换，仍继承全局 Token；需要主题外壳时主动组合 `InAdminThemeLayout`

## 功能需求

### REQ-001：显式配置主题包

系统 SHALL 在构建期引入主题，并在启动时选择一套主题。主题不是 `InAdminPlugin`。

**验收标准：**

- [x] 支持 workspace 包与 npm 包；仓库内正式主题使用 `themes/<id>/`；无业务插件注册、无后端接口
- [x] admin 与 create-app 生成应用显式传入 `defaultAdminTheme`
- [x] 未配置 `theme` 时回退到默认主题
- [x] 协议版本不兼容时，挂载前抛出包含主题标识的中文错误
- [x] 无主题选择页面，不保存用户级主题 ID

### REQ-002：Token 与明暗独立

系统 SHALL 以默认主题完整浅/深色结果为基线合并覆盖，并通过受控样式节点输出。

**验收标准：**

- [x] 公开 `InThemeTokens`；附加 CSS 使用 `html[data-in-theme="主题ID"]`
- [x] 省略的 Token 与 parts 继承默认值；浅色覆盖不复制到深色
- [x] 切换明暗不更换主题；存储键仍为 `vueuse-color-scheme`
- [x] 弹层继承根 Token；`--in-*` 单向映射 `--el-*`

### REQ-003：主题布局宿主

系统 SHALL 让 `layout.main` 渲染 `InAdminThemeLayout`。主题不参与 layout registry 同名覆盖。

**验收标准：**

- [x] `layout.main` 键稳定；simple / iframe / external 语义不变
- [x] Shell 提供 header、navigation、breadcrumb、content、footer；content 只渲染一次
- [x] 核心提供 KeepAlive、滚动恢复、菜单权限、设置可见性和窄屏 overlay / Escape
- [x] 自定义 parts 转交 `shellSlots`；独立 layout 不被隐式替换

## 非功能需求

- 主题包将 Vue 与 `@ingot/admin-core` 作为 peerDependencies
- 仓库内正式主题位于 `themes/<id>/`，包名 `@ingot/theme-<id>`；默认主题不迁出 admin-core
- 消费端不扫描主题源码生成 UnoCSS
- 禁止依赖 `@/` 或 `@ingot/admin-core/src` 内部路径

## 依赖与约束

- 默认视觉值仍以 [UI 基础设施](../admin-ui-foundation/spec.md) 为基线
- 页面注册、布局扫描与重复键报错见 [App 插件化与共享包](../app-plugins-shared-scaffold/spec.md)
- 主题开发指南见 [docs/theme-development.md](../../../../docs/theme-development.md)
- 主题目录与包约定见 [themes/README.md](../../../../themes/README.md)

## 验收标准

- [x] 示例主题可证明 Token 覆盖、顶栏替换、区域重排和独立包消费
- [x] 路由缓存、滚动恢复、菜单权限、明暗、设置与窄屏导航保持可用
- [x] 默认主题与自定义示例可通过开发者验收
