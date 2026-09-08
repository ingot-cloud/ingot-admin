# admin-core 共享组件契约

本文件供业务页面迁移（`20260904-common-admin-ui-rollout`）使用。公开属性与插槽保持兼容，新增能力均为可选。Phase 05 起列表页必须显式选择滚动模式，不要再依赖 `.in-content-viewport` 作为页面滚动根。

| 组件 | 用途 | 主要新增/约定 | 兼容说明 |
|------|------|----------------|----------|
| `InPageFrame` | 页面高度、表面与滚动契约 | `mode: page \| contained`，`surface: plain \| workspace`；page 模式滑到底保留 `--in-page-gutter`；`#header` / `#tabs` / default；`#tabs` 在滚动区外（与 header 一起钉住），页头紧挨 Tab 时去掉底边，只留 Tab 底部分隔 | 新组件；普通页用 `page`，列表/双栏用 `contained` + `workspace` |
| `InPageHeader` | 页面标题区 | 白底、底部分隔；有说明时约 80px，无说明时高度随主标题收缩、不预留副标题占位；未传 `title` 时使用当前路由 `meta.title`（侧栏菜单名）；主标题 16/24px、500、`#1f2329`；说明 14/22px、400、`#646a73`；超长单行省略；返回为 20×20 左箭头 SVG，右侧 16px 竖分隔线；`title` / `description`（`subtitle` 别名）/ `showBack` / `#action` / `back`；页级 Tab 用 `InPageFrame` `#tabs`，不要塞进本组件 | 原 `#title`、`#action`、`#tabs` 仍可用；自带 `#tabs` 时同样去掉页头底边 |
| `InContainer` | 信息卡片/区块 | 默认 `plain` 透明无边框、直角；`variant="bordered"` 加边框；`radius` / `background` / `borderColor` / `borderWidth` 可覆盖 | `padding` / `showBacktop` / `getContentSize` 保留 |
| `InSplitLayout` | 可选 header + 左右分栏工作面 | 默认全高白底工作面、无边框直角；可覆盖 `background` / `borderColor` / `radius`；左栏默认与容器同色，可用 `left-background` 单独覆盖；左栏 260→0px，分隔线中线 16×32 右侧圆角折叠标签（贴线向右伸出）；左栏默认 16px 内边距且子项不超出；`auto-collapse`（默认 true）+ `min-right-width`（默认 680）临时收起；`v-model:left-open` 只持久化手动桌面状态；`<1024` 覆盖层不写回桌面状态 | `header/left/top/default` 插槽名不变；`left-collapsible=false` 不出现折叠柄 |
| `InTree` | 左栏树 | 展开/收起三角与 `InTable` 树列相同：`table-expand-collapsed.svg` / `table-expand-expanded.svg`，叶子节点占位但不显示三角 | 仍透传 `ElTree` 属性与实例方法 |
| `InTable` | 列表 | 全高 flex：Meta/Tools/分页固定，数据区内 ElTable 唯一滚动；无数据加载用行骨架，不出现「暂无数据」；已有数据刷新用局部 loading；空态插图为 `no_data.svg`；`tools-start` / `tools-end`；`density: compact` 为 48/44 行高；表头 14px / 400 / `--in-table-header-text`；单元格正文 `--in-table-cell-text` 14px；`treeColumn` 在列内绘制展开三角 + 可选勾选 + 内容（部门树样式）；`checkbox` / `headerCheckbox` 三态 `on` / `off` / `disabled`（行可函数，表头启用勾选时默认 `on`）；`type: selection` 表头仍默认 `off`，需 `headerCheckbox: true` / `"on"` / `"disabled"`；勾选框 16×16、4px 圆角与勾选 SVG；不再内置刷新和字段设置；`#title` 内 `.in-table__count` 使用 summary 次要正文样式，与标题间隔 12px | 旧 `#toolbar` 映射到 `tools-start`；`refresh` emit 仅保留类型、不再触发；`hideSetting` 废弃无效果；`#actions` 仍是行操作列；`customTree` 仍可只藏默认缩进，优先改用 `treeColumn` |
| `InTableActions` | 行内/工具栏操作分层 | `actions` + `row` + `variant` + `selectedCount`；可选 `icon`；`kind: primary` 描边主色、`danger` 描边危险色、`quick` 工具栏实心主操作；`priority` / `overflow` / `overflowGroup`；toolbar 按容器宽度原子收纳同组操作；更多在固定操作左侧，工具栏为竖向三点、行内为横向三点，默认悬停弹出；更多菜单打开不预选，hover 灰底圆角且与容器留间隔 | 新组件；不包含 API/Query；自定义 VNode 不自动搬移 |
| `InMenu` | 全局左侧导航 | 菜单滚动视口与底部「收起导航」控制为兄弟区域；滚动条隐藏；控制区上方 1px 分隔线并与按钮间隔 8px；图标固定 20px；带图标/无图标分色，选中叶子 `#2b2f36`；展开/收起图标为 `ic_expand` / `ic_close`；236/52px；收缩态无二级浮层 | 桌面折叠入口只在侧栏底部；`InMenuToggle` 仅 overlay |
| `InAppBar` | 全局顶栏 | 品牌(A) / 一级入口(B) / 搜索(C 靠右) / 操作(D)；B/D 按内容站位并限宽 560/360，空区不占位；默认 framed Logo 随 dark 切换 | 现有 `brand-extra`、`org-mgmt`、`product-settings`、`utilities` 仍可用；新增 `#nav`；`branding.logo` 可覆盖默认 Logo |
| `InPicker` | 紧凑单选（筛选/工具栏） | 可选 `label` 前缀；32px / 6px 圆角；默认边框 `#d0d3d6`，悬停/展开 `#3370ff`；展开后面板勾选当前项；相邻实例默认 12px 间距；`v-model` + `options` + `change` | 新组件；不替代表单 `InSelect` |
| `InFilterPanel` | 工具栏筛选浮层 | 32px 描边按钮，文案「筛选」、`aria-label="筛选条件"`；`active-count` 控制数量角标；`#default` 放额外条件，`#footer` 可放重置；Teleport 贴按钮下方；Esc / 点击外部关闭（忽略 `el-popper` / `InPicker` 菜单） | 新组件；不要叫「更多」；不要对话框或抽屉 |
| `InTableColumnSetting` | 字段显示设置 | 32×32 描边按钮、表格设置 SVG、说明「请选择列表中要展示的信息」、约 213×426 复选列表、“全部”半选、必选列禁用、右侧拖拽调序、浮层 Teleport 到 body、`user + tableId` 前端持久化、Esc/点击外部关闭并恢复焦点 | 原名 `InColumnSetting`；继续发出 `onSelectionChange`；新增 `change`；可用 `headers` 别名；`table-id` 必填才持久化；`change` 按显示顺序返回选中列；持久化前缀仍为 `in-column-setting` |
| `InBizTabs` | 页内 Tab | 16px；默认 `--in-text-color`，选中 `--in-color-primary`；墨条跟文案同宽、顶部圆角、半条压线；`before-change` 可拦截 | `v-model` + `change`；键盘方向键；懒挂载 `InBizTabPanel` |
| `InTabs` | 全局路由 Tab | 与页内 Tab 视觉分离，默认可关闭 | 行为不变 |
| `InDrawer` | 长任务编辑 | 中性标题、固定操作区、无装饰竖条；`layout="pinned"` 钉住内容头、仅内部滚动 | `v-model`、`title`、`#header`/`#footer`、`loading`；默认 `layout="default"` |
| `InDetailDrawer` | 实体详情查看/编辑 | 标题 + `#identity` + 页内 Tab；查看态底部「编辑…」，编辑态取消/保存；编辑中关抽屉或切 Tab 需确认 | `v-model`、`v-model:tab`、`v-model:editing`、`edit-label`、`save` / `cancel` / `edit` |
| `InDetailIdentity` | 详情身份区 | 大号头像、姓名、`#status`、右侧 `#more`；`editable` 时悬停头像上传；无头像实体固定 `src` 且 `editable=false`；`#more` 下拉用 `.in-dropdown`：无箭头、无分割线、6px 圆角、`--in-shadow-overlay` | `name` / `src` / `v-model:avatar` / `upload-dir` |
| `InDescriptionList` | 只读字段列表 | 上标签下值；空值 `-` | `InDescriptionItem` 的 `label` + `value` |
| `InDialog` | 短确认/小表单 | `description`、`tone: default \| danger`；标题左侧 `#icon`；`showClose` 控制右上角关闭；`align-center` 全屏居中 | `v-model`、`title`、`#footer`、`#header` |
| `InAvatar` | 姓名/头像 | 默认 32px；`size="lg"` 为 48px；无图时用姓名最后两字；`showAvatar` 默认 true；`showName` 默认 true；可用 `color` 覆盖；`src` / `avatar` 别名 | 新组件 |
| `InCommonStatusTag` | 公共状态 | 只根据 `status`；正常：蓝底成功图标；暂停：橙底暂停图标，文案「已暂停」；按内容撑开不截断 | 不再使用 Element Plus Tag 的 success/danger 色 |
| `InAccountStatusTag` | 账号可用与锁定 | `enabled === true && locked === false` 为正常；`enabled === false` 为已暂停；否则已锁定（`#f54a45`） | 用于通讯录成员、平台管理员用户、会员用户列表 |

