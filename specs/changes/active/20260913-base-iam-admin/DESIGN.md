# IAM 前端设计

## 1. 现状与替换

当前 admin-core 从 /api/pms 获取用户、菜单、权限；授权指令存在 mounted 时删除 DOM 的模式。组织角色基本信息、绑权和 DataRuleDrawer 分离，旧租户追加层语义无法表达差异移除。新实现统一接入 IAM bootstrap、响应式能力、角色向导和版本差异。

保留 Vue 3 + strict TypeScript + Pinia + TanStack Query + Element Plus + UnoCSS。使用 InDetailDrawer、InDetailIdentity、InDescriptionList、useDetailEditSession、InBizTabs；不重新搭建视觉体系。

## 2. 页面路径、插件和导航注册

下列是目标页面四件套根目录，位于各 plugin/src/pages，使用 IndexPage.vue、table.ts、useOps.ts、components/；向导/详情使用内部组件或子页面。插件 src/plugin.ts 注册 canonical viewPath；浏览器 path 与注册键分开，不从路径推导 ACTION。

| 插件/页面根 | 目标浏览器 path | canonical viewPath | 接入模块 |
|---|---|---|---|
| platform/admin/tenant | /platform/tenants | platform.iam.tenants | api/iam/tenants |
| platform/config/app | /platform/applications | platform.iam.applications | api/iam/applications |
| platform/config/plan | /platform/plans | platform.iam.plans | api/iam/plans |
| platform/config/shared-role | /platform/shared-roles | platform.iam.sharedRoles | api/iam/shared-roles |
| platform/admin/user | /platform/personnel | platform.iam.personnel | api/iam/personnel |
| platform/admin/authorization | /platform/authorization | platform.iam.authorization | api/iam/roles, assignments, delegations |
| org/contacts/user | /org/members | org.iam.members | api/iam/members, departments |
| org/contacts/group | /org/groups | org.iam.groups | api/iam/groups |
| org/settings | /org/settings | org.iam.settings | api/iam/settings |
| org/authorization | /org/authorization | org.iam.authorization | api/iam/roles, assignments, delegations |
| org/applications | /org/applications | org.iam.applications | api/iam/applications |
| org/workbench | /org/workbench | org.iam.workbench | bootstrap applications |
| org/directory | /org/directory | org.iam.directory | api/iam/directory |
| security/member-permissions | /org/member-permissions | security.iam.memberPermissions | api/iam/member-policies |
| security/authorization-audit | /platform/authorization-audit 或 /org/authorization-audit | security.iam.authorizationAudit | api/iam/authorization-audit |

现有 security 会话/策略/事件、platform 字典保持页面实现和注册键，归入新导航并校对新授权。无后端功能的运维页不新增。角色详情与升级由角色页进入，授权记录/管理员为 Tab；诊断为抽屉/详情工具，不新增侧栏一级入口。

菜单由后端过滤后返回，前端不能再硬编码一份独立有权菜单。以上 path/viewPath 是前端注册目标，T01 须与后端菜单种子对齐；未对齐不生成“页面已可访问”的验收结论。旧角色/权限/数据范围独立入口在新路由切换时收敛，必要代码复用不保留旧接口兼容。

## 3. 公共能力

packages/admin-core 承担身份、bootstrap、路由、reactive useCapabilities、授权刷新、错误处理。只保存 actionCodes 作为功能依据，角色仅展示；对象操作需要同时满足 actionCodes 与服务端 capabilities。

packages/admin-common 新增无页面的 iam models/enums、类型化范围与主体选择、角色操作编辑、差异展示、升级冲突展示、诊断结果展示。业务组件采用 Biz*，底层视觉 In*。公共组件通过 props/callback 接收查询或提交能力，不导入 plugin API，不包含路由页。

平台/组织分别建立 api/iam，具名 XxxAPI 返回 Promise<R<T>>，统一 import request from "@/net"；对应 .query.ts 使用 Query Options。公共 DTO 放 admin-common，平台/组织特有 DTO 放各自 models/iam。接口字段只以 API.md 和校对后的 OpenAPI 为准，不在本设计复制平行字段表。

