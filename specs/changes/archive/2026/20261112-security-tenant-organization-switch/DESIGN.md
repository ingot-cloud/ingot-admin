# 持久化安全账本设计（2026-11-13 approved）

批准来源：用户“按这个方案推进，接受一次性重新登录。先把双仓 Spec 和任务更新到 approved，再分阶段实施并复验两组失败场景，先不要提交。”
本修订取代旧纯 Redis 权威及“无需数据库迁移”决策。旧实现/故障证据保留，见 DESIGN-REDIS-HISTORY.md、CLUSTER-ACCEPTANCE.md；发布仍阻断，current 不提前更新。

## 权威与范围

Auth 独占写事务安全账本；BFF、Gateway、资源服务经内部端口读取。Redis 是可删除/重建的派生数据，不证明会话、代次、幂等、授权码消费或撤销有效。涵盖租户/平台交互登录、切换、注销、AT/RT、授权码/预授权兑换、管理员与账号域撤销；平台仍无组织切换。已入场的业务请求不承诺可撤回；撤销 COMMIT 后开始的认证必须拒绝。

MySQL 8.4 三成员单主 Group Replication 为验收目标。账本池使用 BEFORE_AND_AFTER；主节点读写、一致性屏障、innodb_flush_log_at_trx_commit=1、sync_binlog=1、持久磁盘；Router/连接就绪检查及退出栅栏隔离离群/旧主。不能证明已确认提交完整时 503，不提升落后异步副本。不以只读模式继续提供可能过时认证。单实例仅供局部测试，不替代 HA 验收。三 VM 同宿主不宣称物理机级容灾。

## 模型

九张认证权威表由Auth自有适配器维护，位于Auth库。F08-C02另在IAM库增加一张安全变更结果表，仅记录IAM本地业务事务结果，不证明身份有效。IDs 内部用不透明字符串；摘要 HMAC-SHA256，密文 AEAD + keyId + AAD，凭据不进入日志。时间 DATETIME(6)/UTC，协议 NumericDate 保持 epoch 秒，业务接口 UTC ISO-8601。

| 表 | 约束与职责 |
|---|---|
| auth_security_control | 单行 schema/强制模式、authorityIncarnation；灾难恢复生成新实例，绝不复用旧实例 |
| auth_security_binding | app/client/domain + bindingDigest 唯一，指纹/CSRF 安全关联，slotEpoch/currentContext |
| auth_security_context | rootId、账号/客户端/域、immutable rootExpiresAt、当前 sid/generation、关闭状态 |
| auth_security_session | sid 主键、root/generation、身份及 OAuth Authorization 加密快照、状态/版本、截止 |
| auth_security_token | type+digest 唯一；AT/RT/一次性码，sid/family/version，PENDING/ACTIVE/CONSUMED/REVOKED、截止 |
| auth_security_operation | 全局不复用 opId、kind、摘要、固定来源/目标、plannedSid、stage、leaseFence、期限、加密候选/结果、deliveredAt |
| auth_security_scope | 按既有撤销/并发维度的 scopeEpoch 与行锁；避免用户批量撤销与新建会话穿插 |
| auth_security_outbox | 同事务登记缓存索引、清理与审计；至少一次投递、幂等消费、独立重试 |
| auth_security_signing_key | keyId 唯一；加密私钥/公钥/轮换状态，Redis 回滚不丢失已签结果验签能力 |

当前 Cookie 的原始值只在受控加密结果中保存，索引用摘要。候选不能通过 sid 在线态获得身份；资源认证还检查 AT 确属已提交签发记录。合法 refresh 前 AT 按既有期限保留，丢弃候选 AT 永不可用。

## 操作与事务边界

