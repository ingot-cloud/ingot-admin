# 账本接入阶段进展（validating，2026-11-14）

## 当前续验快照（2026-11-14，candidate10）

发布仍阻断，未提交，current 未更新。最新代码回归为 Auth114（真实 Redis/MySQL/三节点 GR）、BFF34、Gateway46、commons17、Feign12、security-common71、authorization-server60、account-core26 全通过；IAM1525 中1519通过、6项独立可选门禁跳过。candidate10 仅增加存储故障脱敏诊断和2项回归，其他模块沿用 candidate9 的包与证据，详见 [最新回归](LEDGER-CANDIDATE10-REGRESSION.json)。

已有真实证据：candidate9 连续100次切换竞争通过；candidate8 五项页面、两项丢响应/迟到注销回包、三项 MySQL 主故障/少数派/失多数故障通过。candidate9 RT 消费竞争270次通过后出现503，批次停止；随后确证独占VM磁盘耗尽及多数派中断，不能记作900次通过，也不能用环境恢复补记。恢复、维护GTID失误及官方Clone完整性核对见 [容量记录](LEDGER-CAPACITY-RECOVERY.md)。

candidate10 最新结果：100切换+450 RT双消费+450 RT/退出竞争累计1000次全部通过；R1与R2均已从零连续20轮完整通过。页面5项、交付2项、真实双标签页3项、平台边界2项及首个可访问菜单落地通过。C02五类账号变更35个独立故障点及5组旧预授权/待提交切换凭据验证通过，见 [C02故障复验](LEDGER-CANDIDATE10-MUTATIONS.md)。

R1这20轮运行于三成员GR的两节点持久多数派：worker2因VM全局OOM退出，后经官方Clone恢复至三节点同一ONLINE视图；停应用静稳窗口十表校验和、会话状态、实例与持久性已一致核对，见 [副节点边界](LEDGER-CANDIDATE10-SECONDARY-RECOVERY.md) 与 [静稳核对](LEDGER-CANDIDATE10-QUIESCENT-CHECKSUMS.json)。不能据此宣称三节点始终在线或容量门禁通过。历史candidate1 R1、candidate2 R2仅19轮及所有失败批次均分开保留，不混计。

权威读取性能仍失败：默认P95 60.05ms/P99 90.61ms；临时统计/JDBC对照均已恢复，见 [性能记录](LEDGER-PERFORMANCE-CONTROLS.md)。用户已明确“先收束功能与安全，性能另做”，本轮不继续性能专项，发布门禁保持未通过。固定root RT、备份恢复fresh incarnation、兼容功能回滚及环境清理均已完成；详见[功能与安全收尾](LEDGER-FUNCTIONAL-SECURITY-CLOSURE.md)。current/归档不更新，不提交。

以下为先前批次与定位过程，保留其版本和失败边界，不代表最新包结果。

## 历史续验快照（保留原批次）

最新续验见 [2026-11-14 续验记录](LEDGER-CONTINUATION-20261114.md)：candidate8 Auth112/BFF28全量通过，普通RT竞争900次通过属于candidate5，性能仍不达标。下文历史版本及失败批次保留，不视为最终包验收。

candidate5相关后端全量回归：Auth102、BFF28、Gateway46、security-common71、authorization-server60、account-core26均零失败零跳过，真实Redis/MySQL/GR实际启用；IAM1525零失败、43项可选环境跳过。另commons17零失败零跳过；快照verified-full-1794624391551042000。

原R1在candidate1连续20轮通过；candidate2 R2连续19轮通过，第20轮初始登录UNKNOWN且候选被撤销，未进入本轮故障注入，不能计为20轮完成。新增脱敏诊断后真实登录30轮通过但未复现，原失败仍保留待查。

真实页面发现并修复组织统计字符串问题，total/switchableTotal固定JSON数字、ID字符串保持；四项真实页面验收通过，证据见LEDGER-UI-ACCEPTANCE。candidate5协调包正在串行执行竞争批次；先前混跑批次450次消费竞争及39次注销竞争后请求超时，部分证据保留，不计完整门禁。已清理一条仅属于本轮的旧Gateway JVM，当前实例和原有容器保留。

固定root RT、MySQL真实故障、C02崩溃点、性能与发布回滚及最终清理尚未完成。current未更新，未提交。以下历史观察保留原样，不能以旧快照或部分轮次替代最新门禁。


持久化账本已接入 Auth 授权/AT/RT、幂等候选、BFF 事务与注销、Gateway 和资源服务实际 AT 校验。F08-C01 注销无删除 Cookie、F08-C02 IAM 安全变更结果表均按用户批准实现。当前仍在实施和故障复验；发布阻断，current 不更新，未提交。

## 已验证范围

