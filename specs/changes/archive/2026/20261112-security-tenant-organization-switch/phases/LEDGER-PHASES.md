# F08 持久化账本阶段（approved 2026-11-13）

2026-11-15 主变更完成：F14及最终审查已通过，双仓current已按最终实现更新，C01归档经用户授权执行。L5/其他门禁中的性能与目标发布仍由独立active Spec阻断，不因本阶段文档归档关闭。当前完成范围见[收口记录](../CLOSEOUT.md)；以下为原阶段设计和历史验收快照。

2026-11-15 F13最新：标准RT撤销P1已修复，410相关回归和最终三成员34组通过；A13/V02本地功能安全收口，性能/目标发布仍独立阻断，详见上级LEDGER-F13-OAUTH-REVOCATION.md。不更新current、不归档、不提交。

2026-11-15 F12历史状态：F12最终包三VM/GR已补验并完成证据矩阵，标准OAuth RT撤销F12-N01失败，A13/V02不能关闭。性能独立移交20261115-security-session-ledger-performance且仍未通过；目标发布由20261031-security-same-origin-release-acceptance承接。本轮不动current/归档、不提交，详见上级LEDGER-F12-MULTINODE.md。以下F08门禁和历史批次保留原归属。

| 阶段 | 输入/工作 | 退出条件 |
|---|---|---|
| L1 基础 | 九表增量迁移、Auth事务适配器、摘要/密文/UTC、控制实例/就绪、签名密钥 | 真MySQL迁移可重入、串行化/版本/CAS/重启/截止与加密回归通过 |
| L2 Auth | 授权码消费、无副作用生成、AT生效登记、RT并发/撤销、scope/并发策略、outbox | 仅账本可授权；候选AT拒绝，轮换/复用符合客户端配置，撤销成功后旧执行者不能写回 |
| L3 BFF | 持久prepare/activate、登录接入、绑定/root/generation、交付与恢复、注销 | 跨BFF CAS一个结果，丢响应同结果，旧root不能覆盖新root，Cookie截止保持 |
| L4 全链 | Gateway/资源权威读取，去JWT-only，前端pending logout/多页隔离、IAM撤销 | 数据源故障503、旧缓存不放行，旧写请求不重放；类型/构建通过 |
| L5 验收 | 三VM/六Redis复验、三节点MySQL故障、性能、迁移/回滚演练 | 以下反例与全部发布门禁通过，证据可核对；否则维持阻断 |

## R1 已确认切换后复制回滚
健康复制A基线→阻断三副本数据保留投票→真实A切B成功且账本COMPLETED/A拒绝→逐一终止Redis三主自动选主→另一Auth/BFF查询/提交/窗口内resume→重启再查。
必须：旧A Cookie/AT始终拒绝；唯一op/结果、generation只+1；未refresh结果摘要不变，已refresh不返消费RT；未提交候选永无效；旧Redis数据不能放行；root截止不变。连续≥20轮。

## R2 已确认退出/RT撤销后复制回滚
真实交付B及单独机密RT会话→阻断复制→BFF退出/RT撤销各取得成功并核对DB→逐一终止主节点自动选主→跨节点重放Cookie/AT/RT/commit/resume→Auth/BFF重启。
必须：me/业务及直接旧AT拒绝，RT400 invalid_grant，resume无Set-Cookie且不能激活；旧worker/outbox不能覆盖；新凭据登录不被旧root覆盖；DB断链503而非旧缓存放行；自然截止仍失效。连续≥20轮。

## 其他门禁
- 两节点切换/注销/refresh竞争累计≥1000，零越界/重复生效/复活。
- 崩溃点：claim、签名、候选提交、激活COMMIT、Cookie回包、交付确认、outbox，含提交ACK丢失。
- DB：RPO0自动主切换、少数派仍TCP可达、失多数、旧主重入、备份恢复fresh incarnation；无授权降级。
- 正常A→B→A/无候选/搜索空/成员失效/无权限落地/平台登录退出改密回归。
- 原截止实际等待，记录时钟误差；真实RT连续轮换、旧RT重放、复用配置分开记录。
- 迁移：旧Redis身份拒绝，一次新登录；旧应用隔离；仅账本兼容包回滚，已撤销身份不复活。
- 性能按DESIGN门槛，不满足不得弱化安全放行。
- 记录包哈希/内核/网络计数/Redis偏移/DB提交/代次/token摘要/UTC时间，凭据不出日志；清理本轮资源，VM恢复停止。
