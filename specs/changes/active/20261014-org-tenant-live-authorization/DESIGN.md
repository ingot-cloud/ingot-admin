# Design

## 1. 组件与页面结构

保留已有 composition root 和路由注册键。租户页面仍由 org 插件承担，平台共享管理仍由 platform 插件承担。新当前角色类型与低层权限选择/范围工具放 admin-common；平台固定版本 DTO/组件保留，不能全局替换 RoleRevisionRef 含义。

| 落点 | 本次改变 |
|---|---|
| plugins/org/src/pages/iam/authorization/IndexPage.vue、table.ts、useOps.ts、components/ | 页面四件套；角色分类、当前权限编辑、无版本分配、资源委派及受限入口 |
| plugins/org/src/pages/iam/settings/IndexPage.vue 与对应 useOps/components | 消费拥有者身份与真实转交capabilities，转交后刷新；整页表单使用InFormContent |
| plugins/org/src/pages/iam/members/components/MemberDetailDrawer.vue | 拥有者标识及服务端字段可编辑结果，不增加普通角色选择中的拥有者条目 |
| plugins/platform/src/pages/iam/shared-roles/ | 共享来源复用分步向导创建/详情/编辑，预览后保存当前权限；保留平台自有来源固定版本分支 |
| packages/admin-common/src/models/iam/tenantCurrentRoles.ts（拟新增） | 当前角色/租户分配/资源委派、scopeIssues和候选类型；API字段以本次副本为准 |
| packages/admin-common/src/components/iam-current-role/（拟新增） | BizIamCurrentRoleCreateDrawer、DetailDrawer、权限选择/预览；不包含版本表单或差异 |
| packages/admin-common/src/components/iam-tenant-authorization/（拟新增） | BizIamTenantAssignmentDrawer、DelegationDrawer和作用范围工具；不复用平台固定版本props |
| packages/admin-core/src/stores/modules/auth.ts | TENANT快照到期调度、失败unavailable、成功重载菜单、身份切换清理 |

可复用 Element Plus/设计系统、InTableActions、加载/异步守卫、时间、实体对话框和已有低层范围模型。平台插件私有GrantPicker若需两端复用，先把无页面公共逻辑提取到admin-common，再保留平台wrapper；org不得导入platform插件。

## 2. 对接映射

接口字段表仅见 API，本文件不维护第二套契约。

| API能力 | API函数与模块 | 消费 |
|---|---|---|
| 角色目录/创建及创建预览/详情/元数据/删除 | org/api/iam/authorization.ts：TenantRolePage/Create/CreatePreview/Detail/Profile/DeleteAPI | 角色列表与私有创建/详情 |
| 当前权限、预览与保存、候选目录 | 同模块 TenantRoleGrants/Preview/PermissionUpdate/GrantCatalogAPI | 当前权限Tab与操作/资源选择器 |
| 分配与受限候选 | 同模块 TenantAssignmentPage/Create/Preview/Update/Delete/Options/RoleDefinition/ScopeCandidatesAPI | 名称回显、分配表单和scopeIssues |
| 委派及本人来源 | 同模块 TenantDelegationPage/Create/Detail/Update/Delete/Preview/Mine/ScopeCandidatesAPI | 独立治理编辑、受限来源选择 |
| 共享当前权限 | platform/api/iam 下已有共享角色模块新增CreatePreviewAPI/CurrentPermissionUpdateAPI及当前类型 | 共享CreateWizard/Detail/GrantEdit流程 |
| 会话/拥有者/转交 | 复用admin-core IamBootstrap/CapabilitiesAPI与org现有设置API | 身份展示、权限指纹、刷新、转交 |

移除org版本列表、publish、revision metadata/source preview、upgrade及roleRevisionRef序列化调用；保留platform自有API导出。数据查询缓存键包含当前域/组织/主体/委派来源，成功只失效相关query，不清除其他域正在工作的会话。

## 3. 交互设计

角色列表类型显示“平台共享/组织私有”，候选展示名称和来源。共享详情基本信息/当前权限只读；私有详情的基本信息和当前权限各有明确保存。创建一次提交完整基本信息及定义。角色权限草稿使用已开通应用的分页ACTION目录，已选回显保留停用操作提示；不预拉其他Tab、不把200条冒充全集。