1. prepare：以当前正式 Cookie 对应服务端 AT 验签/issuer/exp/nbf/aud/domain，核对账本会话、账号、绑定、指纹、Origin/CSRF、来源代次；实时 IAM 目标资格。固定来源 root/sid/generation/slotEpoch/account/client/domain/target/截止，服务端分配 opId/resultSid；不接受客户端账号，不能以内部标记/事务 ID 放行。
2. claim：数据库租约与递增 fence 领取操作。IAM/签名不占长行锁；签名器不注册正式在线会话。候选加密持久化仍为 PENDING。
3. activate：同一 Auth 本地事务锁 scope→binding/context→session/token→operation，重验截止、当前来源/版本/账号及目标资格，按既有并发策略处理；激活唯一结果及 token，退休来源及凭据，推进 generation，完成 op，登记 outbox。所有改写有版本条件，不做跨服务伪原子双写。
4. COMMIT 后 BFF 才写同一结果 Cookie。首次实际 Cookie 请求持久确认交付；事务 GET 只读。Redis 更新失败不回滚已提交身份。
5. COMMIT ACK 丢失只查原 op；候选已保存则复用同一字节，过期工作者不能提交。计算可重复，但只有一个持久可用结果。
6. resume 只补发当前有效同一 Cookie：原绑定/指纹、root/当前代次、结果 sid/token、恢复期限均通过；不依赖已撤销来源 token。不复活退出/替换/重新登录结果，不返回已消费旧 RT。
7. 未交付到期结果条件撤销且不恢复来源；重复、竞争、未采用候选可靠回收。未知 op 的 commit 永不创建新 op。

600 秒事务、30 秒执行租约、60 秒恢复与前端 15 秒确认预算保留并受 root 截断。switchableTotal=0 不创建事务、不替换/撤销；搜索空不返回首页。原成员失效按已有账号身份/业务资格分离处理。

## 代次、刷新、注销

root/slotEpoch 隔离重新登录；generation 隔离组织；credentialVersion 隔离刷新。公开 contextVersion 仍为不敏感 opId。A→B→A 每次是新 generation；请求固定捕获来源，不随 CSRF 准备或 Cookie 变化改绑。

logout 关闭请求原本所属 root，不套用迟到请求上的新 Cookie 身份。与同 root 切换竞争时无论先后最终关闭；与新 root 登录竞争不能退出/覆盖新 root。历史合法凭据可在严格绑定/同源校验下仅证明“撤销该原 root”的权限，不能用于切换/恢复。

200 logout/revoke 必须在账本关闭 root/session/family、作废 pending/recovery、写 outbox 后。503/超时为未知，前端暂停业务并持久标记 pending logout、跨页同步，不能自动 me/bootstrap 恢复。1500ms 本地 UI 等待不代表服务端注销完成；注销200仅确认持久撤销，不发送删除正式或绑定Cookie的Set-Cookie；旧Cookie立即失去服务端效力，按原截止自然过期，新登录覆盖同名Cookie，避免迟到删除响应破坏新登录。重试继续针对捕获root。CSRF 失效须合法重备，不以清 Cookie 冒充撤销。

refresh 同事务锁及版本验证：会话/root/scope、RT 摘要/状态、原截止→原子消费旧 RT/保存新凭据及快照/outbox。轮换客户端旧 RT 400 invalid_grant；reuse=true 保留复用策略但仍服从 family 撤销。无通用旧 RT 宽限，不用 refresh 重建已撤销 sid。refresh 先赢则随后注销撤全部；注销先赢则 refresh 拒绝。普通 OAuth 非切换客户端不静默改期限策略；BFF/切换链必须有固定 rootExpiresAt，永不退回滑动策略。

已有改密/禁用/锁定/踢人撤销接入账本，去掉成功 NoOp。涉及 IAM/Auth 跨库时先持久阻断对应既有作用域，再完成业务变更和可靠补偿；失败保持阻断，不恢复旧撤销事实。

## 期限与密钥

BFF rootExpiresAt=min(原 BFF 截止, Auth 凭据链截止)，只能保持/缩短。AT/RT/Redis TTL/后续 refresh/恢复均 cap；Cookie 固定 Expires、无正 Max-Age。数据库 UTC 时钟判断，节点超出允许时钟误差退出就绪。结果与 OAuth/principal 编码带 schema 版本并保留部门不可变性，不放宽 Jackson allowlist。签名/加密/HMAC 密钥持久配置、带 keyId 轮换，不用进程临时值。密钥保留覆盖相应有效凭据截止。

## 接口、资源认证与前端

