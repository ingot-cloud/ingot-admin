# 设计：管理台 UI 基础设施

## 技术方案

继续使用“语义 Token → Element Plus 映射 → admin-core 共享组件 → 业务页面”的单向设计系统链路。Phase 01–05 已完成的 Token、壳层、基础组件和验证记录保留。Phase 06 已完成成员内容工作区施工；2026-09-05 新增 Phase 07，单独处理全局左侧导航差异，不回写已完成的 Phase 02 或 Phase 06 任务。

本轮 Phase 06 只处理飞书“成员”页面红框内容工作区对应的两个核心组件：

- InSplitLayout：固定 header、260px 左侧部门栏、分隔线折叠按钮、窄宽度自动收起和左右滚动边界。
- InTable：标题/摘要、可组合 tools、移除刷新、按需字段设置、自适应操作收纳、紧凑表格、固定操作列和分页。

新增 Phase 07 只处理主布局左侧导航：

- `layout.main`：侧栏外层占位、画布沟槽、桌面收缩态和窄屏 overlay 协调。
- `InMenu`：菜单滚动视口、固定底部控制、收缩文案、宽度动画和焦点语义。
- `InSubmenu`：40px 菜单行、层级缩进、活动/悬浮态、收缩态内容裁剪和原路由语义。

## 浏览器复核结论

在用户授权账号中，以 1280×720 视口复核成员页面；同时使用 1000、960、920、900、880、800px 临时视口检查响应行为。

| 区域          | 实测结果                                                               |
| ------------- | ---------------------------------------------------------------------- |
| 内容工作区    | 1200px 宽、白色、无外层圆角和阴影                                      |
| 工作区 header | 79px，白底，内边距 12px 20px                                           |
| SplitBody     | 539px 高；左栏 260px，右栏 940px                                       |
| 左栏          | 默认与容器同色；搜索框 32px、圆角 6px、边框 #d0d3d6                    |
| 左树行        | 40px；选中背景 #f0f4ff，文字 #3370ff                                   |
| 折叠柄        | 16×32px 右侧圆角标签，贴分隔线向右伸出，无左边框，与分割线融合         |
| 折叠结果      | 左栏直接变为 0，右栏扩展到工作区全宽，箭头旋转 180°                    |
| 右侧内边距    | 20px                                                                   |
| 右侧标题行    | 24px；标题、总数摘要同一行                                             |
| 工具栏        | 32px；与标题行、表格各间隔 20px；工具间距 12px                         |
| 表头          | 48px、#f2f3f5、文字 #3f4f66、水平内边距 12px                           |
| 数据行        | 44px、底部分隔 #dee0e3                                                 |
| 操作列        | 固定右侧；“详情”文字按钮 + “…”                                         |
| 窄工具栏操作  | 32px“…” + 98px“邀请成员” + 98px“添加成员”；组宽约 252px                |
| 宽工具栏操作  | 离职 108px + 变更部门 108px + 导入/导出 112px + 邀请 + 添加，间距 12px |
| 批量更多菜单  | 约 112×114px；菜单项 30px；顺序为导入/导出、变更部门、操作离职         |
| 字段设置      | 32px 图标按钮；浮层约 213×426px、圆角 8px                              |
| 分页          | 28px，位于内容区右下角，不随表格数据滚动                               |

飞书成员页在约 900px 视口下自动隐藏左栏，在 920px 下仍显示；该行为是 viewport/media query 驱动。Ingot 使用容器可用宽度和最小右栏宽度计算，避免组件嵌在抽屉、Tab 或窄父容器时判断错误。

复测确认“邀请成员”“添加成员”是始终直接显示的固定操作，不进入更多菜单。三个批量操作组成原子折叠组：右侧空间不足时整组替换为固定操作左侧的“…”；空间足够时“…”消失，三个批量按钮一次性全部展开，不采用逐个按钮收纳。展开左侧部门栏时可触发窄状态，收起部门栏扩大右侧空间后可触发宽状态；算法仍应按工具栏容器实际宽度计算，不能把某个页面视口宽度写死为断点。

