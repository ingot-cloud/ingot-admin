# App 插件化与共享包规格

本文写已上线的组合、分层与脚手架行为。接口细节见归档 [20260831 API.md](../../../changes/archive/2026/20260831-app-plugins-shared-scaffold/API.md)。三层架构见 [20260902-packages-admin-plugin-layering DESIGN.md](../../../changes/archive/2026/20260902-packages-admin-plugin-layering/DESIGN.md)。viewPath 编码见 [20260902-packages-view-path-canonical](../../../changes/archive/2026/20260902-packages-view-path-canonical/)。

## 概述

仓库使用 apps、plugins、packages 三层。官方业务能力是 `@ingot/{platform,security,org,member}-plugin` 源码插件，位于 `plugins/`，不可独立 `dev`/`build`。`apps/admin` 默认注册全部四个插件，通过 `src/plugins.ts` 集中声明清单。未列入的插件不进入构建产物。Dashboard 属于 platform 插件。`@ingot/admin-base`、`@ingot/utils`、`@ingot/crypto`、`@ingot/hooks` 与 `apps/target-project` 已删除。

## 范围

### In Scope

- apps / plugins / packages 目录职责与单向依赖
- 四个官方源码插件的页面归属、纵向切片与构建期组合
- 默认 admin composition root 与插件裁剪
- `@ingot/admin-common`、`@ingot/shared`、`@ingot/admin-core`
- `definePluginPages` 只生成 canonical 键（无 `@/` / `ingot.admin.*` / `ingot.base.*`）
- 布局与页面同一套 IndexPage 扫描；菜单编辑从 registry 选择视图
- 静态菜单与后端动态菜单合并
- 本地 `create-app` 脚手架与 `examples/admin-plugin`
- App 约定本地插件（pages / layouts / components / hooks / directives / stores）与重名失败

### Out of Scope

- 运行时远程加载插件 / 微前端
- 将 `apps/auth` 改为管理台插件
- 前端自动隐藏后端误配的未安装插件菜单
- 可发布的官方插件 dist 或跨仓库插件市场

## 用户场景

### 场景 1：直接使用默认后台

- **角色**：后台项目开发者
- **前置条件**：配置环境并启动 `apps/admin`
- **步骤**：登录后访问平台控制面、安全中心、组织管理、会员管理及 Dashboard
- **预期结果**：默认包含四个官方插件；同一 Router / Pinia 实例；Dashboard 来自 platform 插件

### 场景 2：裁剪默认后台能力

- **角色**：后台项目开发者
- **前置条件**：编辑 `apps/admin/src/plugins.ts` 与 package.json
- **步骤**：移除插件 import、注册项和 dependency，并同步后端菜单
- **预期结果**：未选择插件不进入模块图；后端不再返回其菜单；其余能力正常

### 场景 3：开发并注册业务插件

- **角色**：业务前端开发者
- **前置条件**：在 `plugins/<name>` 编写纵向切片与 `plugin.ts`
- **步骤**：完成 type-check/单测后注册到 admin 清单
- **预期结果**：插件无需独立 App 即可检查和测试；由 admin Vite 编译运行

### 场景 4：创建独立后台 App

- **角色**：需要多后台交付的开发者
- **前置条件**：本地执行 `pnpm create:app`（`127.0.0.1:5801`）
- **步骤**：填写独立 appCode / 端口，默认全选官方插件，可取消；可选本地 Demo 页
- **预期结果**：写入新的 `apps/<appCode>`；始终有 `src/app-plugin.ts` 与约定目录；`src/plugins.ts` 与依赖一致；已有目录拒绝覆盖

### 场景 5：静态 + 动态菜单

- **角色**：项目开发者
- **前置条件**：插件或 App 声明 `staticMenus`，后端返回用户菜单
- **步骤**：启动后查看侧栏
- **预期结果**：静态在前、动态在后；同 `path` / `routeName` 冲突则启动失败；后端误配未安装插件或未迁库的旧 `@/` `view_path` 时进入 plugin-unavailable 诊断页

### 场景 6：创建菜单时选择已扫描视图

- **角色**：平台管理员
- **前置条件**：已登录默认 admin，打开应用详情菜单管理
- **步骤**：添加目录或菜单；从下拉选择布局或页面；菜单类型确认默认可改 path；目录自行填写 path
- **预期结果**：提交 canonical `view_path` 且 `customViewPath=true`；不能手填 `@/`；按钮不选视图；内嵌/外链绑定 `layout.iframe` / `layout.external`

### 场景 7：在 App 约定目录扩展本部署能力

- **角色**：后台项目开发者
- **前置条件**：使用 `apps/admin` 或 create-app 生成的后台
- **步骤**：在 `src/pages` / `components` / `hooks` / `stores` 新增文件，不改 `app-plugin.ts`
- **预期结果**：页面进入 registry；`Biz*` 组件与 hook/store 可直接使用；`InButton`、`usePaging` 仍可用；`In*` 或保留导出名构建失败

## 功能需求

### REQ-001：三层目录和依赖方向

系统 SHALL 使用 apps、plugins、packages 表达运行应用、业务插件和公共模块。依赖只允许 `apps → plugins/packages`、`plugins → packages` 和 packages 内部无环依赖。

**验收标准：**

- [x] `pnpm-workspace.yaml` 包含 `apps/*`、`plugins/*`、`packages/*`
- [x] 官方业务插件之间不存在源码 import 或 package dependency
- [x] packages 不注册业务页面或 `InAdminPlugin` 实例
- [x] `pnpm check:boundaries` 检查非法反向依赖、遗留 `@base` 和清单/依赖不一致