公开 API.md 路径/R<T>/字符串 ID/stage/错误语义保持；内部新增 ledger resolve/prepare/activate/result/close 契约，严格服务身份+用户 token，固定版本/fence。Gateway Cookie→Bearer 前与资源服务直接 Bearer 均校验账本和已提交 AT；无跨请求正向身份缓存、JWT-only 或 LKG。不存在401、冲突409、过期410、依赖503；不能故障伪装空/null。异步 Gateway 使用非阻塞 RPC。

前端保留独立组织页、零候选、搜索、权限清理和多标签编排。新增注销 pending/重试确认；其他页同步暂停，不因网络未知自动恢复。缺上下文版本409提示刷新；所有旧写请求不自动重放。接口不向浏览器新增 sid、AT/RT 或正式 sessionId。

## 迁移、性能、发布与回滚

用户已接受一次性重新登录。增量迁移创建表/索引/权限/版本记录，不运行删除旧表的初始化；不从 Redis/JWT 自动导入活跃身份。Auth 注册客户端校验迁移不改客户端密钥/授权配置。BFF v2 保留，缓存带实例/结构/代次。终态保留超过最长相关凭据寿命+恢复/时钟边界；清理后未知身份仍失效。

正常业务不写 lastAccessAt；一次索引读取聚合认证事实，Gateway/资源各一次，容量按实际跳数；无全局锁，外呼不占行锁，outbox异步。性能门槛（待实测）：权威认证P95≤15ms/P99≤50ms，切换P95≤500ms/P99≤1s，同资源吞吐≥原基线90%，DB CPU/连接池≥30%余量；峰值/2倍突发、refresh集中、冷缓存及outbox积压。性能不达标不得用正向身份缓存降低安全性。

依次存储准备→ledger-capable 全链部署但关闭切换→暂停入口/排空在途/隔离旧节点→强制账本+拒旧会话→新登录基础验收→反例通过后放量。同作用域不能混跑 Redis-authority 旧节点；readiness 检查能力/schema/模式/实例。
切换前可回退应用并保留表；切换后只回退 ledger-compatible 包，关闭切换不关闭撤销。禁止退回 Redis 权威、恢复旧会话或热删账本。备份恢复必须维护模式、隔离所有旧节点、生成全新 authorityIncarnation 使恢复旧身份全失效，再新登录。

## 复验与宪章符合性

完整门禁和阶段见 phases/LEDGER-PHASES.md。原两组自动选主反例各≥20轮，跨节点切换/退出/refresh竞争≥1000次，零安全违规；自然截止、提交ACK丢失、签名/候选/激活/投递崩溃、DB选主/少数派/旧主重入/备份恢复补验。三VM/真实浏览器与模拟分别记录。相关Gradle、真实Redis/MySQL序列化和UTC、前端定向/类型与两端构建。不以以往288项覆盖新架构。DB与性能实证未达标不关闭发布阻断。
遵守后端 in-framework/SDD；前端 apps→plugins/themes/packages，plugins→packages，无 any，不反向依赖。完整验收后再更新 current/归档，不提交。

### F08-C01 注销Cookie响应修订（approved 2026-11-13）
用户已确认“采用账本撤销确认，注销不删除正式 Cookie”。同名HttpOnly Cookie没有浏览器端的条件删除能力；延迟到达的删除响应可清掉新登录Cookie。因此注销不发送任何正式/绑定Cookie删除头，以账本关闭root/session/RT作为成功事实。匿名绑定按服务端期限失效，下次CSRF准备创建新绑定。前端持久pending注销至服务端确认，确认前暂停业务与新登录。旧Cookie重放401，迟到注销响应不清新登录Cookie；显式清理旧版Cookie仍由合法准备入口处理。

### F08-C02 IAM结果表补充（approved 2026-11-13）
用户确认“批准增加 IAM 结果表（推荐）”。实施IAM安全变更意图/fence/本地原子结果及Auth可靠收敛，具体协议、迁移和验收见IAM-MUTATION-FENCE-REVIEW.md。未知结果持续阻断，不以afterCommit或NoOp作为成功事实。Auth九表保持独占身份权威，新增IAM表不保存密码或凭据。

### 保留作业落地

