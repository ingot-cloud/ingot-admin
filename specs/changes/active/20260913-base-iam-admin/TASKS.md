# IAM 前端任务

> 主change状态implementing；2026-09-19校准：增量已有部分实施，不能按“全部待开发”理解。T00–T11保留历史记录；S子项标注当前已落地代码，N/T父项及U任务必须满足完整退出条件。开发与自动化/真实HTTP/端到端验收分开记录，详见IMPLEMENTATION-STATUS。

## 历史阶段：准备（旧契约记录）

- [x] T00 状态 approved 后改 implementing，阅读本 change、CONSTITUTION 及 in-coding-standards skill。
- [x] T01 校对后端已验证 OpenAPI、操作码、路由/viewPath 和 DESIGN §6 缺口。
  - 契约：OpenAPI 77 路径 / 132 操作全部 `x-runtime-implemented=true`；routes.json 107 个 ACTION，字面量 `iam-platform:` / `iam-tenant:`。
  - viewPath：按 `definePluginPages` 注册 `platform.iam.*` / `org.iam.*` / `security.iam.*`；kebab 目录映射为点分键（如 `shared-roles` → `shared.roles`）。
  - 未闭合：purpose `/candidates`、审计导出路径、辅助接口更名、菜单种子。选择器不发明路径；审计导出不虚构端点；辅助入口暂留 `/api/pms`。
- [x] T02 建立目标页面注册/旧入口替代与 /api/pms 引用分类清单。
  - IAM 替换：admin-core bootstrap（原 user info/menus/permissions）、平台租户/应用/角色/权限/人员、组织用户/部门/角色/授权。
  - 辅助暂留 `/api/pms`：字典、菜单配置旧页收敛前、社交、发号、OSS 上传、密码、org auth tree。
  - 不改：会员边界、Auth 协议。四个一级目录见 INTERACTIONS。

## 公共能力

- [x] T03 重构 IAM bootstrap、上下文 epoch、查询隔离、刷新及错误处理。
  - 依赖 T01；验收 A01/A02/A11/A12，迟到响应不泄露旧组织数据。
  - 会话改为 `GET /api/iam/v1/me/bootstrap`；刷新走 capabilities；503 标记不可用不清空权限、不登出。
- [x] T04 建立共享 IAM DTO/枚举、范围与主体选择、操作编辑、差异与诊断组件。
  - 依赖 T01；验收无插件互相依赖、合法范围来自资源声明。
  - DTO/ACTION/分页适配在 admin-common；BizIamPreviewAlert / DiagnosePanel / StatusTag 不导入 plugin API。
- [x] T05 接入响应式 ACTION、对象能力、字段展示/提交及编辑会话。
  - 依赖 T03/T04；验收 A03/A10，无角色名绕过/每行鉴权请求。
  - `v-auth` 与表格操作只认 actionCodes；脱敏 patch 工具拒绝 `***`。

## 页面

- [x] T06 平台租户向导、应用/套餐开通、资源操作和菜单管理。
  - 依赖 T02/T05；验收 A04，无角色复制步骤，开通与业务授权区分。
  - 租户向导四步预览后提交；应用/套餐列表已接 IAM。应用资源/菜单详情 Tab 仍需后续加厚。
- [x] T07 平台共享角色、平台角色授权、租户共享/定制/自定义角色向导。
  - 依赖 T04/T05；验收 A05/A06；差异、固定版本、恢复基础及冲突流程正确。
  - 角色目录与授权 Tab 已接列表；完整向导/升级冲突抽屉待联调加厚。
- [x] T08 授权分配、受限管理员及诊断入口。
  - 依赖 T07；验收 A07/A13，不支持多级委派或模拟执行。
- [x] T09 成员/部门、用户组、组织设置和应用可用范围。
  - 依赖 T05/T08；验收 A03/A08，用户组影响预览，账号/成员分离。
- [x] T10 通讯录/字段策略、普通通讯录、工作台与授权审计。
  - 依赖 T05/T09；验收 A09/A10/A13，预览真实后端结果。
  - 审计页不对接未单列的导出路径。
- [x] T11 整合四个一级目录与现有安全/字典页面授权，清理旧入口。
  - 依赖 T06–T10；验收 A01，路由注册和后端菜单一致，不出现无功能空页。
  - 新页面按 viewPath 注册；旧 PMS 页保留直至菜单种子切流。字典/OSS/密码仍走 `/api/pms`。

