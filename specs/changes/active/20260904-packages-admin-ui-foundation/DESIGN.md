# 设计：管理台 UI 基础设施

## 技术方案

继续使用“语义 Token → Element Plus 映射 → admin-core 共享组件 → 业务页面”的单向设计系统链路。Phase 01–05 已完成的 Token、壳层、基础组件和验证记录保留；本轮针对性视觉补强不再同时改顶栏、全局侧栏、抽屉、弹窗和全部页面原型。

本轮 Phase 06 只处理飞书“成员”页面红框内容工作区对应的两个核心组件：

- InFilterContainer：固定 header、260px 左侧部门栏、分隔线折叠按钮、窄宽度自动收起和左右滚动边界。
- InTable：标题/摘要、可组合 tools、移除刷新、按需字段设置、自适应操作收纳、紧凑表格、固定操作列和分页。

## 浏览器复核结论

在用户授权账号中，以 1280×720 视口复核成员页面；同时使用 1000、960、920、900、880、800px 临时视口检查响应行为。

| 区域          | 实测结果                                                               |
| ------------- | ---------------------------------------------------------------------- |
| 内容工作区    | 1200px 宽、白色、无外层圆角和阴影                                      |
| 工作区 header | 79px，白底，内边距 12px 20px                                           |
| SplitBody     | 539px 高；左栏 260px，右栏 940px                                       |
| 左栏          | #fbfbfb；搜索框 32px、圆角 6px、边框 #d0d3d6                           |
| 左树行        | 40px；选中背景 #f0f4ff，文字 #3370ff                                   |
| 折叠柄        | 19×32px，距 SplitBody 顶部 22px，白底，边框 #dee0e3                    |
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

## InFilterContainer

### 结构

    InFilterContainer (height: 100%, overflow: hidden)
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
- 保留 persistence-key、radius、background、sticky-header 和 show-backtop 等既有属性；持久化键只记录手动桌面状态。
- 手动状态和临时自动收起分开保存；宽度恢复后回到用户之前的手动状态。

### 折叠按钮

- 使用原生 button，尺寸 19×32px，绝对定位在左右分隔线上，距 SplitBody 顶部 22px。
- 展开态位于左栏右边界；收起态位于容器左边界，不保留额外导轨宽度。
- 白色背景，顶部/底部/左侧 1px #dee0e3，右侧无边框，圆角 4px 0 0 4px。
- 图标为 12px 左箭头；收起态旋转 180°。
- aria-label 在“收起筛选”和“展开筛选”之间切换，支持 Enter、Space、focus-visible 与 Tooltip。
- 宽度变化使用 160–200ms Token 动效；prefers-reduced-motion 下接近即时完成。

### 滚动

- 根、SplitBody、RightPane 均设置 min-height: 0。
- HeaderSlot 和 TopSlot 不参与纵向滚动。
- LeftScrollArea 与右侧表格数据区分别滚动。
- InFilterContainer 不再默认把所有内容包进同一个 overflow: auto。

## InTable

### 结构

    InTable (height: 100%, min-height: 0)
    ├── MetaRow
    │   ├── Title
    │   └── Summary
    ├── ToolsRow
    │   ├── ToolsStartSlot
    │   └── ToolsEndSlot / InTableActions
    ├── TableDataViewport (flex: 1, min-height: 0, overflow: auto)
    │   ├── StickyHeader
    │   └── Rows / Empty / Error / Loading
    └── Pagination (flex: none)

- MetaRow、ToolsRow 和 Pagination 固定；只有 TableDataViewport 滚动。
- 右侧内容内边距默认 20px；MetaRow → ToolsRow、ToolsRow → TableDataViewport 的垂直间距均为 20px。
- ToolsStart/ToolsEnd 内部 gap 默认 12px；ToolsStart 按内容占位，ToolsEnd 以 `flex: 1; min-width: 0` 获得剩余宽度并靠右。
- 表头 48px，紧凑成员式数据行 44px；继续保留 default 48px 密度，新增或复用 density: compact | default。
- 表格宽度不足时仅 TableDataViewport 横向滚动；选择列可固定左侧，操作列可固定右侧并显示轻量分隔。
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

