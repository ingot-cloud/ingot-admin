> 历史设计，已被2026-11-13持久化账本批准修订取代；不再作为施工依据。

# 租户组织切换设计

## 方案

BFF 独立切换事务，复用现有同槽绑定、容量、租约、会话与可靠清理队列；Auth 根据当前 Access Token 严格认证，并以可信账号向 IAM 解析目标成员。新授权不依赖预授权 Cookie，不新增公开 OAuth grant。
来源 BFF sessionId/sid/contextVersion/账号/绑定与目标租户在创建时固定，提交用来源代次 CAS；状态 PREPARED→ISSUING→COMMITTING→COMPLETED，另有 FAILED/EXPIRED/UNKNOWN。
Auth 先登记幂等操作 ID、结果 sid 与摘要，失败只查询原结果、不重复签发。未采用结果可靠回收；旧会话在正式替换后失效并补偿撤销。
期限 = min(来源 BFF 截止, 来源 Auth 凭据链截止)，新 AT/RT、会话、Cookie、后续 refresh 均不超界。600s 事务、30s 租约、60s 交付恢复、前端 15s 查询预算沿用现有配置并截断到来源截止。

## 前端

认证插件新增独立选择页与账号会话守卫，不先 bootstrap 原组织。auth-core 提供契约与编排，admin-core 注入清理/进入能力。
currentTenant 单独显示；switchableTotal=0 提示并 replace 返回当前租户，搜索匹配为零只显示搜索空态。
me 返回公开事务 ID 作为 contextVersion，租户业务请求固定携带 In-Bff-Context-Version；网关校验 Cookie 实际会话版本，409 不转发。
提交前同源待处理标记暂停其他页，BroadcastChannel/storage 同步；成功清理身份、菜单、路由、Query、KeepAlive 和草稿，me→bootstrap 一次，优先工作台 org.iam.workbench、首个可访问菜单、稳定空态。
切换中 401 先查询待处理事务，写操作不重放；bootstrap 故障保留新身份重试。恢复可见时核对会话版本。

## 宪章符合性

遵守 apps→plugins/packages、plugins→packages，不反向依赖，不复制协议实现；类型严格、页面与编排分离。Java 使用构造注入、业务枚举、命名常量及 JavaDoc。

## 兼容、发布和回滚

无数据库迁移，沿用 BFF v2。协调发布 Gateway/BFF/Auth/IAM/前端；旧页缺少上下文版本拒绝业务转发并提示刷新。回滚停止新切换、协调回退，不恢复已撤销会话。

## 验证

以 REQUIREMENTS A01–A13 为准，新增严格 token、关系分页、CAS/恢复/补偿、跨标签/旧请求测试；相关 Gradle、前端类型/定向测试与构建，真实环境另记证据。

## 安全实现细节

切换使用独立的标准验签 decoder，再读取权威在线态，避免通用资源读取的宽限把故障转换成 401。正式 CAS 前再验来源 token；结果投递和恢复前重验目标成员仍有效。Auth 丢回包时的已知 sid 清理记录保留到来源认证截止，并重复撤销，防止晚到工作者写回。BFF 独立 AUTH 审计经现有 recording center 投递，消费模块配置启用，敏感认证 RPC 禁止 Feign URL/头/体日志。

上下文同步细化：暂停记录必须属于已确认来源版本；迟到的旧版本通知不冻结新身份。没有内存版本的新文档先 me，再判定是否暂停。候选/创建/提交在 CSRF 准备前固定版本；结果确认的 15 秒预算覆盖查询、补交、恢复 Cookie 和 me，超时保留原事务。来源成员失效的业务守卫进入账号选择页，身份错误页也提供切换入口。

无候选且当前成员已失效时，将现有权限标为不可用再进入稳定 403，不签发、替换或撤销会话；可访问的零候选分支不触发身份切换清理。

## 回归修复决策（2026-11-12 approved）

- InUserDetailsChecker 将经过 CredentialExpirationMessageResolver 解析的纯文本装入专用 CredentialsExpiredException 子类；失败处理器仅对此类型透传用户文案。普通 CredentialsExpiredException 及其他认证异常保持既有脱敏。
- InUser 私有字段继续使用独立 ArrayList/LinkedHashMap，沿用安全 Jackson mixin 的字段序列化；显式 getter 返回不可修改视图，跨租户映射的嵌套列表同样只读，防止序列化编码与身份不可变性相互影响。
- 回归包括两个原失败用例、配置新增/刷新/删除及不同过期原因 HTTP 响应、普通/内部异常不泄露、输入防御性复制、只读视图、空/null、真实安全 Jackson 往返，以及完整 security-common / authorization-server / Auth / BFF / Gateway 等相关模块。

## 2026-11-13 集成验证补充

在临时 Redis 8.2 与 MySQL 8.4 上补跑现有条件测试。为直接验证已批准的部门只读契约，Redis 用例补充非空部门、IAM 成员身份及 Authentication/InUser 授权主体的真实存储往返，刷新存储后复核身份和只读性；不修改生产行为、存储类型或 allowlist。MySQL 全局时区故意设为 +08:00，由生产 JDBC UTC 参数保证连接会话 UTC，覆盖三个 JVM 时区。

## 2026-11-13 多节点验收执行决策