## 类型

```ts
type InDensity = "compact" | "default";
type InSurfaceVariant = "plain" | "bordered";
type InNavigationMode = "expanded" | "collapsed" | "overlay";
type InPageScrollMode = "page" | "contained";
type InPageSurface = "plain" | "workspace";
type InTableFeedback = "none" | "empty" | "no-result" | "error" | "unauthorized";
type InDialogTone = "default" | "danger";
type InDrawerLayout = "default" | "pinned";
type InAvatarSize = "default" | "lg" | number;
type InTableCheckboxMode = "on" | "off" | "disabled";
type InTableActionKind = "detail" | "quick" | "default" | "danger" | "primary";
type InTableActionOverflow = "auto" | "never" | "always";
```

`InTableAction`、`InAppBarUtilityAction` 同样从 `@ingot/admin-core` 导出。不要在业务插件反向定义这些类型。

## 列表页推荐结构

```text
InPageFrame mode="contained" surface="workspace"
  #header  InPageHeader
  InSplitLayout variant="plain" persistence-key
    #left  树/分组
    #top   仅左树/作用域上下文（可选）
    InTable table-id density="compact"
      #tools-start  无 label 查询 + 可选 InPicker + 可选 InFilterPanel + InTableColumnSetting
      #tools-end    InTableActions variant="toolbar"
      #actions      InTableActions
InDrawer / InDetailDrawer / InDialog
```