凭据/会话/root/绑定/事务仅在相关凭据与恢复期限结束至少30天后回收，仍有活跃或未知期限引用时保留。已确认投递任务保留365天且不早于关联root截止加365天；PENDING/RUNNING审计或清理任务永久保留至实际确认。控制记录、scope/credential epoch和跨库未知结果不自动清理，避免ABA；IAM终态结果在具备跨账本归档协议前继续保留。历史验签密钥必须过实际retireAfter加30天且不为当前控制指针才可删除。所有密文先校验AEAD/AAD；每表每分钟最多100条，SKIP LOCKED、CAS删除、独立线程/短事务，依赖故障保留重试。过期未知身份持续拒绝，不从缓存或旧结果重建。

新增002增量保留索引，Auth仍为九表，数据结构控制版本仍为1（只增索引，无编码变更）。001不改；002由部署迁移记录保证只执行一次。应用账号没有DDL权限，清理只作用当前incarnation，灾备旧实例数据另经离线归档。该实现细化已批准的“最长相关凭据寿命加恢复/时钟边界”保留契约，不改变身份截止或撤销语义。

2026-11-14 恢复边界实现细化：resume 使用已有 Auth verify 契约重验结果 token、在线代次与账号安全状态。结果组织成员在提交后失效时，允许交付同一已完成账号会话，由静态选择页或无权限状态承接，不恢复业务权限；不以 currentTenantAccessible 作为 Cookie 恢复门槛。账号禁用、锁定、强制改密、token 撤销及依赖不可用仍拒绝交付。该细化落实已批准的账号身份与组织业务资格分离，不新增恢复权限。

2026-11-14 组织分页线协议细化：total、switchableTotal始终输出JSON数字（包括0），复用现有IAM统计序列化器覆盖Long标识符的全局字符串规则；组织ID继续为字符串。修复真实零候选被前端误作搜索空态的问题，既有搜索/总数语义不变。

2026-11-14 切换并发错误语义细化：内部候选保存因来源代次、消费凭据或执行栅栏已过时而产生OAuth invalid_grant时，返回既有BFF_CONTEXT_CHANGED/409；当前token验证失败仍401，真实数据库/签发依赖失败（包括嵌套异常）仍503。该映射不重新签发、不自动重放、不允许旧来源继续提交；实际竞争批次的503仍须以新脱敏诊断复核。

2026-11-14 权威读取性能落地细化：同一次AT认证的验签密钥读取与身份读取共用一个物理READ_COMMITTED事务和控制/一致性屏障；按实际kid有界读取持久公钥，按token摘要主键联读凭据/会话/root，作用域主键集合批读，仍逐行校验完整AEAD/AAD并在最终数据库UTC时刻严格判断各截止。只合并SQL与事务往返，不增加正向身份缓存、JWT-only或故障降级，不改变并发写入的锁顺序、旧AT续存配置或RT消费语义。无DDL/编码版本变化；真实回归、性能及原故障门禁须以最终包复验。

2026-11-14 登录未知结果恢复细化：Auth已持久登记签发意图后，BFF身份核验或提交回包异常不立即撤销原候选。原操作由账本后台按当前绑定、root、代次、token及截止重新确认后完成；注销、重新登录及未采用结果清理继续阻断或回收。前台未确认提交不设置正式Cookie，不重发密码或token请求。该修正落实原有幂等恢复契约，不放宽身份校验；此前真实初次登录UNKNOWN的触发原因仍须独立复核。

2026-11-14 内部错误传递细化：真实Feign/JDK HTTP测试复现401正文不可取得时，通用解码器空指针导致BFF误返回503。账本/组织专用Feign客户端使用有界错误适配：明确401且正文缺失仍为TOKEN_INVALID；其他无正文或无法解码的响应保持AUTH_UNAVAILABLE，不推断可用身份。完整R错误继续保持原码，不改变校验、负载均衡及Retryer.NEVER_RETRY。该修正落实已批准401/503语义；竞争失败批次保留，修复后重新计数。

## F09 最终审查修复（approved 2026-11-14）

批准来源：用户要求“把这三项问题都修复一下，先同步双仓Spec和任务，再补齐定向测试及相关回归，第2、3项补做真实环境复验”。本修订为本次修复的批准依据；性能继续独立保留，未提交，不更新current或归档。