“…”已验证支持点击打开；规范要求同时支持 Enter/Space，hover 只提供视觉反馈，不把悬停设为唯一打开方式。菜单内“批量导入/导出”可直接使用，“批量变更部门”“批量操作离职”在未选择成员时保持可见但禁用。

## Phase 07 浏览器复核：全局左侧导航

在用户授权账号中，以 1280×720 为基准视口，并临时切换至 1440×900 和 1280×500 验证尺寸、收缩和长菜单滚动。测量坐标均以全局顶栏下方 `y = 56px` 为侧栏起点。

| 项目 | 飞书实测结果 |
| ---- | ------------ |
| 外层占位 | 展开 244px、收起 60px；由 8px 左画布沟槽 + 236px / 52px 面板组成 |
| 面板 | 高度占满顶栏以下视口；背景与页面画布同为 `#f5f5f5`，无常驻右边框或阴影 |
| 菜单视口 | 位于面板顶部；1280×720 时高 594px，短视口下独立 `overflow-y: auto` |
| 菜单内容 | 顶部 12px；菜单行 40px，相邻行 2px；展开态行宽 236px，收起态 52px |
| 文字层级 | 14/20px、400；带图标 `#646a73`，无图标 `#1f2329`；一级文字对齐图标后，二级与一级文字对齐，再下级缩进 20px |
| 活动态 | `rgba(31,35,41,.05)` 背景、8px 圆角、`#2b2f36`、500；只作用在当前叶子，不点亮父级分组 |
| hover | `rgba(31,35,41,.06)` 背景、8px 圆角；不改变菜单占位 |
| 收缩态 | 仅一级 20px 图标和一级活动底色可见；标签、徽标、箭头、子级内容均裁剪 |
| 收缩交互 | 700ms hover 未出现二级浮层；点击含子级的分组图标不临时展开侧栏，也不改变当前路由 |
| 底部控制 | 236px / 52px × 44px，距窗口底部 8px；展开态文案“收起导航” |
| 控制内容 | 左右内边距 8px；20px 图标，文案 14/20px、400、`#646a73` |
| 控制 hover | `rgba(31,35,41,.08)` 背景、6px 圆角；默认透明；控制区上方 1px `#dee0e3` 分隔线，线与按钮间距 8px |
| 菜单文案 | 菜单项与底部控制文案均 `user-select: none`，不可拖选复制 |
| 动效 | 面板 `all 300ms cubic-bezier(.25,.1,.05,1)`；实现只允许宽度/位移参与动画 |

在 1280×500 短视口中，菜单视口由 374px 内容高度产生 600px 滚动高度；滚动前后 `scrollTop` 从 0 变为 226，而底部控制始终位于 `y = 448px`、距窗口底部 8px。这是 Phase 07 的核心滚动验收，不以整页截图相似替代。

## Phase 07 侧栏结构

    MainWorkspace (height: calc(100vh - 56px), overflow: hidden)
    ├── SidebarSlot (244px / 60px)
    │   └── NavigationPanel (236px / 52px, margin-left: 8px)
    │       ├── MenuScrollViewport (min-height: 0, overflow-y: auto)
    │       │   └── MenuContent (padding-top: 12px)
    │       ├── FooterClearance (18px)
    │       ├── FooterDivider (1px)
    │       ├── DividerGap (8px)
    │       └── NavigationControl (44px, margin-bottom: 8px)
    └── MainContent (min-width: 0)

### 滚动所有权

- `InMenu` 是全高纵向容器；`MenuScrollViewport` 与 `NavigationControl` 必须是 DOM 兄弟。
- `ElScrollbar` 只包裹菜单内容，禁止把 `NavigationControl` 放进默认插槽或通过 `position: sticky` 补救。菜单滚动条隐藏，仍可用滚轮/触控板滚动。
- 控制区使用不参与收缩的固定行；可使用 `grid-template-rows: minmax(0, 1fr) 18px 44px 8px`，或等价的 `flex + absolute`，但最终几何和滚动所有权必须一致。
- `NavigationPanel` 自身 `overflow: hidden`，只允许菜单视口拥有纵向滚动；收缩态文本裁剪不得制造页面横向滚动。

