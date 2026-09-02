# 设计：Admin App / Plugin / Package 三层架构

## 基线与实施门禁

本设计以 `20260902-packages-admin-feature-app-split` 已经完成并归档为基线。实施时直接迁移该 change
最终产出的四个业务 App，不重新拆分旧 `apps/admin` 单体，也不修改前置 change 的归档工件。

在前置 change 未完成前，本 change 只能处于 `draft`。满足前置条件并经用户确认后，才允许进入
`approved → implementing`。

## 技术方案

### 目标结构

```text
apps/
├── admin/                 # 默认通用后台；全插件 composition root
├── auth/                  # 独立登录应用，不属于管理台插件体系
├── create-app/            # 本地 App 生成工具
└── <generated-app>/       # 仅在确需独立应用时创建

plugins/
├── platform/              # 平台控制面 + Dashboard
├── security/              # 安全中心
├── org/                   # 组织管理
└── member/                # 会员服务管理

packages/
├── admin-core/            # 管理台 runtime、shell、插件契约和通用 UI
├── admin-common/          # 多插件共享的无页面管理域能力
├── shared/                # 框架无关工具、crypto、轻量 hooks
└── vite-config/           # App、library、source plugin 构建配置

examples/
└── admin-plugin/          # 不参与默认构建的完整插件示例
```

### 依赖规则

```text
apps ─────→ plugins ─────→ packages
  └──────────────────────→ packages
```

- App 是 composition root，任何 plugin/package 都不得反向依赖 App。
- 官方业务插件默认独立，只依赖 packages，不直接依赖另一个官方插件。
- Package 可以依赖更底层 package，但依赖图必须无环。
- Package 不注册业务页面、业务菜单或业务插件。
- create-app 生成的定制 App 可以保留仅属于自身的本地插件；需要复用时再提升到 `plugins/*`。

### 官方源码插件

| 目录 | package name | export | plugin id |
|------|--------------|--------|-----------|
| `plugins/platform` | `@ingot/platform-plugin` | `platformPlugin` | `ingot-platform` |
| `plugins/security` | `@ingot/security-plugin` | `securityPlugin` | `ingot-security` |
| `plugins/org` | `@ingot/org-plugin` | `orgPlugin` | `ingot-org` |
| `plugins/member` | `@ingot/member-plugin` | `memberPlugin` | `ingot-member` |

每个 package 使用源码 exports：

```json
{
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/plugin.ts",
      "import": "./src/plugin.ts"
    },
    "./package.json": "./package.json"
  }
}
```

插件只提供 `type-check`、`test:unit` 和 `lint`，不提供 `dev`、`preview`、`build`、独立 HTML 或 dist。
framework 依赖使用 peerDependencies，workspace 公共包使用 dependencies，并由宿主统一去重 Vue 运行时。

前置 change 的业务纵向切片整体移动：pages、API、models、stores、组件、枚举和 `plugin.ts` 不重新分配。
删除各业务 App 的 `main.ts`、Vite App 配置、public、Docker、环境文件和端口。原 admin Dashboard 从
admin 本地插件移动到 platform 插件，canonical key 为 `ingot.platform.dashboard`，继续注册
`ingot.admin.dashboard`、`ingot.base.dashboard` 和旧文件路径别名。

### 默认 Admin Composition Root

`apps/admin` 保留 package name `@ingot/admin-app`，但不导出业务插件。其源码只包含 bootstrap 和
集中插件清单：

```ts
// src/plugins.ts
import type { InAdminPlugin } from "@ingot/admin-core";
import { platformPlugin } from "@ingot/platform-plugin";
import { securityPlugin } from "@ingot/security-plugin";
import { orgPlugin } from "@ingot/org-plugin";
import { memberPlugin } from "@ingot/member-plugin";

export const adminPlugins: InAdminPlugin[] = [
  platformPlugin,
  securityPlugin,
  orgPlugin,
  memberPlugin,
];
```