### R01 请求创建边界
管理台公共Http门面在每个请求方法（含raw/form/head/options）调用时同步捕获身份纪元与contextVersion，之后才进入Axios异步链。重试保留已有捕获值；header/identity拦截器只核对和使用捕获值，异步指纹/CSRF/信封及响应处理不能改绑到新身份。未完成首屏me时保留原创建纪元，身份变化后取消；不重放写请求。共享http-client仅新增可选的同步onRequestCreated元数据钩子，由admin-core注入身份捕获；通用包保持无业务身份依赖；每次调用复制请求配置后捕获，不把身份元数据写回调用方复用的选项对象。

### R02 登录恢复门禁
新增仅BFF角色可用的RECOVER_SESSION账本命令，固定原绑定、已完成操作和结果Cookie；Gateway仍仅READ_SESSION。BFF登录resume改用该命令。Auth先在行锁外读取原当前结果、要求已有凭据证明并校验凭据代次并调用IAM只读账号安全状态端口；在最终本地事务中再次锁定/校验凭据与正式范围，复核原绑定、root、generation、sid、当前AT、指纹、恢复窗口和截止后只返回同一结果。账号、客户端、管理域均由账本确定，失败不发Cookie；依赖故障503。
IAM新端口只校验账号启用、锁定和改密门禁，不要求当前组织业务成员有效。初次新鲜凭证登录原已允许的强制改密入口继续受限可达；恢复能否沿用该入口由Auth固定操作种类及未变化的凭据代次决定，不接受浏览器控制。安全变更后新增的强制改密/改密/锁定/禁用会推进全局凭据代次，旧结果拒绝。普通READ_SESSION/资源AT仍保留既有租户正式撤销范围，不把全局派生栅栏误加到全部普通业务读取。

### R03 绑定错位的注销证明
继续严格校验当前请求的应用、Origin和CSRF。原操作所属绑定与当前绑定Cookie不一致时，仅在当前实际携带的正式Cookie（含只可用于关闭原root的历史合法Cookie）通过账本摘要、完整密文、app/client/domain、原操作绑定、root和指纹校验后，允许关闭该Cookie证明的同一原root。公开contextVersion、事务ID、其他账号/其他root的Cookie均不能充当原root的撤销凭据。
按稳定顺序锁定当前请求绑定及原root绑定，随后锁root并关闭其会话/AT/RT；若原绑定仍指向被关闭root，同时取消旧登录/切换意图并推进slotEpoch，使迟到候选/后台完成不能重新建立身份。原绑定已被后续新root占用时保留新root及其操作；不能因为错位注销取消其他绑定的新登录。注销200保持无正式/绑定Set-Cookie。失败/503保留前端pending意图，重试仍针对原context，不能改绑当前新登录。

### 兼容与验证
公开路径、请求和R结构不变，无数据库迁移/编码变更。新增内部命令与IAM只读账号安全端口需Auth/BFF/IAM协调部署；旧端点或未知命令必须拒绝/503，不能回退普通READ_SESSION冒充恢复。前端身份策略只在admin-core；通用http-client仅提供可选同步元数据钩子，不加入业务依赖。
定向用例先复现后修复；覆盖微任务窗口、全部Http方法与重试、恢复后的跨租户凭据变更/锁定/禁用/强改、成员失效、503/旧root/指纹/窗口拒绝、错位绑定与原Cookie、错误Cookie/公共ID拒绝、旧候选取消及新登录不被误注销。第2、3项使用真实账号、真实Redis/MySQL与同源HTTPS浏览器复验；模拟与真实证据分开记录。原候选10证据保留版本边界，新增修复包单独记录。性能门禁仍未通过。

## F11 已完成结果交付与焦点身份接纳（approved 2026-11-15）

后端在BFF命令执行入口统一拦截携带COMPLETED事务及会话的结果。原提交事务退出后，先验证已登记凭据证明及撤销范围、在行锁外实时查询IAM账号安全，再开启最终事务按既有顺序锁凭据/撤销范围，重新核对原操作、绑定、root/代次、sid、当前token、截止及恢复窗口，才允许结果离开Auth。该门禁覆盖正常完成、已完成快速返回、外呼失败后的completed回退及TRANSITION/REGISTER竞争出口，不依赖调用者主动选择RECOVER_SESSION。新签发已持久化但交付拒绝时保持权威事实，不回滚/重签；可靠清理保持既定职责。IAM外呼不占行锁，普通READ_SESSION/正式AT不增加全局凭据代次限制。