### 展开、收起与状态

- 桌面展开/收起延续 `useAppStateStore().getMenuOpened` 的持久化状态，不改变菜单数据和 active path 计算。
- 面板宽度 236px / 52px，外层占位同步为 244px / 60px；二者使用同一个 300ms Token 和同一 easing，避免内容区与面板错位。
- 展开态按钮显示 20px `ic_close` 和“收起导航”；收起态仅显示 20px `ic_expand`，`aria-label` 为“展开导航”。现有“收起菜单/展开菜单”文案统一替换。
- 收缩期间保留当前一级活动底色；标签、徽标、子级箭头和子级列表在动画开始时进入不可交互状态，避免裁剪文本仍可聚焦。
- 飞书实测未出现收缩态子菜单浮层，Phase 07 不使用 Element Plus 默认 collapse popper；带子级的分组图标不触发临时展开，完整层级通过固定底部控制恢复。
- 小于 1024px 的 overlay 是独立模式：固定控制文案改为“关闭导航”，Escape、遮罩点击和按钮关闭行为保持；overlay 始终以 236px 完整导航呈现，不套 52px 桌面收缩态。

### 菜单项与层级

- 所有一级链接、分组标题和子级链接统一为 40px 行高、2px 垂直节奏和 8px 圆角点击面。
- 一级图标固定 20px（展开/收起相同），图标中心位于面板左侧 26px；带图标项文字起点 44px。无图标的下一级文字与上级文字起点对齐，再下级每次增加 `--in-menu-nested-indent`（20px）。
- 带图标文字 `#646a73`、400；无图标文字 `#1f2329`、400、同一字号行高；当前叶子活动项 `#2b2f36`、500。以上均使用 `--in-menu-*` Token，便于主题覆盖。hover/active 背景分别使用 `.06` / `.05` 中性黑透明度。
- 多级展开状态延续菜单本身的交互；不得因路由切换重建整棵菜单。Phase 07 不修改动态菜单结构、权限过滤、redirect 或 canonical viewPath。
- 收缩态的一级叶子仍可导航；纯分组保持当前路由。图标按钮和折叠控制提供可访问名称及 `focus-visible`，键盘焦点不得进入已裁剪的子级节点。

### 固定底部控制

- 控制区宽度跟随面板、高 44px、距底部 8px，与菜单视口之间保持 18px 清空区。
- 图标和文字之间 12px；展开态内容左对齐，控制图标与一级菜单图标共用 `--in-menu-base-level-padding`（16px）；收起态图标水平居中。
- 默认背景透明；控制区上方使用 1px `--in-border-color` 分隔线，与菜单滚动区区分；分隔线与收起按钮之间保留 8px（`--in-menu-divider-gap`），避免线贴住按钮 hover 面。hover 使用 `rgba(31,35,41,.08)` 和 6px 圆角，pressed/focus-visible 使用同一中性体系并增加可识别焦点环。分隔线画在独立行上，不受按钮圆角裁剪。
- 菜单项与底部控制文案使用 `user-select: none`，管理员不能拖选复制侧栏文字。
- 任何菜单滚动、路由切换、分组展开/收起都不得改变控制区 y 坐标；底部控制也不得覆盖最后一个菜单项。

### 组件边界

- `InMenuToggle.vue` 不作为桌面第二个折叠入口；若仍被 overlay 顶栏调用，只负责打开/关闭 overlay，并与底部控制共用文案和状态源。
- `InSubmenu.vue` 只负责递归菜单呈现和路由语义，不直接读写侧栏宽度。
- 新尺寸和颜色进入 `styles/tokens.css` 与暗色映射，不在业务页面覆盖；对飞书的具体采样值以语义 Token 表达。

## InAppBar 四区

