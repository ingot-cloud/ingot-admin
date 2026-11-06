# 分步弹层组件与迁移设计

## 共享组件

在 `@ingot/admin-core` 增加业务无关的 `InWizard`，按现有组件导出和注册机制提供。它复用 `InDrawer` 与 `InDialog`，统一头部排版、步骤导航样式、当前步标题、正文工作面和页脚。通过全屏抽屉、窄抽屉、对话框三种展示形态接入，调用方提供小弹层尺寸。遮罩、层级、键盘关闭、焦点管理及业务传入的关闭回调沿用对应外壳的现有行为。样式作用域限定到向导实例。

| 输入或插槽 | 职责 |
| --- | --- |
| 显隐、标题、展示形态、宽度 | 外层控制开启与关闭。默认使用全屏抽屉，非全屏形态按提供的尺寸与可用空间约束。 |
| 可选的步骤列表、当前步骤标识 | 按现有步骤数据渲染标题、简述和状态。仅对原本可点击的步骤绑定已有处理。当前入口无步骤栏时可省略导航。 |
| 外壳与步骤事件 | 转接各入口原有的显隐、关闭和步骤事件及回调。现有页脚取消仍由业务按钮调用原处理。 |
| 正文、步骤标题附加区、页脚 | 业务提供字段、选择器、预览及现有按钮，向导负责排版。按当前主次角色把操作放入页脚次要区和右端主操作区，渲染顺序与键盘顺序一致。 |
| 加载状态 | 沿用现有加载与按钮禁用约定。业务区分加载、校验、提交和已启动的后台任务，并决定当下可用的步骤与动作。 |

草稿、步骤切换、校验、接口、错误定位和预览状态由业务组件持有。向导根据输入渲染相应状态，既有可跳步菜单直接接回原事件处理。应用角色版本、冲突重试、选择器确认等动作接回原按钮与回调。

## 布局与尺寸

- 宽屏以当前弹层的内容矩形为测量基准。共享三列轨道由等宽侧列和 680px 中列组成，正文和页脚使用同一中列。两侧空间从容器宽度平均分配，滚动条位于正文或控件内部，滚动出现时中列与页脚的水平基准保持一致。
- 容器宽度达到 1120px 时，两侧各至少 220px，左侧导航可容纳标题和可换行的说明。低于 1120px 使用同一组步骤的紧凑排版，导航位于正文顶部，按弹层内宽而非浏览器外宽判断。紧凑排版为正文与页脚的共享列各留至少 16px 外边距，正文内部另有 16px 水平内边距。
- 宽屏正文顶部留白 32px，标题采用 20px 段落标题。默认字段标签位于控件上方，复用 `InForm` 和现有控件。飞书在 1920px 窗口下实测正文列宽 680px，居中的页脚操作轨道宽 670px，按钮右端位于正文面板右缘内约 5px。宽屏按 5px 复现，紧凑布局沿用共享列的右缘。桌面单排页脚高 64px，按钮垂直居中，常规短文案按钮最小宽度 80px、高 32px，间距 12px。长文案或换行时允许页脚增高。该定位独立于字段内边距。
- 颜色、边框、间距和焦点优先使用现有主题 Token。680px 和布局阈值由向导组件集中定义，业务页面移除自己的向导宽度和左右留白类。正文标题和字段在正文列内对齐，窄容器下将组间双栏、说明、动作行改为换行或堆叠。
- 普通步骤由正文滚动区承接纵向滚动。已有定高的树、列表和表格由控件承接内部滚动，外层给出可收缩的高度和宽度，避免两层滚动争用。角色版本应用中宽表的表格列保留既有可读宽度，横向滚动限制在表格区域。
- 步骤导航使用有序语义和 `aria-current="step"`，非交互步骤保留静态显示。沿用现有可交互步骤和关闭按钮的键盘行为、子弹层焦点处理、未保存确认和显隐生命周期。

## 迁移清单

清单按源码组件计数。共用业务组件由其所有平台端、租户端入口验收。