前端auth-core的me为纯查询，宿主统一验证再接纳。admin-core在观测到contextVersion改变时同步标记switchingIdentity、推进纪元并调用既有完整清理，再发布新contextVersion；相同版本不清理。认证插件的初次/现有会话和组织完成路径显式调用宿主接纳能力。焦点路径使用第一次已确认结果进入现有单飞bootstrap，不再次me。HTTP创建钩子固定“创建时已暂停”事实，Header及最终identity门禁拒绝这些请求，也拒绝当前仍暂停的普通业务请求。仅现有公开permit、BFF认证请求及框架内部标记且GET的bootstrap/改密状态读可通行；标记不传到服务端、不跳过contextVersion或纪元校验，不能授权写请求。

兼容：无公开API/ID/时间/序列化/DDL改变，无OAuth grant改变；共享me消费者改为由宿主显式接纳，双端协调构建/发布。新增HTTP元数据为可选内部字段。新增一次结果交付账号查询和最终权威重验仅影响登录/切换/完成重试，不给普通业务认证增加缓存或额外外呼；不宣称性能通过。回滚仅允许账本兼容包，关闭切换不关闭撤销，不恢复已撤销身份。

F11恢复细化：真实故障复验确认bootstrap失败后普通返回路径会留下switchingIdentity。已暂停身份的“返回当前组织”必须复用enter/beginIdentitySwitch重试，成功bootstrap及路由后解除暂停；正常零候选仍不清理身份。AuthSession为认证插件显式包装me，调用宿主adoptBrowserSession，覆盖选择页首次加载等既有隐式消费方；共享auth-core.me仍是纯查询。此为已批准F11失败重试/宿主接纳职责的实现细化，无新公开接口或范围扩张。

## F12 验证编排与性能移交（approved 2026-11-15）

制品冻结，以F11最终SHA-256为输入，VM逐一校验实际jar，浏览器使用F11最终静态产物。六个JVM分别部署到既定三VM，以同源HTTPS/可控路由代理执行真实API与实际页面；代理只在独占路径暂停请求或故障，记录脱敏节点/动作/结果证明跨节点执行。GR强门禁保持，无standalone profile；不重置已有应用GTID，不强行提升落后副本。

本轮只改Spec/证据与临时验证夹具，不改产品实现、配置基线或DDL。临时可调VM内存以容纳真实服务，完整记录并恢复原值；保留原Docker资源/规则，清理仅匹配本轮命名空间。跨机含义为三个独立内核、同一物理宿主，不宣称物理容灾。

性能L07-P从本主change执行范围移交到双仓独立active change 20261115-security-session-ledger-performance（draft，目标规格/QPS待确认）；原性能数值/门槛/失败记录保留，发布依赖仍为“性能未通过则不放行”。L07功能/迁移/兼容回滚证据与V02本地多节点证据可独立收口。原“全部性能门禁闭环后才主change归档”调整为“功能安全验收完成、未完成项已独立承接后按仓库流程另行归档”；本轮用户明确不归档，不提前更新current。

A01–A13矩阵以能力/制品摘要/证据类型/覆盖范围/结论逐项核对：新增修复和跨节点敏感路径必须使用F11最终包实测；原受控/历史/同包组件证据明确引用边界。客户CA/真实休眠/目标部署沿既有20261031-security-same-origin-release-acceptance，不以本轮替代。无需为了消除计数跳过执行独立性能、OSS或其他业务浏览器项目。

F12隔离容量配置记录：测试VM工作目录总量约2.9GB，应用默认10GB磁盘告警无法满足；只在私有启动参数中设128MB健康阈值，实测工作目录余量约1.6GB且持久盘最低约297MB。账本/GR/落盘门禁不变，配置差异随证据记录，不据此宣称目标容量、性能或生产就绪通过。原产品配置不改，临时参数随环境清理。

