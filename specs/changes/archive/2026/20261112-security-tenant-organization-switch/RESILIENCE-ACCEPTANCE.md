# RT、节点重启与依赖故障验收（2026-11-13）

本轮真实 RT 3 组、浏览器重启/故障 7 组全部通过；最终相关回归 288 项，0 失败、0 错误、0 跳过。修复 F06/F07 后完成验证；状态保持 validating，未发布、未提交。

## 环境与凭据边界

使用重新创建的隔离 MySQL 8.4.13、Redis 8.2.0、IAM/Gateway 各一台、Auth/BFF 各两台。真实 API 创建账号及 A/B 成员，浏览器走构建产物、同源 HTTPS、真实 Gateway/BFF/Auth/IAM；开启原设备指纹、Origin、CSRF、上下文版本与默认 UNIQUE 策略。原有开发服务未改动。

公开 BFF 客户端继续不签发 RT。本轮仅在隔离库建立机密 password/refresh_token 客户端，实际调用 OAuth token 端点及内部组织切换/撤销接口；AT=20 秒、RT=180 秒、RT 轮换。内部可信调用方给定原会话截止 75 秒，新组织 RT/AT 与后续刷新均受其约束。这验证真实 Auth 的 RT 分支，不表示向公开 BFF 增授 RT 或新增浏览器刷新流程。

浏览器会话截止设为 180 秒，来源 AT 为 300 秒，为真实 SIGKILL/启动、30 秒租约自然结束和依赖超时留出执行空间。没有改时钟、回写事务状态或缩短已存在会话 TTL。故障代理仅调度真实 HTTP，不伪造业务结果。故障 API 经与真实登录页面共享 Cookie 的 Playwright 请求上下文发送，并固定已准备的 CSRF 和身份版本；页面提示及自动重试交互不作为本批新增结论。

## 真实 RT 结果

| 检查 | 证据与结果 |
|---|---|
| 连续刷新和再次切换 | A→B→A，两次独立组织签发、七次真实 RT 刷新；同一组织的刷新保持 sid，jti 更新；再次切换换 sid，原绝对截止不变 |
| 轮换后重放 | 前三次旋转后的旧 RT 在另一 Auth 上重放，均 400/invalid_grant，不能再次签发 |
| Auth 重启 | SIGKILL Auth0 并重启，PID 改变；新进程能从 Redis 刷新同一 sid，期限不重置 |
| 临近截止 | 前一 AT 已实际过期后，用 RT 在原截止前 5 秒刷新；新 AT 截断到原截止；每次 RT、在线态、授权及索引 TTL 均没有越界 |
| 自然到期 | 等待原 75 秒期限自然到达，最新 RT 返回 400/invalid_grant，授权/在线主数据已消失 |
| 撤销后再试 | 实际撤销后，从另一 Auth 刷新被拒绝；用已撤销来源 token 切组织返回 401，不产生新身份 |

同一签发操作在两个 Auth 节点重复 POST 与查询，返回完全相同的结果；RT 轮换产生新 token 是预期行为，不能用旧 RT 或重试组织事务制造另一身份。

## 实际进程重启与退出栅栏

1. **签发后、提交前重启**：Auth0 已完成真实签发但暂扣返回；SIGKILL BFF0 和 Auth0，再启动。自然等待原执行租约结束，BFF1 调 Auth1 查询原结果后完成提交。签发调用只有一次，最终 sid 摘要等于原签发结果，截止仍为原值。
2. **成功提交丢响应后重启**：在 BFF0 已成功 CAS 后丢回包并重启 BFF0；BFF1 resume 恢复同一 Cookie 结果，Auth 仍只签发一次，截止不变。
3. **Auth 全不可用期间退出**：停止两台 Auth 后退出，BFF 返回 200、清 Cookie、删除绑定/当前会话，并保留撤销任务。两台 BFF 和 Auth 全部重启后，重放旧 Cookie/事务的 read/resume/commit 均拒绝，me 401，不写新 Cookie；可靠补偿最终使原 Auth sid 消失。

上述重启均为真实进程 SIGKILL、新进程重新启动，记录了旧/新 PID；没有用清缓存或重置 mock 代替重启。

## 依赖故障矩阵

| 真实故障 | 候选 / 创建 / 提交 | 故障及恢复结果 |
|---|---|---|
| IAM JVM 停止 | 503 / 503 / 503 | 不伪造零候选，原 Cookie/sid/contextVersion 保持；原事务恢复后只签发一次 |
| 两台 Auth JVM 停止 | 503 / 503 / 503 | 不建立新身份；重启后原事务只签发一次 |
| Redis 容器暂停 | 503 / 503 / 503 | 网关前置安全存储失败也按 BFF 协议返回 503；Cookie 不替换，无签发 |
| MySQL 容器暂停 | 503 / 503 / 503 | JDBC 实际超时，原身份不变；恢复连接后原事务只签发一次 |