树表（部门管理同款）：`tree-column` 指定名称列；`checkbox` 控制行勾选，`header-checkbox` 控制表头全选，取值 `on`（默认打开）/ `off`（不显示）/ `disabled`（显示禁用）。根节点不勾选、不展开时：

```text
InTable tree-column="name" :checkbox="(row) => row.root ? 'off' : 'on'" :tree-expand="(row) => !row.root"
  @selection-change
```

实体详情抽屉标准：

```text
InDetailDrawer title edit-label v-model:editing
  #identity  InDetailIdentity + 状态 + 更多操作
  InBizTabPanel
    查看：InDescriptionList
    编辑：表单
```

`useDetailEditSession` 管理 `editing` / 快照回滚，离开确认走公共 `Confirm`（`in-confirm-dialog`），文案固定为「确定退出当前编辑？」，并关闭右上角关闭按钮。查看/编辑字段顺序必须一致。成员编辑态头像在身份区悬停上传，不要在表单里再放头像项。部门详情使用 `deptDrawerHeaderAvatar`，且 `editable=false`。创建表单仍用普通 `InDrawer`，不要套查看态。

公共确认框（`Confirm.warning` / `useMessageConfirm` / `openConfirmDialog`）统一白底 8px 圆角、视口居中。第一参是说明或自定义 VNode；`title`、`icon`（组件 / VNode / `false` 隐藏）、`showClose` 可配。默认警告图标、显示关闭按钮。

全局 Toast 使用 `Message.success` / `warning` / `error`（`import { Message } from "@ingot/admin-core"`）。不要依赖 auto-import 类名；composable 场景可用已注入的 `useMessage()`。样式由封装统一加 `.in-message`：最小 204×54、语义色描边与浅底、正文 `--in-text-color`。不要在业务页覆盖 toast 宽高。

普通 Overview/Settings/Detail 使用 `InPageFrame mode="page"`，由 PageBody 滚动；返回顶部只绑定该滚动区。Settings / Detail 的页内 Tab 放 `InPageFrame` `#tabs`（header 与 tabs 都不进滚动区，滚动时仍钉住），不要放进 `InPageHeader`，也不要放进 default 以免丢掉钉住。

```text
InPageFrame mode="page"
  #header  InPageHeader  (#action 可选)
  #tabs    InBizTabsHeader
  面板内容
```

宽表格只在 `InTable` 数据区横向滚动。不要在页面容器上加 `overflow-x-hidden`。不要为了白底再套一层默认圆角 `InContainer`。

## 兼容迁移

- `--in-bg-color` / `--in-bg-color-page` / `--in-menu-show` / `--in-menu-hide` 仍可用，内部请改用 `canvas` / `sidebar` / `surface` / `sidebar-panel-*`。
- 容器默认直角无边框。`InContainer` 的 `plain` 背景透明；需要白底或描边时传 `background` / `borderColor`，或用 `variant="bordered"`。列表工作面继续用 `InSplitLayout`，不要为了白底再套一层默认圆角 `InContainer`。
- 未传 `table-id` 时列设置只在当前会话生效，不写 localStorage。
- `InTable` 不再自动渲染刷新和字段设置。旧 `#toolbar` 仍可用，请尽快改为 `#tools-start` / `#tools-end`。`refresh` 事件只为存量 `@refresh` 保类型，组件本身不会发出。
- `InTableActions` 的 `overflow: never` 始终直出；相同 `overflowGroup` 的 `auto` 操作整组进入 `…`。页面不要再按 `selectedCount` 隐藏批量组，未选中时应禁用并给出 `disabledReason`。工具栏主操作可用 `icon`；描边主色用 `kind: "primary"`，实心主色用 `kind: "quick"`，描边危险色用 `kind: "danger"`。更多菜单打开不预选第一项，hover 才出现圆角灰底并与容器留间隔。
- 桌面侧栏折叠入口只在底部「收起导航 / 展开导航」；顶栏 `InMenuToggle` 仅窄屏 overlay 使用。
- 顶栏企业管理、产品设置仅在提供对应插槽时渲染，不显示死入口。组织切换在用户菜单中。
