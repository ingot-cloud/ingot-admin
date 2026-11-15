# 接口契约

浏览器均增加同源 /api 前缀；使用 R<T>，时间为 UTC ISO-8601，新增 ID 使用字符串。

| 方法 | 路径 | 请求/结果 |
|---|---|---|
| GET | /bff/auth/me | 增加 contextVersion、expiresAt |
| POST | /bff/auth/tenant/organizations/query | page/pageSize/keyword；当前组织、候选分页、switchableTotal |
| POST | /bff/auth/tenant/switch-transactions | tenantId；固定来源和目标的 PREPARED 事务 |
| POST | /bff/auth/tenant/switch-transactions/{id}/commit | 空 JSON；幂等执行，成功设置 Cookie |
| GET | /bff/auth/tenant/switch-transactions/{id} | 只读阶段、期限及 sessionEstablished |
| POST | /bff/auth/tenant/switch-transactions/{id}/resume | 空 JSON；只恢复当前有效的同一结果 |

候选分页默认 20；switchableTotal 为未加搜索的其他有效组织总数，total 为匹配数量。
当前会话来自 HttpOnly Cookie；token 由 BFF 服务端传给 Auth 校验，不下发浏览器。
Auth 内部提供校验/组织查询、目标解析、按事务 ID 幂等签发与结果查询。IAM 提供按可信账号的关系分页和目标成员解析，不返回密码。

错误：400 参数、401 token/会话失效、403 来源/资格、409 BFF_CONTEXT_CHANGED 或事务冲突、410 过期、429 容量、503 依赖故障。恢复依赖原绑定、指纹、当前结果代次与有效结果 token，不能靠事务 ID 建立新身份。

## 公开数据结构

- me 新字段：contextVersion:string，expiresAt:UTC Instant。contextVersion 是公开事务 ID，不能当作认证凭据。
- OrganizationQuery：page 从 1 起（默认 1）；pageSize 默认 20、最大 200；keyword 可选，trim 后最大 100 字符。
- OrganizationSummary：id:string、name:string|null。
- OrganizationPage：currentTenant、currentTenantAccessible:boolean、records:OrganizationSummary[]、total:number、switchableTotal:number、page、pageSize。
- OrganizationSwitchView：transactionId:string、tenantId:string、stage、expiresAt、recoveryExpiresAt:Instant|null、sessionEstablished:boolean|null（仅完成时有值）。不返回 sid、正式 sessionId、AT/RT 或 Cookie 内容。
- stage：PREPARED、ISSUING、COMMITTING、COMPLETED、FAILED、EXPIRED、UNKNOWN。执行租约到期后提交只查 Auth 原结果，不再次签发；查询为只读，不推进事务。

查询、创建与提交同时携带 Cookie、X-CSRF-Token、In-Bff-Context-Version 和配置要求的 In-Ca-Sig，并校验精确 Origin 与应用。上下文在请求启动时固定，不因 CSRF 准备或重试改绑新身份。
恢复补发不依赖已撤销来源 token；使用原绑定/指纹、当前已交付结果代次与新 token/sid 的权威有效状态。登录或退出后的旧结果拒绝恢复。

## 内部执行面

所有内部端点使用 INNER 通道；它只控制可达性，不能替代用户 token 的身份验证。

- Auth POST /inner/organization-session/verify：TenantSessionProof → 最早绝对截止。
- Auth POST /inner/organization-session/organizations/query：proof + query → OrganizationPage。
- Auth POST /inner/organization-session/target：proof + tenantId + 预分配 resultSid → 最早绝对截止；不签发。
- Auth POST /inner/organization-session/operations/{id}：同一输入，操作 ID 为 BFF 公开事务 ID → 原幂等结果。
- Auth POST /inner/organization-session/operations/{id}/result：只读原结果；尚无完整结果时 data:null，不能重新签发。
- IAM POST /inner/organizations/query：服务端可信 accountId + currentTenantId + query → 关系分页。
- IAM POST /inner/organizations/identity：服务端可信 accountId + tenantId → 当前有效成员 AuthorizationContext、账号名与目标部门。

