# IAM 前端设计

## 1. 现状与替换

原起点使用 PMS 用户/菜单/权限和旧角色模型；当前已有 IAM bootstrap、响应式能力及部分页面实现。2026-09-16 按最新契约重新验证完整性，历史任务勾选不代表页面功能闭环。新增双入口设计见第8节，逐操作工作归属见 IAM-INTEGRATION。

保留 Vue 3 + strict TypeScript + Pinia + TanStack Query + Element Plus + UnoCSS。使用 InDetailDrawer、InDetailIdentity、InDescriptionList、useDetailEditSession、InBizTabs；不重新搭建视觉体系。

## 2. 页面路径、插件和导航注册

下列是目标页面四件套根目录，位于各 plugin/src/pages，使用 IndexPage.vue、table.ts、useOps.ts、components/；向导/详情使用内部组件或子页面。canonical viewPath 由 `definePluginPages` 从目录生成：`pages/iam/<segment>/IndexPage.vue` + 插件前缀；kebab 目录会变成点分键。浏览器 path 与注册键分开，不从路径推导 ACTION。

| 插件/页面根 | 目标浏览器 path | canonical viewPath | 接入模块 |
|---|---|---|---|
| platform/iam/tenants | /platform/tenants | platform.iam.tenants | api/iam/tenants |
| platform/iam/accounts | /platform/accounts | platform.iam.accounts | api/iam/accounts |
| platform/iam/applications | /platform/applications | platform.iam.applications | api/iam/applications |
| platform/iam/plans | /platform/plans | platform.iam.plans | api/iam/plans |
| platform/iam/shared-roles | /platform/shared-roles | platform.iam.shared.roles | api/iam/shared-roles |
| platform/iam/personnel | /platform/personnel | platform.iam.personnel | api/iam/personnel |
| platform/iam/authorization | /platform/authorization | platform.iam.authorization | api/iam/roles, assignments, delegations |
| org/iam/members | /org/members | org.iam.members | api/iam/members, departments |
| org/iam/groups | /org/groups | org.iam.groups | api/iam/groups |
| org/iam/settings | /org/settings | org.iam.settings | api/iam/settings |
| org/iam/authorization | /org/authorization | org.iam.authorization | api/iam/roles, assignments, delegations |
| org/iam/applications | /org/applications | org.iam.applications | api/iam/applications |
| org/iam/workbench | /org/workbench | org.iam.workbench | bootstrap applications |
| org/iam/directory | /org/directory | org.iam.directory | api/iam/directory |
| security/iam/member-permissions | /org/member-permissions | security.iam.member.permissions | api/iam/member-policies |
| security/iam/authorization-audit | /platform/authorization-audit 或 /org/authorization-audit | security.iam.authorization.audit | api/iam/authorization-audit |

现有 security 会话/策略/事件、platform 字典保持页面实现和注册键，归入新导航并校对新授权。无后端功能的运维页不新增。角色详情与升级由角色页进入，授权记录/管理员为 Tab；诊断为抽屉/详情工具，不新增侧栏一级入口。

菜单由后端过滤后返回，前端不能再硬编码一份独立有权菜单。以上 viewPath 是前端注册键；T13 须与后端菜单种子对齐，未对齐不生成“页面已可访问”的验收结论。旧角色/权限/数据范围独立入口在新路由切换时收敛，必要代码复用不保留旧接口兼容。

## 3. 公共能力

packages/admin-core 承担身份、bootstrap、路由、reactive useCapabilities、授权刷新、错误处理。只保存 actionCodes 作为功能依据，角色仅展示；对象操作需要同时满足 actionCodes 与服务端 capabilities。

packages/admin-common 新增无页面的 iam models/enums、类型化范围与主体选择、角色操作编辑、差异展示、升级冲突展示、诊断结果展示。业务组件采用 Biz*，底层视觉 In*。公共组件通过 props/callback 接收查询或提交能力，不导入 plugin API，不包含路由页。

平台/组织分别建立 api/iam，具名 XxxAPI 返回 Promise<R<T>>；core 内 `import request from "@/net"`，插件内使用 `@ingot/admin-core` 的同一 request 单例。对应 .query.ts 使用 Query Options。公共 DTO 放 admin-common。接口字段只以 API.md 和校对后的 OpenAPI 为准，不在本设计复制平行字段表。ACTION 字面量使用 `iam-platform:` / `iam-tenant:`，禁止示例里过期的 `iam:platform:`。

