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

`apps/admin/src/main.ts` 读取 runtime 配置并调用 `bootstrapAdminApp`。必须同时引入 `@ingot/admin-core/style.css`（core 组件 CSS）和 `uno.css`（App 与插件的 UnoCSS 原子类）；只引 `style.css` 时约定目录和插件里的原子类不会生效。插件清单集中在 `src/plugins.ts`，`appCode` 与约定本地插件必须同源：

```ts
export const createAdminPlugins = (appCode: string): InAdminPlugin[] => [
  platformPlugin,
  securityPlugin,
  orgPlugin,
  memberPlugin,
  createAppLocalPlugin(appCode),
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

网络请求、App 追加拦截器与 `useServerPaging` 见 [网络请求](./network.md)。

## App 约定本地插件

每个管理台 App（含 `apps/admin`）都有一份冻结的 `src/app-plugin.ts`，用 glob 扫描约定目录。新增文件不必改注册逻辑。

```text
src/pages/**/IndexPage.vue    # 进 page registry，prefix 为 appCode 转点号
src/layouts/**/IndexPage.vue  # `{prefix}.layout.*`
src/components/**/*.vue       # 全局组件，文件名必须 Biz*
src/hooks/**/*.ts             # AutoImport
src/directives/**/*.ts        # 文件名转 kebab-case，需 default 导出
src/stores/**/*.ts            # AutoImport；与 core 同一 Pinia，persist 需显式声明
```

`pages/**/components/` 仍是页面私有。`In*` / `El*` 与 `useServerPaging`、`useAppStore` 等保留名会在构建期失败；与官方插件全局组件重名会在启动时失败。

admin 仍是 composition root，不复制官方插件页面；本部署专属扩展放约定目录。要跨 App 复用再升到 `plugins/`。

Store 不要再 `createPinia`。需要落盘时写 `persist: { storage, pick }`，键前缀来自 `VITE_APP_STORE_PREFIX`。

菜单 `view_path` 约定见 [菜单 view_path](./menu-view-path.md)。

## 构建、Docker 与 CI

```bash
pnpm build:packages
pnpm type-check:apps
pnpm --filter @ingot/admin-app test:unit
pnpm build:admin
pnpm preview:admin
```

admin 的 Docker / `proxy.conf` / GitLab job 仍负责默认后台部署。插件源码变化必须能触发 admin 构建：CI `changes` 包含 `plugins/**/*`。

浏览器 HTTPS 入口的 HTTP/2 由外层 TLS 代理负责。应用容器 `proxy.conf` 只配置到 `ingot-gateway` 的 HTTP/1.1 keepalive，镜像构建时执行 `nginx -t`。

插件由 App 构建时直接编译，根 `build` 仍是 packages → apps，不会给插件单独打 dist。