TenantSessionProof 含服务端 AT、sid、账号、租户、客户端及 notAfter；IssuedOrganizationSession 含 sid、AT/RT、绝对截止，仅允许 BFF 服务端消费。敏感 DTO toString 脱敏，该 Auth Feign 客户端关闭日志；复用的签发、存储、转发与撤销日志不输出会话标识。

## F08 内部账本协议（approved 2026-11-13）

浏览器接口保持上述路径/字段。logout成功现要求持久撤销提交；503/超时不能当成已注销，重试针对捕获的contextVersion/root，不套用新Cookie身份。Gateway/资源的权威读取失败503，不使用旧Redis或JWT-only。

内部增加session-authority解析及操作prepare/activate/result/close端口：请求包含服务端AT或Cookie/绑定摘要、app/client/domain、固定来源root/sid/generation/slotEpoch、opId、请求摘要和执行fence；账号/成员由服务端解析。操作结果只在内部包含加密凭据所需信息，公开不增sid/token/sessionId。未知操作提交410，输入/版本不一致409；依赖故障503而非空结果。INNER身份不替代用户token。

原organization-session签发适配到PENDING候选与原子activate，不能由旧调用隐式激活新身份。me/结果确认/resume均检查账本当前实例/代次/撤销及原截止；恢复不返回已消费旧RT。当前签名密钥/JWKS路径保持，持久密钥取代Redis唯一存储。

## F08内部服务认证与注销响应（approved 2026-11-13）
- POST `/inner/session-authority/bff-command`：固定用途BffLedgerCommand/R<BffLedgerResult>，BFF可调用已注册命令，Gateway仅READ_SESSION；其他角色拒绝。
- POST `/inner/session-authority/access`：实际AT+sid，R<AuthorityIdentity>只返回已生效的当前身份，不含凭据。
- 独立调用者密钥：In-Authority-Key-Id、In-Authority-Signed-At（UTC ISO-8601）、In-Authority-Signature；HMAC-SHA256绑定方法、精确路径、时间及已知DTO的规范化语义，30秒时钟窗口。Inside不替代签名或用户token。该签名不是一次性票据；窗口内重放仍读取当前账本，写命令由原操作/绑定代次幂等。生产内部链路须TLS或等效加密服务通道，凭据与请求体日志关闭。
- 浏览器DELETE `/bff/auth/logout` 保持R<void>，携带请求创建时固定的In-Bff-Context-Version及现有Origin/CSRF。200只表示持久撤销，不下发正式/绑定Cookie的Set-Cookie；网络未知不得视为完成。Cookie按原截止自然过期，新登录覆盖。此修订已由用户明确批准（F08-C01）。

F08-C02（approved）：IAM增加受服务认证保护的安全变更结果查询；Auth增加固定操作/摘要/目标的凭据与既有撤销范围阻断/完成契约。IAM结果只证明本地事务提交/回滚，不提供认证放行，未知保持503和阻断；不新增公开OAuth grant。具体状态/fence见IAM-MUTATION-FENCE-REVIEW.md。

## F09 内部恢复与错位注销（approved 2026-11-14）
- `BffLedgerAction.RECOVER_SESSION`：仅签名BFF角色；appId、结果Cookie id、原bindingId及公开contextVersion由BFF从原事务组装。只读返回当前同一结果，先后复验凭据代次与实时账号状态，不激活或延长身份；错误401/403/409/410/503维持既有语义。Gateway不得调用。
- IAM新增`POST /inner/organizations/recovery-account`，可信accountId与服务端确定的initialCredentialLogin，返回`R<Boolean>`；只校验账号状态，不提供业务成员/权限，不返回密码/凭据。缺失、失败、false均不能放行恢复。
- 浏览器登录resume路径不变，改用严格恢复命令。注销请求仍为捕获的contextVersion+实际Cookie及现有CSRF/Origin；绑定错位时增加原正式Cookie的账本所有权验证，不能靠事务ID关闭其他root。200仍无正式/绑定Set-Cookie。