用户确认顶栏按 A/B/C/D 划分，而不是旧的左/中/右三等分。

    InAppBar (56px)
    ├── Brand (A, flex: none) Logo + 标题，窄屏 overlay 开关
    ├── Nav (B, width: max-content, max-width: 560px) 一级入口 / `#nav`
    ├── SearchPane (C, flex: 1, justify-content: flex-end) 「搜索功能」靠右
    └── Actions (D, flex: none, width: max-content, max-width: 360px) 全屏 / 设置 / 用户

- B 与 D 只按内部按钮占位，没有入口时宽度为 0，不得用 `flex: 1` 吃掉空白。
- C 吸收剩余空间，搜索框固定 240px 并靠右，紧贴 D。
- 现有 `org-mgmt` / `product-settings` 放在 B；`brand-extra` 仍在 A。新增 `#nav` 供后续一级菜单。
- 顶栏 Logo 默认使用 framed 资源：浅色 `in-light-framed.svg`，暗色 `in-dark-framed.svg`；未配置 `branding.logo` 时随 `html.dark` 切换。

## 内容区画布沟槽

用户确认内容区与顶栏、侧栏、版权的间距，而不是给 `el-main` 预留固定四边灰色边。

    MainContent
    ├── Breadcrumb? (46px，有则显示)
    ├── ContentViewportHost
    │     左右：`--in-page-gutter`（12px，与侧栏面板到工作面的间隙对齐）
    │     顶部：面包屑未实际渲染时同样 `--in-page-gutter`；可见时为 0
    │     底部：壳层不预留沟槽
    └── Copyright? (有则整体上移内容区)

- 面包屑「实际渲染」才占用顶栏：设置关闭、或 `breadcrumbList.length <= 1`（仅一层）时不显示，内容顶距与左右沟槽对齐。
- 无版权时，contained 列表/双栏工作面贴视口底，不出现底部灰色条。
- 页面滚动（`InPageFrame` `mode="page"`，以及未使用 PageFrame / SplitLayout 的遗留溢出根）滑到内容尽头时，滚动内容底部补与 top/right 相同的 `--in-page-gutter`。
- 有版权时版权占据底部，上述顶部/左右/滚动尽头规则不变。
- `InContainer` 默认 `plain` 背景透明、无边框；可用 `background` / `borderColor` / `borderWidth` / `radius` 覆盖。`InSplitLayout` 仍是全高白色工作面，同样允许覆盖背景和边框色。

## InSplitLayout

### 结构

    InSplitLayout (height: 100%, overflow: hidden)
    ├── HeaderSlot (flex: none)
    └── SplitBody (flex: 1, min-height: 0)
        ├── LeftPane (260px / 0px)
        │   └── LeftScrollArea
        ├── CollapseHandle
        └── RightPane (flex: 1, min-width: 0)
            ├── TopSlot (optional, flex: none)
            └── ContentSlot (flex: 1, min-height: 0)

### 公开契约

- 保留现有 header、left、top 和默认插槽。
- left-width?: number，默认 260。
- left-collapsible?: boolean，沿用当前默认 true；页面可显式设为 false 隐藏折叠按钮。
- v-model:left-open，默认 true，事件为 update:left-open。
- auto-collapse?: boolean，仅在 left-collapsible 时生效，默认 true。
- min-right-width?: number，默认 680；容器宽度小于 leftWidth + minRightWidth 时进入临时自动收起。
- 保留 persistence-key、radius、background、border-color、border-width、sticky-header 和 show-backtop 等既有属性；持久化键只记录手动桌面状态。
- left-background?: string，仅覆盖左栏背景；未传时与容器 `background` / `--in-container-bg` 相同。
- 手动状态和临时自动收起分开保存；宽度恢复后回到用户之前的手动状态。

### 折叠按钮