F12执行发现（2026-11-15）：标准OAuth RT撤销双向400且旧RT仍可刷新，见[失败与待确认修复方向](LEDGER-F12-OAUTH-REVOCATION.md)。该建议未approved、未实施；原批准安全契约不放宽，A13/V02保留失败。独立性能Spec仍阻断发布。

## F13 标准RT撤销修复（approved 2026-11-15）

用户已明确授权修复F12-N01，先同步双仓Spec/任务到approved，再实施、定向/相关回归和三VM双向真实复验后收口A13/V02；性能独立阻断发布，不提交、不归档、不改current。批准替代F12问题文档的“待确认建议”，原失败证据保留。

标准`/oauth2/revoke`使用专用AuthenticationProvider替换默认会将失效快照送回签发save的provider。仍复用SAS客户端认证、参数转换、标准成功/错误处理；只接受已认证的注册客户端，客户端身份不读自提交参数/Inside标识。账本按原始token摘要查询已登记ACCESS/REFRESH记录，sid/root/账号均由权威记录确定；未知token幂等200，已知他客户端token拒绝且不影响任何身份，依赖/持久性故障503，不提前确认成功。hint仅提示、不替代实际类型。无新增公开grant或路径。

在同一GR权威事务中按现有scope→root→session→token锁序执行：RT撤销关闭其固定sid/RT族及所有已签发AT（含轮换前仍合法AT），仅当root当前sid仍为该sid时关闭root；旧/已消费RT仍最多撤销其原sid族，不跨到并发新登录或替换组织sid。重复撤销幂等，不依赖当前凭据证明或仍有active token；账号改密/锁定的BLOCKED代次不能被撤销解除。与RT消费交错后也不能留可用后继，不允许任何旧快照保存写回。

AT单独撤销仅失效该已登记AT，保留其他合法AT/RT；若它是快照当前AT，同时更新加密授权快照的失效metadata以拒绝候选交付，避免AT-only无RT再次走expiry失败。旧AT与其他客户端token不以当前快照匹配冒充未知。保存授权的普通save及期限/凭据准入不放宽，撤销不签发任何身份、不延长root/token/Cookie截止、不更换Cookie。沿用现有USER_LOGOUT原因和可靠outbox；不新增表/枚举/配置/序列化版本。

测试先覆盖真实MySQL的RT撤销（新鲜/轮换/自然AT过期）、旧AT集合及新RT拒绝、重复/未知/错误客户端、RT消费竞争、并发新登录/已替换root、凭据栅栏/旧快照不复活；AT-only/旧AT选择性兼容及依赖故障另验。三VM使用新Auth包（其余包冻结核对），两Auth交叉登录/撤销/刷新/资源访问，两方向均确认200仅在持久提交后、旧RT400/AT401、独立新登录保持；停止六JVM后同view强GR/十表一致再清理。针对Auth及相关会话/HTTP/网关模块回归，真实Redis/MySQL条件测试显式启用，前端不变复用其冻结回归与构建证据。必要时补GR相关测试但不重复无关性能专项。

性能Spec维持draft/未通过；目标环境CA/休眠/首次部署边界不扩大。仅在F13修复和本地/三VM功能安全复验全部通过后将A13/V02适用范围收口，主change保持validating，current与归档仍待另轮处理。回滚只用账本兼容版本；已知失败F11 Auth不可作为标准撤销安全回滚包放行，不恢复已撤销身份。

F13验证语义细化：独立机密OAuth测试客户端沿用原有滚动RT寿命，竞争中的合法refresh可更新其非BFF TTL；不得把该变化归因于撤销。该类竞争只证明旧/后继凭据均拒绝和身份隔离；撤销单独调用前后期限相同，固定BFF root截止由组件与真实A→B→A另行严格校验。无产品语义或批准范围改变。

F13认证负向探针沿用既有入口语义：未提供客户端认证的请求由现有InLoginUrlAuthenticationEntryPoint原始302至/oauth2/login；禁止自动跟随后把登录页200当撤销成功，须核对原RT/AT仍可用。错误客户端密钥按既有OAuth认证错误拒绝。此轮不改变全局登录入口/错误码，Inside头不授权撤销。

