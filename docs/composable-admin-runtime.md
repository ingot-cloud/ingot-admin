# 可组合后台运行时

管理台是**构建期组合的单 SPA**：`plugins: [...]` 清单即构建开关。业务页属于对应 App；App 既可独立部署，也可作为官方插件被其他 App 依赖。

| 位置 | 职责 |
|------|------|
| `@ingot/admin-core` | 启动器、插件契约、壳层、公共错误页、Pinia、net、`In*` 组件、静态+动态菜单合并 |
| `@ingot/shared` | 通用工具 / 信封加密 / 轻量 hooks（`@ingot/shared/crypto`、`@ingot/shared/hooks`） |
| `@ingot/vite-config` | App / library Vite 配置；官方 App 插件的 alias、`fs.allow`、Vue 单实例 dedupe |
| `apps/admin` | 平台业务页；独立部署，同时导出 `adminPlugin`（`@ingot/admin-app/plugin`） |
| `apps/target-project` | 示例组合：`adminPlugin` + 本地 `targetPlugin` |

`@ingot/admin-base` 已废弃：页面/API/models/Biz 回迁到 `ingot-admin`。

## 快速开始

```bash
pnpm install
pnpm build:packages
pnpm dev:admin     # :5798 独立平台 App
pnpm dev:target    # :5799 组合官方插件 + 本地页
pnpm dev:login     # :1798
pnpm create:app    # :5801 可视化脚手架（仅本地）
```

生产构建：

```bash
pnpm build:admin
pnpm build:target
pnpm build:login
```

隔离消费验证（pack `shared` / `vite-config` / `admin-core`）：

```bash
pnpm test:pack
```

## 官方 App 插件

`ingot-admin` 通过 package exports 暴露插件入口：

```ts
import { adminPlugin } from "@ingot/admin-app/plugin";

await bootstrapAdminApp({
  appCode: "target-project",
  plugins: [adminPlugin, targetPlugin], // 未列入的插件不会打进产物
  branding,
  login,
});
```

约束：

- 插件 `id` 使用 App 名 kebab-case（`ingot-admin`）
- `dependsOn` 必须包含 `ingot-admin-core`
- 业务 App 不得互相循环依赖；只依赖 `@ingot/admin-core` 与 `@ingot/shared`
- 页面稳定键优先 `ingot.admin.*`；兼容期同时注册 `ingot.base.*` 与 `@/pages/**`
- Vue / Router / Pinia / Element Plus 必须单实例（peer + Vite `dedupe`）

`@ingot/vite-config` 会识别对 `ingot-admin` 的 workspace 依赖，把该 App 的 Vue SFC / `import.meta.glob` 编进组合方产物，并用 importer 感知的 `@/`、`@base` 避免与宿主别名冲突。

## 静态 + 动态菜单

```ts
import { MenuType, defineStaticMenus } from "@ingot/admin-core";

export const targetPlugin: InAdminPlugin = {
  id: "acme-feature",
  apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
  dependsOn: ["ingot-admin"],
  pages: { "acme.demo.overview": () => import("./pages/demo/overview/IndexPage.vue").then((m) => m.default) },
  staticMenus: defineStaticMenus([
    {
      name: "本地 Demo",
      path: "/demo",
      routeName: "AcmeDemo",
      menuType: MenuType.Menu,
      viewPath: "acme.demo.overview",
    },
  ]),
};
```

合并顺序：App `staticMenus` → 各插件 `staticMenus` → 后端 `UserMenuAPI`。静态在前。同 `path` / `routeName` 冲突会抛错。后端为空或失败时，仅静态菜单仍可出现在侧栏。公共 403/404 只走 `staticRoutes` 且 `hideMenu`。

## 编写本地插件

```ts
export const myPlugin: InAdminPlugin = {
  id: "acme-feature",
  apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
  dependsOn: ["ingot-admin"],
  pages: {
    "acme.order.list": () => import("./pages/order/list/IndexPage.vue").then((m) => m.default),
  },
};
```

- 页面、组件、指令、路由名冲突会抛错，禁止静默覆盖
- 业务全局组件使用 `Biz<Domain><Name>`
- 未知 `viewPath` 渲染 `ingot.common.plugin-unavailable`

## 创建新 App

图形界面（推荐）：见 [create-app.md](./create-app.md)。

```bash
pnpm create:app          # 打开本地 UI
pnpm create:app:cli      # 交互式 CLI
```

## 独立仓库消费

1. 安装 `@ingot/admin-core` / `@ingot/shared` / `@ingot/vite-config`（或 `pnpm pack` 产物）
2. 若需要平台页，workspace/path 依赖 `ingot-admin` 源码（组合方 Vite 编译其 Vue）
3. peer 安装与 catalog 对齐的 `vue`、`vue-router`、`pinia`、`element-plus`
4. 使用 `defineInAppConfig`，入口调用 `bootstrapAdminApp`
5. `import "@ingot/admin-core/style.css"`

发布前确认 tarball 的 `package.json` 中不再包含 `workspace:` / `catalog:`。

## Docker / CI

- `apps/target-project/Dockerfile` + `proxy.conf`：Nginx SPA + `/api` 反代
- 根 `.gitlab-ci.yml` 已增加 `build-target` / `docker-target` / `deploy-target` 示例

## 版本升级注意

1. 同步更新 `admin-core` 的 peerDependencies ranges
2. 重新执行 `pnpm test:pack`
3. 回归独立 `ingot-admin` 与组合 `target-project`