### REQ-002：官方源码插件

系统 SHALL 提供四个不可独立运行的官方插件，包名为 `@ingot/{platform,security,org,member}-plugin`，导出 `platformPlugin`、`securityPlugin`、`orgPlugin`、`memberPlugin`。插件 ID 分别为 `ingot-platform`、`ingot-security`、`ingot-org`、`ingot-member`。

**验收标准：**

- [x] 每个插件保留本域 pages、API、models、stores、组件和 `plugin.ts`
- [x] 插件没有独立 HTML、public、dev/preview/production build
- [x] 插件可独立 type-check、lint 和 unit test
- [x] Dashboard 在 platform 插件，canonical 为 `platform.dashboard`

### REQ-003：默认通用 Admin

系统 SHALL 将 `apps/admin` 作为唯一默认通用后台。`appCode` 读取 `VITE_APP_CODE`，缺省 `ingot-admin`。

**验收标准：**

- [x] admin 默认注册全部四个官方插件
- [x] 清单集中在 `src/plugins.ts` 的 `createAdminPlugins(appCode)`，官方插件页面不在 admin 复制
- [x] admin 保留约定目录供本部署扩展，以及 dev/build、Docker 和部署能力

### REQ-004：页面键、布局扫描与共享能力

系统 SHALL 为 IndexPage 生成 canonical 键 `{domain}.*`（无全局 `ingot.` 前缀）。布局扫描 `layouts/{slot}/IndexPage.vue` 为 `layout.{slot}`；系统页为 `common.*`；App 本地页面 prefix 为 `appCode` 的 `-` 转 `.`，本地布局再拼 `.layout`。不注册 `@/`、`ingot.admin.*`、`ingot.base.*`。租户与 Client 只读选择器在 `@ingot/admin-common`。

**验收标准：**

- [x] 例如会话页 canonical 为 `security.sessions`，Dashboard 为 `platform.dashboard`
- [x] core 扫描 `layout.main|simple|iframe|external`；宿主 `optimizeDeps.exclude` 包含 `@ingot/admin-core`
- [x] security 可单独选装，选择器来自 admin-common，不依赖 platform 插件
- [x] 业务源码不再使用 `@base`

### REQ-005：菜单、脚手架与文档

系统 SHALL 合并 App/插件 `staticMenus` 与 `UserMenuAPI`；冲突报错。create-app 默认全选四个官方插件；始终生成约定本地插件 `defineAppLocalPlugin(appCode)`，与 `main.ts` 同源；原本地插件开关只控制 Demo。菜单编辑从当前 registry 选择页面或布局。根 README 与 `docs/development-model.md` 说明三层开发入口；`docs/menu-view-path.md` 说明编码与迁库。

**验收标准：**

- [x] 菜单接口仍为 `GET /api/pms/v1/auth/user/menus`；`view_path` 只认 canonical
- [x] 生成物 `src/plugins.ts` 为 `createAppPlugins(appCode)`，与 package.json 只包含所选官方插件
- [x] 已删除 `apps/target-project`；示例在 `examples/admin-plugin`
- [x] `pnpm check:docs` 与 `pnpm check:examples` 覆盖文档链接和示例类型
- [x] 菜单类型默认 path 为 `'/' + key.replaceAll('.', '/')`，目录不自动填 path；提交 `customViewPath=true`
- [x] 生成物始终包含 `src/app-plugin.ts`；关闭 Demo 时仍注册约定插件

### REQ-006：App 约定本地插件与自动注入

系统 SHALL 为每个管理台 App 提供约定目录本地插件。`src/components` 的 `Biz*` 组件与 `src/directives` 自动进入 registry；`src/hooks` 与 `src/stores` 由 AutoImport 注入。与 admin-core 或已注册插件重名时构建或启动失败。App store 使用同一 Pinia；persist 必须显式声明。

**验收标准：**

- [x] `defineAppLocalPlugin` 接受组件/指令 glob，文件名推导注册名
- [x] `apps/admin` 具备空约定目录与 `createAdminPlugins(appCode)`
- [x] 管理台 Vite `enforceAppConventions` 拒绝 `In*` / `El*` 与保留导出名
- [x] Store 不默认 persist，id 使用 appCode 点分前缀

## 非功能需求

- 组合方 Vite 必须按 importer 编译官方插件内的 Vue SFC、`import.meta.glob` 与 `@/`
- Vue / Router / Pinia / Element Plus / VueUse 保持单实例
- create-app 仅限本地，不得暴露到公网
- 不改变现有业务接口路径与 `R<T>` 包装
- 插件为构建期静态组合，不引入远程运行时加载

## 依赖与约束

- 官方业务插件不得互相依赖；跨插件复用进入有明确职责的 package
- 只有两个及以上插件实际使用的无页面能力才能进入 `admin-common`
- 仓库根包名为 `@ingot/workspace`
- 页面稳定键为 `{domain}.*`、`layout.*`、`common.*` 或 App 本地 `{appCode 转点号}.*`，不兼容 `@/` 与旧 `ingot.admin.*` / `ingot.base.*`
- 上线须先迁 `platform_menu.view_path`（或同时发）；后端原样保存前端提交的 `view_path`
- 裁剪插件时必须同步 `src/plugins.ts`、package.json 和后端菜单

## 验收标准

- [x] 三层目录与单向依赖由边界脚本保护
- [x] 四个官方源码插件与 admin 宿主可类型检查；packages 可构建
- [x] create-app 可按全选、裁剪、空插件生成，并始终带约定本地插件
- [x] 文档、示例和分层检查纳入根 `pnpm check`
