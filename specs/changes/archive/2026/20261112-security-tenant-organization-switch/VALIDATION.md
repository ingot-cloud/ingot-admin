# 实现验证记录

F13标准RT撤销P1已修复：新增定向13项、相关八模块410项（包含该13项）零失败/零跳过，最终三成员GR健康后重跑34组真实验收全部通过。A13及V02本地/三VM功能安全范围收口；性能独立仍未通过并阻断发布，目标环境发布另验。不更新current、不归档、不暂存/提交。见[F13报告](LEDGER-F13-OAUTH-REVOCATION.md)及[验收矩阵](ACCEPTANCE-A01-A13.md)。

以下F12及更早章节保留原制品和当时结论，当前以上方F13为准。

F12最终F11包补验已完成记录：35组通过、标准OAuth RT撤销1组失败；两任GR主节点各3项通过，三VM/十表静稳一致且资源已清理。A01–A13证据已形成，A13/F12-N01及V02整体保持未完成；性能独立未通过、发布仍阻断。见[F12报告](LEDGER-F12-MULTINODE.md)、[验收矩阵](ACCEPTANCE-A01-A13.md)和[新失败](LEDGER-F12-OAUTH-REVOCATION.md)。不更新current、不归档、不暂存/提交。

以下各日期章节为对应历史制品的执行记录；不以较早“通过”覆盖后续失败，不将阶段待办当成当前唯一剩余项。

首次验证：2026-11-12；更新：2026-11-13。状态：validating，未发布、未使用真实业务账号改变成员资格或制造线上依赖故障。

## 定向自动化与构建

| 范围 | 结果 | 主要证据 |
|---|---|---|
| IAM 组织关系查询 | 3 通过 | H2 + 真实 MPJ SQL；账号隔离、分页、当前失效与搜索计数 |
| Auth provider | 25 通过、0 跳过（2026-11-13） | 真实 Redis/MySQL 集成、RSA 严格验证、幂等操作、目标成员签发、AT/RT 与后续 refresh 截止 |
| BFF | 36 通过 | 隔离 Redis；零候选、CAS 双工作者竞争、丢回复恢复、来源失效、退出并发、迟到签发回收 |
| Gateway | 46 通过（2026-11-13） | 空/旧上下文不能转发写操作，新上下文正常；原有 Cookie/域与 API 路径回归 |
| Authorization framework 全量 | 60 通过（2026-11-13） | 原失败修复；HTTP 提示动态配置与安全回退、Jackson、token/会话回归 |
| Commons Cookie 契约定向 | 4 通过（2026-11-13） | 正式 Cookie UTC 绝对截止、无相对 Max-Age 及隔离属性 |
| Security common 全量 | 69 通过 | 原失败修复；部门只读视图、嵌套隔离、空/null 及在线会话回归 |
| Recording / Security API | 42 / 3 通过 | 审计分类及枚举兼容 |
| auth-core / auth-plugin / admin-core | 35 / 7 / 570 通过 | 共 612 项；结果恢复、无候选、旧请求隔离、来源失效守卫与跨页协调 |
| 前端质量检查 | 通过 | 改动文件 ESLint、Prettier；三个相关包类型检查 |
| 打包 | 通过 | IAM、Auth、BFF、Gateway bootJar；pnpm build 含两个管理端及类型检查 |

RedisAuthorizationTimeContractTest、UtcJdbcContractTest 在前轮曾因缺少集成环境跳过；2026-11-13 已在隔离的真实 Redis/MySQL 上补跑通过，并确认 Auth 全量 25 项零跳过。此前的跳过记录保留在对应日期章节。

后端可重跑命令（JDK 21、已有离线依赖）：

```sh
./gradlew :ingot-service:ingot-iam:ingot-iam-provider:test --tests '*OrganizationSwitchIdentityServiceTest' :ingot-service:ingot-auth:ingot-auth-provider:test :ingot-service:ingot-bff:test :ingot-service:ingot-gateway:test --offline
./gradlew :ingot-framework:ingot-security:ingot-security-common:test --tests '*RedisOnlineTokenServiceTest' :ingot-framework:ingot-security:ingot-security-authorization-server:test --tests '*AbsoluteExpiryRefreshTokenGeneratorTest' --tests '*JwtTimeProtocolTest' --tests '*SessionRegistrarTest' --tests '*DefaultSessionRevocationServiceTest' --tests '*SessionConcurrencyEnforcerTest' --offline
./gradlew :ingot-service:ingot-iam:ingot-iam-provider:bootJar :ingot-service:ingot-auth:ingot-auth-provider:bootJar :ingot-service:ingot-bff:bootJar :ingot-service:ingot-gateway:bootJar --offline
```