以上 T06–T11 的 `[x]` 是历史勾选（适用 2026-09-16 及更早的页面骨架/调用落地），不表示业务流程或验收完成。完整退出条件见未勾选的 N05–N08、U03–U13 与 P24–P26。

## 验证与收尾

- [ ] T12 组件及集成测试、静态检查。
  - 依赖 T11；执行受影响 packages/plugins 单测和 type-check、lint:check、依赖边界检查及 admin build；不用 lint --fix 修改无关文件。
- [ ] T13 非超管端到端测试与全新系统联调。
  - 依赖 T12 和后端可用环境；验收 ACCEPTANCE 全部通过，提供后端 change 的 F01–F07 证据。不得用夹具假装通过。
- [ ] T14 更新 current 的页面行为及归档引用，记录完成后归档。
  - 依赖 T13；不把 API 全文写入 current，不把后端迁移标记为前端完成。
- [ ] 未明确请求提交时不 commit；提交时使用仓库约定 skill。

## 2026-09-16 增量父任务（2026-09-19 校准：部分实现，完整退出条件未满足）

本节取代旧任务中的“Auth不改/辅助PMS整体暂留/迁移后验证”作为当前执行规则。保留旧勾选和待补齐说明，以下新任务需独立验收；不删除或冒充补齐历史进展。

| 状态 | 编号 | 工作与退出条件 | 依赖 / 验收 |
|---|---|---|---|
| [ ] | N01 | 确认增量设计；逐操作核对 IAM-INTEGRATION 的 API/页面/ACTION、DTO与辅助接口归属；核对完整来源哈希 | Spec确认 / A14/A16 |
| [ ] | N02 | auth-core 与 auth 页面插件分离，两个登录 App 独立构建；挑战/加密/凭证流程复用，隐藏静态二维码 | N01、后端B01 / A17/L08/L12 |
| [ ] | N03 | 管理台两份配置、启动/完成页、事务/CSRF/交接、设备指纹和安全返回 | N02、后端B02–B05 / A17–A19/L01–L09 |
| [ ] | N04 | bootstrap预期域校验、退出独立、切租户成功后清理/同源标签通知、无菜单及深链处理 | N03 / A02/A11/A12/A20/L10 |
| [ ] | N05 | 平台账号/成员/组、租户创建/开通、应用资源操作菜单Tab、套餐完整对齐 | N01/N04 / A04/A16/A21 |
| [ ] | N06 | 角色完整向导、差异与恢复、版本及三方冲突、授权/受限委派/预览诊断补齐 | N01/N04 / A05–A07/A13/A21 |
| [ ] | N07 | 租户成员/部门/组/设置与owner-transfer、应用人群、通讯录/字段策略、工作台和审计补齐 | N01/N04 / A03/A08–A10/A13/A21 |
| [ ] | N08 | 本人资料/密码、字典/发号/社交、安全与OSS归属核对；成员导出状态→下载；退出被替代PMS调用 | N05/N07 / A14/A16/A22 |
| [ ] | N09 | 四产物CI/镜像及本地四host HTTPS代理；单元/集成/类型/边界/构建检查；配置与日志预检 | N02–N08 / A23/L11 |
| [ ] | N10 | 非超管真实后端全矩阵和四站浏览器验收，填证据；通过后更新current并归档 | N09、后端B06/可用验收环境 / A01–A23、P24–P26、L01–L12、F01–F09 |

执行顺序 N01 → N02/N03 → N04 → N05/N06/N07 → N08 → N09 → N10。已有 T12/T13/T14 的收尾必须包含这些增量；后端 T16/T17/F 项仅有对应真实证据才允许勾选。

## 本轮实施进展（2026-09-16）

