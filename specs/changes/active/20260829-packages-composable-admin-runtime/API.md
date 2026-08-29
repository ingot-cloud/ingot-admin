# 接口：可组合后台插件运行时

## 来源

- 原始文件：用户对话中的插件化架构方案
- 后端仓库：无新增后端接口；沿用现有用户菜单接口

## 服务与约定

- **前端 packages**：`@ingot/admin-core`、`@ingot/admin-base`、`@ingot/vite-config`
- **后端菜单接口**：`GET /api/pms/v1/auth/user/menus`
- **鉴权**：沿用现有 session 与 OAuth2/PKCE 流程
- **兼容目标**：同一 Vue、Router、Pinia 实例；插件在 mount 前完成注册

## TypeScript 公共接口

### 1. 插件清单

```ts
import type {
  App,
  Component,
  Directive,
  Plugin as VuePlugin,
} from "vue";
import type { Pinia } from "pinia";
import type {
  RouteRecordRaw,
  Router,
} from "vue-router";

export const INGOT_ADMIN_PLUGIN_API_VERSION = 1 as const;

export type PageKey = string;
export type AsyncComponentLoader = () => Promise<Component>;

export interface InAdminPluginContext {
  app: App;
  appCode: string;
  pinia: Pinia;
  router: Router;
  resolvePage: (pageKey: PageKey) => AsyncComponentLoader | undefined;
}

export interface InAdminPlugin {
  id: string;
  apiVersion: typeof INGOT_ADMIN_PLUGIN_API_VERSION;
  dependsOn?: string[];
  pages?: Record<PageKey, AsyncComponentLoader>;
  components?: Record<string, Component>;
  directives?: Record<string, Directive>;
  vuePlugins?: VuePlugin[];
  staticRoutes?: RouteRecordRaw[];
  install?: (
    context: InAdminPluginContext,
  ) => void | Promise<void>;
}
```

约束：

- `id` 使用小写 kebab-case，全局唯一；基础插件固定为 `ingot-admin-base`。
- `dependsOn` 仅引用同一应用清单中的插件 ID；缺失依赖或循环依赖阻止启动。
- `pages` 的稳定键使用反向域式命名，例如 `ingot.base.app.home`、`target.order.list`。
- `components` 仅声明需要跨页面全局使用的组件；业务组件名必须包含域语义，例如 `BizTargetOrderPicker`。
- `install` 在全部声明式资源注册后、app mount 前按依赖顺序执行。

### 2. 应用启动配置

```ts
export interface InBrandingConfig {
  title: string;
  logo?: string;
}

export interface InLoginConfig {
  loginUri: string;
  callbackUri: string;
  errorImage?: string;
  fingerprintEnabled: boolean;
}

export type AdminShellSlot =
  | "header-start"
  | "header-end"
  | "sidebar-top"
  | "sidebar-bottom";

export interface InAdminAppOptions {
  appCode: string;
  mountTarget?: string;
  plugins: InAdminPlugin[];
  branding: InBrandingConfig;
  login: InLoginConfig;
  shellSlots?: Partial<Record<AdminShellSlot, Component>>;
}

export interface InAdminRuntime {
  app: App;
  pinia: Pinia;
  router: Router;
}

export function bootstrapAdminApp(
  options: InAdminAppOptions,
): Promise<InAdminRuntime>;
```

约束：

- `appCode` 使用小写 kebab-case，作为诊断、持久化状态和应用配置命名空间。
- `mountTarget` 默认 `#app`。
- `bootstrapAdminApp` 必须等待插件校验、注册和 `install` 完成后才 mount。
- `shellSlots` 只能填充公开插槽，不替换整个基础布局。

### 3. 错误类型

`@ingot/admin-core` 导出统一错误 `InAdminPluginError`，至少覆盖下列 `code`：

| code | 条件 |
|------|------|
| `DUPLICATE_PLUGIN_ID` | 插件 ID 重复 |
| `UNSUPPORTED_API_VERSION` | 插件 API 版本不兼容 |
| `MISSING_PLUGIN_DEPENDENCY` | `dependsOn` 未安装 |
| `CYCLIC_PLUGIN_DEPENDENCY` | 插件依赖存在环 |
| `DUPLICATE_PAGE_KEY` | 页面键重复 |
| `DUPLICATE_COMPONENT_NAME` | 全局组件名重复 |
| `DUPLICATE_DIRECTIVE_NAME` | 指令名重复 |
| `DUPLICATE_ROUTE_NAME` | 静态路由 name 重复 |

错误消息必须包含冲突资源和涉及的插件 ID，不允许后注册覆盖前注册。

## 后端菜单兼容契约

### `GET /api/pms/v1/auth/user/menus`

请求和响应结构不变。本 change 只收敛 `viewPath` 字段语义：

- 新值：优先使用稳定页面键，如 `ingot.base.role.list`。
- 目录布局：使用 core 保留键 `ingot.layout.main`、`ingot.layout.simple`、`ingot.layout.iframe`、`ingot.layout.external`。
- 迁移期：`adminBasePlugin` 与 core 同时注册现有 `@/pages/**/*.vue`、`@/layouts/*.vue` 旧值为别名。
- 未知值：动态路由使用 core 的“插件页面不可用”组件，展示 `appCode` 与 `viewPath`；不得产生空白页面或未捕获异常。

旧值兼容层只有在后端菜单完成迁移且仓库新增独立 change 后才能移除。

## 构建与发布接口

`@ingot/vite-config` 导出：

```ts
export function defineIngotAppConfig(
  options: InAppViteOptions,
): UserConfigExport;

export function defineIngotLibraryConfig(
  options: InLibraryViteOptions,
): UserConfigExport;
```

- app 配置保留 Vue、JSX、UnoCSS、AutoImport、Components、SVG icons 和 HTML title 能力。
- library 配置生成 ESM、类型声明与独立 CSS；Vue、Vue Router、Pinia、Element Plus 作为 peer dependencies/external。
- package 内部允许扫描自己的组件和 hooks，消费 app 不扫描已发布 package 的源码。

## 前端注意

- `components.d.ts` 或 package 类型声明必须扩展 Vue `GlobalComponents`，保证独立仓库获得全局组件提示。
- 插件注册中心不得依赖 `window` 全局变量，不得支持 mount 后热注入。
- target 私有状态使用带域前缀的 Setup Store；不同插件不得深层导入彼此源码。