前端使用仓库指定 Node 22.17 / pnpm 10.12.4，运行相关包 test/type-check 及根 build。
原始日志位于本机 /private/tmp/ingot-org-switch-final-backend.log、ingot-org-switch-targeted-followup.log、ingot-org-switch-final-frontend.log、ingot-org-switch-final-ui-followup.log、ingot-org-switch-final-api-followup.log、ingot-org-switch-last-ui.log；后续运行可能覆盖，以上测试源文件是可重复证据。

## 生产前端与受控 HTTPS BFF

脚本：前端 scripts/verify-organization-switch-browser.mjs；隔离 Chrome profile、Secure/HttpOnly Cookie、真实 HTTPS 与原生多标签事件，BFF/Auth/IAM 响应受控。

已通过：

- 无其他组织时提示、返回、Cookie 与会话不变，不创建事务。
- 搜索空留页、清空后可选；直接切换后原生另一标签加载目标成员和首页。
- 旧来源暂停标记晚到后，已切换标签和新打开的标签仍可正常 bootstrap；旧上下文写入返回 409，业务未执行。
- 来源组织成员失效后刷新业务页，进入只验证账号的选择页并切入有效目标。
- 提交响应丢失后恢复同一结果，网络重试不重复执行签发。
- 503 留在可重试选择页；来源失效且无候选进入稳定 403；缺少会话不能查询候选。

原有 scripts/verify-same-origin-login-browser.mjs 的 22 个登录、退出、强制改密、平台/租户隔离及跨标签用例通过，覆盖 HTTPS 双端口和分主机两种受控拓扑。
自签 TLS 忽略信任错误。上述浏览器证据不代表真实 Auth/IAM、客户 CA 信任、长时休眠或生产多节点已经验收。

## 扩展全量回归的历史失败（已修复）

首次实施验证时，扩展全量回归有以下失败，未将其标为通过；随后用户授权一并修复：

1. Authorization server：50 项中 1 项失败。LoginFailureMessagesAuthenticationTest.productionConfigurerUsesConfiguredCheckerAndHttpResponseForBothDomains 期望“初始密码失效，请联系服务台重置”，DefaultAuthenticationFailureHandler 返回“登录凭证已过期，请更新凭证后重试”。
2. Security common：67 项中 1 项失败。InUserIdentityTest.callerCannotMutateBoundDepartmentList 期望 getter 返回不可变集合，实际未抛 UnsupportedOperationException。

已逐文件与后端 HEAD 28beaeb119cc6310b7c7506765f00da492feef51 比较：上述两个生产类与两个测试均完全相同；失败路径未被本次改动。首次实施时为保持范围保留了失败记录。随后按用户明确授权修复实现，未放宽原失败断言；修复结果见下节。

## 真实环境待验

2026-11-13 已补验真实账号 A→B→A 成员/部门、双标签竞争、跨节点退出及丢响应恢复、实际原截止。V02 继续保留差异化菜单/按钮权限、账号禁用/锁定/强制改密、节点重启与依赖故障、真实 RT 连续 refresh、审计落库、客户 CA、多标签长时休眠和协调发布/回滚；完整范围见 [真实验收报告](REAL-ACCEPTANCE.md)。
A01–A13 的自动化与受控覆盖不替代以上实证。V02 验收前，不更新 current，不标 completed，不归档。

最终浏览器产物（本机临时目录）：组织切换 `/var/folders/zb/hqbvy0s96tz6g6d0m4cbq6rh0000gn/T/ingot-organization-browser-694WJx`；登录回归 `/var/folders/zb/hqbvy0s96tz6g6d0m4cbq6rh0000gn/T/ingot-same-origin-browser-EQz3bd`。目录包含 JSON 结果和页面截图，需长期保存时另行转存。

## 用户授权回归修复（2026-11-12）

### 原因与修复

- 登录文案：此前通用错误脱敏将 CredentialsExpiredException 统一改写为固定提示，覆盖了已批准的场景化配置。现在由 InUserDetailsChecker 将解析器生成的纯文本装入 UserFacingCredentialsExpiredException；失败处理器仅对这一明确类型透传。普通凭证过期异常、内部错误和未知认证错误继续使用安全提示。HTTP 状态、code 与认证阻断保持不变。
- 部门集合：此前为避免不可变集合实现类破坏安全 Jackson 序列化，将内部存储改为 ArrayList/LinkedHashMap，但 Lombok getter 暴露了这些内部对象。现在保持私有字段和字段序列化编码，显式 getter 提供只读列表、只读映射和只读嵌套列表。构造防御性复制和 null/空语义保留；不放宽 Jackson allowlist。

### 实测结果

