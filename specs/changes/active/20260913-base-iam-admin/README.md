# 20260913-base-iam-admin

> 状态：implementing
> 2026-09-16 双入口 BFF 与完整 IAM 对齐增量：implementing（规格已补齐，后端先行）。原实现进展与历史证据保留。

## 目标与范围

完整接入后端 IAM 身份、权限和页面契约，补齐双入口 BFF 登录。一份 apps/admin 源码按平台/租户分别配置构建并部署；apps/auth 保留租户登录，新增 apps/auth-platform；四个同主域 HTTPS 子域。平台与租户独立认证且可同时在线；单租户自动完整认证，多租户选择。登录事务、交接与 host-only Cookie 由 BFF 管理，浏览器不传 domain/OAuth 参数/任意返回 URL。

范围包含 admin-core/admin-common、平台/组织/安全插件全部 IAM 页面与必要辅助调用、auth 公共包及页面插件、双登录 App、管理台完成页和部署配置。包含账号治理、本人资料/密码、字典/发号/社交配置、成员导出状态和已实现页面的完整向导/详情/冲突处理；不以之前已勾任务或接口数量替代完成证据。

不包含 SSO、跨主域部署、扫码认证、平台代入租户、会员重构、数据库迁移、额外业务微服务或通用规则执行器。当前只有静态二维码的入口隐藏；Member 既有能力保留。

## 输入与职责

后端来源为同级 ingot 的 20260912-iam-identity-access-management，2026-09-16 同步当前管理面 OpenAPI 96路径/161操作、完整 schemas/examples、入口映射与登录契约。x-runtime-implemented 仅表示后端控制器接入，不证明前端已实现或真实 HTTP 已通过。BFF-LOGIN 是待实施契约，不混入 96/161。

接口真相归后端，前端副本按字节复制。没有消费或移动 inbox；来源及 SHA-256 见 SOURCES。旧来源记录保留于 sources/history。后端 B01–B06 与前端 N01–N10 相互依赖，不能用前端 Mock 代替后端认证和权限证据。

## 阅读与工件

1. [需求](./REQUIREMENTS.md)、[设计](./DESIGN.md)。
2. [BFF 登录权威副本](./BFF-LOGIN.md)、[IAM 接口](./API.md)、[逐页交互](./INTERACTIONS.md)。
3. [逐操作对接矩阵](./IAM-INTEGRATION.md)、[任务](./TASKS.md)、[验收](./ACCEPTANCE.md)。
4. [来源和剩余边界](./SOURCES.md)、[契约快照](./sources/contracts/README.md)。

## 完成门禁

现有 TASKS 勾选保留为历史阶段进展；新增任务全部未完成。增量确认后实施，真实四站点登录、非超管 IAM 联调、CI/镜像验证完成后才更新 current 并归档。不提前勾后端 T16/T17 或 F 系列。未请求提交，不创建 commit。

- 完成日期：未完成。
- 提交或 PR：未创建。
- current：未更新。
- 差异：由“auth仅必要更名、不改协议”扩大为固定域BFF与会话交接；辅助接口改为按当前映射逐项处理，旧迁移要求退出。