前端共享HttpClientHooks增加可选onRequestCreated(config):void同步元数据钩子；admin-core注入身份捕获，所有请求别名在Axios调用前执行，未配置的消费方行为不变。

## F11 内部交付门禁与me语义（approved 2026-11-15）

公开路径、响应R<T>、状态码和时间契约不变。BFF内部COMMIT、TRANSITION、REGISTER_ISSUANCE凡返回COMPLETED结果及session，均经过统一严格交付门禁；失效401、身份/事务冲突409、过窗410、依赖503，失败不得下发Cookie。不能用完成事实、原正式AT或先前预检代替当前凭据/账号/结果校验。Gateway没有恢复/交付授权。

auth-core AuthApi.me保留签名与响应类型，去除更新全局contextVersion的隐式副作用。admin-core宿主负责验证和原子接纳；组织切换flow只返回实际me供宿主接纳。内部请求元数据保存创建时暂停状态和只读bootstrap标志，既不发送公开响应也不替代服务端安全校验。

## F12 验证与兼容边界（approved 2026-11-15）

不变更公开/内部接口、响应、错误、时间、Cookie或DDL。只在独占验证路由暂停/故障，GR/身份强校验不降级；性能移交不解除正式发布门禁。A01–A13仅对已标证据范围下结论。

F12兼容性验收发现（2026-11-15）：既有标准POST /oauth2/revoke在有效RT场景失败，见[脱敏复现](LEDGER-F12-OAUTH-REVOCATION.md)。未修改公开接口或将400改定义为成功；需修复后才能通过兼容验收。本轮未实施新设计。

## F13 标准撤销契约修复（approved 2026-11-15）

保持POST `/oauth2/revoke`表单token/可选token_type_hint及既有客户端认证、标准空200/认证错误语义；不包装为新增R接口。未知/重复token幂等200，已知他注册客户端token invalid_client且不撤销；依赖/权威事务不可用503。RT撤销按固定sid关闭RT族和全部该sid AT，仅关闭仍指向该sid的root；已消费旧RT不扩展到新sid。AT单独撤销只失效该token。不得凭sid/账号参数或内部标识替代客户端认证与token持有证明。Browser/BFF Cookie、现有路径、UTC与数字时间语义不变，无DDL。

## F14 恢复与AT-only兼容修复（approved 2026-11-15）

公开组织切换resume路径及R响应不变，内部改为既有BFF角色RECOVER_SESSION，不能以普通READ_SESSION或通用组织verify代替严格恢复；Gateway仍无恢复权。失败不发Cookie，错误语义保持。标准/oauth2/revoke空200、客户端认证及幂等不变；唯一AT撤销且固定sid无其他未过期ACTIVE/PENDING的AT/RT时，退休该sid并释放并发名额，只关闭仍指向该sid的root；其他合法凭据和并发新登录隔离保持。不新增接口/表/字段/序列化/时间格式；Auth/BFF协调更新，旧BFF不能作为修复包验收。

F14验收更新（2026-11-15）：F14两项审查修复已完成：57定向包含于八模块418项回归，零失败/跳过；三VM双向真实验收40组、换主后3项GR及静稳十表一致通过。A13/V02本地三VM功能安全范围重新收口；性能独立仍未通过、目标发布另验，不更新current、不归档、不暂存/提交。见[F14报告](LEDGER-F14-RECOVERY-AT-ONLY.md)及[验收矩阵](ACCEPTANCE-A01-A13.md)。 无接口/DDL/序列化或时间契约变更，Auth/BFF协调更新。