- 两个原失败用例均通过。
- 新增/增强：三类过期原因的实际 HTTP 文案、配置新增/修改/删除/空白回退及模板字面量；未标记异常和内部错误不透传；输入列表与映射隔离、嵌套只读、空/null、真实安全 Jackson 往返及原存储类型。
- security-common 全量 69 通过；authorization-server 全量 55 通过。
- Auth 23 通过，另 2 项环境测试跳过；BFF 36、Gateway 44、IAM 定向 3、recording 42、security-api 3 通过。
- 合计 277 项：275 通过、2 跳过、0 失败。四个服务 bootJar 通过；git diff --check 通过。
- 本轮未修改前端业务代码，前端 612 项及浏览器结果为前轮证据；没有以受控前端响应代替本轮 Auth HTTP 的真实失败处理器测试。

重跑命令（完整安全模块，不排除原失败测试）：

```sh
./gradlew :ingot-framework:ingot-security:ingot-security-common:test :ingot-framework:ingot-security:ingot-security-authorization-server:test :ingot-service:ingot-auth:ingot-auth-provider:test :ingot-service:ingot-bff:test :ingot-service:ingot-gateway:test :ingot-service:ingot-iam:ingot-iam-provider:test --tests '*OrganizationSwitchIdentityServiceTest' :ingot-framework:ingot-security:ingot-security-recording:test :ingot-service:ingot-security:ingot-security-api:test :ingot-service:ingot-iam:ingot-iam-provider:bootJar :ingot-service:ingot-auth:ingot-auth-provider:bootJar :ingot-service:ingot-bff:bootJar :ingot-service:ingot-gateway:bootJar --offline --continue --console=plain
```

日志：本机 /private/tmp/ingot-regression-fixes-before.log、/private/tmp/ingot-regression-fixes-framework.log（中间验证）、/private/tmp/ingot-regression-fixes-all.log（最终通过）。未创建提交；V02/C01 仍待真实环境验收。

## Redis/MySQL 集成补跑（2026-11-13）

按用户要求补跑两个原条件跳过的测试。本轮没有修改生产代码或配置；增强了 Redis 测试夹具，将 Authentication/InUser 主体、IAM 成员身份和非空部门列表一并放入授权快照，实际保存与读回，并在续期后复核身份和部门列表只读性。

| 项目 | 实测结果 |
|---|---|
| 隔离实例 | 缓存镜像创建的临时 Redis 8.2.0、MySQL 8.4.13；只绑定随机本机回环端口，无持久数据挂载 |
| JVM 时区矩阵 | UTC、Asia/Shanghai、America/New_York；每项测试内部遍历三种时区 |
| RedisAuthorizationTimeContractTest | 通过、实际执行，无跳过；授权主体/在线会话序列化、非空部门只读视图、成员身份、授权码与 AT/RT 索引、期限/TTL、sid/issuedAt 保持、jti 更新及撤销 |
| UtcJdbcContractTest | 通过、实际执行，无跳过；UTC 会话、DATETIME(6)/TIMESTAMP(6) 微秒、CURRENT_TIMESTAMP、真实 MyBatis-Plus 读写及 OAuth JDBC 客户端时间往返 |
| UTC 强制验证 | MySQL 全局时区故意设为 +08:00，JDBC URL 使用 connectionTimeZone=UTC&forceConnectionTimeZoneToSession=true；三种 JVM 时区下连接会话均为 UTC，时间点没有偏移 |
| Auth 全量 | 25 项通过、0 失败、0 跳过（含上述两个集成测试） |
| 清理 | Redis DBSIZE=0；测试库持久表数=0；测试只建连接私有临时表，连接关闭即清除；两个临时容器及其数据已删除，临时凭证文件已删除 |

持久摘要：[INTEGRATION-RESULTS-20261113.json](INTEGRATION-RESULTS-20261113.json)。原始执行日志与 JUnit XML 留在本机 `/private/tmp/ingot-time-integration-20261113-8zzceskx/`，targeted.log 为两项定向验证，auth-full.log 为启用集成环境后的全量验证。最初未增强夹具的原始补跑也已通过，记录在 `/private/tmp/ingot-time-integration-20261113-jnl8e5fa/`。

可重跑的测试入口：先创建自己的隔离实例，配置 TIME_TEST_REDIS_HOST/PORT（可选 PASSWORD）、TIME_TEST_MYSQL_URL/USER/PASSWORD，再执行：

```sh
./gradlew :ingot-service:ingot-auth:ingot-auth-provider:test --tests '*RedisAuthorizationTimeContractTest' --tests '*UtcJdbcContractTest' --offline --rerun-tasks
./gradlew :ingot-service:ingot-auth:ingot-auth-provider:test --offline --rerun-tasks
```