- 使用原生 button，尺寸 16×32px，绝对定位在左右分隔线垂直中点。
- 形状为向右伸出的标签：无左边框、右侧 8px 圆角、右侧轻阴影，左边贴齐分隔线（展开时左缘覆盖 1px 分割线），与边框融合而不是悬浮在线上的独立胶囊。
- 展开态整颗落在右栏、左边贴分隔线；收起态同样以标签贴齐容器左缘向右伸出，不保留额外导轨宽度。
- 白色背景，上/右/下 1px `#dee0e3`。
- 图标为 12px 左箭头；收起态旋转 180°。
- aria-label 在“收起筛选”和“展开筛选”之间切换，支持 Enter、Space、focus-visible 与 Tooltip。
- 宽度变化使用 160–200ms Token 动效；prefers-reduced-motion 下接近即时完成。

### 左栏内容

- LeftScrollArea 默认 `padding: var(--in-section-padding)`（16px，compact 为 12px），子项纵向 `gap: 12px`。
- 左栏子节点被约束为 `width: 100%; min-width: 0`，不得撑破右边界；页面不要再给 `#left` 包一层 `w-260px`。
- 左栏背景默认与容器一致（`--in-container-bg`）；页面需要区分时传 `left-background`。

### 滚动

- 根、SplitBody、RightPane 均设置 min-height: 0。
- HeaderSlot 和 TopSlot 不参与纵向滚动。
- LeftScrollArea 与右侧表格数据区分别滚动。
- InSplitLayout 不再默认把所有内容包进同一个 overflow: auto。

## InTable

### 结构

    InTable (height: 100%, min-height: 0)
    ├── MetaRow
    │   ├── Title
    │   └── Summary
    ├── ToolsRow
    │   ├── ToolsStartSlot
    │   └── ToolsEndSlot / InTableActions
    ├── TableDataViewport (flex: 1, min-height: 0, overflow: hidden)
    │   └── ElTable (height 100%，由表格内部唯一滚动条承担横向/纵向滚动)
    └── Pagination (flex: none)

- MetaRow、ToolsRow 和 Pagination 固定；数据区由 `ElTable` 承担滚动，视口本身不得 `overflow: auto`，避免与表格内部滚动条叠出两条。
- 必须在模板中使用 `<el-table>` 并加载 `el-table.css`，以隐藏 Element Plus 的 `.hidden-columns` 测量节点；禁止再用 `h(ElTable)` 绕过按需样式。
- 右侧内容内边距默认 20px；MetaRow → ToolsRow、ToolsRow → TableDataViewport 的垂直间距均为 20px。
- ToolsStart/ToolsEnd 内部 gap 默认 12px；ToolsStart 按内容占位，ToolsEnd 以 `flex: 1; min-width: 0` 获得剩余宽度并靠右。
- 表头 48px，紧凑成员式数据行 44px；继续保留 default 48px 密度，新增或复用 density: compact | default。
- 表格宽度不足时由 `ElTable` 在数据区内唯一横向滚动；选择列可固定左侧，操作列可固定右侧并显示轻量分隔。视口不叠加第二层 overflow。
- 分页位于右下角，表格加载、横向滚动或纵向滚动时保持可见。

## Tools 组合方式

InTable 不再默认渲染刷新和字段设置：

- 删除无业务价值的内置刷新按钮和内部刷新 handler；为避免 foundation 阶段导致现有大量 `@refresh` 监听类型报错，`refresh` emit 声明保留一个迁移期但不再由 `InTable` 自动触发，并标记废弃。
- 提供 tools-start 和 tools-end 插槽。
- 旧 toolbar 插槽在兼容期映射到 tools-start，文档标记废弃。
- hideSetting 标记废弃；旧页面迁移前可以保留兼容适配，但新页面必须显式插入字段设置按钮。
- 表格能力以独立组件导出，页面按需导入，例如 InColumnSetting、InTableActions。
- 任意复杂业务工具可直接放入 tools 插槽；共享表格不读取业务权限或调用 API。

建议用法：

    <in-table :headers="headers" :data="data" table-id="org.members">
      <template #tools-start>
        <biz-member-filters />
        <in-column-setting :headers="headers" table-id="org.members" />
      </template>
      <template #tools-end>
        <in-table-actions :actions="actions" :row="toolbarContext" variant="toolbar" />
      </template>
    </in-table>

## 自适应操作收纳

