# App 开发

App 只负责启动和部署。默认通用后台是 `apps/admin`。

## 直接使用 admin 还是 create-app

使用 `apps/admin`，如果：

- 只有一个管理后台
- 可以接受默认 `appCode=ingot-admin`
- 官方四插件或在此基础上裁剪即可

使用 create-app，如果需要：

- 独立 appCode
- 独立品牌、登录回调、Cookie / Store 前缀
- 独立构建产物、Docker 或 CI 流水线

## Bootstrap

`apps/admin/src/main.ts` 读取 runtime 配置并调用 `bootstrapAdminApp`。插件清单集中在 `src/plugins.ts`：

```ts
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

`appCode` 读取 `VITE_APP_CODE`，缺省 `ingot-admin`。

## 裁剪插件

必须同步修改：

1. `src/plugins.ts` 的 import 和数组
2. `package.json` 的 plugin dependency
3. 后端应用 / OAuth Client 菜单
4. `pnpm check:boundaries`

未选择插件不会进入 `optimizeDeps`、页面注册表和构建模块图。若后端仍下发其菜单，会显示 plugin-unavailable 诊断页。

## 环境与品牌

常用变量：

- `VITE_APP_CODE`、`VITE_APP_TITLE`、`VITE_APP_SYMBOL`
- `VITE_APP_LOGIN_URI`、`VITE_APP_LOGIN_CALLBACK_URI`
- `VITE_APP_STORE_PREFIX`、`VITE_APP_COOKIE_DOMAIN`
- `VITE_APP_NET_BASE_URL` 与超时
- 布局开关：`VITE_APP_SETTINGS_*`

登录应用是 `apps/auth`，不属于管理台插件体系。

## App 私有插件

create-app 可以生成仅属于该 App 的本地插件。官方 admin 保持严格 composition root，不在自身堆积业务页面。本地插件需要被多个 App 复用时，再提升到 `plugins/`。

## 构建、Docker 与 CI

```bash
pnpm build:packages
pnpm type-check:apps
pnpm --filter @ingot/admin-app test:unit
pnpm build:admin
pnpm preview:admin
```

admin 的 Docker / `proxy.conf` / GitLab job 仍负责默认后台部署。插件源码变化必须能触发 admin 构建：CI `changes` 包含 `plugins/**/*`。

插件由 App 构建时直接编译，根 `build` 仍是 packages → apps，不会给插件单独打 dist。
