# admin-core 共享组件契约

本文件供业务页面迁移（`20260904-common-admin-ui-rollout`）使用。公开属性与插槽保持兼容，新增能力均为可选。Phase 05 起列表页必须显式选择滚动模式，不要再依赖 `.in-content-viewport` 作为页面滚动根。

| 组件 | 用途 | 主要新增/约定 | 兼容说明 |
|------|------|----------------|----------|
| `InPageFrame` | 页面高度、表面与滚动契约 | `mode: page \| contained`，`surface: plain \| workspace`；page 模式滑到底保留 `--in-page-gutter`；`#header` / `#tabs` / default | 新组件；普通页用 `page`，列表/双栏用 `contained` + `workspace` |
| `InPageHeader` | 页面标题区 | 约 80px、白底、底部分隔；`title` / `description`（`subtitle` 别名）/ `showBack` / `#action` / `#tabs` / `back` | 原 `#title`、`#action` 仍可用 |
| `InContainer` | 信息卡片/区块 | 默认 `plain` 透明无边框、直角；`variant="bordered"` 加边框；`radius` / `background` / `borderColor` / `borderWidth` 可覆盖 | `padding` / `showBacktop` / `getContentSize` 保留 |
| `InFilterContainer` | 筛选+主从布局 | 默认全高白底工作面、无边框直角；可覆盖 `background` / `borderColor` / `radius`；左栏 260→0px，19×32 折叠柄；`auto-collapse`（默认 true）+ `min-right-width`（默认 680）临时收起；`v-model:left-open` 只持久化手动桌面状态；`<1024` 覆盖层不写回桌面状态 | `header/left/top/default` 插槽名不变；`left-collapsible=false` 不出现折叠柄 |
| `InTable` | 列表 | 全高 flex：Meta/Tools/分页固定，数据区内 ElTable 唯一滚动；空态插图为 `no_data.svg`；`tools-start` / `tools-end`；`density: compact` 为 48/44 行高；不再内置刷新和字段设置 | 旧 `#toolbar` 映射到 `tools-start`；`refresh` emit 仅保留类型、不再触发；`hideSetting` 废弃无效果；`#actions` 仍是行操作列 |
| `InTableActions` | 行内/工具栏操作分层 | `actions` + `row` + `variant` + `selectedCount`；`priority` / `overflow` / `overflowGroup`；toolbar 按容器宽度原子收纳同组操作 | 新组件；不包含 API/Query；自定义 VNode 不自动搬移 |
| `InMenu` | 全局左侧导航 | 菜单滚动视口与底部「收起导航」控制为兄弟区域；滚动条隐藏；控制区上方 1px 分隔线并与按钮间隔 8px；图标固定 20px；带图标/无图标分色，选中叶子 `#2b2f36`；展开/收起图标为 `ic_expand` / `ic_close`；236/52px；收缩态无二级浮层 | 桌面折叠入口只在侧栏底部；`InMenuToggle` 仅 overlay |
| `InAppBar` | 全局顶栏 | 品牌(A) / 一级入口(B) / 搜索(C 靠右) / 操作(D)；B/D 按内容站位并限宽 560/360，空区不占位；默认 framed Logo 随 dark 切换 | 现有 `brand-extra`、`org-mgmt`、`product-settings`、`utilities` 仍可用；新增 `#nav`；`branding.logo` 可覆盖默认 Logo |
| `InColumnSetting` | 字段显示设置 | 32×32 描边按钮、约 213×426 复选列表、“全部”半选、必选列禁用、`user + tableId` 前端持久化、Esc/点击外部关闭并恢复焦点 | 继续发出 `onSelectionChange`；新增 `change`；可用 `headers` 别名；`table-id` 必填才持久化 |
| `InBizTabs` | 页内 Tab | 键盘方向键，懒挂载 `InBizTabPanel` | `v-model` + `change` |
| `InTabs` | 全局路由 Tab | 与页内 Tab 视觉分离，默认可关闭 | 行为不变 |
| `InDrawer` | 长任务编辑 | 中性标题、固定操作区、无装饰竖条 | `v-model`、`title`、`#header`/`#footer`、`loading` |
| `InDialog` | 短确认/小表单 | `description`、`tone: default \| danger` | `v-model`、`title`、`#footer` |
| `InButton` | 按钮 | `in-click` 为长期节流 API；原生 `click` 不节流 | `type`/`loading` 等继续透传 |

## 类型

```ts
type InDensity = "compact" | "default";
type InSurfaceVariant = "plain" | "bordered";
type InNavigationMode = "expanded" | "collapsed" | "overlay";
type InPageScrollMode = "page" | "contained";
type InPageSurface = "plain" | "workspace";
type InTableFeedback = "none" | "empty" | "no-result" | "error" | "unauthorized";
type InDialogTone = "default" | "danger";
type InTableActionKind = "detail" | "quick" | "default" | "danger";
type InTableActionOverflow = "auto" | "never" | "always";
```

`InTableAction`、`InAppBarUtilityAction` 同样从 `@ingot/admin-core` 导出。不要在业务插件反向定义这些类型。

## 列表页推荐结构

```text
InPageFrame mode="contained" surface="workspace"
  #header  InPageHeader
  InFilterContainer variant="plain" persistence-key
    #left  树/分组
    #top   筛选
    InTable table-id density="compact"
      #tools-start  筛选控件 + InColumnSetting
      #tools-end    InTableActions variant="toolbar"
      #actions      InTableActions
InDrawer / InDialog
```

普通 Overview/Settings/Detail 使用 `InPageFrame mode="page"`，由 PageBody 滚动；返回顶部只绑定该滚动区。

宽表格只在 `InTable` 数据区横向滚动。不要在页面容器上加 `overflow-x-hidden`。不要为了白底再套一层默认圆角 `InContainer`。

## 兼容迁移

- `--in-bg-color` / `--in-bg-color-page` / `--in-menu-show` / `--in-menu-hide` 仍可用，内部请改用 `canvas` / `sidebar` / `surface` / `sidebar-panel-*`。
- 容器默认直角无边框。`InContainer` 的 `plain` 背景透明；需要白底或描边时传 `background` / `borderColor`，或用 `variant="bordered"`。列表工作面继续用 `InFilterContainer`，不要为了白底再套一层默认圆角 `InContainer`。
- 未传 `table-id` 时列设置只在当前会话生效，不写 localStorage。
- `InTable` 不再自动渲染刷新和字段设置。旧 `#toolbar` 仍可用，请尽快改为 `#tools-start` / `#tools-end`。`refresh` 事件只为存量 `@refresh` 保类型，组件本身不会发出。
- `InTableActions` 的 `overflow: never` 始终直出；相同 `overflowGroup` 的 `auto` 操作整组进入 `…`。页面不要再按 `selectedCount` 隐藏批量组，未选中时应禁用并给出 `disabledReason`。
- 桌面侧栏折叠入口只在底部「收起导航 / 展开导航」；顶栏 `InMenuToggle` 仅窄屏 overlay 使用。
- 顶栏企业管理、产品设置仅在提供对应插槽时渲染，不显示死入口。组织切换在用户菜单中。