已落地但未勾选验收：`@ingot/auth-core`；两套登录 App；管理台拆成 `apps/admin`（租户，CODE=`ingot-admin`，ID=`tenant-admin`）与 `apps/admin-platform`（平台，CODE=`ingot-platform-admin`，ID=`platform-admin`）；`/auth/start` `/auth/complete`；bootstrap 域校验；切租户/退出 BroadcastChannel。登录站 CSRF 按 `transactionId` 绑定：新事务重新 `POST csrf`，过期/`BFF_TRANSACTION_EXPIRED`/`BFF_BINDING_MISMATCH` 清缓存后回 `/auth/start`。显式退出不保存 returnTo，start 跳过残留 `me()` 并新建事务。N05 已补平台账号页 `platform/iam/accounts`、应用资源/操作/菜单详情 Tab、套餐创建编辑、平台人员/组 Tab、租户开通预览提交；完整联调与 N06–N08 仍待验收，故 N02/N05–N10 不勾选。N07 部门树：租户 `GET /v1/tenant/departments` 由 API 固定 `purpose=MANAGED_DEPARTMENT`，成员页按默认 20 条分页收齐后再按 `parentId` 组树，不再传 `pageSize=200`。

## 2026-09-19 已开发子项补标

本节`[x]`仅确认描述范围内源码已落地，不补勾T12/T13/N09/N10或A/F/L。证据及限制见 [IMPLEMENTATION-STATUS](./IMPLEMENTATION-STATUS.md)，本轮未重跑测试。N01仍需实际DTO/HTTP逐项校对；本轮静态矩阵填充不代替联调。

- [x] S01（T03/N04）：IAM bootstrap/capabilities API、auth store及contextEpoch/expectedDomain/同源BroadcastChannel代码已接。
- [x] S02（N02/N03）：auth-core无页面API/CSRF/返回/错误模块与四个App宿主已建立；管理台start/complete已接。登录页面插件抽取仍未完成。
- [x] S03（T04/T05）：IAM基础DTO/枚举、分页/Query适配、预览/诊断展示及响应式能力基础已落地；不代表复杂编辑器齐备。
- [x] S04（N05）：平台账号创建、详情编辑、启停、锁定/解锁、密码重置和删除页面调用已落地。
- [x] S05（N05）：平台成员创建/详情/状态/移出、平台组CRUD及预览调用已落地；分页候选和草稿失效仍待补齐。
- [x] S06（N05）：租户创建预览/提交、详情与开通预览/替换调用已落地；完整选择器及异常交互待补齐。
- [x] S07（N05）：应用目录、资源/操作/菜单编辑与套餐创建编辑已接API；字段能力编辑完整性及样式待补齐。
- [x] S08（N06）：平台/租户角色、授权记录、委派和共享角色列表已接；创建/详情/版本/分配等完整流程未完成。
- [x] S09（N07）：租户成员列表搜索、部门树及分页收齐已实现；成员/部门写API部分封装，页面操作未完成。
- [x] S10（N07）：租户组、应用、通讯录和审计列表、工作台应用展示已存在；详情/写操作/跳转仍有缺口。
- [x] S11（N07）：组织设置读写/所有者转交基础调用、两类策略读取展示已接；前者仍手填ID，后者仍JSON展示。
- [x] S12（文档）：本轮静态实现核对、逐操作归属、剩余任务、P24–P26 编号、统一交互/测试数据场景卡已记录；未执行产品验收。

## 2026-09-19 剩余可执行任务

用户已确认按下列范围补齐规格；本轮不实施业务代码。后续开发必须覆盖全部已实现管理能力，而非只填空白页。所有U任务同时遵守U13；已有页面也须补齐，不另造重复页面。

