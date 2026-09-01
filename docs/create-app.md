# 可视化脚手架 create-app

`apps/create-app` 是**仅限本地**的 Web 工具，用来勾选官方插件并生成新的后台 App。不要部署到公网。

## 启动

```bash
pnpm create:app
# 或
pnpm --filter create-app dev
```

浏览器打开 `http://127.0.0.1:5801`。

命令行等价入口：

```bash
pnpm create:app:cli
pnpm create:app:cli acme-admin
```

生成逻辑与 UI 共用 `scripts/lib/scaffold-app.mjs`，模板在 `scripts/templates/admin-app`。

## 表单字段

| 字段 | 说明 |
|------|------|
| App 编码 | kebab-case，写入 `apps/<appCode>` |
| 标题 | `VITE_APP_TITLE`，默认与编码相同 |
| 开发端口 | 写入 Vite `server.port` 与登录回调 URI |
| 官方插件 | 多选。首期：`ingot-admin`；`ingot-ops` 占位且不可选 |
| 本地插件骨架 | 是否生成 `targetPlugin` + Demo 页 + 示例 `staticMenus` |

## 安全

- 只允许写到仓库 `apps/` 下**尚不存在**的目录
- 已有 App 会被拒绝，不会覆盖

## 生成后

```bash
pnpm install
pnpm --filter <appCode> dev
```

入口示例（勾选 `ingot-admin` 且生成本地插件时）：

```ts
import { adminPlugin } from "@ingot/admin-app/plugin";
import { targetPlugin } from "./plugins/targetPlugin";

await bootstrapAdminApp({
  appCode: "acme-admin",
  plugins: [adminPlugin, targetPlugin],
  // ...
});
```

插件运行时与菜单约定见 [composable-admin-runtime.md](./composable-admin-runtime.md)。
