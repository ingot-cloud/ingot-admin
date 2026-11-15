# 容量故障与恢复记录

candidate9的RT竞争在270次通过后出现[200,503]，批次中止，不计900或1000门禁完成。MySQL错误日志显示worker1在05:20:51Z、manager在05:23:36Z出现磁盘满；3.9GB测试盘上的复制relay日志累计数百MB。随后Auth114项回归中三项GR夹具连接/建库超时，属于依赖故障，未计通过。

应用已停写。通过MySQL正常PURGE关闭binlog、轮转relay，由数据库回收不再需要的日志，没有手删relay、账本表或RESET GTID。各次PURGE保留当前binlog并核对执行GTID不变。

一次在离组worker1执行的relay轮转漏加LOCAL，产生本地维护GTID并阻止重新加入。这是本轮操作疏漏，已保留binlog证据：唯一额外GTID仅包含FLUSH RELAY LOGS，不含账本写入；其余全部目标GTID包含于供体。通过官方Clone从原组健康供体恢复该节点，未伪造空事务或bootstrap。恢复前三节点应用保持停止；前后九张Auth表及IAM结果表校验和、会话状态及原实例标识相同，三节点同视图ONLINE，redo64MB、flush1/sync1保留。

之后维护使用FLUSH LOCAL并在维护会话关闭binlog；验证没有本地事务域。仅在三节点健康同视图时按测试环境阈值轮转，保持原600秒日志保留；不缩短身份或审计保留，不清账本。低于容量阈值停止本轮应用写入。虚拟机磁盘未扩容，原有容器/数据未清理。

恢复后Auth114项真实Redis/MySQL/GR完整回归零失败零跳过。新增两项只覆盖存储503诊断脱敏与非存储异常原样抛出，身份行为未改。日志维护及恢复属于基础设施证据，不替代尚未完成的RT900、R1/R2最终包20轮、固定root RT、C02、性能、备份恢复/回滚及最终清理。

依据：[MySQL FLUSH语义](https://dev.mysql.com/doc/refman/8.4/en/flush.html)、[GR通道日志轮转](https://dev.mysql.com/doc/refman/8.4/en/channels-commands-single-channel.html)、[relay日志回收](https://dev.mysql.com/doc/refman/8.4/en/replica-logs-relaylog.html)。