页面适配器把服务端 Page.items/total 映射到现有分页组件；不要求全仓分页模型变更。不对 Member API 做字符串全局替换。扫描现有 PMS 引用按 IAM/辅助能力/会员/认证协议分类，只调整经确认的服务边界。

## 4. 身份与查询生命周期

Bootstrap 一次提交 profile、applications、menus、actionCodes 及 version/expiresAt 到 store，失败不留下半初始化界面。并发 bootstrap/refresh 共用进行中 Promise。

Query key 含管理域、tenantId、account/memberId 和 contextEpoch，业务筛选沿用现有网络规范，敏感筛选使用现有安全指纹，不把手机等原值写 key。切租户先独立认证，失败/取消保留旧正式会话；complete 成功后递增 epoch、取消旧请求、清旧 query/详情/草稿/授权，再 bootstrap。迟到响应比较 epoch，不能回填；同源其他标签页收到变更通知后重载身份，另一域不受影响。

授权版本改变时失效受保护列表/详情、预览、字段和对象能力，更新菜单；合法空权限清空入口。到期后在进入受保护页/提交前 single-flight 刷新；窗口重可见及 403 刷新。不增加持续全局轮询，服务端仍执行最终期限。

503 不登出且不伪造空权限；标记授权不可用、阻止操作、隔离旧业务数据不作为新结果展示。失败不自动重试 mutation。网络 412/信封/上传下载沿用既有协议，不由 IAM 更名改写。

## 5. 草稿、预览与差异

独立 draft 状态不被后台 refetch 覆盖。变更影响操作、范围、主体、基础版本、期限或规则时清除旧 preview 的可提交状态；预览响应比较 draftRevision/contextEpoch，旧响应不回填。

保存使用服务器预览版本和 expectedVersion 再提交完整类型化输入；preview.valid 仅为 UX 条件，服务端重新鉴权。无效项在对应步骤/字段显示；向导可返回修订。提交中防重复，成功后刷新关联角色/分配/诊断/query，不对权限做乐观扩大。

共享角色定制只产生 delta，切换视图不创建持久化；恢复基础删除覆盖项。升级冲突按服务端稳定 key，不能客户端选默认强行通过。角色发布默认不选旧授权升级，展示仍使用旧版本的事实。

字段 form 只装载可编辑原值，hidden/masked 不进入编辑 payload；角色编辑收窄不误作为跨角色全局 deny。人员选择器使用服务器 purpose 白名单，不能退回全员接口补齐不可见条目。

## 6. 接口集成门禁

2026-09-16 输入为当前后端 OpenAPI 96路径/161操作，包含账号、本人、字典/发号/社交、purpose/筛选、成员导出状态。全部操作见 [IAM-INTEGRATION](./IAM-INTEGRATION.md)，实现时填写实际 API/页面/测试落点与证据；数量不作为完成指标。BFF 接口另见 [BFF-LOGIN](./BFF-LOGIN.md)。

按 [入口映射](./sources/endpoint-mapping.json) 逐项判断辅助调用；已发布的账号、本人、字典、发号、社交迁到 IAM；OSS、安全和 Member 使用其有效独立契约，不能全局替换或无条件保留 `/api/pms`。存在 RJson/RVoid 的包装接口须核对后端实际类型/HTTP样例，不能用 any 或虚构 DTO 隐藏缺口。

选择器调用已发布列表及 purpose 白名单，不造 `/candidates`；审计导出没有已发布路径时不显示可操作导出按钮。成员导出完整使用创建→状态→下载，并处理失败/过期与下载重新鉴权。菜单种子/viewPath、所有对象能力、字段脱敏与 scope 需要真实后端验证。

## 7. 与 CONSTITUTION 符合性

| 原则 | 符合 | 落点 |
|---|---|---|
| apps 为组合根、插件不互相依赖 | 是 | 业务页面放 plugin，共享无页面能力放 packages |
| strict TS / 具名 API / Query | 是 | 无 any，枚举显式，XxxAPI + .query.ts |
| 页面四件套 | 是 | 表格、操作、页面、组件分离 |
| Token / UnoCSS / 既有详情标准 | 是 | 只读详情与编辑会话复用 |
| SDD 与接口真相 | 是 | implementing；API 副本来源可追踪，current 验收后更新 |

无需修改项目宪章。

## 8. 双入口与四站点设计（2026-09-19：部分实现，剩余见U01）