InTableActions 只处理配置型 action。复杂自定义 VNode、表单、Popover 或带内部状态的工具不自动搬移，避免重复挂载和焦点丢失。

- row 变体延续“详情 + 至多一个高频快捷操作 + …”规则，不因操作列变宽而展开全部低频行操作。
- toolbar 变体支持固定操作和原子折叠组。成员页式配置中邀请、添加为固定操作，三个批量操作同属一个折叠组。

### Action 类型

    interface InTableAction<Row = unknown> {
      key: string;
      label: string;
      icon?: string;
      kind: "detail" | "quick" | "default" | "danger";
      permission?: string;
      group?: string;
      confirm?: string | { title: string; description?: string };
      priority?: number;
      overflow?: "auto" | "never" | "always";
      overflowGroup?: string;
      disabled?: boolean;
      disabledReason?: string;
      onSelect: (row: Row) => void;
    }

- quick 主操作默认 `overflow: never`；低频操作可以指定 `always`，始终进入“…”。
- 相同 `overflowGroup` 的 `auto` 操作必须全体展开或全体进入菜单，不允许只露出组内一部分。
- 数值较大的 `priority` 在菜单中靠前；组内直出时按低到高排列，使高优先级操作更靠近右侧固定操作；同优先级保持输入顺序。
- `permission`、`group`、`confirm` 和 `onSelect` 延续现有契约；`overflowGroup` 只负责响应式收纳，不替代既有批量上下文 `group`。
- 页面或 `useOps.ts` 继续负责 Query 和 mutation；组件只做权限过滤、确认、编排与事件分发。

### 宽度算法

1. InTable 先把扣除 ToolsStart 后的剩余宽度分配给 ToolsEnd；toolbar 变体由 ResizeObserver 监听自身填满的 content box，不依赖固定 viewport 断点。
2. 缓存固定操作和各 overflowGroup 的真实总宽度，计算时包含全部 12px gap。
3. 从低优先级折叠组开始判断；任一组放不下时，整组进入菜单，并预留 32px “…”按钮及相邻 gap。
4. 固定操作保持直出；成员页式配置不得把“邀请成员”“添加成员”收入菜单。
5. 宽度增大且能容纳整个组时一次性恢复全组，同时移除已无内容的“…”按钮。
6. 计算结果相同时不更新状态，避免 ResizeObserver 循环和按钮闪烁。
7. 初次测量使用 visibility: hidden、pointer-events: none、aria-hidden 的纯按钮测量层，不挂载业务副作用组件。
8. 左栏折叠动画改变右侧宽度时自动连续复算；动画结束后状态必须稳定，不要求页面手动触发 refresh 或 resize。

当容器窄到连 overflow: never 操作也放不下时，ToolsStart 先按自身规则收缩；仍不足时允许 actions 区横向滚动或由页面提供更紧凑的主操作文案，不得静默隐藏主操作。

### 更多菜单

- “…”为 32×32px 描边按钮，仅存在折叠组或 always 操作时显示，并紧邻固定操作左侧。
- 菜单最小宽度以内容为准；成员页参考宽度 112px、圆角 6px、边框 #dee0e3、轻量浮层阴影、垂直内边距 8px。
- 菜单项高度 30px、水平内边距 8px、圆角 4px，支持 disabled、disabled reason、danger、分组分隔。
- 支持 Enter/Space 打开、方向键移动、Esc 关闭，并将焦点返回“…”。
- hover 只改变按钮视觉状态；不得依赖 hover 才能打开菜单。

## 字段显示设置

InColumnSetting 从“图标包裹嵌套表格”改为可独立放入 tools 的完整按钮组件：

- 触发器为 32×32px 描边按钮，图标约 16px，Tooltip 为“设置显示字段”。
- 浮层宽约 213px、最大高 426px、圆角 8px、边框 #dee0e3。
- 内容使用普通复选列表，行节奏 36px；第一项“全部”支持选中/半选。
- required 列选中且禁用；选择列、操作列默认 configurable: false。
- 切换立即生效，无保存按钮；点击外部或 Esc 关闭并返回焦点。
- table-id 必填，按 user + tableId 前端持久化；不新增后端接口。
- 本阶段不实现拖拽排序。

