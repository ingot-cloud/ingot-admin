# candidate10 副节点 OOM 与恢复（2026-11-14）

worker2 的 MySQL 在 07:04:41Z 因 VM 全局 OOM 退出，容器没有内存硬上限，退出时约997MB匿名RSS；本轮 Docker 数据置于 tmpfs 约1.3GB，另有Auth/BFF进程。内存不足属于真实环境失败，不能描述成三节点始终在线。

影响边界：1000次竞争、页面5项和交付2项完成在本次退出之前。随后 R1 readiness120 的20轮均在两节点持久多数派下执行，两套Auth/BFF及三台VM仍在线；每轮身份断言通过。本结果证明该多数派下的Redis回滚安全性，不能证明三节点持续在线的容量能力。R2前8轮也跨越副节点退出和恢复，逐轮事实保留，不把恢复本身计为应用验收。

按原配置启动后，副节点通过官方Clone恢复；因容器需在Clone后重启而完成第二次启动。确认本次Clone为07:53:31.406Z至07:56:26.959Z，Completed/0，三节点回到同一ONLINE视图。未手工删除账本、未RESET复制历史、未建立空组、未更改身份截止或持久性要求。Auth1由R2自身的SIGKILL重启释放先前热身的较高内存占用，未额外干预测试步骤。

补验：全部测试应用停止后，三节点同视图ONLINE；九张Auth表和IAM结果表校验和、会话状态、实例标识及强落盘设置全部一致，见[静稳核对](LEDGER-CANDIDATE10-QUIESCENT-CHECKSUMS.json)。容量/性能、备份恢复新实例及其他门禁仍阻断发布，未提交。详见[JSON](LEDGER-CANDIDATE10-SECONDARY-RECOVERY.json)。