本次临时 init script 显式传递上述环境变量并使 test 任务重新执行，未依赖之前的 UP-TO-DATE 或条件跳过结果。MySQL URL 的密码单独通过环境传入，未写入仓库。此证据覆盖单节点真实中间件的组件契约；V02 中真实账号、多 BFF/Auth 节点及完整组织切换发布验收仍独立待验。

## 真实账号与多节点补验（2026-11-13）

五个重点场景及两项强制跨节点复核通过，保持种子库 UNIQUE 策略。F03/F04/F05 已修复并用同一最终包验证；相关回归 286 项，0 失败、0 跳过，含两个真实 Redis/MySQL 集成测试；四服务 bootJar 通过。环境和证据边界见 [真实验收报告](REAL-ACCEPTANCE.md)，逐请求与截止数据见 [脱敏 JSON](REAL-ACCEPTANCE-20261113.json)。临时实例、JVM 和凭证已清理，未提交；完整 V02/C01 保持未完成。

## 真实 RT、节点重启与依赖故障（2026-11-13）

七次真实 RT 连续刷新、自然截止、撤销拒绝，以及实际 Auth/BFF SIGKILL 重启、Auth 故障期间退出不可恢复、IAM/Auth/Redis/MySQL 故障 503 与恢复幂等均通过。直接 Auth 的当前有效 token 在 Redis 故障时也返回 503、不降级签发。F06/F07 修复后的相关回归 288 项全部通过、零跳过，含真实 Redis/MySQL 集成。范围和批次哈希见 [补充验收](RESILIENCE-ACCEPTANCE.md)。V06/V07/V08 完成，完整 V02/C01 未完成，未提交。

## 2026-11-13 跨 VM / Redis Cluster：验收未通过

用户选定的三台独立 VM、真实六节点 Redis Cluster 已实测：应用断链、完整复制后的自动选主、原截止通过；复制落后后的确认写入回滚导致同一事务签发两次、旧 Cookie/resume/RT 重新返回 200。发布阻断，不能以原截止保持或前轮回归通过覆盖。见 [失败验收](CLUSTER-ACCEPTANCE.md) 与 [一致性评审稿](FAILOVER-CONSISTENCY-REVIEW.md)。本轮未改生产代码，三 VM 已恢复原停止状态，未提交；V02/C01 仍未完成。

## 2026-11-15 F12最终包补验与A01–A13证据

F12最终F11包补验已完成记录：35组通过、标准OAuth RT撤销1组失败；两任GR主节点各3项通过，三VM/十表静稳一致且资源已清理。A01–A13证据已形成，A13/F12-N01及V02整体保持未完成；性能独立未通过、发布仍阻断。见[F12报告](LEDGER-F12-MULTINODE.md)、[验收矩阵](ACCEPTANCE-A01-A13.md)和[新失败](LEDGER-F12-OAUTH-REVOCATION.md)。不更新current、不归档、不暂存/提交。

当轮复验及失败尝试、版本复用、三VM容量差异、GR强持久性与清理均见报告。标准OAuth撤销返回400后旧RT仍可用，未收到成功撤销确认；与BFF注销/内部撤销的通过项分开，不能描述为成功退出后复活。当前不关闭V02整体；F12-05证据子项已完成，验收关闭子项被F12-N01阻断。

## 2026-11-15 F13标准撤销修复及A13/V02收口

F13标准RT撤销P1已修复：新增定向13项、相关八模块410项（包含该13项）零失败/零跳过，最终三成员GR健康后重跑34组真实验收全部通过。A13及V02本地/三VM功能安全范围收口；性能独立仍未通过并阻断发布，目标环境发布另验。不更新current、不归档、不暂存/提交。见[F13报告](LEDGER-F13-OAUTH-REVOCATION.md)及[验收矩阵](ACCEPTANCE-A01-A13.md)。

标准RT撤销200后旧RT两Auth400、同sid全部AT真实资源401；新登录及其RT刷新200，迟到/并发旧撤销不影响新root。依赖故障503不确认成功；Auth实际重启、GR计划换主后边界保持。前端未变复用658及静态制品；历史长批次不冒称F13重跑，具体版本/失败尝试和清理见报告JSON。

F14验收更新（2026-11-15）：F14两项审查修复已完成：57定向包含于八模块418项回归，零失败/跳过；三VM双向真实验收40组、换主后3项GR及静稳十表一致通过。A13/V02本地三VM功能安全范围重新收口；性能独立仍未通过、目标发布另验，不更新current、不归档、不暂存/提交。见[F14报告](LEDGER-F14-RECOVERY-AT-ONLY.md)及[验收矩阵](ACCEPTANCE-A01-A13.md)。 无接口/DDL/序列化或时间契约变更，Auth/BFF协调更新。