### 8.1 模块与构建

- `apps/auth`、`apps/auth-platform` 为两个独立 composition root，注册对应域登录视图、网络配置与品牌，分别输出镜像。不能通过 alias 导入另一个 App 的 src。
- 新 `plugins/auth`（@ingot/auth-plugin）作为登录站页面模块，导出页面与路由工厂，不实现依赖 admin-core 的 InAdminPlugin；不注册管理台业务菜单。包含登录/错误/租户选择页面和表单展示组件，平台根不装配选择租户流程。
- 新 `packages/auth-core`（@ingot/auth-core）存放无页面的事务/登录状态、DTO、具名 API、请求配置与安全拦截适配，复用 http-client/shared 的挑战/加密能力，不复制安全逻辑，不依赖 App 或 admin-core。
- `apps/admin`、`apps/admin-platform` 为两个独立 composition root，分别输出镜像。不能通过 alias 导入另一个 App 的 src。与登录站同样按域拆目录，便于后续品牌、顶栏、本地插件和静态资源分叉。
- `VITE_APP_CODE` 是本 App 的前端编码（本地页面/布局前缀、缺省品牌），租户 `ingot-admin`、平台 `ingot-platform-admin`。`VITE_APP_ID` 是 BFF/Nacos 应用注册键，仅 `tenant-admin` / `platform-admin`，不得与 CODE 混用。`expectedDomain` 与 `entry` 由各宿主显式写入。入口只调用同源 BFF，不再使用登录 URL 环境变量拼地址。
- 插件在各自 App 的 `src/plugins.ts` 静态导入：平台 platform/security，租户 org/security，保留各自 local 插件；Member 原用途保留但不默认混入这两份 IAM 构建。
- 根流水线为四产物维护构建→镜像→部署依赖；apps/auth 局部流水线同步一致，不以仅改根 job 代替独立构建能力。更新工作区脚本、依赖边界测试和构建文档。

### 8.2 页面与身份生命周期

- admin-core 提供 `/auth/start` 和 `/auth/complete` 的轻量公开路由，先完成事务/交接再加载业务模块，不提前 bootstrap；预期 domain 与 appId 由宿主显式注入，后端再次核验。
- goLogin 只进入本站 `/auth/start`，不向 BFF 传 URL；把当前 path/query/hash 写入同源 sessionStorage。loginUrl/completionUrl/落地页均由 BFF 按注入 appId 读 Nacos 构造。错误页不能读取任意 redirect_uri 跳转。已有正式会话再访 `/auth/start` 时直接落地，不新建事务。
- 登录页面消费 LOGIN/SELECT_TENANT/READY 状态；READY 仅跳 completionUrl。平台不展示候选；租户单候选自动由服务端完成，多候选提交 tenantId。保留凭证错误、412、锁定及初始改密交互，静态二维码入口隐藏。
- complete 页立即清 URL 中 ticket、请求本站 CSRF 并带本站设备指纹交接；不加载第三方资源，no-store/no-referrer。成功获取 bootstrap 后检查 domain；不匹配显示身份错误并停止装配，不自动跨域。
- 退出撤销当前应用 sid，清当前 origin 内所有身份缓存；另一域不受影响。成功切租户用 BroadcastChannel 通知同源标签页失效，窗口恢复再校验，迟到结果靠 contextEpoch 丢弃。
- 初始改密/凭证过期仍使用既有安全流程；需要保持登录状态的安全阶段不得被误判为 SELECT_TENANT 或强行 READY，联调验证原协议允许的操作范围。

### 8.3 全量页面归属与补齐

保留第2节页面结构；新增平台账号页 `platform/iam/accounts`（/platform/accounts，platform.iam.accounts），与人员成员页独立；平台组作为 personnel 内组 Tab，不引入租户部门。本人资料与密码复用现有个人中心，字典/发号/社交复用已有 platform 页面与注册键，只替换有效契约和权限。

租户应用的 actions 用于租户角色资源操作选择；audience 为应用详情的可用人群编辑。成员导出增加进度/失败/过期视图；owner-transfer 属于组织设置的独立治理操作。应用资源/操作/菜单 Tab、完整角色向导、三方升级冲突、分配与委派预览均作为 N05–N07 的必需完成项，不能以列表存在交付。

### 8.4 发布边界