- 真实平台/租户改密、持久安全阻断解除、重新登录及 A/B 双组织账号创建通过。真实 Chrome 同源 HTTPS 的 A→B→A、另一标签页成员资料同步、新会话与组织代次、原登录截止不变通过。
- 三 VM 独立内核、六 Redis、三节点 MySQL GR 已建立。GR 三项专项通过，不能代替实际少数派/选主/恢复验收。三 VM 同物理宿主，只证明本拓扑下的逻辑故障。
- 非敏感 Redis v2 派生索引经独立持久任务投递，使用 PXAT 固定截止，不存凭据或原始 sid。两项真实 MySQL+Redis 回归通过；审计积压不阻塞身份清理的回归通过。
- 相关后端：BFF 20、Gateway 46、security-common 71、authorization-server 60、account-core 26，均零失败零跳过。IAM 1525 项中 1482 通过、43 项可选环境用例跳过，不能计为通过。此前 Auth 整模块 87 项零失败零跳过，含显式启用的 Redis/MySQL 时间和序列化用例；此后新增用例，最终整模块仍待重跑。
- 最新 Auth 账本定向 68 项：65 通过、3 项 GR 条件跳过、零失败；GR 三项已在独立真实三节点环境单独执行通过。报告快照位于本轮隔离验证目录 verified-20261114-deadline。
- 前端 auth-core 39、auth-plugin 7、admin-core 570 项通过；三个包类型检查、共享包及两端构建通过。

## 本次续验发现与修复

预登记 BFF 会话截止与稍后换码的签发时刻可能跨秒。原实现按后者加 TTL，导致 token 晚于预登记 Cookie 截止，提交时被安全校验拒绝。新增真实 MySQL 回归先复现失败；Auth 换码读取现已将预登记会话截止加入最小值，修复后定向回归通过。不放宽原截止、不延长已有会话。

R1 新包复验已实际执行 Redis 旧副本自动晋升和原事务恢复，但脚本未以 me 确认 Cookie 交付，60 秒恢复窗口后未交付会话被可靠清理，整轮不计通过。已由数据库 UTC 变更时刻核对，与原登录截止无关。脚本补齐真实交付确认后重跑，R1/R2各一轮真实完整复验随后通过；固定最终包的20轮计数仍待完成。耗时故障轮次将使用新建的 600 秒测试登录；短截止自然过期单独验证，不能以延长已有身份代替。新增脱敏动作/错误码/代码位置诊断不包含凭据。

## 尚未完成的发布门禁

R1/R2 各至少 20 轮、跨节点切换/注销/refresh 竞争至少 1000 次、真实固定 BFF root 的连续 RT 与自然截止、提交 ACK 丢失和故障点、MySQL 选主/少数派/重入/备份恢复、性能和协调迁移/发布/回滚、物理保留收敛及最终完整回归。未完成项不勾选，不以先前 Redis 权威架构的通过结果覆盖。

## 环境与证据边界

测试 VM 磁盘未调整，内存临时 4G/4G/4G，结束恢复原 3G/2G/2G 并停止。独立 Docker/containerd 命名空间和持久 MySQL 数据仅属于本轮。初始化空库时清理过无应用数据的初始化 GTID，已开始验收的数据禁止使用该步骤。旧测试曾误用尚未生效的新密码触发真实登录保护，仅清理独占测试 Redis 的本次 IP 临时封禁，未禁用产品门禁。代理补齐 chunked 请求解析后真实资源请求通过。

数据库一致性依据见 [MySQL 官方说明](https://dev.mysql.com/doc/refman/8.4/en/group-replication-configuring-consistency-guarantees.html)；实现依据不等于故障验收证据。所有公开工件仅保留摘要和公开事务标识，私有测试凭据不进入仓库。

批量首轮补发现同一事务前台提交与后台完成的竞争：等待范围/绑定锁期间另一执行者已提交，仍以原快照判来源代次变化而返回409。持久结果唯一，未重复签发；正补确定性同事务并发测试，完成后以新包重启20轮批次。

2026-11-14 批量继续：固定包R1前5轮完整通过；第6轮后台完成发生在前台来源token复验期间，前台回503但账本仅一结果。Auth加入同操作完成事实重验，仍由正式事务校验当前结果；真实MySQL正/反向回归通过，退出后无恢复。BFF补签发回包失败但后台已完成时的原结果交付，与注销/未知结果反向用例。新包将从零重跑批次，不能将这5轮当作最终包20轮完成。此前完整后端快照Auth100/BFF20/Gateway46/security-common71/authorization-server60/account-core26均零失败零跳过；IAM1525中43跳过，最新新增用例计数待固定包再跑。

最新固定包回归快照 verified-full-1794616937761099000：Auth102/BFF23/Gateway46/security-common71/authorization-server60/account-core26均零失败零跳过，Redis/MySQL/三节点GR实际启用；IAM1525中43可选跳过、零失败。新增保留4项和全部前台/后台竞争回归已通过。随后重载受独占VM的MySQL OOM影响中断，另外两节点多数派保持ONLINE；已保留持久数据恢复退出节点，三节点ONLINE，并逐台重启释放内存。仅调整本轮MySQL消息缓存128MiB和日志缓冲16MiB，强落盘/一致性不变，未重置GTID或重建账本。最新包已复制并重新启动，最终20轮批次从零执行。
