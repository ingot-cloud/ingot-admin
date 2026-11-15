# 主变更完成与归档

2026-11-15，用户明确授权：双仓组织切换与会话账本主变更收口，先按最终实现更新current，再归档；性能和目标环境验收继续独立发布阻断，不提交。本轮仅文档/目录整理，未改运行代码、配置或DDL，未部署、未重新执行测试，未创建commit/PR。

## 完成范围与依据

主change状态completed，C01已完成；本地及三VM功能安全范围完成，A13/V02以F14最终包收口。57定向包含于418相关回归，零失败/跳过；40组真实HTTP/Chrome验收、GR前后各3次执行及静稳十表一致通过。最后只读审查未发现新的需修复问题，制品与证据一致。

[最终验收报告](./LEDGER-F14-RECOVERY-AT-ONLY.md) · [原始脱敏明细](./LEDGER-F14-RECOVERY-AT-ONLY.json) · [A01–A13矩阵](./ACCEPTANCE-A01-A13.md) · [完成元数据](./CLOSEOUT.json)

原Redis回滚反例、标准RT撤销失败、历次夹具失败及批准修复记录全部保留；不把旧包/组件/模拟或历史耐久测试冒称为F14重跑。前端658等复用边界保持最终报告的原版本说明。历史JSON的currentUpdated/archived/committed字段保留执行当时事实，本文件和CLOSEOUT.json表达本次归档状态。

## Current基线

### ingot

- [specs/current/security/tenant-organization-switch/README.md](../../../../../../ingot/specs/current/security/tenant-organization-switch/README.md)
- [specs/current/security/tenant-organization-switch/SPEC.md](../../../../../../ingot/specs/current/security/tenant-organization-switch/SPEC.md)
- [specs/current/security/session-ledger/README.md](../../../../../../ingot/specs/current/security/session-ledger/README.md)
- [specs/current/security/session-ledger/SPEC.md](../../../../../../ingot/specs/current/security/session-ledger/SPEC.md)
- [specs/current/security/same-origin-login/SPEC.md](../../../../../../ingot/specs/current/security/same-origin-login/SPEC.md)
- [specs/current/security/same-origin-login/README.md](../../../../../../ingot/specs/current/security/same-origin-login/README.md)
- [specs/current/security/session-safety/SPEC.md](../../../../../../ingot/specs/current/security/session-safety/SPEC.md)
- [specs/current/security/session-safety/README.md](../../../../../../ingot/specs/current/security/session-safety/README.md)
- [specs/current/security/credential-security/SPEC.md](../../../../../../ingot/specs/current/security/credential-security/SPEC.md)
- [specs/current/iam/database-persistence/README.md](../../../../../../ingot/specs/current/iam/database-persistence/README.md)
- [specs/current/iam/database-persistence/SPEC.md](../../../../../../ingot/specs/current/iam/database-persistence/SPEC.md)
- [specs/current/README.md](../../../../../../ingot/specs/current/README.md)

### ingot-admin

- [specs/current/org/organization-switch/README.md](../../../../../../ingot-admin/specs/current/org/organization-switch/README.md)
- [specs/current/org/organization-switch/spec.md](../../../../../../ingot-admin/specs/current/org/organization-switch/spec.md)
- [specs/current/security/session-context/README.md](../../../../../../ingot-admin/specs/current/security/session-context/README.md)
- [specs/current/security/session-context/spec.md](../../../../../../ingot-admin/specs/current/security/session-context/spec.md)
- [specs/current/ingot-login/password-login/spec.md](../../../../../../ingot-admin/specs/current/ingot-login/password-login/spec.md)
- [specs/current/ingot-login/password-login/README.md](../../../../../../ingot-admin/specs/current/ingot-login/password-login/README.md)
- [specs/current/packages/network-query/spec.md](../../../../../../ingot-admin/specs/current/packages/network-query/spec.md)
- [specs/current/packages/app-header/spec.md](../../../../../../ingot-admin/specs/current/packages/app-header/spec.md)

## 最终设计与初始方案差异