四站同主域不同 host、同源 /api 代理、两个 OAuth client；本地提供同样四主机名 HTTPS 拓扑。部署具体域名由环境配置给出，预检拒绝缺失或不一致；不会从旧 env 猜生产值。全新系统启用后清已知旧 Cookie/缓存并重新登录，不迁移旧会话；前后端一致版本回退，不恢复旧宽松跳转。生产发布不在“只生成 Spec”授权范围。

## 9. 全量适配、交互与验证组织（2026-09-19）

IMPLEMENTATION-STATUS记录现状，IAM-INTEGRATION记录每个操作的API和消费落点，TASKS的S/U分别表达已落地开发事实与剩余退出条件。继续复用现有页面；不为凑接口覆盖率生成重复CRUD。接口不足按后端依赖记录，不改变授权/JSON语义。本轮不新增公共API或DTO。

统一视觉和行为以INTERACTIONS第5节为检查清单，原通讯录只作为交互参照。列表action由table.ts提供，业务动作与状态由useOps/页面私有组件组织；公共人员/范围/期限/预览编辑能力放admin-common，框架生命周期在admin-core，插件不得互相依赖。资源字段能力、策略和角色使用可读表单/矩阵及说明，不暴露内部JSON作为最终管理界面。INTERACTIONS 中 `[TEST-DATA](./TEST-DATA.md)` 按 [SOURCES](./SOURCES.md) 解析为 `sources/BACKEND_TEST_DATA.md`。

独立测试环境使用后端TEST-DATA的同一runId，前端记录I操作、U任务、A/P验收与TD场景关系。后端准备脚本不承担浏览器验收；页面测试和静态检查不代替真实授权结果。候选分页、草稿失效、字段payload、冲突保留及多身份状态是组件/集成测试重点，主题/布局/action一致性另行视觉验收（P25）。

### 9.1 页面交互检查表（与 INTERACTIONS §5、P25 对齐）

后续每个 IAM 页面（含已接页面）按下列项勾选，不能只写“保持统一”。

| 检查项 | 通过标准 |
|---|---|
| 布局 | 复用 InPageFrame/InPageHeader、InSplitLayout、InTable、InTableActions、InDetailDrawer/InDescriptionList；树表双栏沿用通讯录，不为每域另搭布局 |
| 动作 | 工具栏与行操作走类型化 action；分主操作、快捷、溢出菜单、危险确认；无 ACTION 隐藏；对象受限禁用并展示后端原因 |
| 搜索筛选 | 主搜索在 tools-start、无 label、回车或清空查询；枚举用 InPicker；≥3 个或远程实体条件进 InFilterPanel |
| 选择器 | 人员/部门/应用/角色版本/所有者远程分页，不截断首 200、不手填裸 ID；purpose/范围由服务端约束 |
| 详情与编辑 | 名称/头像进只读详情；编辑用明确入口；简单用抽屉，角色/升级/应用创建/开通用全页向导，分配用大抽屉；全屏向导关闭在标题栏左侧 |
| 草稿与错误 | 未保存离开确认；409 留草稿并重预览；403 刷新能力；503 可辨识且不空列表；404 不泄露存在性；写请求防重复 |
| 视觉 | 现有主题 Token 与 UnoCSS；宽/窄屏；统一空态/错误/密度/按钮；不另建品牌色 |
| 完整性 | 空 handle、JSON 展示、未知 DTO 只能标部分实现；无契约不造按钮；工作台 URL 来自服务端菜单 |


## 2026-09-28 平台角色分配增量

已获用户明确实施批准；规格与契约见 [AUTHORIZATION-REFINEMENT](./AUTHORIZATION-REFINEMENT.md)。本轮先完成平台两端，主 change 保留 implementing；真实验收单列记录。


2026-09-29 已批准“角色”单选树增量，接口、设计、任务与手动验收见 [ROLE-PICKER-REFINEMENT](./ROLE-PICKER-REFINEMENT.md)。本轮测试由用户执行，开发完成不代表验收通过。

2026-09-30 平台角色分配抽屉沿用既有创建/修改预览接口：修改预览传打开详情时的 expectedVersion，保存再传同一版本并由后端事务重验。仅当当前草稿的 preview.valid 为 true 才渲染提交按钮；失败清除旧预览。修改预览或保存的 409 将抽屉标记为已过期，保留草稿但阻止重试，重新打开时取完整详情并重置该标记；删除仅更新本地 version/capabilities 的入口。租户交互及 API 契约不变。