页面适配器把服务端 Page.items/total 映射到现有分页组件；不要求全仓分页模型变更。不对 Member API 做字符串全局替换。扫描现有 PMS 引用按 IAM/辅助能力/会员/认证协议分类，只调整经确认的服务边界。

## 4. 身份与查询生命周期

Bootstrap 一次提交 profile、applications、menus、actionCodes 及 version/expiresAt 到 store，失败不留下半初始化界面。并发 bootstrap/refresh 共用进行中 Promise。

Query key 含管理域、tenantId、account/memberId 和 contextEpoch，业务筛选沿用现有网络规范，敏感筛选使用现有安全指纹，不把手机等原值写 key。上下文切换：递增 epoch → 取消旧请求 → 清旧 query、详情、草稿和授权 → 重新认证/bootstrap；迟到响应比较 epoch，不能回填。

授权版本改变时失效受保护列表/详情、预览、字段和对象能力，更新菜单；合法空权限清空入口。到期后在进入受保护页/提交前 single-flight 刷新；窗口重可见及 403 刷新。不增加持续全局轮询，服务端仍执行最终期限。

503 不登出且不伪造空权限；标记授权不可用、阻止操作、隔离旧业务数据不作为新结果展示。失败不自动重试 mutation。网络 412/信封/上传下载沿用既有协议，不由 IAM 更名改写。

## 5. 草稿、预览与差异

独立 draft 状态不被后台 refetch 覆盖。变更影响操作、范围、主体、基础版本、期限或规则时清除旧 preview 的可提交状态；预览响应比较 draftRevision/contextEpoch，旧响应不回填。

保存使用服务器预览版本和 expectedVersion 再提交完整类型化输入；preview.valid 仅为 UX 条件，服务端重新鉴权。无效项在对应步骤/字段显示；向导可返回修订。提交中防重复，成功后刷新关联角色/分配/诊断/query，不对权限做乐观扩大。

共享角色定制只产生 delta，切换视图不创建持久化；恢复基础删除覆盖项。升级冲突按服务端稳定 key，不能客户端选默认强行通过。角色发布默认不选旧授权升级，展示仍使用旧版本的事实。

字段 form 只装载可编辑原值，hidden/masked 不进入编辑 payload；角色编辑收窄不误作为跨角色全局 deny。人员选择器使用服务器 purpose 白名单，不能退回全员接口补齐不可见条目。

## 6. 接口集成门禁

源 API 仍为目标契约，以下均须后端交付/校对后解除，不在前端猜测：
- 每个菜单/按钮的明确 ACTION code 与完整 OpenAPI schema、必填只读、错误信封、分页过滤。
- 平台人员/治理角色具体接口；共享角色版本发布、系统角色与本地/定制 kind 的完整区分。
- purpose 选择器实际 endpoint、可选资源能力、组引用与有效成员分页协议。
- 角色旧授权升级命令与冲突 resolution payload、默认策略/显式策略版本结构。
- 审计导出、成员导出创建/进度/下载生命周期及相应权限。
- 租户应用停用命令、部门移动和批量命令精确 DTO、状态枚举。
- 服务更名涉及安全/字典/认证辅助接口的确认清单。

这些是对接完整性缺口，不改变已确定产品行为。T01 记录后端版本和差异；若语义变化先修改并确认 Spec，禁止用 any、假路径、硬编码允许掩盖缺口。批准后可先做布局/组件夹具，未校对接口不能上线。

## 7. 与 CONSTITUTION 符合性

| 原则 | 符合 | 落点 |
|---|---|---|
| apps 为组合根、插件不互相依赖 | 是 | 业务页面放 plugin，共享无页面能力放 packages |
| strict TS / 具名 API / Query | 是 | 无 any，枚举显式，XxxAPI + .query.ts |
| 页面四件套 | 是 | 表格、操作、页面、组件分离 |
| Token / UnoCSS / 既有详情标准 | 是 | 只读详情与编辑会话复用 |
| SDD 与接口真相 | 是 | draft；API 副本来源可追踪，current 验收后更新 |

无需修改项目宪章。本次不执行格式化、构建生成声明或业务测试，因为仅生成文档。