- 纯Redis权威和“无需迁移”改为Auth九表持久账本、强GR及IAM一张安全变更结果表，旧身份不导入；所有修订有用户批准记录。
- 注销200仅确认账本持久撤销，不删除正式/绑定Cookie，迟到注销不影响新登录；Cookie固定原绝对截止。
- 登录/组织恢复使用严格命令，IAM返回后最终复验凭据代次；完成结果交付同样受门禁，普通另一租户AT与派生门禁分离。
- 标准RT撤销固定族及全部该sid AT，AT-only凭据耗尽时退休固定sid释放名额，其他有效凭据及并发新sid隔离。
- 性能与目标发布从主change完成条件中独立承接，归档仅关闭主实现/功能安全范围，不解除任何发布门禁。

## 独立阻断与未发布事实

[性能专项](../../../active/20261115-security-session-ledger-performance/README.md)继续active/draft、未通过、发布阻断；门槛、历史失败数值和目标规格/QPS待确认状态保留。

[目标环境验收](../../../../../../ingot/specs/changes/active/20261031-security-same-origin-release-acceptance/README.md)继续active/draft、未通过、发布阻断；客户CA、真实长停留/隔天/物理休眠、目标部署/监控及首次部署恢复由E00–E05承接。已有本地/三VM证据可按版本与类型复用，不能替代目标环境实测。

两个门禁分别验收通过前，不确认正式发布。三VM同物理宿主，不声明物理容灾或容量通过；本次更新开发基线不代表生产已经切换。

## 归档完整性核对

双仓20份current文档完成，主变更全部任务完成；92份JSON解析和735处相对链接核对通过，无遗留active主目录链接。90份历史验收JSON（两仓各45份）逐字节保留；原阶段标志不追溯改写。F14四jar/双端静态摘要未变，性能需求/设计/接口/任务及目标环境需求/设计未改门槛。两独立门禁仍draft且发布阻断，目标E00–E05继续未完成；运行代码/配置/DDL无变化，两仓暂存区为空，未创建提交。

## 归档后标题锚点与交叉链接复核

用户授权修复历史401归档记录的current标题锚点：`#3-resource-server-校验`改为`#3-校验与并发`。扩大目录/规则入口检查后，一并修正旧分层缓存归档README的5处路径层级错误（路线图、依赖归档两处、根AGENTS与ingot-core）。两份历史README合计6处仅改链接目标，原验收内容和关联提交保持；不追溯改写原测试结果或当时的文件级检查快照。

双仓扫描1352份Markdown，主归档、20份current、索引、独立门禁、运行手册及修复来源共117份主文档，检查其全部本地出链和全仓指入这些文档/目录的链接，并纳入旧active路径与错误邻接文件名。184份相关来源文档的903处本地链接、44处跨仓链接、18处标题/显式锚点、131处入链及13处目录链接全部通过，无缺失目标、大小写错位或失效锚点。

采用CommonMark解析，验证引用式链接、Setext/重复/Unicode标题和HTML锚点，排除代码围栏示例；解析器控制样例及原失效锚点负向检查通过。外部网站未做网络抓取，不将其计为本地链接通过。

历史验收JSON与F14统计/制品保持，current内容及记录哈希未改。性能专项和目标环境仍独立active/draft、未通过并阻断发布；本轮不改运行代码/配置/DDL，不重跑功能测试、不启动VM、不提交。

## 提交授权与剩余工作

2026-11-15，用户授权整理后提交双仓主变更。上文及JSON中的未提交标志保留归档/链接复核执行时的快照；后续提交状态和标识以Git历史为准，不追溯修改历史验收报告。功能实现、Spec收口及旧归档链接维护分开提交，不包含无关工作区文件，不推送远端。本次补齐IAM迁移说明两处归档引用，运行代码、配置、DDL和最终制品保持。

剩余发布工作由两个独立Spec承接：性能P01–P06需确认目标规格与QPS、批准执行方案、完成负载测量及必要优化复测；目标环境E00–E05需确认两个origin、证书、制品配置、账号和执行窗口，补齐TLS/会话边界、真实长停留/隔天/物理休眠、安全缺口、首次部署及失败恢复证据。两项继续draft、未通过并阻断正式发布，提交不解除门禁。

补齐引用后905处相关本地链接通过；IAM初始化生成一致性及6项框架表结构测试通过，前端文档检查在Node 22.17.0下通过。功能回归继续引用已冻结F14的418项及40组真实验收，本次没有重跑或新增计数。
