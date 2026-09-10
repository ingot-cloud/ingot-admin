# 开发者中心与创建工具

`apps/dev-portal`（包名 `@ingot/dev-portal`）是 **Ingot 开发者中心**：中文文档、组件演示，以及本地创建 App / 插件 / 主题的向导。静态构建可部署；写入仓库仅在本地 `pnpm dev:portal` 时启用。

普通单后台项目请直接使用 `apps/admin`。

## 启动

```bash
pnpm create:app
# 或
pnpm dev:portal
# 兼容
pnpm dev:create-app
```

浏览器打开 `http://127.0.0.1:5801`。

```bash
pnpm create:plugin          # 打开插件向导
pnpm create:theme           # 打开主题向导
pnpm create:app:cli         # App CLI，保留旧参数与交互
pnpm create:plugin:cli
pnpm create:theme:cli
pnpm create:app:cli --config ./app.json --dry-run
```

生成逻辑与 UI 共用 `scripts/lib/scaffold/`，模板在 `scripts/templates/`。

## 安全

- 只允许写到当前仓库 `apps/`、`plugins/`、`themes/` 下尚不存在的目录
- 拒绝覆盖、符号链接绕过和路径逃逸
- 静态站点不会调用本地写入 API

更多约定见 [App 开发](./app-development.md)、[插件开发](./plugin-development.md) 与 [主题开发](./theme-development.md)。
