# App 开发

App 只负责启动和部署。默认通用后台是 `apps/admin`。

## 直接使用 admin 还是 create-app

使用 `apps/admin`（租户）或 `apps/admin-platform`（平台），如果：

- 需要官方 IAM 租户后台或平台后台
- 可以接受默认 `VITE_APP_CODE=ingot-admin` / `ingot-platform-admin`
- 官方插件在此基础上裁剪即可

使用 create-app，如果需要：

- 独立 appCode
- 独立品牌、Cookie / Store 前缀
- 独立构建产物、Docker 或 CI 流水线

## Bootstrap

`apps/admin` 与 `apps/admin-platform` 是两个 composition root，各自 `src/main.ts` 读取 runtime 并调用 `bootstrapAdminApp`。必须同时引入 `@ingot/admin-core/style.css` 和 `uno.css`。

- 租户 `apps/admin`：端口 `5798`，插件 `org` + `security`，`VITE_APP_CODE=ingot-admin`，`VITE_APP_ID=tenant-admin`
- 平台 `apps/admin-platform`：端口 `5799`，插件 `platform` + `security`，`VITE_APP_CODE=ingot-platform-admin`，`VITE_APP_ID=platform-admin`

`VITE_APP_CODE` 只做前端应用编码（本地页面/布局前缀）。`VITE_APP_ID` 是 BFF/Nacos 注册键，二者不要写成同一个值。Member 不默认打进这两份 IAM 构建。

```ts
export const createAdminPlugins = (appCode: string): InAdminPlugin[] => [
  securityPlugin,
  orgPlugin,
  createAppLocalPlugin(appCode),
];
```

跳转登录只走本站 `/auth/start`，由 BFF 按 Host 注入的 appId 读 Nacos 回跳。

## 裁剪插件

必须同步修改：

1. 对应 App 的 `src/plugins.ts` 的 import 和数组
2. `package.json` 的 plugin dependency
3. 后端应用 / OAuth Client 菜单
4. `pnpm check:boundaries`

未选择插件不会进入 `optimizeDeps`、页面注册表和构建模块图。若后端仍下发其菜单，会显示 plugin-unavailable 诊断页。

## 环境与品牌

常用变量：

- `VITE_APP_CODE`（前端应用编码）、`VITE_APP_ID`（BFF appId，与 CODE 分开）
- `VITE_APP_TITLE`、`VITE_APP_SYMBOL`
- `VITE_APP_AUTH_ENTRY`、`VITE_APP_EXPECTED_DOMAIN`
- `VITE_APP_STORE_PREFIX`、`VITE_APP_COOKIE_DOMAIN`
- `VITE_APP_NET_BASE_URL` 与超时
- 布局开关：`VITE_APP_SETTINGS_*`

登录应用是独立的 `apps/auth`（租户，:1798）和 `apps/auth-platform`（平台，:1799），不属于管理台插件体系，也不接入管理台主题协议。

更换主题见 [主题开发](./theme-development.md)。顶栏五区配置见 [顶栏 APP 配置](./app-header.md)。图标与内网 Iconify 打包见 [图标](./icons.md)。

网络请求、App 追加拦截器与 `useServerPaging` 见 [网络请求](./network.md)。

## App 约定本地插件

每个管理台 App（`apps/admin`、`apps/admin-platform`）都有一份冻结的 `src/app-plugin.ts`，用 glob 扫描约定目录。新增文件不必改注册逻辑。

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
