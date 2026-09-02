# 需求：Admin App / Plugin / Package 三层架构

## 场景与页面

### 场景 1：直接使用默认后台

- **角色**：后台项目开发者
- **入口**：`apps/admin`
- **步骤**：配置环境变量并启动或构建 admin。
- **预期结果**：默认包含 platform、security、org、member 全部官方能力，可以直接作为 OA、运营后台或 C 端业务管理后台使用。

### 场景 2：裁剪默认后台能力

- **角色**：后台项目开发者
- **入口**：`apps/admin/src/plugins.ts`
- **步骤**：移除不需要的插件 import、注册项和 package dependency，并同步应用菜单配置。
- **预期结果**：未选择插件不进入构建模块图，其菜单不由后端返回，其余后台能力正常运行。

### 场景 3：开发并注册业务插件

- **角色**：业务前端开发者
- **入口**：`plugins/<plugin>` 和 admin 插件清单
- **步骤**：创建页面、API、models、stores、组件与 plugin manifest，完成测试后注册到 admin。
- **预期结果**：插件不需要独立 App 即可开发、类型检查和测试，注册后由 admin 编译并运行。

### 场景 4：创建独立后台 App

- **角色**：需要多后台交付的开发者
- **入口**：create-app UI 或 CLI
- **步骤**：配置独立 appCode、品牌、端口和插件集合，生成新的 App。
- **预期结果**：新 App 只负责 bootstrap 和部署，可以选择官方插件并可选生成 App 私有插件。

### 场景 5：学习开发模式

- **角色**：首次接触仓库的开发者
- **入口**：根 README 与 `docs/development-model.md`
- **步骤**：按文档选择直接使用 admin、开发插件或创建新 App。
- **预期结果**：无需阅读历史 change 即可理解目录职责、依赖边界、完整开发流程、命令和发布方式。

## 功能需求

### REQ-A001：三层目录和依赖方向

系统 SHALL 使用 apps、plugins、packages 三层表达运行应用、业务插件和公共模块。

**验收标准：**

- [x] `pnpm-workspace.yaml` 包含 `apps/*`、`plugins/*`、`packages/*`。
- [x] 依赖只允许 `apps → plugins/packages`、`plugins → packages` 和 packages 内部无环依赖。
- [x] packages 不包含业务菜单、业务页面或 `InAdminPlugin` 实例。
- [x] 官方业务插件之间不存在源码 import 或 package dependency。

### REQ-A002：四个官方源码插件

系统 SHALL 把前置 change 的四个业务 App 迁为不可独立运行的源码插件。

**验收标准：**

- [x] 目录和包名分别为 `plugins/platform` / `@ingot/platform-plugin`、`plugins/security` / `@ingot/security-plugin`、`plugins/org` / `@ingot/org-plugin`、`plugins/member` / `@ingot/member-plugin`。
- [x] 每个插件保留本域 pages、API、models、stores、组件和 `plugin.ts`。
- [x] 插件 package 根直接导出其 `platformPlugin`、`securityPlugin`、`orgPlugin` 或 `memberPlugin`。
- [x] 插件没有 `main.ts`、HTML、public、运行端口、dev、preview 或 production build。
- [x] 插件仍可独立 type-check、lint 和 unit test。

### REQ-A003：默认通用 Admin

系统 SHALL 将 `apps/admin` 作为唯一默认通用后台 composition root。

**验收标准：**

- [x] admin 默认注册全部四个官方插件。
- [x] admin 业务页面全部来自 plugins，不在自身复制业务实现。
- [x] admin 使用 `src/plugins.ts` 集中声明插件清单。
- [x] appCode 从 `VITE_APP_CODE` 读取，缺省为 `ingot-admin`。
- [x] admin 原有 dev/build、Docker 和部署能力保持可用。
- [x] Dashboard 归 platform 插件，并兼容已有页面 key。

### REQ-A004：移除重复 Target 应用

系统 SHALL 删除与默认 admin 定位重复的 target-project，并保留其有价值的插件示例。

**验收标准：**

- [x] `apps/target-project`、对应根脚本、CI build/deploy job 和文档引用被移除。
- [x] 原 target 的页面、组件、指令、Store、静态菜单示例整理到 `examples/admin-plugin`。
- [x] 示例不参与默认 workspace build 或 admin 运行。
- [x] 示例可通过独立 type-check，文档可直接链接到其关键源码。

### REQ-A005：源码插件构建支持

系统 SHALL 让 App 的 Vite 直接编译其选中的 workspace 源码插件。

**验收标准：**

- [x] Vite 根据 App direct dependencies 发现 `plugins/*` 源码根。
- [x] 插件内部 `@/` 解析到自身 src，不与宿主或其他插件冲突。
- [x] Vue、Router、Pinia、Element Plus 和 VueUse 保持单实例。
- [x] 未选择插件不进入 optimizeDeps、页面注册表和构建模块图。
- [x] 插件有统一的 Vitest、自动导入和组件类型配置，但不会生成 dist。

### REQ-A006：Create App 定位与生成结果

系统 SHALL 把 create-app 定位为创建独立后台应用的工具，而不是普通项目的默认入口。

**验收标准：**

- [x] UI 和 CLI 默认选择全部四个官方插件，同时允许任意取消。
- [x] 生成物只包含 bootstrap、环境/构建配置、部署资源和集中插件清单。
- [x] 生成物的 package dependencies 与插件清单严格一致。
- [x] 可选的 App 私有插件骨架继续可用。
- [x] UI 和文档明确提示通常应直接使用 `apps/admin`。

### REQ-A007：完整开发文档

系统 SHALL 提供不依赖历史 change 的三层架构和开发使用文档。

**验收标准：**

- [x] 根 README 的结构、版本、脚本和文档导航与实现一致。
- [x] 有总览文档说明三层职责、依赖规则和开发路径选择。
- [x] 有插件开发文档覆盖目录、API、页面、菜单、注册、测试和边界。
- [x] 有 App 开发文档覆盖 bootstrap、环境、插件裁剪、create-app、构建和部署。
- [x] 运行时与 create-app 参考文档全部更新到源码插件模型。
- [x] 文档命令、内部链接和示例通过自动化检查。

### REQ-A008：分层治理与回归保护

系统 SHALL 通过规范和自动化阻止三层边界退化。

**验收标准：**

- [x] 边界脚本检查非法依赖、遗留 `@base`、插件清单与依赖不一致。
- [x] AGENTS、coding standards 和 CONSTITUTION 记录新的目录和依赖规则。
- [x] 组合验证覆盖单插件、部分插件和全插件场景。
- [x] 前置 change 已 completed/archived 才允许本 change 开工。

## 非功能需求

- 现有后端接口、鉴权、菜单响应结构和业务页面行为保持不变。
- 插件仍为构建期静态组合，不引入远程运行时加载。
- 新代码遵循 Vue 3、TypeScript strict、UnoCSS 和页面四件套规范。
- 跨插件复用不得复制实现，必须进入有明确职责的 package。
- `admin-common` 不得演变为无边界业务代码集合：只有两个及以上插件实际使用的无页面能力才能进入。

## 验收标准

- [x] REQ-A001 至 REQ-A008 全部满足。
- [x] packages build、plugins check、apps type-check、lint、unit tests 和 admin build 通过。
- [x] 默认 admin、裁剪组合、create-app 生成物和文档示例完成验收。
