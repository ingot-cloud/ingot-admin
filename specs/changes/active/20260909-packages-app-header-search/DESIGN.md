# 设计：顶栏菜单搜索（本地路由第一版）

## 技术方案

第一版不接后端。检索 `useRouterStore().getMenus`：动态菜单来自 `UserMenuAPI`（已按权限裁剪），与插件 `staticMenus` 合并，经 `generateMenus` 去掉 `hideMenu` 后与侧栏同源。公共 403/404/init 等带 `meta.hideMenu`，不会进入搜索。

若某页只要路由不要搜索，应设 `hidden` / `hideMenu`，不要事后从 `getRoutes()` 剔除。

### 扁平与过滤

纯函数放在 `packages/admin-core/src/layouts/widgets/search/`：

- `flattenMenus`：递归取叶子（无 children 或 children 为空），须有 `path` 与非空 `title`；保留祖先 `title` 链与叶子 `icon`。
- `filterMenusByName`：trim 后大小写不敏感，匹配叶子 `title` 或任一祖先 `title`。空关键词返回空列表。

选中后 `router.push(path)`。

### 交互

- 宽屏：输入框直出。聚焦或点击输入框打开下方面板，宽度对齐输入框。`--in-app-bar-search-width` 调整为 `400px`，以容纳三列历史胶囊。
- 面板在宽屏 Teleport 到 `body` 并 `position: fixed`，避免 shell `overflow: hidden` 裁切。`InAppBarSearchPane` 只负责紧凑图标入口与 Teleport，不与宽屏面板抢焦点。
- 紧凑：现有图标按钮打开浮层；浮层内挂同一 `InAppBarSearch` 实例，面板改为内联展开；打开后聚焦输入。选中菜单后关闭浮层。
- 空关键词：搜索历史（若有）+ 常用列表；无常用时展示空态占位，避免面板中段空白。
- 有关键词：先展示 loading（本地检索 debounce 约 240ms），完成后展示「功能」匹配列表。不做高级搜索、「应用」分区、⌘+Shift+F。脚底仍为 `↑↓ 移动光标 | Enter 选择条目`。
- 常用来自 `header.search.shortcuts`（`key` / `label` / `path`，可选 `icon`、`description`、`visible`）。省略或空数组走占位。↑↓ / Enter 在空关键词时操作常用项，历史胶囊仍为点击填入。
- Escape / 点击外部关闭。空查询不跳转。
- 自定义 `header.search.component` 仍整区替换，不绑定本次默认面板。

### 搜索历史

Pinia setup store `header.search`，`persist.storage = localStorage`，`pick` 按用户分桶的历史表。

- 用户键优先 `useUserInfoStore` 的 `phone`，其次 `email`，否则 `anonymous`。
- 选中菜单后，将当前输入 trim 非空关键词插入该用户列表头部，去重，上限 10。
- 无历史时隐藏整块（含清空按钮）。
- 清空只删当前用户分桶。

### 视觉

- 历史标题：`color: var(--in-text-color-placeholder)`，14/22px、字重 400，沿用全局字体。
- 清空图标：将 DeleteTrashOutlined 收入 `packages/admin-core/src/assets/icons/`，`InIcon` 使用 `ingot:delete-trash-outlined`。
- 胶囊：背景 `var(--in-gray-100)`，圆角 43px，高 30px，`padding: 4px 16px`，`max-width: calc(33.333% - 8px)`；hover `var(--in-bg-color-control-hover)`。点击填入关键词并立刻过滤。
- 常用与结果共用卡片：外层 flex、圆角 8px、间距 12px、`padding: 8px 24px 8px 8px`；悬停/高亮背景 `var(--in-bg-color-control-hover)`。图标容器 40×40、圆角 8px、浅底；图标 24×24。标题 14/22px、字重 500；次级路径 12/20px、`var(--in-text-color-secondary)`。匹配字用 `var(--in-color-primary)`。
- 结果区分组标题「功能」，样式同历史标题。
- 脚底：高 36px，`background: var(--in-bg-color-muted)`，`color: var(--in-text-color-secondary)`，12/20px，左右 20px；相对面板 padding 拉满。文案 ellipsis + `white-space: pre`。

## 对接映射

本期无后端接口，不创建 API.md。

| 数据 | 前端 | 说明 |
|------|------|------|
| 侧栏菜单 | `useRouterStore().getMenus` | 已有，不新增 API |
| 搜索历史 | `useHeaderSearchStore` | localStorage persist |

## 数据模型

- `FlattenedMenuItem`：`path`、`title`、可选 `icon`、`ancestors: string[]`
- `InAdminHeaderSearchShortcut`：常用入口，解析后为 `key`、`label`、`path`、可选 `icon` / `description`
- 历史：`Record<userKey, string[]>`

## 组件与页面影响

- `InAppBarSearch.vue`：输入、面板、键盘与跳转。
- `InAppBarSearchPane.vue`：紧凑 Teleport；打开后聚焦默认搜索实例；监听选中关闭浮层。
- Store：`packages/admin-core/src/stores/modules/headerSearch.ts`，从 admin-core 入口导出。
- Token：`--in-app-bar-search-width: 400px`。
- 文档：`docs/app-header.md` 写明数据源与非范围。
- 无新页面、无页面四件套。

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| 三层边界与共享抽象 | ✅ | 能力放在 `packages/admin-core`，APP 不复制 |
| 类型与组件规范 | ✅ | script setup、strict、无 any |
| 样式与响应式 | ✅ | Token + UnoCSS/PostCSS，紧凑与宽屏两套展示 |
| 规格门禁 | ✅ | 独立 change，用户确认计划后 implementing；不改 current |
| 单一真相 | ✅ | 无 API.md；实施期间不更新 current |

## 备选方案

- 扫描 `router.getRoutes()`：会命中公共静态路由，否决。
- 并入 `20260908-packages-app-header`：该变更明确排除全局搜索服务，否决。

## 开放问题

无。