2026-09-30 角色分配工具栏使用无 label 的接收对象名称搜索框（回车/清空查询）及带 label 的主体类型 InPicker（切换即查询），共享分页条件新增 subjectType；后端先按同一可见边界筛选，再分页/计数。角色分配列全部给定最小宽度，名称与来源单行截断及悬浮查看。租户列表不改；其他两个 Tab 的后续增量见下段。

2026-09-30 追加三个 Tab 的列表工具栏：每个 Tab 以独立 tableId 绑定 InTableColumnSetting，并将选择结果经 applyColumnSelection 传给 InTable；角色复用既有 `name` 查询。平台委派 GET 新增可选 `administratorName`，服务端在平台域和治理资格约束内按平台成员 display_name 包含匹配后再分页；批量解析本页管理员名称返回，避免逐行查询。租户委派查询与写入不变。

2026-10-02 平台委派创建/编辑使用与角色向导一致的 pinned 全屏抽屉及左侧四步导航。导航提取至 admin-common，平台既有向导通过轻量封装复用，不改变插件到公共包的依赖方向。操作确认采用角色详情权限树的应用/资源/操作分组；设置范围采用角色向导的分组节奏，但保持委派逐操作多范围和对象选择；预览展示业务名称、时间与完整上限及冲突。共用时间控件分别呈现可选起止时间和必填最长时长，步骤、预览和提交使用同一校验；DTO、后端契约和既有记录保持不变。未保存关闭需确认，宽窄屏使用同一主题 Token。


2026-10-03 用户批准实施 [平台角色工作区与委派优化](./ROLE-WORKSPACE-DELEGATION-REFINEMENT.md)，含独立关联分页、期限模式、自我授权收紧与统一选择器/样式。

2026-10-03 角色左栏修正（用户明确要求实施）：InSplitLayout 统一负责左栏内边距和分隔线，RoleWorkspace 不再重复添加外围边框或工具栏/分页内边距；角色行单行展示名称，详情使用 InTableActions 的普通菜单操作，保留原权限、对象能力和回调，启用状态仍用于业务判断及详情展示。

2026-10-03 左栏按钮对齐与入口精简（用户明确要求实施）：保留 InTableActions 的权限过滤和操作回调，在 RoleWorkspace 局部让可见工具栏按钮等宽撑满行，间距沿用 --in-space-3；不影响其他工具栏或宽度测量。删除关联工作区新增分配按钮和 assign 事件绑定，角色分配 Tab 的流程及来源查看/调整/撤销保持原样。

2026-10-03 委派对象选择器属性透传修复（用户要求消除范围复制后的 warning）：BizIamDelegationCandidatePicker 保留录入框与弹窗的多根结构，关闭自动继承并将非 props 属性显式绑定到录入框容器，外部 class/style 正常应用且不传入弹窗。单选、多选、模型更新及范围复制契约保持不变。

2026-10-03 委派批量范围与对象复制修复（用户要求所有目标完整生效）：以完整操作集合确定同资源目标，不受搜索/分页影响；确认覆盖后在一个新草稿中完成所有目标修改，仅提交一次模型更新，避免受控 v-model 连续写入时后续更新覆盖前面的结果。对象复制只作用于同资源且已配置指定对象的其他操作，保持范围不变，各操作使用独立对象数组；取消覆盖不修改草稿，提交后仍由既有草稿监听使预览失效。

2026-10-03 委派列表展示优化（用户要求实施）：状态使用与角色分配相同的 StatusTag 和中文映射，有效为 info、撤销为 warning；直接消费后端记录状态，不在此推算有效期状态。公共时长格式化函数将已有 Duration 转为天/小时/分钟/秒，列表和平台委派详情/预览复用；UNLIMITED 显示不限期限，缺失/无效时长显示未设置，不修改提交值和接口契约。

