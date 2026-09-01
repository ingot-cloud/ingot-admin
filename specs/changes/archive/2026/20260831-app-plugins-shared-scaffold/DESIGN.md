# 设计：App 插件化重组与脚手架可视化

## 技术方案

### App-as-plugin

`ingot-admin` 同时是可部署 App 与可依赖插件包：

1. 业务源码位于 `apps/ingot-admin/src`（pages/api/models/stores/biz components）。
2. `src/plugin.ts` 导出 `adminPlugin`（pages glob + 全局 Biz 组件）。
3. `main.ts`：`bootstrapAdminApp({ plugins: [adminPlugin], ... })`。
4. `target-project` 声明 `dependencies: { "ingot-admin": "workspace:*" }`，`plugins: [adminPlugin, targetPlugin]`。
5. `@ingot/vite-config` 为官方 App 插件配置 resolve/fs.allow，确保组合构建能编译依赖 App 的 Vue SFC 与 glob。

废弃 `@ingot/admin-base`：删除包并更新所有引用。

### @ingot/shared

新建 `packages/shared`：

```text
packages/shared/src/
  index.ts          # 聚合 utils 主导出
  crypto/           # 原 @ingot/crypto
  hooks/            # 原 @ingot/hooks
  ...utils modules
```

`exports`：`"."`、`"./crypto"`、`"./hooks"`。admin-core / login 改依赖并改 import。

### 静态 + 动态菜单

```text
staticMenus(app) + staticMenus(plugins)
        ↓ mergeMenuTrees（冲突报错）
backend UserMenuAPI menus
        ↓ mergeMenuTrees(static, dynamic)
transformMenu → addRoute → generateMenus
```

公共 403/404/500/init 仍仅走 `staticRoutes` 且 `hideMenu`，不进入 staticMenus。

### create-app Web UI

- `apps/create-app`：Vite 本地工具，调用仓库内 `scripts/lib/scaffold-app.mjs`。
- 生成逻辑与 CLI 共用；UI 负责收集表单与官方插件多选。
- 仅写入不存在的 `apps/<appCode>`。

## 对接映射

| 能力 | 位置 |
|------|------|
| adminPlugin | `apps/ingot-admin/src/plugin.ts` |
| shared | `packages/shared` |
| mergeMenuTrees | `packages/admin-core` |
| create-app UI | `apps/create-app` |

## 与 CONSTITUTION

- 跨 App 复用：壳与工具在 packages；业务页在 App，通过**插件依赖**组合而非复制。
- 单 SPA 部署：组合在构建期完成。

## 实现说明

- 仓库根 `package.json` 的 `name` 为 `@ingot/workspace`，与 App `ingot-admin` 区分，避免 pnpm `workspace:*` 链到仓库根。
- `@ingot/vite-config` 用正则 `/^@\//`、`/^@base/` 解析宿主与官方 App 源码；解析官方 App 根目录时拒绝 workspace 根，并回退到 `apps/<packageName>`。
