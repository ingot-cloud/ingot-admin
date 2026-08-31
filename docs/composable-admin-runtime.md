# 可组合后台运行时（admin-core / admin-base）

本仓库将管理台拆为构建期插件化运行时：

| 包 | 职责 |
|----|------|
| `@ingot/admin-core` | 启动器、插件契约、壳层、公共路由/guards、Pinia、net、`In*` 组件 |
| `@ingot/admin-base` | dashboard / org / platform 基础业务页与 `adminBasePlugin` |
| `@ingot/vite-config` | app / library 共享 Vite 配置工厂 |

参考应用：

- `apps/ingot-admin`：仅组合 `adminBasePlugin`
- `apps/target-project`：组合 `adminBasePlugin` + 本地 `targetPlugin`（D/E/F 验证页）

## 快速开始

```bash
pnpm install
pnpm build:packages
pnpm dev:admin     # :5798
pnpm dev:target    # :5799
pnpm dev:login     # :1798
```

生产构建：

```bash
pnpm build:admin
pnpm build:target
pnpm build:login
```

隔离消费验证（`pnpm pack` + 临时工程）：

```bash
pnpm test:pack
```

## 创建新 app

```bash
pnpm create:app
# 或
pnpm create:app acme-admin
```

脚本会从 `scripts/templates/admin-app` 生成薄入口、`.env`、Vite 配置，以及可选的本地插件骨架。

## 编写插件

```ts
import {
  INGOT_ADMIN_PLUGIN_API_VERSION,
  type InAdminPlugin,
} from "@ingot/admin-core";

export const myPlugin: InAdminPlugin = {
  id: "acme-feature",                 // kebab-case，全局唯一
  apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
  dependsOn: ["ingot-admin-base"],
  pages: {
    "acme.order.list": () => import("./pages/order/list/IndexPage.vue").then((m) => m.default),
  },
  components: {
    BizAcmeOrderPicker: OrderPicker,
  },
  directives: {
    "acme-focus": focusDirective,
  },
};
```

入口：

```ts
await bootstrapAdminApp({
  appCode: "acme-admin",
  plugins: [adminBasePlugin, myPlugin],
  branding,
  login,
  // net / storage / settings ...
});
```

约束：

- 页面、组件、指令、路由名冲突会抛错，禁止静默覆盖
- 业务全局组件使用 `Biz<Domain><Name>`
- 包内不要依赖消费 app 的 `@/`；跨包只走 `@ingot/*` 公开导出
- Vue / Router / Pinia / Element Plus 必须单实例（peerDependencies）

## 稳定页面键与菜单迁移

- 新页面写入后端菜单时使用稳定键，例如 `ingot.base.dashboard`、`target.demo.overview`
- `admin-base` 仍为旧 `@/pages/**` 注册别名，兼容期内无需批量改库
- 未知键渲染受控错误页 `ingot.common.plugin-unavailable`，不会空白

建议迁移步骤：

1. 后端菜单新增稳定键字段或直接改 `viewPath`
2. 前端验证新旧键均可解析
3. 全量切换后再立项删除 aliases（独立 change）

## 独立仓库消费

1. 安装已发布的 `@ingot/admin-core` / `@ingot/admin-base` / `@ingot/vite-config`（或使用 `pnpm pack` 产物）
2. peer 安装与 catalog 对齐的 `vue`、`vue-router`、`pinia`、`element-plus` 等
3. 使用 `defineIngotAppConfig` 创建 Vite 配置，入口调用 `bootstrapAdminApp`
4. 引入 CSS：

```ts
import "@ingot/admin-core/style.css";
import "@ingot/admin-base/style.css";
```

发布前请确认 tarball 的 `package.json` 中不再包含 `workspace:` / `catalog:` 协议版本。

## Docker / CI

- `apps/target-project/Dockerfile` + `proxy.conf`：Nginx SPA + `/api` 反代
- 根 `.gitlab-ci.yml` 已增加 `build-target` / `docker-target` / `deploy-target` 示例，可按环境修改变量 `VIRTUAL_HOST`

## 版本升级注意

升级 workspace catalog 中的 Vue 生态版本时：

1. 同步更新 `admin-core` / `admin-base` 的 peerDependencies ranges
2. 重新执行 `pnpm test:pack`
3. 回归 `ingot-admin` 与 `target-project` 登录、菜单与插件页
