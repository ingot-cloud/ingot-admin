# 管理台开发模式

本仓库把可运行应用、业务插件和公共模块分成三层。读完本文即可选择日常入口，不必翻历史 change。

## 三层职责

| 层 | 目录 | 职责 |
|----|------|------|
| App | `apps/` | 启动、环境、品牌、构建和部署。是 composition root。 |
| Plugin | `plugins/` | 完整业务纵向切片：页面、API、models、stores、组件和 `plugin.ts`。不可独立运行。 |
| Package | `packages/` | 无页面的公共抽象。不注册业务菜单或业务插件。 |

```text
apps ─────→ plugins ─────→ packages
  └──────────────────────→ packages
```

- 任何 plugin / package 都不得反向依赖 App。
- 官方业务插件默认互相独立，只依赖 packages。
- Package 依赖必须无环。
- 只有两个及以上插件实际使用的无页面能力才能进入 `admin-common`。

## 选择哪条路

1. **直接使用 `apps/admin`**：普通单后台、OA、运营后台或 C 端业务管理。这是默认入口。本部署专属页面/组件/hook 放 `apps/admin/src` 约定目录，不必手写注册。
2. **开发 `plugins/<name>`**：新增或修改可复用业务页面和 API。插件自己 type-check / lint / 单测，由 admin 编译运行。
3. **create-app 生成新 App**：需要独立 appCode、品牌、环境变量、构建产物或部署流水线时才创建。

不要为了“看起来像独立产品”再复制一套全插件后台。`apps/admin` 已经承担这个角色。

## 端到端工作流

```text
改插件源码 → 插件 type-check / 单测 → 在 admin 的 src/plugins.ts 注册
    → 同步 package.json 依赖 → 同步后端菜单 → pnpm dev:admin 或 build:admin
```

裁剪能力时必须同时：

1. 从 `apps/admin/src/plugins.ts` 删除 import 和数组项
2. 从 `apps/admin/package.json` 删除对应 plugin 依赖
3. 让后端应用 / OAuth Client 不再返回该插件菜单
4. 运行 `pnpm check:boundaries`

未选择的插件不应进入 Vite 模块图；若后端仍返回其菜单，页面会落到 plugin-unavailable 诊断页。

## 相关文档

- [插件开发](./plugin-development.md)
- [App 开发](./app-development.md)
- [运行时参考](./composable-admin-runtime.md)
- [菜单 view_path](./menu-view-path.md)
- [create-app](./create-app.md)
- [插件示例](../examples/admin-plugin/README.md)