| 编号 | 入口 | 源码 |
| --- | --- | --- |
| W01 | 平台创建组织 | [CreateWizard.vue](../../../../../plugins/platform/src/pages/iam/tenants/components/CreateWizard.vue) |
| W02 | 平台编辑应用开通 | [EntitlementEditWizard.vue](../../../../../plugins/platform/src/pages/iam/tenants/components/EntitlementEditWizard.vue) |
| W03 | 平台创建应用 | [CreateWizard.vue](../../../../../plugins/platform/src/pages/iam/applications/components/CreateWizard.vue) |
| W04 | 平台菜单创建与编辑 | [MenuEditDrawer.vue](../../../../../plugins/platform/src/pages/iam/applications/components/MenuEditDrawer.vue) |
| W05 | 平台创建套餐 | [CreateWizard.vue](../../../../../plugins/platform/src/pages/iam/plans/components/CreateWizard.vue) |
| W06 | 平台创建共享角色 | [CreateWizard.vue](../../../../../plugins/platform/src/pages/iam/shared-roles/components/CreateWizard.vue) |
| W07 | 平台共享角色编辑权限 | [GrantEditWizard.vue](../../../../../plugins/platform/src/pages/iam/shared-roles/components/GrantEditWizard.vue) |
| W08 | 租户创建角色 | [CreateWizard.vue](../../../../../plugins/org/src/pages/iam/authorization/components/CreateWizard.vue) |
| W09 | 租户角色编辑权限 | [GrantEditWizard.vue](../../../../../plugins/org/src/pages/iam/authorization/components/GrantEditWizard.vue) |
| W10 | 平台分配与调整角色 | [BizIamPlatformAssignmentDrawer.vue](../../../../../packages/admin-common/src/components/BizIamPlatformAssignmentDrawer.vue) |
| W11 | 租户分配与调整角色 | [BizIamTenantAssignmentDrawer.vue](../../../../../packages/admin-common/src/components/iam-tenant-authorization/BizIamTenantAssignmentDrawer.vue) |
| W12 | 平台委派 | [BizIamPlatformDelegationDrawer.vue](../../../../../packages/admin-common/src/components/BizIamPlatformDelegationDrawer.vue) |
| W13 | 租户委派 | [BizIamTenantDelegationDrawer.vue](../../../../../packages/admin-common/src/components/iam-tenant-authorization/BizIamTenantDelegationDrawer.vue) |
| W14 | 应用角色版本 | [BizIamRoleApplicationDrawer.vue](../../../../../packages/admin-common/src/components/BizIamRoleApplicationDrawer.vue) |
| W15 | 升级角色分配版本 | [BizIamAssignmentUpgradeDrawer.vue](../../../../../packages/admin-common/src/components/BizIamAssignmentUpgradeDrawer.vue) |
| W16 | 平台与租户的用户组创建和编辑 | [BizIamGroupWizard.vue](../../../../../packages/admin-common/src/components/BizIamGroupWizard.vue) |
| W17 | 配置成员角色，960px 对话框 | [MemberRoleAssignDialog.vue](../../../../../plugins/platform/src/pages/iam/personnel/components/MemberRoleAssignDialog.vue) |
| W18 | 添加平台成员，520px 抽屉 | [MemberCreateDrawer.vue](../../../../../plugins/platform/src/pages/iam/personnel/components/MemberCreateDrawer.vue) |

W04 只读详情继续使用现有详情模式，创建与编辑进入共享向导。W16 将横向 `ElSteps` 迁入共享导航，根据各入口实际步骤生成列表。W17 作为 W18 或成员详情的内层弹窗工作，确认结果写回调用方草稿。W18 只接入共享头部、正文和页脚布局。W01 与 W18 接续全局账号选择变更，合并时先核对其最终版本。完成所有迁移后清理仅供旧向导使用的局部导航、样式和包装，按现有包导出兼容约定处理旧公共导出。

## 兼容与发布

同一前端发布单元交付共享组件与各入口迁移。接口、权限码、路由、请求载荷、数据与保存时机沿用当前契约，原入口继续打开对应的业务流程。发布回退使用上一版前端构建产物。

## 宪章符合性

通用组件位于 admin-core，平台和租户业务仍归对应插件，复用的 IAM 业务内容仍位于 admin-common。组件采用 Vue 3 与类型化属性、插槽、事件，复用现有组件和语义主题。规格在确认后实施，验收后写入 current 并归档。
