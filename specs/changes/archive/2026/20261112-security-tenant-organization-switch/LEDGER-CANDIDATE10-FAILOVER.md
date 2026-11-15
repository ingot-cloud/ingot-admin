# candidate10 两组 Redis 回滚反例复验（2026-11-14）

R1、R2各连续20轮完整通过；跨节点竞争另有1000次全部通过。每批的包与逐轮摘要分别保留，旧失败或部分轮次未混计。

| 组别 | 结果 | 实际断言 |
|---|---|---|
| R1 | 20/20 | Redis旧ACTIVE投影晋升后，旧Cookie和来源签发仍拒绝；查询/提交/恢复同一结果，代次只+1，原截止不变；Auth/BFF重启后保持 |
| R2 | 20/20 | 真实注销和独立RT撤销均先获成功；旧ACTIVE投影晋升后，旧Cookie/AT/RT仍拒绝，resume无Set-Cookie；Auth/BFF SIGKILL重启后仍拒绝 |

R2每轮重启后显式断言当前时间仍早于该RT的原始到期时间。它使用独立新建的AT20/RT600客户端，以覆盖120秒冷就绪预算；没有延长已发行凭据或已有BFF root。注销200不删除正式/绑定Cookie，响应事实是持久撤销。

边界：R1 readiness120批次20轮运行于三成员GR的两节点持久多数派，第三成员因VM全局OOM退出；R2前8轮跨越该退出及官方Clone恢复，随后三节点同视图ONLINE。详见[副节点记录](LEDGER-CANDIDATE10-SECONDARY-RECOVERY.md)，不把该结果表述为三节点始终在线或容量门禁通过。完整表校验和等待应用静稳窗口。

证据：[R1](LEDGER-CANDIDATE10-R1.json)、[R2](LEDGER-CANDIDATE10-R2.json)、[1000竞争](LEDGER-CANDIDATE10-RACES.md)。先前R1冷启动45秒超时批次独立保留；新批次从零计数。固定root真实RT/自然截止、C02崩溃点、备份/兼容回滚、性能与清理仍有未完成项，L06/L07及发布阻断不提前关闭，未提交。
