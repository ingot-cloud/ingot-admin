# 设计：顶栏五区布局与 APP 配置扩展

## 技术方案

为 bootstrapAdminApp 的 InAdminAppOptions 增加可选 header 配置。默认主题消费该配置，admin-core 提供配置解析、布局及交互；APP 提供业务组件与动作。延续 Vue 3、TypeScript strict、Element Plus、UnoCSS 和主题 Token。

### 公开配置契约

公开 InAdminHeaderConfig 及品牌、导航、搜索、小部件和用户菜单关联类型。字段采用以下结构，实施时以判别联合区分内置项、动作项和组件项，禁止 any：

| 配置              | 职责                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------ |
| header.brand      | 控制品牌内容展示，可提供自定义组件；标题和 Logo 来源仍为 branding.title/logo         |
| header.navigation | items、响应式 activeKey、onSelect；入口分为直接操作和分组面板两种                    |
| header.search     | placeholder、自定义 component；显隐唯一来源仍为 settings.showSearch 与现有设置 store |
| header.utilities  | 按顺序排列的内置 fullscreen/settings、图标操作、自定义组件列表                       |
| header.user       | 用户入口展示配置/自定义入口组件，以及内置和自定义菜单列表                            |

所有列表项使用稳定唯一 key；通用展示字段包括 label、icon、visible、disabled，小部件另支持 badge。动态值接受 Vue ref/computed 或 getter，组件在 setup 上下文解析；静态值同样可用。列表可响应式替换。保留的默认用户菜单顺序为 switchOrg、fixPwd、logout，默认小部件顺序为 fullscreen、settings。列表省略使用默认值，显式传入以其为完整列表，空数组清空。

大类入口最多支持“入口 → 分组 → 菜单项”，不做递归多层业务菜单。分组包含标题和菜单项；选择回调携带入口 key 及可选子项 key。activeKey 由 APP 控制，点击仅发出通知；禁用项不通知。不存在或已隐藏的选中 key 按未选中处理，不自动写回 APP。业务路由、权限判断及侧栏联动由 APP 回调和响应式 visible 提供。

品牌组件接收 navigationMode 和紧凑状态；搜索组件接收 compact 状态；小部件组件接收 overflowed、disabled 状态；自定义用户入口接收用户信息与紧凑状态，由核心包裹下拉触发行为。用户菜单本期为一层动作项和分隔线，不实现图片中的语言或账号子菜单业务。

配置通过 adminAppOptionsKey 注入，经共享 composable 解析，在 useAdminShell 中公开只读 header 配置。不得放进 configureAdminRuntime 的可序列化配置或 Pinia 持久化数据。

### 五区布局与测量

- 品牌区桌面宽度复用 sidebar gutter + expanded/collapsed panel Token；结合顶栏左内边距计算外部占位，保证右边界与侧栏一致。动画复用侧栏 duration/ease。品牌内容隐藏仍保留桌面对齐占位。
- 品牌收起隐藏标题，overlay 显示导航按钮与 Logo；无侧栏可展示时使用紧凑品牌占位，避免空白导航开关。
- 大类区为弹性剩余空间；搜索、小部件、用户区独立测量。默认使用现有搜索宽度 Token，取消默认导航/操作区横向滚动和导航固定断点隐藏。
- ResizeObserver 监听区域、菜单尺寸与动态内容，批量调度测量；菜单使用无交互的测量副本计算自然宽度，不复制有状态的业务组件。宽度计算包含 gap、内边距及更多按钮，先预留更多宽度再装入入口，避免临界点抖动。
- 装入时优先保留当前选中入口，其余按原顺序补充，最终直出与溢出列表各自维持配置顺序。可见入口非空时至少一个；超长标签限宽省略。
- 宽度不足时依次减少导航直出项、把搜索变图标、小部件从右向左收纳。小部件更多按钮本身计入宽度预算；反向扩展按相反顺序恢复。用户区紧凑形态只保留头像及箭头。
- 小部件在顶栏与更多浮层间移动使用稳定实例及 Teleport/持久挂载容器，避免重复实例或收纳导致状态丢失；自定义组件浮层内限宽。搜索同样保留实例与输入状态。

### 浮层和操作

- 大类分组入口点击展开 Element Plus Popover；宽屏按组多列，受视口限制时单列，面板最大高度受视口约束并内部滚动。
- 更多浮层点击分组入口后，在同一浮层中展示分组内容并提供返回按钮，避免多层浮层互相遮挡。
- 打开同一区域新面板时关闭旧面板；提供焦点进入、键盘选择、Escape、关闭后回到触发器。被响应式隐藏的触发器关闭浮层并把焦点交给仍可见的更多入口。
- 内置用户动作复用现有确认、修改密码抽屉和退出逻辑；空菜单不渲染箭头或空下拉。自定义回调支持 Promise，执行期间避免重复触发，失败沿用项目消息能力展示并恢复可操作状态。

## 组件与兼容影响

- 配置类型位于 admin-core plugin 类型体系并从包入口导出；复杂解析和宽度算法拆为可测试 composable/纯函数。
- DefaultHeader 向 InAppBar 传递解析配置；InAppBar 编排五区，拆分导航面板、小部件容器及用户区，避免单文件堆积。
- InLogo 消费侧栏状态；InUserDropdown 从固定 menuList 改为配置驱动，清理本次触及的 style:any。内置功能组件继续复用。
- 保留 InAppBar 现有 utilities prop 与旧插槽；旧 props 经适配器保留 featureFlag/priority 语义，新 header.utilities 按本规格收纳。显式组件 prop 优先于注入配置。
- header-start 及原导航插槽作为导航附加内容；header-end/utilities 插槽作为功能区附加内容。旧插槽测量为不可拆整体，空间不足时整体收纳，保留内部组件状态；新数据化入口承担逐项溢出能力。
- 自定义 theme.parts.header 继续完全替换默认顶栏；通过 useAdminShell 选择接入 header 配置，不强制改变第三方主题。
- APP 使用集中配置模块接入并提供文档示例；演示大类和自定义业务动作不进入正式菜单。无页面、新路由或业务 store，因此不新增页面四件套。

## 对接映射

本期无后端接口及 API/models 映射，不创建 API.md。搜索原实现仅为输入展示，本期不扩展检索服务；消息、系统切换等由 APP 后续提供组件或回调。

## 与 CONSTITUTION 符合性

| 原则               | 符合 | 说明                                                             |
| ------------------ | ---- | ---------------------------------------------------------------- |
| 三层边界与共享抽象 | ✅   | 通用顶栏进入 packages，APP 仅组合，不依赖其他 APP 或复制业务插件 |
| 类型与组件规范     | ✅   | Vue script setup、strict 类型、公开配置判别联合，不新增 any      |
| 样式与响应式       | ✅   | UnoCSS 优先，主题 Token、PostCSS 补充，验证移动窗口与深色主题    |
| 规格门禁           | ✅   | 本次仅 draft，批准后实施，偏离设计先确认                         |
| 单一真相           | ✅   | 实施期间不更新 current，无后端接口副本                           |

## 验证与兼容发布

单元测试覆盖默认/空配置、响应式变化、回调、内置动作、选中项和宽度边界；组件测试覆盖浮层与焦点、实例保留及旧插槽。真实浏览器覆盖需求中的窗口矩阵，检查品牌边界和布局恢复。

运行共享包与 APP 类型检查、相关 Vitest、只读 lint、包与 admin 构建、边界/主题示例/文档检查。保留默认配置兼容，无数据迁移。验收前进入 validating，验收后更新 current/admin-theme 和 admin-ui-foundation，记录变更并归档。