## 前端类型

- InSplitLayout 新增的 prop/model/emit 使用严格类型。
- InTableProps 增加 density，保留必要的 Element Plus 透传，但触碰到的 any 必须替换为具体类型或 unknown。
- TableHeaderRecord 增加 required?: boolean、configurable?: boolean。
- InTableActions 使用 InTableAction<Row> 泛型并保留现有 onSelect 回调契约；本阶段不强制迁移为新的事件协议。
- InColumnSetting 将旧 onSelectionChange 兼容映射到类型化 change，文档给出迁移期。

## InPageHeader

- 页面头保持约 80px 最小高度、白底、底部分隔。
- 主标题使用 `--in-font-size-section-title` / `--in-font-weight-section-title`（16/24px、500）和 `--in-text-color`（`#1f2329`）。
- 说明使用正文 Token（14/22px、400）和 `--in-text-color-secondary`（`#646a73`）。
- 主标题与说明超长时单行省略：`display: -webkit-box`、`-webkit-line-clamp: 1`、`word-break: break-all`。
- `#tabs` 仅用于设置/详情等页内局部 Tab，不用于在独立菜单路由之间切换。

## 对接映射

本 change 无后端接口变化，见 [API.md](./API.md)。

| 前端路径                                   | 变更                                          |
| ------------------------------------------ | --------------------------------------------- |
| components/container/InSplitLayout.vue | 固定 header、左栏折叠、自动收起和滚动边界     |
| components/container/InContainer.vue       | plain 默认透明；可覆盖背景/边框               |
| components/InPageFrame.vue                 | page 模式滚动尽头保留画布沟槽                 |
| components/InPageHeader.vue                | 主标题 16/500、说明 14/400，超长单行省略      |
| components/table/InTable.vue               | 移除刷新、tools 插槽、固定区域和紧凑密度      |
| components/table/InTableActions.vue        | 固定操作与配置型 action 原子组自适应收纳      |
| components/table/InColumnSetting.vue       | 独立按钮、普通复选列表和持久化                |
| components/table/types.ts / props.ts       | 严格类型、密度、列设置和 action 契约          |
| components/**fixtures**/                   | 成员式双栏、不同容器宽度和 200 行数据 fixture |
| layouts/main/IndexPage.vue                 | 244px / 60px 侧栏占位、内容沟槽和 overlay 模式协调 |
| layouts/main/useShellLayout.ts             | 桌面持久化状态与窄屏 overlay 状态隔离          |
| layouts/widgets/InMenu.vue                 | 独立滚动区、固定底栏、文案、尺寸和收缩动效     |
| layouts/widgets/InSubmenu.vue              | 菜单层级、活动/hover、收缩裁剪和键盘可达性     |
| styles/tokens.css / dark/tokens.css        | 侧栏尺寸、颜色、间距、控制区和动效语义 Token   |

## 兼容与迁移

- 本阶段不修改业务页面、路由、权限、API、Query 或 canonical viewPath。
- left-collapsible 沿用当前默认开启；显式关闭的 InSplitLayout 不出现折叠柄，既有 persistence-key 继续可用。
- toolbar 与旧字段设置行为提供明确兼容期；rollout 时逐页迁移到 tools 插槽和按需组件。
- refresh emit 仅作为无触发入口的类型兼容层保留；rollout 清理现有 `@refresh` 监听后再移除声明。
- 自动收纳只接受 action 配置，不尝试解析或移动任意 slot VNode。
- 组件 fixture 通过用户视觉验收前，关联 rollout 保持 draft。
- Phase 07 不修改业务菜单配置、路由、权限和 canonical viewPath；现有侧栏偏好键继续复用，不做破坏性迁移。
- 桌面折叠入口统一到侧栏底部；`InMenuToggle` 若仍有窄屏调用，只作为 overlay 开关，避免同一桌面出现两个导航开关。

## 验证