用户明确要求继续真实账号与多节点验收，不提交。使用新建隔离 MySQL/Redis、两个 Auth 与两个 BFF 节点，真实 IAM 数据和登录签发；浏览器走 HTTPS 同源代理。故障代理只控制真实 HTTP 的调度、延迟和回包投递，不生成业务结果。测试账号/组织仅存在本轮隔离库。使用短生命周期 OAuth 客户端观察实际截止，不修改正式账号或既有服务。审计段插入导致的 YAML 缩进/重复键按原 account.bff 与 bff 根配置结构恢复，保持已批准语义。

真实入口修复：服务端预授权专用 converter 生成明确的凭证校验请求子类型；账号查询及密码校验仍保留 password/social 方式，客户端准入则校验已登记的 PRE_AUTHORIZATION_CODE。普通 token endpoint 仍按原 grant 校验，不能依靠客户端提交的 pre_grant_type、路径或参数获得此标记；客户端状态、凭证和 PKCE 等后续检查不变。这是恢复既有预授权契约，不新增公开 grant。

预授权负向验收补充：普通直接请求缺少已认证客户端时，应统一抛 OAuth invalid_client，避免 getClient().getClass() 空指针返回 500。使用 instanceof 安全解析标准客户端或用户凭证请求中的客户端，不改变客户端认证成功要求；新增缺失客户端的直接/预授权两种回归。

Cookie 截止修复（F05，2026-11-13）：真实浏览器发现相对 Max-Age 从回包接收时计时，秒级取整与传输延迟可使浏览器保留时间超过原 expiresAt。正式会话 Cookie 改为 UTC HTTP-date 的固定 Expires，省略优先级更高的正 Max-Age；绑定 Cookie 和清除 Cookie 仍沿用原相对策略。提交与恢复均使用持久会话的同一绝对截止，服务端的 token、Redis 与权限截止判定保持不变。覆盖延后恢复仍保持同一 Expires，并用真实浏览器自然到期和过期 Cookie 重放复核。此修复落实已批准的原登录截止契约。

## 2026-11-13 RT、重启与故障验收决策

用户授权继续隔离实证，不提交。公开 BFF 客户端保持无 RT；另建仅测试库中的机密 password/refresh_token 客户端，通过真实 OAuth 端点、内部组织切换及撤销接口检验连续 RT 轮换、固定 sid 和原绝对截止。浏览器仍使用原公开 BFF，实际 SIGKILL/重启两个 Auth/BFF 进程，控制真实签发响应投递，检验共享 Redis 恢复与退出栅栏；分别停止 IAM/Auth、暂停 Redis/MySQL，故障时查询/创建/提交应 503 且不签发、不替换、不伪造零候选。依赖恢复后查询同一事务结果，不重新签发；退出期间撤销失败保留可靠清理，重启后原 Cookie/事务/RT 均不能恢复。只操作本轮隔离资源；所有证据脱敏，current 与完整发布验收状态不提前修改。

F06（恢复既有 RT 轮换契约，用户已授权本轮验收修复）：真实轮换后旧 RT 重放仍返回 200。Redis token 索引允许残留到 TTL，但不得被视为凭证事实；findByToken 必须核对授权快照中当前对应类型 token 与输入完全相等（state 单独按原协议核对），否则返回空。不得据旧索引签发新 token。保留索引编码、现有存储和 TTL；增强真实 Redis 回归与真实 OAuth 重放负向验收。

F07（落实已批准的 BFF 依赖故障 503）：真实暂停 Redis 时，网关前置临时封禁 EXISTS 抛 QueryTimeoutException，被全局异常处理器误映射为 500。仅对 /bff/auth 及其子路径的 DataAccessException 返回 503/BFF_AUTH_UNAVAILABLE，保持失败关闭、不转发、不写 Cookie、不泄露底层诊断；其他路径及编程异常沿用既有映射。补充同源 BFF 查询/创建/提交与边界回归，并真实复验共享 Redis 故障及直接 Auth 当前-token 校验不降级。

## 2026-11-13 跨 VM 分区与 Redis Cluster 验收

用户明确选择 test-manager/test-worker1/test-worker2 三台独立内核 Ubuntu 虚拟机（同一物理宿主）进行验收。只新增独立命名/标签的测试容器、应用和端口；网络分区仅作用于本轮资源，不改原有业务服务。使用真实六节点 Redis Cluster（三主三从、主从跨 VM 分布），分别验证健康复制后自动故障转移、服务链路分区、复制落后/确认写入丢失及恢复后的会话安全。记录原登录截止、操作和结果数量、旧 Cookie/事务/RT 拒绝情况，失败必须保留实证，不把单机模拟或异步复制的写丢失当作通过。若需改变已批准的一致性/持久化设计，先形成设计决策再实施；本轮不提交、不提前更新 current。结束后删除本轮资源并将三台 VM 恢复到原停止状态。

## 2026-11-13 集群验收发现（未批准的新设计）

真实异步复制回滚反例已使幂等与注销保证失败，详见 CLUSTER-ACCEPTANCE.md。纯 Redis 绑定/幂等/在线事实无法辨别恢复的旧合法状态；原截止不延长仍不足以通过。FAILOVER-CONSISTENCY-REVIEW.md 为待评审方向，涉及原无数据库迁移约束，尚未批准实施。保留现有实现和失败证据，不把候选方案写作已生效设计，不更新 current。
