# 20260913-base-iam-admin

> 状态：implementing
> 2026-09-19 状态校准：部分基础能力和平台页面已落地，完整业务流程及验收未结束。开发子项见 TASKS 的 S 系列，剩余 U01–U13；详细证据见 IMPLEMENTATION-STATUS。

## 目标与范围

完整接入后端 IAM 身份、权限和页面契约，补齐双入口 BFF 登录。apps/admin 与 apps/admin-platform 为独立宿主，复用公共包和业务插件；apps/auth 保留租户登录，新增 apps/auth-platform；四个同主域 HTTPS 子域。平台与租户独立认证且可同时在线；单租户自动完整认证，多租户选择。登录事务、交接与 host-only Cookie 由 BFF 管理，浏览器不传 domain/OAuth 参数/任意返回 URL。

范围包含 admin-core/admin-common、平台/组织/安全插件全部 IAM 页面与必要辅助调用、auth 公共包及页面插件、双登录 App、管理台完成页和部署配置。包含账号治理、本人资料/密码、字典/发号/社交配置、成员导出状态和已实现页面的完整向导/详情/冲突处理；不以之前已勾任务或接口数量替代完成证据。

不包含 SSO、跨主域部署、扫码认证、平台代入租户、会员重构、数据库迁移、额外业务微服务或通用规则执行器。当前只有静态二维码的入口隐藏；Member 既有能力保留。

## 输入与职责

后端来源为同级 ingot 的 20260912-iam-identity-access-management，2026-09-16 同步当前管理面 OpenAPI 96路径/161操作、完整 schemas/examples、入口映射与登录契约。x-runtime-implemented 仅表示后端控制器接入，不证明前端已实现或真实 HTTP 已通过。BFF-LOGIN 独立于 96/161；后端B01–B05已实现，前端已有接入，完整浏览器验收仍待执行。

接口真相归后端，前端副本按字节复制。没有消费或移动 inbox；来源及 SHA-256 见 SOURCES。旧来源记录保留于 sources/history。后端 B01–B06 与前端 N01–N10 相互依赖，不能用前端 Mock 代替后端认证和权限证据。

## 阅读与工件

1. [需求](./REQUIREMENTS.md)、[设计](./DESIGN.md)。
2. [BFF 登录权威副本](./BFF-LOGIN.md)、[IAM 接口](./API.md)、[逐页交互](./INTERACTIONS.md)。
3. [实现核对](./IMPLEMENTATION-STATUS.md)、[逐操作对接矩阵](./IAM-INTEGRATION.md)、[任务](./TASKS.md)、[验收](./ACCEPTANCE.md)。
4. [来源和剩余边界](./SOURCES.md)、[测试数据副本](./sources/BACKEND_TEST_DATA.md)、[联调操作手册](./sources/BACKEND_VERIFICATION_GUIDE.md)、[契约快照](./sources/contracts/README.md)。

## 完成门禁

现有 TASKS 历史勾选不代表本轮闭环；S子项标注已开发内容，N/U父项按完整退出条件验收。真实四站点登录、非超管 IAM 联调、CI/镜像验证完成后才更新 current 并归档。不提前勾后端 T16/T17 或 F 系列。未请求提交，不创建 commit。

- 完成日期：未完成。
- 提交或 PR：未创建。
- current：未更新。
- 差异：由“auth仅必要更名、不改协议”扩大为固定域BFF与会话交接；辅助接口改为按当前映射逐项处理，旧迁移要求退出。

## 2026-09-19 校准与剩余交付

- [实现核对](./IMPLEMENTATION-STATUS.md)：开发状态为未实现/部分实现/已实现；验证分自动化、真实接口、端到端；不以列表/API封装宣称页面完成。
- [逐操作矩阵](./IAM-INTEGRATION.md)：保留I001–I161，记录现有API/消费落点及U任务；BFF、辅助及内部服务边界单列。I001/I002 为 admin-core 调用链已接。
- [任务](./TASKS.md)：S系列补标已有开发子项；U01–U13覆盖全部已实现管理功能的页面适配、公共组件与统一交互；N/T原编号及历史保留。
- [交互标准](./INTERACTIONS.md)第5节：参考原通讯录的action、按钮、搜索及详情抽屉，统一现有页面和后续新增内容。
- [验收](./ACCEPTANCE.md)：前端补充项为 P24–P26，避免与后端 A24–A26 混淆。
- [测试数据契约](./sources/BACKEND_TEST_DATA.md)：后端测试数据 D01–D05（≠ DESIGN D01）与 TD01–TD18 场景卡；前端后续按同一runId进行多身份真实验收。
- [联调操作手册](./sources/BACKEND_VERIFICATION_GUIDE.md)：功能测试导读、建库/导入逐步操作、四站登录与按页点击步骤。执行证据不自动勾选 P24–P26。

本轮只更新Spec，不改业务代码、接口契约或数据库，不声明测试通过；用户已确认本次补充方案。原change继续implementing，后续按已列任务推进，实际偏离接口或权限设计时另行对齐。