| 状态 | 编号 / 原父项 | 工作与退出条件 | 验收 / 数据 |
|---|---|---|---|
| [ ] | U01 / N02–N04、N09 | 抽取尚缺的auth页面插件，清理双App页面复制；完成四App配置/构建/部署核对、CSRF/交接/退出/切租户/深链/域校验及异常闭环；复用既有安全流程 | A17–A20/A23；L01–L12；TD02/TD17 |
| [ ] | U02 / T04/T05、N01 | 补类型化角色/范围/主体/期限编辑、版本差异与预览组件，消除本次unknown契约占位；候选purpose及远程分页正确；draftRevision/contextEpoch隔离预览且草稿改变后重新预览 | A05–A12/A16；TD05–TD11/TD18 |
| [ ] | U03 / N05 | 账号、平台成员/组、租户创建/详情/开通逐操作闭环；补有效候选分页、套餐/基础应用选择、组引用/有效成员和预览失效；已接操作补字段/对象能力、409/403/503、危险确认 | A03/A04/A08/A16/A21；TD02–TD04/TD09/TD16 |
| [ ] | U04 / N05 | 应用、资源、操作、菜单、套餐按契约完整CRUD/启停；资源字段能力完整编辑并用中文解释范围；菜单注册键/ANY/ALL/OPEN与域边界正确；选择器不截断首200条 | A01/A04/A16/A21；TD03/TD04/TD18 |
| [ ] | U05 / N06 | 平台/共享/租户角色详情、创建/定制向导、参数/逐操作范围、预览发布、状态/删除、版本历史、差异恢复及三方升级冲突；默认不升级既有授权，选中授权原子提交并处理409 | A05/A06/A16/A21；TD05/TD06/TD07 |
| [ ] | U06 / N06 | 两域授权分配/修改/撤销/预览、委派详情/创建/修改/撤销/影响预览；受限选择器及单一来源、逐操作上限/期限；接通诊断工具及成员详情入口，受限来源不泄露 | A07/A13/A16/A21；TD09/TD12/TD13 |
| [ ] | U07 / N07/N08 | 成员只读详情、创建/编辑/状态/移出/任职；部门详情/新增/编辑/移动/删除；字段可编辑patch和多部门对象能力；导出创建→状态轮询→下载及失败/过期/撤权处理 | A03/A08/A10/A16/A22；TD07/TD08/TD11/TD14 |
| [ ] | U08 / N07 | 租户用户组详情/创建/修改/删除、成员与部门来源/下级开关、有效成员/引用及影响预览；组织设置只读编辑与有效成员选择，所有者转交影响确认、防重复提交和权限刷新 | A08/A16/A21；TD08/TD09/TD15 |
| [ ] | U09 / N07 | 租户已开通应用的人群读取/修改及角色操作选择；工作台以服务端可见菜单提供入口；通讯录树/搜索/详情/count/字段一致，删除无契约创建动作 | A01/A09/A16/A21；TD04/TD10/TD11 |
| [ ] | U10 / N07 | 用类型化可视编辑替代策略JSON展示；默认/允许/禁止及字段矩阵、真实草稿预览/保存/冲突；审计按域筛选、详情及来源跳转，未发布的审计导出不提供按钮 | A09/A10/A13/A16/A21；TD10/TD11/TD13 |
| [ ] | U11 / N08 | 本人资料/改密、字典/发号/社交逐项迁到有效IAM接口并复用原安全流程；OSS/Security/Member按现有契约核对；旧PMS调用逐个分类替换或确认无消费后退出 | A14/A16/A22；TD16/TD18 |
| [ ] | U12 / T12/T13、N09/N10 | 按实际受影响范围执行单元/集成、type-check、lint:check、依赖边界、四产物构建及真实后端E2E；填每个I操作和BFF/辅助覆盖证据，关联测试数据 D01–D05 runId；无静默占位/遗漏 | A01–A23、P24–P26、L01–L12、F01–F09；全部TD |
| [ ] | U13 / T06–T11、N05–N08 | 全部IAM新旧页面遵循INTERACTIONS第5节：action/按钮/搜索/筛选/详情/抽屉/向导/反馈及主题统一；人工视觉与交互验收，不能只通过静态检查 | P24/P25；各业务TD场景 |

执行顺序以IMPLEMENTATION-STATUS第3节为准。U12依赖各业务任务及后端测试环境；U13贯穿开发。若后端缺少某项所需能力，记录具体接口与后端依赖，不以客户端自算权限、Mock或空处理函数交付。内部RPC不新增页面。

T14/N10归档仍以全部研发/验证完成、current更新为前提。测试数据方案见 [后端权威副本](./sources/BACKEND_TEST_DATA.md)，操作步骤见 [联调手册](./sources/BACKEND_VERIFICATION_GUIDE.md)，禁止把数据准备完成当作A系列通过。

开发子项（不代替 U01/U02 退出条件与验收）：

