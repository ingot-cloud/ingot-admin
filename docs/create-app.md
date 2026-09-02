# 可视化脚手架 create-app

`apps/create-app` 是**仅限本地**的 Web 工具，用来创建需要独立运行和部署的后台 App。不要部署到公网。

普通单后台项目请直接使用 `apps/admin`。只有独立 appCode、品牌、环境、构建或部署需求时才创建新 App。

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
| 官方插件 | 多选四个 `@ingot/*-plugin`，**默认全选**，可全部取消 |
| 本地插件骨架 | 是否生成 App 私有 `targetPlugin` + Demo 页 + 示例 `staticMenus` |

## 生成结果

- `src/main.ts`：bootstrap，`appCode` 读取 `VITE_APP_CODE`
- `src/plugins.ts`：集中插件清单，与 `package.json` 依赖一致
- 环境、Vite/TS、Docker 与代理配置
- 可选的 App 私有插件骨架

## 安全

- 只允许写到仓库 `apps/` 下**尚不存在**的目录
- 已有 App 会被拒绝，不会覆盖

## 生成后

```bash
pnpm install
pnpm --filter <appCode> dev
```

入口示例（默认全选且生成本地插件时）：

```ts
import type { InAdminPlugin } from "@ingot/admin-core";
import { platformPlugin } from "@ingot/platform-plugin";
import { securityPlugin } from "@ingot/security-plugin";
import { orgPlugin } from "@ingot/org-plugin";
import { memberPlugin } from "@ingot/member-plugin";
import { targetPlugin } from "./plugins/targetPlugin";

export const appPlugins: InAdminPlugin[] = [
  platformPlugin,
  securityPlugin,
  orgPlugin,
  memberPlugin,
  targetPlugin,
];
```

本地插件默认 `dependsOn: ["ingot-admin-core"]`。更多约定见 [App 开发](./app-development.md) 与 [运行时](./composable-admin-runtime.md)。
