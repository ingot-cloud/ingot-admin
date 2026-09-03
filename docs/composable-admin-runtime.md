# 可组合后台运行时

管理台是**构建期组合的单 SPA**：`src/plugins.ts` 清单即构建开关。官方业务能力是 `plugins/` 下的源码插件，由 App Vite 直接编译，不在运行时远程加载。

| 位置 | 职责 |
|------|------|
| `@ingot/admin-core` | 启动器、插件契约、壳层、公共错误页、Pinia、net、`In*` 组件、静态+动态菜单合并 |
| `@ingot/admin-common` | 跨插件无页面能力：只读租户/Client 选择器与共用管理枚举 |
| `@ingot/shared` | 通用工具 / 信封加密 / 轻量 hooks |
| `@ingot/vite-config` | App、library、源码插件 Vite 配置；官方插件 alias、`fs.allow`、Vue 单实例 dedupe |
| `plugins/platform` | 平台控制面 + Dashboard；导出 `platformPlugin` |
| `plugins/security` | 安全中心；导出 `securityPlugin` |
| `plugins/org` | 组织管理；导出 `orgPlugin` |
| `plugins/member` | 会员管理；导出 `memberPlugin` |
| `apps/admin` | 默认通用后台 composition root，注册全部官方插件 |

概念总览见 [开发模式](./development-model.md)。

## 快速开始

```bash
pnpm install
pnpm build:packages
pnpm dev:admin     # :5798 默认全插件后台
pnpm dev:login     # 登录应用
pnpm create:app    # :5801 可视化脚手架（仅本地）
```

生产构建：

```bash
pnpm build:admin
pnpm build:login
```

隔离消费验证：

```bash
pnpm test:pack
```

## 官方源码插件

```ts
import { adminPlugins } from "./plugins";

await bootstrapAdminApp({
  appCode: import.meta.env.VITE_APP_CODE || "ingot-admin",
  plugins: adminPlugins,
});
```

`resolveOfficialPlugins` 根据 App 的 direct dependencies 发现 `plugins/*`。未选择的插件不会进入 `optimizeDeps`、页面注册表和构建模块图。

约束：

- 插件 `id`：`ingot-platform`、`ingot-security`、`ingot-org`、`ingot-member`
- 官方插件 `dependsOn` 必须包含 `ingot-admin-core`，彼此不得互相依赖
- 页面稳定键：官方 `{domain}.*`，布局 `layout.*`，系统 `common.*`，App 本地用 `appCode`（`-` 转 `.`）
- Vue / Router / Pinia / Element Plus / VueUse 必须单实例（peer + Vite `dedupe`）
- 插件内部 `@/` 按 importer 解析到该插件 `src`，宿主 `@/` 留给 App

`createOfficialSourcePlugin` 负责上述 alias、`server.fs.allow` 和 `optimizeDeps.exclude`（官方插件 + `@ingot/admin-core`）。排除 admin-core 是为了保留 `import.meta.glob` 的路径键，布局才能扫成 `layout.*`。

## 静态 + 动态菜单

```ts
import { MenuType, defineStaticMenus } from "@ingot/admin-core";

export const examplePlugin: InAdminPlugin = {
  id: "example-admin-plugin",
  apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
  dependsOn: ["ingot-admin-core"],
  pages: {
    "example.demo.overview": () =>
      import("./pages/demo/overview/IndexPage.vue").then((m) => m.default),
  },
  staticMenus: defineStaticMenus([
    {
      name: "示例",
      path: "/example-demo/overview",
      routeName: "ExampleDemoOverview",
      menuType: MenuType.Menu,
      viewPath: "example.demo.overview",
    },
  ]),
};
```

合并顺序：App `staticMenus` → 各插件 `staticMenus` → 后端 `UserMenuAPI`。静态在前。同 `path` / `routeName` 冲突会抛错。后端为空或失败时，仅静态菜单仍可出现在侧栏。公共 403/404 只走 `staticRoutes` 且 `hideMenu`。

未知 `viewPath` 渲染 `common.plugin.unavailable`。编码约定见 [菜单 view_path](./menu-view-path.md)。

可复制示例见 [examples/admin-plugin](../examples/admin-plugin/README.md)。

## 创建新 App

普通项目使用 `apps/admin`。独立运行/部署需求见 [create-app.md](./create-app.md)。

```bash
pnpm create:app          # 打开本地 UI
pnpm create:app:cli      # 交互式 CLI
```

## 独立仓库消费

1. 安装 `@ingot/admin-core` / `@ingot/shared` / `@ingot/vite-config`
2. 若需要官方业务页，workspace/path 依赖对应 `@ingot/*-plugin` 源码
3. peer 安装与 catalog 对齐的 `vue`、`vue-router`、`pinia`、`element-plus`
4. 使用 `defineInAppConfig`，入口调用 `bootstrapAdminApp`
5. `import "@ingot/admin-core/style.css"`

发布前确认 tarball 的 `package.json` 中不再包含 `workspace:` / `catalog:`。

## Docker / CI

- `apps/admin/Dockerfile` + `proxy.conf`：Nginx SPA + `/api` 反代
- 根 `.gitlab-ci.yml`：`build-admin` / `docker-admin` / `deploy-admin`，`changes` 包含 `plugins/**/*`

## 版本升级注意

1. 同步更新 `admin-core` 的 peerDependencies ranges
2. 重新执行 `pnpm test:pack`
3. 回归默认 `apps/admin` 全插件菜单与裁剪组合