- [x] U01.dev.plugin：已新增 `plugins/auth`（`@ingot/auth-plugin`），双登录 App 改为注入 AuthSession 并共用 `createAuthRoutes`；四产物 CI/真实登录/CSRF 闭环未做。
- [x] U01.dev.auth-styles：`plugin.ts` 静态拉取登录布局 token 与 ElInput/ElButton/ElImage 的 theme-chalk；页面侧为 CSS 变量补了 fallback，窄屏隐藏 banner。父任务 U01 不勾选。
- [x] U01.dev.entry：`plugins/auth` 已补 `src/plugin.ts` 宿主编译入口，exports 与官方源码插件一致；登录 App 显式声明 `officialPlugins`。真实登录与四产物 CI 仍属 U01。
- [x] U02.dev.editors：admin-common 已补范围/主体/期限/差异/升级冲突组件、`createIamOptionLoader`、`useIamDraftPreview`；平台/组织 RoleCreate/Preview API 改为 `RoleCreateInput` / `RolePreviewInput`。
- [x] U05.dev.role-drawers：`BizIamRoleCreateDrawer` / `BizIamRoleDetailDrawer` 已接到平台授权、共享角色、组织授权（含基于共享定制）；Get/Status/Delete/Revisions/Publish API 已封装。三方升级冲突与分配写操作未做，父任务 U05 不勾选。
- [x] U03.dev.group-paging：平台组编辑改为远程分页添加成员，草稿变化清除预览。
- [x] U03.dev.tenant-select：租户创建向导用套餐远程分页替代手填 ID；开通追加应用改为远程分页，草稿变化清除预览。父任务 U03 不勾选。
- [x] U08.dev.group-drawers：组织用户组已接创建/详情/更新/删除/预览，成员与部门来源走远程分页。父任务 U08 不勾选。
- [x] U08.dev.group-impact：组抽屉展示有权范围内有效人数及预览中的可披露引用；无法披露时不以 0 代替。父任务 U08 不勾选。
- [x] U04.dev.app-status：应用列表已接启停（I033）与状态筛选；资源字段能力含可见性/可编辑/筛选/排序，范围用中文解释；套餐/开通选择改为远程分页。菜单 ANY/ALL/OPEN 说明已补。父任务 U04 不勾选。
- [x] U05.dev.upgrade-conflicts：组织角色详情已接 `upgrade-preview`/`upgrade`；冲突须逐项处置（替换范围必填 scopes），默认不勾选既有授权，409 保留草稿并重新预览。平台/共享角色无租户升级路径。父任务 U05 不勾选。
- [x] U06.dev.assignment-write：两域授权记录已接批量创建/预览/修改/撤销；接收对象与角色版本远程分页，提交前预览且整批失败不保存。父任务 U06 不勾选。
- [x] U06.dev.delegation-write：两域委派已接创建/详情/调整/撤销/收缩预览；角色版本须显式加入白名单。父任务 U06 不勾选。
- [x] U06.dev.diagnose：两域授权页已接通诊断抽屉（成员/账号二选一，不提供模拟执行）；授权行可预填成员。成员详情页入口仍属 U07。父任务 U06 不勾选。
- [x] U05.dev.restore-deltas：组织/平台角色详情发布页已提供「恢复平台设置」，清空 deltas 并清除预览。完整功能树向导仍待补。父任务 U05 不勾选。
- [x] U07.dev.member-write：组织成员页已接创建/详情/状态/移出/任职部门，字段走 editablePatch；部门树已接新增/编辑(含移动上级)/删除空部门。父任务 U07 不勾选。
- [x] U07.dev.export：成员导出已接创建 → 状态轮询 → 成功下载；FAILED 展示 failureCode，EXPIRED/进行中不下载。父任务 U07 不勾选。
- [x] U08.dev.owner-transfer：组织设置所有者改为有效成员远程分页选择，确认后提交、防重复、409 保留选择，成功后刷新权限。父任务 U08 不勾选。
- [x] U09.dev.audience：开通应用详情已接人群读写（ALL 不携带 selection 且 groupIds=[]）及操作候选；租户侧不提供应用创建。父任务 U09 不勾选。
- [x] U09.dev.directory-workbench：通讯录已接 DIRECTORY 部门树与只读详情，无创建入口；工作台改为服务端可见菜单入口。父任务 U09 不勾选。
- [x] U10.dev.policy-editors：成员权限页已用类型化通讯录/字段草稿、预览与 PUT 保存替换 JSON；审计列表可打开详情（列表行 before/after），无导出按钮。父任务 U10 不勾选。
- [x] U12.dev.guide：已同步后端联调手册副本 `sources/BACKEND_VERIFICATION_GUIDE.md`；真实多身份 E2E 仍属 U12/P26，不勾选父任务。