- InFilterContainer 新增的 prop/model/emit 使用严格类型。
- InTableProps 增加 density，保留必要的 Element Plus 透传，但触碰到的 any 必须替换为具体类型或 unknown。
- TableHeaderRecord 增加 required?: boolean、configurable?: boolean。
- InTableActions 使用 InTableAction<Row> 泛型并保留现有 onSelect 回调契约；本阶段不强制迁移为新的事件协议。
- InColumnSetting 将旧 onSelectionChange 兼容映射到类型化 change，文档给出迁移期。

## 对接映射

本 change 无后端接口变化，见 [API.md](./API.md)。

| 前端路径                                   | 变更                                          |
| ------------------------------------------ | --------------------------------------------- |
| components/container/InFilterContainer.vue | 固定 header、左栏折叠、自动收起和滚动边界     |
| components/table/InTable.vue               | 移除刷新、tools 插槽、固定区域和紧凑密度      |
| components/table/InTableActions.vue        | 固定操作与配置型 action 原子组自适应收纳      |
| components/table/InColumnSetting.vue       | 独立按钮、普通复选列表和持久化                |
| components/table/types.ts / props.ts       | 严格类型、密度、列设置和 action 契约          |
| components/**fixtures**/                   | 成员式双栏、不同容器宽度和 200 行数据 fixture |

## 兼容与迁移

- 本阶段不修改业务页面、路由、权限、API、Query 或 canonical viewPath。
- left-collapsible 沿用当前默认开启；显式关闭的 InFilterContainer 不出现折叠柄，既有 persistence-key 继续可用。
- toolbar 与旧字段设置行为提供明确兼容期；rollout 时逐页迁移到 tools 插槽和按需组件。
- refresh emit 仅作为无触发入口的类型兼容层保留；rollout 清理现有 `@refresh` 监听后再移除声明。
- 自动收纳只接受 action 配置，不尝试解析或移动任意 slot VNode。
- 组件 fixture 通过用户视觉验收前，关联 rollout 保持 draft。

## 验证

- 1280、1000、920、900、800px 视口检查手动与自动收起，但核心算法使用容器宽度测试。
- 使用 1200、940、700、520、360px actions 容器宽度验证批量组原子收纳和恢复；不得出现只展开一个或两个批量按钮的中间态。
- 使用至少 200 行、宽表格和固定操作列验证 header/tools/表头/分页稳定。
- 验证 overflow: never/auto/always、overflowGroup、优先级排序、disabled、danger、动态文案宽度和 ResizeObserver 循环。
- 验证折叠按钮键盘行为、焦点、Tooltip、减少动效和宽度恢复后的手动状态。
- 验证字段设置半选、必选列、持久化、Esc 和焦点返回。

## 与 CONSTITUTION 符合性

| 原则                      | 符合 | 说明                                                                                             |
| ------------------------- | ---- | ------------------------------------------------------------------------------------------------ |
| packages 承载共享抽象     | ✅   | 双栏、表格工具和 action 收纳均位于 admin-core。                                                  |
| 官方插件不得互相依赖      | ✅   | 本阶段不修改插件依赖。                                                                           |
| Vue 3 + TypeScript strict | ✅   | 新 prop、泛型和事件禁止 any。                                                                    |
| 设计系统命名              | ✅   | 共享组件继续使用 In*。                                                                           |
| UnoCSS / Token            | ✅   | 布局优先 UnoCSS，颜色和尺寸来自 --in-*。                                                         |
| 施工门禁                  | ✅   | change 延续既有 implementing 状态；本次只修订规格，Phase 06 业务代码须在用户明确确认开工后施工。 |
| current 真相单一          | ✅   | 本阶段不提前更新 current。                                                                       |

## 已确认决策

- [x] Phase 06 只修改 InFilterContainer 与 InTable 相关组件，不继续扩大到全局顶栏和侧栏。
- [x] 左栏沿用默认可折叠，展开 260px、收起 0px；临时自动收起不覆盖用户手动状态。
- [x] InTable 移除内置刷新；字段设置变为按需导入的独立按钮。
- [x] tools 支持任意自定义组件，但只有配置型 action 参与自动溢出收纳。
- [x] 成员页式工具栏使用“固定操作 + 原子折叠组”；邀请/添加始终直出，三个批量操作整组展开或进入“…”菜单。
- [x] 成员式紧凑表格使用 48px 表头和 44px 数据行。
- [x] 本阶段不修改业务页面，也不实现字段拖拽排序。
