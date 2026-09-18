# IAM 前端任务

> 主 change 状态 implementing；2026-09-16 增量 draft，尚未实施。下方 T00–T11 勾选保留为旧阶段记录，旧77/132不再是目标基准；当前96/161及双入口契约以 SOURCES/BFF-LOGIN 为准。历史勾选不证明本轮完成。

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

## 验证与收尾

- [ ] T12 组件及集成测试、静态检查。
  - 依赖 T11；执行受影响 packages/plugins 单测和 type-check、lint:check、依赖边界检查及 admin build；不用 lint --fix 修改无关文件。
- [ ] T13 非超管端到端测试与全新系统联调。
  - 依赖 T12 和后端可用环境；验收 ACCEPTANCE 全部通过，提供后端 change 的 F01–F07 证据。不得用夹具假装通过。
- [ ] T14 更新 current 的页面行为及归档引用，记录完成后归档。
  - 依赖 T13；不把 API 全文写入 current，不把后端迁移标记为前端完成。
- [ ] 未明确请求提交时不 commit；提交时使用仓库约定 skill。

## 2026-09-16 增量任务（全部待实施）

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
| [ ] | N10 | 非超管真实后端全矩阵和四站浏览器验收，填证据；通过后更新current并归档 | N09、后端B06/可用验收环境 / A01–A23、L01–L12、F01–F09 |

执行顺序 N01 → N02/N03 → N04 → N05/N06/N07 → N08 → N09 → N10。已有 T12/T13/T14 的收尾必须包含这些增量；后端 T16/T17/F 项仅有对应真实证据才允许勾选。

## 本轮实施进展（2026-09-16）

已落地但未勾选验收：`@ingot/auth-core`；两套登录 App；管理台拆成 `apps/admin`（租户，CODE=`ingot-admin`，ID=`tenant-admin`）与 `apps/admin-platform`（平台，CODE=`ingot-platform-admin`，ID=`platform-admin`）；`/auth/start` `/auth/complete`；bootstrap 域校验；切租户/退出 BroadcastChannel。登录站 CSRF 按 `transactionId` 绑定：新事务重新 `POST csrf`，过期/`BFF_BINDING_MISMATCH` 清缓存后回 `/auth/start`。N05 已补平台账号页 `platform/iam/accounts`、应用资源/操作/菜单详情 Tab、套餐创建编辑、平台人员/组 Tab、租户开通预览提交；完整联调与 N06–N08 仍待验收，故 N02/N05–N10 不勾选。