2026-10-03 角色工作区分页弃用警告修复（用户要求处理）：角色左栏、相关授权/委派/诊断选择器将 ElPagination 的 small 改为 size="small"；InTable 的小尺寸使用 size，非小尺寸继续由 ElPagination 的既有全局尺寸决定，保留原行为。遵循 [Element Plus 分页尺寸契约](https://element-plus.org/zh-CN/component/pagination.html)，不升级依赖、不修改页码、分页条件及事件。

## 2026-10-03 角色分配状态筛选（approved → implementing）

复用 InPicker 和 useServerPaging，筛选值写入 `IamListQuery.effectiveStatus` 并通过既有参数与 Query Key 通道传给平台分配接口；全部省略该参数，切换调用现有 search 重置页码。共用计算状态枚举与中文映射，三个查询条件继续在 tools-start 展示，列设置位置及其他 Tab 不变。后端在分页前筛选计算状态，前端不自行推算时间/来源。同步 API 与来源副本，人工验收单列。

2026-10-04：两个授权主列表统一消费后端 `id DESC` 的页顺序，无需新增前端排序状态、请求参数或本地排序。同步 API 与权威副本；页面验收包含创建后刷新、搜索、状态筛选及跨页顺序。Leaf 号段发号仅趋势递增，默认排序定义为 ID 倒序。


## 2026-10-05 平台多角色分配与范围配置

已获用户批准，需求、接口、兼容和任务见 [ASSIGNMENT-MULTI-ROLE-REFINEMENT](./ASSIGNMENT-MULTI-ROLE-REFINEMENT.md)。新建支持多个角色（每个角色一个固定版本），范围沿用角色定义、对象参数独立，统一有效期；编辑仍固定版本。开发与人工验收分别记录，保留已有未提交改动。


2026-10-05：用户批准分配范围步骤调整，第二步选择角色与有效期，第三步独立范围配置/全部权限视图、全局进度及跨页遗漏定位；新建和编辑均可调整指定对象。详见 [分配范围配置增量](./ASSIGNMENT-MULTI-ROLE-REFINEMENT.md)，HTTP DTO 与后端范围校验契约保持。


## 2026-10-05 平台范围对象识别收紧（用户已批准）

后端改为按实际应用/资源关联识别对象候选；同资源自定义操作和内置操作行为一致，全部委派上限继续相交。分配、委派、诊断和已选回显/写入使用相同识别，接口和页面契约不变，本轮无需修改前端代码。未知资源保持不支持，跨资源参数不允许混用。后端实施与定向回归后同步来源，页面人工验收独立记录，主状态保持 implementing，不更新 current。


## 2026-10-05 资源字段策略与分配升级

已批准 [资源扩展增量](./RESOURCE-EXTENSION-REFINEMENT.md)，按后端同源契约实施平台字段策略及升级步骤交互；主状态 implementing，人工验收单列。


## 2026-10-05 平台角色字段权限（用户已批准）

平台角色五步创建/四步编辑、字段权限按资源配置、固定版本只读摘要及预览，独立字段策略入口退出。共享/租户流程不变；宪章符合性：业务留platform插件、复用admin-common，API/R/类型及主题组件保持统一。任务及验收见 [ROLE-FIELD-AUTHORIZATION-REFINEMENT](./ROLE-FIELD-AUTHORIZATION-REFINEMENT.md)。

2026-10-05 用户批准测试阶段直接替换平台字段模型：删除迁移开关、平台旧页面及启用标志；资源能力与角色字段配置直接生效，租户流程保持原行为。增量任务见[角色字段权限](ROLE-FIELD-AUTHORIZATION-REFINEMENT.md)。

2026-10-05最终直接替换：平台旧字段页面/API模型和roleFieldsEnabled标志已清理，字段能力直接用于角色配置。DC01–DC04开发及自动化完成，admin-common92、platform116项、三包类型、只读lint、边界与两管理台构建通过；主change仍implementing，RF08人工待用户。权威来源以SOURCES.md最后一表为准。

## 2026-10-06 平台超级管理员与应用导航

用户已批准实施，增量 implementing；规则、任务及独立验收见 [PLATFORM-SUPER-ADMIN-APPLICATION-NAVIGATION](./PLATFORM-SUPER-ADMIN-APPLICATION-NAVIGATION.md)。


## 2026-10-06 平台成员字段展示与编辑边界

用户已批准实施，见 [增量说明与任务](PLATFORM-MEMBER-FIELD-UI-REFINEMENT.md)。本增量开发及相关自动化完成、进入validating，人工MF04待执行；不提前更新current、不提交，保留已有修改。


## 平台成员角色配置闭环（2026-10-06）

见 [PLATFORM-MEMBER-ROLE-EDITOR.md](PLATFORM-MEMBER-ROLE-EDITOR.md)，approved → implementing；MR04 人工独立验收。

## 强制改密闭环（2026-10-06）

用户已批准实施，approved → implementing；需求、受限登录交互、契约与 FP01–FP05 验收见 [强制改密增量](./FORCED-PASSWORD-CHANGE.md)。不更新 current、不创建提交。