Redis 故障另加直接 Auth 实证：先验证当前 BFF 正式 token 证明有效并预热签名校验，再暂停 Redis；绕过 BFF 前置存储直接请求 Auth 的候选查询和切换签发，均 503。恢复后确认预定结果 sid 没有授权或在线态，证明没有凭 JWT/旧缓存降级签发。内部证明仅由测试进程从本轮服务端私有存储读取，不进入浏览器或证据 JSON。

最终浏览器批次的租户正式会话、清理载荷和到期索引均为零；随后所有本轮 JVM、容器、私有客户端凭据与密钥文件已清理。

## 发现与修复

**F06：旧 RT 索引被错误信任。** 真实 RT 轮换后，旧 RT 再次请求曾返回 200。RedisOAuth2AuthorizationService.findByToken 原来只用索引定位授权，不核对快照中当前 token。现在按 OAuth token 类型核对当前凭证值，旧索引不能证明凭证有效；state 按自身协议校验，保留索引编码和 TTL。真实 Redis 回归增加 RT/AT 轮换旧值拒绝、类型不符拒绝、state/code 与当前 token 正向反查，覆盖三种 JVM 时区。真实 OAuth 旧 RT 重放已返回 invalid_grant。

**F07：Redis 失败被网关映射为 500。** 暂停 Redis 时，前置临时封禁 EXISTS 抛 QueryTimeoutException，原全局处理器返回 500。现在仅对 /bff/auth 及子路径的 DataAccessException 返回 503/BFF_AUTH_UNAVAILABLE；不放行、不设置 Cookie、不泄露诊断。其他路径与编程异常保持原映射；新增两个网关回归验证范围与安全响应。

F06/F07 都落实已批准的凭据轮换和依赖 503 契约，无数据库迁移、公开 grant 或线上客户端配置变化。

## 回归、构建与可追溯证据

| 模块 | 通过数 |
|---|---:|
| Commons Cookie 定向 | 4 |
| Security common | 69 |
| Authorization server | 60 |
| Auth（含真实 Redis/MySQL） | 25 |
| BFF | 36 |
| Gateway | 46 |
| IAM 组织查询定向 | 3 |
| Recording | 42 |
| Security API | 3 |
| 合计 | 288 |

四服务 bootJar 任务通过；F07 后重新打包 Gateway，并用该包完成最终 288 项回归和全部浏览器故障矩阵。RT 验收所用 Auth/IAM/BFF 包与最终包 SHA-256 完全相同，Gateway 的后续 F07 仅影响前置故障映射。前端源码本轮没有修改，使用前轮构建产物做真实浏览器验收。

脱敏明细：[RESILIENCE-ACCEPTANCE-20261113.json](RESILIENCE-ACCEPTANCE-20261113.json)。保存实际状态码、签发次数、sid/jti 摘要、截止与 TTL、重启 PID、各批次包/脚本哈希及清理结果；不保存可用凭证、原始 sid 或正式 sessionId。临时脚本及日志位于本机 `/private/tmp/ingot-org-resilience-20261113-p9kd_548/`，其中 rt.log、dependency-run.log、dependency.log、regression-gradle.log 为最终记录；restart-iam-auth.log 保存同一最终包先通过的五组，最后两组由 dependency.log 记录。额外 Auth 探针曾误拼 /query 返回 403，改为声明的 /organizations/query 后以新夹具重跑 Redis/MySQL 两组；合并 JSON 保留该批次说明，未将这次探针错误当作产品失败或通过。before-* 保留产品修复前失败证据。脚本含本机路径，仅用于本轮。

## 验收边界与状态

两台 Auth/BFF 均位于同一主机，共享单个 Redis/MySQL。重启覆盖真实应用进程，依赖故障覆盖停服务、暂停存储后保留数据恢复；不宣称覆盖跨主机分区、Redis 集群故障转移、存储丢数据或任意中间写入崩溃。HTTPS 使用自签证书并忽略信任错误。

V06/V07/V08/F06/F07 完成。完整 V02 仍保留差异化权限/菜单、账号与成员安全状态矩阵、长时休眠、客户 CA、审计中心落库及协调发布/回滚等验收。current 不提前更新，C01 不勾选，不归档、不提交。

## 后续跨 VM / Cluster 反例

本报告只证明当轮保留存储数据的重启/依赖恢复。后续真实复制回滚发现安全不变量失败，详见 [集群验收](CLUSTER-ACCEPTANCE.md)；不得据本报告将整体变更标为可发布。