- 1280、1000、920、900、800px 视口检查手动与自动收起，但核心算法使用容器宽度测试。
- 使用 1200、940、700、520、360px actions 容器宽度验证批量组原子收纳和恢复；不得出现只展开一个或两个批量按钮的中间态。
- 使用至少 200 行、宽表格和固定操作列验证 header/tools/表头/分页稳定。
- 验证 overflow: never/auto/always、overflowGroup、优先级排序、disabled、danger、动态文案宽度和 ResizeObserver 循环。
- 验证折叠按钮键盘行为、焦点、Tooltip、减少动效和宽度恢复后的手动状态。
- 验证字段设置半选、必选列、持久化、Esc 和焦点返回。
- 在 1440×900、1280×720 验证 236px / 52px 面板、244px / 60px 外层占位、12px 内容顶部和 40px 菜单行。
- 在 1280×500 或等效短视口将菜单滚动至至少 200px，断言底部控制始终高 44px、距底部 8px，坐标不随菜单滚动。
- 验证 hover/active 背景、14px 文案、20px 图标、44px / 72px 两级文字起点，以及收缩态不残留文字、徽标、箭头和可聚焦子级。
- 验证 300ms 宽度动效中外层占位、面板和内容区同步；减少动效模式近乎即时。
- 验证桌面底部“收起导航/展开导航”文案、键盘和持久化，以及窄屏“关闭导航”、Escape、遮罩关闭不回写桌面偏好。

## 与 CONSTITUTION 符合性

| 原则                      | 符合 | 说明                                                                                             |
| ------------------------- | ---- | ------------------------------------------------------------------------------------------------ |
| packages 承载共享抽象     | ✅   | 双栏、表格工具和 action 收纳均位于 admin-core。                                                  |
| 官方插件不得互相依赖      | ✅   | 本阶段不修改插件依赖。                                                                           |
| Vue 3 + TypeScript strict | ✅   | 新 prop、泛型和事件禁止 any。                                                                    |
| 设计系统命名              | ✅   | 共享组件继续使用 In*。                                                                           |
| UnoCSS / Token            | ✅   | 布局优先 UnoCSS，颜色和尺寸来自 --in-*。                                                         |
| 施工门禁                  | ✅   | change 延续既有 implementing 状态；本次只修订规格，Phase 07 业务代码须在用户明确确认后施工。     |
| current 真相单一          | ✅   | 本阶段不提前更新 current。                                                                       |

## 已确认决策

- [x] Phase 06 只修改 InSplitLayout 与 InTable 相关组件，不继续扩大到全局顶栏和侧栏。
- [x] 左栏沿用默认可折叠，展开 260px、收起 0px；临时自动收起不覆盖用户手动状态。
- [x] InTable 移除内置刷新；字段设置变为按需导入的独立按钮。
- [x] tools 支持任意自定义组件，但只有配置型 action 参与自动溢出收纳。
- [x] 成员页式工具栏使用“固定操作 + 原子折叠组”；邀请/添加始终直出，三个批量操作整组展开或进入“…”菜单。
- [x] 成员式紧凑表格使用 48px 表头和 44px 数据行。
- [x] 本阶段不修改业务页面，也不实现字段拖拽排序。
- [x] Phase 07 只补强全局左侧导航，不重新调整顶栏、面包屑、页面工作区或业务页面。
- [x] 侧栏面板与页面画布同色；展开/收起为 236px / 52px，外层含 8px 沟槽后为 244px / 60px。
- [x] 菜单滚动视口与底部控制为兄弟区域；“收起导航”固定在距底部 8px 的 44px 控制区，不随菜单滚动。
- [x] 收缩态不使用二级浮层或临时展开；完整菜单层级通过底部“展开导航”恢复。
- [x] 无面包屑（开关关闭或仅一层未渲染）时内容顶距与侧栏到工作面的 `--in-page-gutter` 对齐；无版权时工作面贴底，页面滚动尽头再补同等沟槽。
- [x] 顶栏 Logo 默认使用 framed 浅色/暗色资源，并随主题切换。