F13最终验收记录：专用撤销及期限/新身份边界按批准方案实现；新增13项包含于410回归，三成员最终34组与十表静稳一致性通过。OOM及夹具中断未混计；前端/其他制品复用边界明确。A13/V02本地三VM收口，性能/目标发布依赖保持，不更新current/归档、不提交。两Auth版本应协调更新后确认标准撤销可用，混合旧失败包不构成修复完成。

## F14 严格组织恢复与空凭据会话退休（approved 2026-11-15）

批准依据：用户本轮明确要求修复两项审查发现，并授权双仓Spec/任务先approved及后续实施与真实复验。需求、接口、兼容及验收决定如下，无待决实现项。

R01：OrganizationSwitchService.resume从原事务组装RECOVER_SESSION，复用现有严格账号恢复及统一完成结果交付门禁。移除该出口的普通READ_SESSION+通用auth.verify，最终Auth事务必须在IAM行锁外查询之后按凭据→正式scope→绑定/root/session锁序重新核对凭据证明、原操作/绑定、当前sid/代次/AT、恢复窗及固定截止；BFF再校验结果指纹后仅写同一Cookie。普通READ_SESSION和资源AT不增加全局凭据代次门禁，原组织成员失效不影响账号身份。失败无Cookie，401/403/409/410/503沿用。

R02：标准AT撤销在原scope→root→session→token事务内失效选定AT及当前快照metadata，随后读取固定sid的完整TOKEN集合，按真实类型ACCESS/REFRESH、ACTIVE/PENDING状态及数据库UTC当前时间判断是否仍有可用凭据（不以快照当前token代替旧AT索引）。同sid签发/消费共享scope/root/session锁，因此检查与退休原子；有其他合法AT/RT保持该会话。没有则使用既有retire及outbox使sid终态，并仅在root.currentSid仍匹配时关闭root；不保存失效快照回签发save，不修改期限或新sid。重复/未知/错误客户端及凭据BLOCKED语义保持F13。

无DDL、公共/内部DTO、OAuth路径、错误或时间契约变化。新Auth/BFF协调部署；前端/IAM/Gateway制品冻结复用，后端相关八模块回归加四jar构建，真实Redis序列化/MySQL UTC及GR显式执行。安全回滚仅回退账本兼容且不含已知恢复/撤销缺陷的版本；已撤销身份不恢复。新增token集合读取限于显式AT撤销及固定sid，性能影响交独立专项，不据此解除性能门禁。

验收：BFF组件证明resume只调严格命令，失败无Cookie；真实MySQL组织切换完成结果在IAM回调推进凭据代次后拒绝（同时其他租户正式AT仍可用），无成员/故障/注销/替换/过窗保持；AT-only在maxSessions=1/REJECT下撤销后可新登录，保留其他有效旧AT/RT、排除过期凭据、重复/迟到撤销及同root新sid隔离，原截止不变。

三VM两个方向：真实A→B结果丢响应后，暂停严格恢复IAM检查的成功回包，在A进行真实改密并等待凭据栅栏ACTIVE，再释放恢复，必须拒绝且无Cookie；验证B普通会话可读、旧恢复始终拒绝、不能重复签发， fresh登录不受影响。使用无RT独立真实OAuth客户端，配置单会话REJECT，先证明第二次登录拒绝，再撤销唯一AT，跨Auth新登录成功且旧AT拒绝；迟到/重复旧撤销不影响新身份，期限不被撤销延长。保持三成员强GR，前后GR测试及静稳十表一致，记录新包摘要和复用边界。A13/V02须待本轮均通过再收口。

F14验收更新（2026-11-15）：F14两项审查修复已完成：57定向包含于八模块418项回归，零失败/跳过；三VM双向真实验收40组、换主后3项GR及静稳十表一致通过。A13/V02本地三VM功能安全范围重新收口；性能独立仍未通过、目标发布另验，不更新current、不归档、不暂存/提交。见[F14报告](LEDGER-F14-RECOVERY-AT-ONLY.md)及[验收矩阵](ACCEPTANCE-A01-A13.md)。 无接口/DDL/序列化或时间契约变更，Auth/BFF协调更新。
