# 功能与安全收尾（2026-11-14）

历史candidate10阶段结论。后续F09–F12已继续修复/复验，当前以[F12报告](LEDGER-F12-MULTINODE.md)和[A01–A13矩阵](ACCEPTANCE-A01-A13.md)为准：标准OAuth撤销新增失败，V02整体未关闭；性能独立仍阻断。下述“剩余项”等为当时记录，不能覆盖后续新失败。

当前状态为validating。功能、安全及本拓扑恢复演练已收束；用户已决定性能另做，性能门禁仍未通过，发布保持阻断。未提交，未更新current，未归档。

| 范围 | 最终证据 |
|---|---|
| 两组原Redis回滚安全反例 | candidate10 R1、R2各连续20轮通过；[复验](LEDGER-CANDIDATE10-FAILOVER.md) |
| 跨节点竞争 | 100次组织切换、450次RT双消费、450次RT与退出竞争，共1000次通过；[证据](LEDGER-CANDIDATE10-RACES.md) |
| 账号安全变更 | 五类×七个独立故障点35项、旧浏览器证明5组通过；[证据](LEDGER-CANDIDATE10-MUTATIONS.md) |
| 原登录截止 | A→B→A、21次真实RT轮换、丢响应、节点重启、DB故障与自然截止通过；[证据](LEDGER-CANDIDATE10-FIXED-ROOT-RT.md) |
| 页面与多标签 | 页面5、交付2、双标签3、平台边界2及首菜单落地通过；见candidate10对应JSON |
| 兼容功能回滚 | 关闭新切换后恢复保存的账本兼容包；有效身份保持，旧退出身份/RT/待提交事务继续拒绝；[证据](LEDGER-CANDIDATE10-RECOVERY.json) |
| 原生备份恢复 | 备份后确认退出，再停六应用恢复旧备份；放流量前启用fresh incarnation，旧部署控制被拒绝；旧租户/平台Cookie、AT、RT和待提交切换不能复活，新鲜登录通过；[证据](LEDGER-CANDIDATE10-RECOVERY.json) |
| 回归 | 后端最新组合1905项中1899通过、6项独立可选条件跳过，零失败；前端39/7/570、三包类型检查和两端构建通过；[回归](LEDGER-CANDIDATE10-REGRESSION.json) |
| 清理 | 三VM恢复原3G/2G/2G并停止；本轮容器、网络规则、目录、临时凭据和原始日志清理；[证据](LEDGER-CANDIDATE10-CLEANUP.json) |

数据库故障三场景在candidate8通过，candidate10应用结果按实际包单独记录。R1的MySQL为两节点持久多数派，第三节点因VM容量压力退出后经官方Clone恢复；静稳十表核对已通过。未宣称三数据库始终在线、物理宿主容灾或容量验收通过，详见[副节点边界](LEDGER-CANDIDATE10-SECONDARY-RECOVERY.md)。

回滚只覆盖停止新切换和账本兼容包恢复；不把回退旧Redis权威、恢复已撤销身份、跨schema二进制降级当作可用回滚。隔离机密客户端、缓存和中断时钟导致的无效尝试均保留，未计入通过；本次收尾未修改产品代码。原生导入通道失败与独立重跑边界见[恢复记录](LEDGER-CANDIDATE10-RECOVERY.md)。

剩余项为独立性能专项：补齐目标机器规格、峰值QPS并达到已批准门槛。现有P95/P99未达标，不能用功能通过解除发布阻断。current与归档在全部发布门禁闭环后处理。

收尾检查：双仓`git diff --check`通过；74个JSON解析、11份重点工件一致性及原始JWT模式扫描通过。清理前公开工件与38个已知私有值比对零匹配，清理后临时凭据文件为零；双仓暂存区及current/archive变更均为零。