当前权限编辑先预览，errors阻止提交，warnings显示新资源待补绑定及影响；保存按钮说明“保存后关联人员自动生效”。没有发布/应用版本选择。私有角色没有共享基础字段；共享详情不露出本地定制按钮。schema技术expectedVersion隐藏提交，409重新读取/预览，不写“版本过旧”。

平台共享角色复用同一套全屏向导和详情抽屉，步骤为角色信息、选择权限、设置范围、预览。详情只显示身份与当前权限，编辑进入后三步。预览通过后提交当前定义，创建与保存都不收集版本名称，也不打开版本历史或应用任务。范围参数键使用 `resource-{resourceId}-{kind}`，并带上资源标识；编辑时保留已保存的参数键。平台自有角色继续使用字段权限、版本表单、版本历史和应用任务。

分配选择角色后读取当前定义及稳定范围参数；角色变更/委派变更时重新验证草稿并提示兼容情况。用户选择人员/组后配置范围与期限，预览通过再提交。scopeIssues显示可披露资源/参数，进入普通编辑补齐。只凭委派时使用mine和受限options/roles/scope-candidates，不调用全量role/member列表来凑资格。

委派资源上限按资源分组，仅支持资源声明能力；同资源操作共享上限。选择不同角色时取资源并集并保留兼容已有草稿，新增资源要求配置；移除资源提示派生授权影响。保持一条完整来源，不在浏览器拼上限。租户时长使用既有Duration工具，只展示LIMITED。

拥有者身份从bootstrap与组织详情展示；行为仍按actionCodes和对象capabilities决定。转交按钮必须按服务器额外资格控制，成功后立即刷新当前授权；旧拥有者剩余私有/共享角色不从前端删除。

## 4. 权限刷新

租户与平台共用 refreshSessionPermissions：去重、contextEpoch，以及 version 变化后再拉 bootstrap/菜单。不为 TENANT 单独按 expiresAt 轮询；可见页定时器已撤销，避免半分钟闪断 `unavailable`、重挂页面。保存成功立即刷新当前会话；窗口重新可见或聚焦且快照已过期时再核对。身份切换/退出清理。服务器撤权下一请求即拒绝，不依赖浏览器定时器。

所有授权相关保存统一成功回调：失效关联query → 刷新当前capabilities → 指纹变化重载bootstrap/菜单。平台共享修改后平台当前会话也核对新操作能力。

503 设置 unavailable、保留展示；不自动退避重试。错误链不自动重发写请求，403也不恢复旧允许结果。410显示接口已退出并要求使用当前入口，不能调用旧版本兜底。迟到响应以epoch/实体加载守卫丢弃。

## 5. 宪章与规范符合性

| 原则 | 决定 |
|---|---|
| 架构边界 | apps不承载新业务页；org/platform不互相导入；公共抽象在packages |
| 页面结构 | IndexPage/table/useOps/components，公共组件在admin-common |
| 类型 | Vue3 script setup+TS strict；Tenant/Shared-current类型与平台固定类型分离，无any |
| 请求与列表 | XxxAPI显式返回R；分页/已选回显/关联查询服务端执行，筛选在tools-start |
| 表单 | 整页设置按InFormContent，抽屉沿用既有容器；录入placeholder与实体对话框一致 |
| 字段/时间 | 服务端字段能力为准，共享UTC ISO与Duration工具，不在UI泄露技术版本概念 |
| SDD | draft待评审、approved后施工；sources副本校验；验收前不改current |

遵循本仓库CONSTITUTION与in-coding-standards，无架构例外。实施前以本change工件为依据，不回读其他inbox或把历史接口副本作为新真相。

## 6. 发布与测试

迁移职责、停止旧契约和前后端回滚联动见MIGRATION。API为权威副本，变更先更新后端再复制/hash。组件测试聚焦真实交互与拒绝边界，类型/静态检查仅作辅助；真实多组织/多身份浏览器验收不可省略。平台自有版本分支须回归，避免共享Detail/Wizard修改牵连批量任务。

所有U矩阵及后端B矩阵相关项通过后再更新current并归档。无未决产品选项；真实后端数据、迁移处置与性能报告属于后续任务交付，不声明本轮已经具备。