`main.ts` 只读取 runtime 配置并调用 `bootstrapAdminApp`。`appCode` 使用
`env.VITE_APP_CODE || "ingot-admin"`。删除插件时必须同步：

1. 从 `src/plugins.ts` 删除 import 和数组项。
2. 从 package.json 删除对应 plugin dependency。
3. 让后端应用/OAuth Client 不再返回该插件菜单。
4. 运行边界和组合检查，确认插件源码未进入模块图。

### Target 移除与示例

删除整个 `apps/target-project`，同步删除 `dev:target`、`build:target`、target Docker/CI/deploy 配置及
所有文档引用。

将 target 中有教学价值的内容迁到 `examples/admin-plugin`：

- `plugin.ts`：pages、components、directives、staticMenus 和 dependsOn 示例。
- Demo 页面：overview、shared-state、components。
- Store、组件和指令示例。
- README：从 package manifest 到在 admin 注册的完整步骤。
- 独立 tsconfig/type-check 配置，不加入 pnpm workspace 和默认 admin 构建。

根 `check:examples` 使用 workspace 已安装依赖执行示例 vue-tsc，保证示例不会失效。

### Vite 和 TypeScript

把 `official-apps` 概念改为 `official-plugins`：

- `InOfficialAppPluginOption` → `InOfficialPluginOption`
- `officialAppPlugins` → `officialPlugins`
- `resolveOfficialApps` → `resolveOfficialPlugins`
- `createOfficialAppVitePlugin` → `createOfficialSourcePlugin`
- 搜索根从 `apps/*` 改为 `plugins/*`，同时保留 node_modules/package exports 解析。

App 通过 direct dependencies 自动发现所选官方插件。resolver 根据 importer 的绝对路径把插件内部
`@/` 指向该插件 src，并把宿主 `@/` 留给 App 自身。只对已选择插件配置 `server.fs.allow`、
`optimizeDeps.exclude` 和 source alias；Vue、Vue Router、Pinia、Element Plus、VueUse 继续 dedupe。

在 `@ingot/vite-config` 新增 `defineInSourcePluginConfig`，为插件提供：

- Vitest 的 Vue/SFC、alias、UnoCSS、icon 和自动导入转换。
- 插件本地 `auto-imports.d.ts`、`components.d.ts` 生成约定。
- 测试环境和 include 配置。
- 不提供 dev server 端口和 production build entry。

每个插件有独立 tsconfig，`@/*` 指向自身 src，引用所需 packages。根 tsconfig references 纳入四个插件；
根 `type-check` 和 `test:unit` 同时覆盖 apps 与 plugins，`build` 仍为 packages → apps，插件由 App 构建时
直接编译。

### Create App

create-app 的 OFFICIAL_PLUGINS 改为四个 `@ingot/*-plugin`，默认全选。生成 App 包含：

- bootstrap `main.ts`、`src/plugins.ts`、环境和 Vite/TS 配置。
- 与插件清单严格一致的 package dependencies。
- 可选的 App 私有插件和示例页面。
- 独立 Docker/代理配置沿用现有模板。

UI 首屏和文档明确说明：“普通单后台项目直接使用 `apps/admin`；只有独立 appCode、品牌、环境、构建
或部署需求时才创建新 App。”

### 文档信息架构

| 文档 | 职责 |
|------|------|
| `README.md` | 真实目录结构、快速开始、常用命令和文档导航 |
| `docs/development-model.md` | 三层概念、依赖规则、开发入口选择和端到端工作流 |
| `docs/plugin-development.md` | 插件结构、页面/API/model/store、菜单、注册、测试和边界 |
| `docs/app-development.md` | bootstrap、环境、插件裁剪、create-app、构建、Docker 和 CI |
| `docs/composable-admin-runtime.md` | 插件排序、资源注册、冲突、菜单合并和源码编译参考 |
| `docs/create-app.md` | 何时创建 App、字段、生成结构和后续步骤 |
| `docs/getting-started.md` | 安装、packages build、默认 admin 启动和常见问题 |
| `examples/admin-plugin/README.md` | 可复制的完整插件示例说明 |

插件开发文档必须覆盖：

- 命名、package manifest、目录和四件套页面。
- API、models、stores、components 的纵向归属。
- `definePluginPages`、canonical/legacy viewPath 和动态菜单配置。
- staticMenus、全局组件、指令、install hook 和依赖声明。
- 如何加入/移除 admin、如何验证模块未被误打包。
- 何时使用 packages、何时保留插件内部实现。

App 开发文档必须覆盖：

- 直接使用 admin 与 create-app 的决策标准。
- `src/plugins.ts`、package dependency 和后端菜单的同步修改流程。
- appCode、品牌、登录、网络、存储、publicPath 和环境文件。
- App 私有插件与 workspace 插件的边界。
- dev/build/type-check/test、Docker、CI 和部署步骤。

新增 Markdown 相对链接检查；示例代码通过 `check:examples` 验证。README 中旧版本号、已删除包和
`with-utils` 命令全部改为当前真实值。

### CI 与治理

- 删除 target build/docker/deploy jobs。
- admin job 的 changes 加入 `plugins/**/*`；plugin 或共享 package 变化必须触发 admin build。
- 增加 `check:boundaries`、`check:examples`、`check:docs` 并纳入根 `check`。
- 将现有 App 边界脚本泛化为分层检查：禁止 `plugins → apps`、`packages → plugins/apps`、官方插件互相依赖、遗留 `@base`、admin 插件清单与 dependencies 不一致。
- 更新 AGENTS、coding standards 和专门的架构文档；本 change 验收完成时同步 CONSTITUTION 和 current specs。

## 对接映射

本变更不改变后端接口，无 `API.md`。业务 API 随四个完整纵向切片从 `apps/*` 移至 `plugins/*`，路径、
函数签名和请求行为不变。菜单继续由 `GET /api/pms/v1/auth/user/menus` 返回，并由后端按 appCode/OAuth
Client 配置裁剪。

## 数据模型

- 业务模型随所属插件移动，公开类型名称和字段不因目录分层改变。
- `admin-core`、`admin-common` 和 `shared` 的职责沿用前置 change 最终状态。
- App 不定义可复用业务 DTO；App 私有插件可以在自身目录定义只被该 App 使用的模型。

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| Monorepo 边界 | ✅ | 明确 apps/plugins/packages 单向依赖，复用进入 packages |
| 页面结构 | ✅ | 页面随业务插件迁移并保持四件套 |
| API 层 | ✅ | API 随纵向切片迁移，接口行为不变 |
| 类型安全 | ✅ | 四插件独立 type-check，不新增 any/as any |
| 组件约定 | ✅ | 通用组件在 packages，业务组件在 plugins |
| 样式 | ✅ | 继续使用 UnoCSS/PostCSS |
| 施工门禁 | ✅ | 前置 change 完成且本 change approved 后才施工 |
| 真相单一 | ✅ | 验收后更新 current 并归档 |
| 构建依赖 | ✅ | packages 先构建，App 构建期编译选中的源码插件 |

## 备选方案

### 四个业务域继续保留为 App

未采纳。它们没有独立部署需求，额外 main、端口、环境和构建只会扩大维护面。

### 同时保留 admin 与 target-project

未采纳。两者默认都包含全插件时定位和 CI 重复；admin 已足以作为通用后台。

### 将 target-project 重命名为 console/backoffice

未采纳。“admin”最准确覆盖 OA、内部运营和 C 端业务管理，直接复用现有 admin 更简单。

### 所有定制 App 都强制建立 workspace 插件

未采纳。官方 admin 保持严格 composition root；create-app 生成的单 App 私有能力允许留在本地插件，复用时再提升。

### 同时维护插件源码和可发布 dist

未采纳。本阶段只服务 monorepo 构建期组合，双交付会增加 alias、声明和版本维护成本。

## 开放问题

无。实施偏离本设计时必须先更新本 change 并重新确认。
