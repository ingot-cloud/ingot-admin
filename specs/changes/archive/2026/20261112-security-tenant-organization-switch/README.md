# 租户端直接切换组织与持久会话账本

> 状态：completed
> 完成日期：2026-11-15
> 关联提交 / PR：无；用户要求先不要提交，未创建commit或PR。

用户明确授权主变更收口、先更新current后归档。组织切换与会话账本本地/三VM功能安全范围完成；最终F14的57定向包含于418相关回归、40组真实验收与GR/十表一致性通过，最终只读审查无新增需修复问题。**性能专项和目标环境验收仍各自独立阻断正式发布；本归档不表示性能通过或生产已经部署。**

- 关联双仓归档：[ingot 同名变更](../../../../../../ingot/specs/changes/archive/2026/20261112-security-tenant-organization-switch/README.md)。
- [收口记录](CLOSEOUT.md) · [完成元数据](CLOSEOUT.json) · [A01–A13证据矩阵](ACCEPTANCE-A01-A13.md) · [F14最终验收](LEDGER-F14-RECOVERY-AT-ONLY.md)
- 更新基线（完整文件清单见CLOSEOUT）：[specs/current/org/organization-switch/README.md](../../../../current/org/organization-switch/README.md) · [specs/current/security/session-context/README.md](../../../../current/security/session-context/README.md) · [specs/current/ingot-login/password-login/README.md](../../../../current/ingot-login/password-login/README.md)
- [性能专项](../../../active/20261115-security-session-ledger-performance/README.md)（draft、未通过、发布阻断）；[目标环境验收](../../../../../../ingot/specs/changes/active/20261031-security-same-origin-release-acceptance/README.md)（draft、未通过、发布阻断）。
- 最终实现相对初始方案：Redis权威改为Auth九表+IAM结果表；注销确认账本撤销且不删Cookie；严格恢复/IAM后代次重验；标准RT固定族撤销与AT-only无凭据时退休；性能及目标发布范围独立承接。所有行为调整均有原批准记录，详见收口记录与历史工件。

## 历史实施与验收快照

以下“未更新current”“未归档”“validating”及失败记录保留其发生时的事实；后续处置和最新完成状态以上方及CLOSEOUT为准。历史证据的归档/提交标志不追溯改写，原失败不删除或改计通过。

F14两项审查修复已完成：57定向包含于八模块418项回归，零失败/跳过；三VM双向真实验收40组、换主后3项GR及静稳十表一致通过。A13/V02本地三VM功能安全范围重新收口；性能独立仍未通过、目标发布另验，不更新current、不归档、不暂存/提交。见[F14报告](LEDGER-F14-RECOVERY-AT-ONLY.md)及[验收矩阵](ACCEPTANCE-A01-A13.md)。

F13标准RT撤销P1已修复：新增定向13项、相关八模块410项（包含该13项）零失败/零跳过，最终三成员GR健康后重跑34组真实验收全部通过。A13及V02本地/三VM功能安全范围收口；性能独立仍未通过并阻断发布，目标环境发布另验。不更新current、不归档、不暂存/提交。见[F13报告](LEDGER-F13-OAUTH-REVOCATION.md)及[验收矩阵](ACCEPTANCE-A01-A13.md)。

F13批准与实施记录：用户明确授权后双仓先approved再实施；现已完成，以下F12失败及当时待办保留历史，不覆盖上方最新收口结论。

F12历史最终F11包补验记录：35组通过、标准OAuth RT撤销1组失败；两任GR主节点各3项通过，三VM/十表静稳一致且资源已清理。A01–A13证据已形成，A13/F12-N01及V02整体保持未完成；性能独立未通过、发布仍阻断。见[F12报告](LEDGER-F12-MULTINODE.md)、[验收矩阵](ACCEPTANCE-A01-A13.md)和[新失败](LEDGER-F12-OAUTH-REVOCATION.md)。不更新current、不归档、不暂存/提交。

F12授权/范围：最终包三VM/GR补验与A01–A13证据收口；性能独立移交但仍阻断发布。执行结果以上方最新结论为准，未将验收失败标通过。

F11两项P1修复、相关回归及最终包真实复验已通过；见[补充修复验收](LEDGER-F11-P1-FIXES.md)。性能仍未通过、发布仍阻断；不更新current/归档，不提交。

F10最终修复包三VM多节点及GR补验已通过：[多节点复验记录](LEDGER-F10-MULTINODE.md)。性能仍未通过，发布继续阻断；未提交。

F09三项审查修复与最终包复验已完成：[修复与复验记录](LEDGER-F09-REVIEW-FIXES.md)。性能门禁继续独立保留，未提交。

历史阶段结论（candidate10；后续F09–F12见上方）：[功能与安全收尾](LEDGER-FUNCTIONAL-SECURITY-CLOSURE.md)。candidate10原两组反例各20轮、1000竞争、C02故障点、固定根RT及恢复演练通过；性能按用户决定另做，仍未达标，保持发布阻断。未提交，current/归档不更新。

- Change ID：`20261112-security-tenant-organization-switch`
- 创建日期：2026-11-12
- 负责人：jy
- 关联仓库：`ingot` 同名 change
- 来源：本次对话已完成 Plan 讨论，用户明确要求实施修订计划。
- 审批记录：2026-11-12 draft/review 对应已完成的对话设计；本次明确实施指令确认 approved。

## 工件

[需求](REQUIREMENTS.md) · [设计](DESIGN.md) · [接口](API.md) · [任务](TASKS.md) · [验证记录](VALIDATION.md)

## 验证状态

2026-11-12 实施完成，定向测试、类型检查、构建与受控 HTTPS 浏览器验证通过。扩展全量回归发现的 2 项既有失败已按用户授权修复；前轮后端相关回归 275 项通过，2 项环境测试已于 2026-11-13 补跑通过，Auth 全量 25 项零跳过，详见验证记录。2026-11-13 已完成五个重点真实账号场景与两项强制跨节点复核；完整发布验收 V02 仍保留，current 不提前修改。

关联工件：[ingot 同名 change](../../../../../../ingot/specs/changes/archive/2026/20261112-security-tenant-organization-switch/README.md)。未创建 commit。

## 2026-11-12 回归修复扩展

用户明确授权分析修复登录文案与部门集合两项失败，先不提交。以下范围及恢复既有契约的实施决策已 approved；完成后重新进入 validating，真实环境验收范围保持待验。

回归修复结果：F01/F02/V03 完成，两个原失败用例和新增安全/兼容回归通过，四服务打包通过。状态回到 validating；未提交，真实环境发布验收仍待执行。

2026-11-13：Redis/MySQL 条件集成测试已在隔离真实实例补跑，三种 JVM 时区全部通过；Auth 全量 25 项零失败、零跳过。测试主体序列化与部门只读断言已增强，临时资源已清理。详见验证记录和集成结果 JSON；未创建提交。

2026-11-13 真实验收：A→B→A、双标签竞争、退出并发、丢响应恢复、原截止全部通过；退出与恢复已强制在不同 BFF 节点补验。真实入口发现的配置、预授权准入和 Cookie 固定截止问题已修复。最终包 286 项相关回归零失败、零跳过，临时环境已清理。见 [真实验收报告](REAL-ACCEPTANCE.md) 和 [脱敏明细](REAL-ACCEPTANCE-20261113.json)。V02/C01 仍未完成，未提交。

2026-11-13 继续补验：真实 RT 七次连续刷新、Auth 重启、自然截止和撤销拒绝通过；Auth/BFF 实际重启、Auth 故障期间退出、IAM/Auth/Redis/MySQL 故障 503 与恢复幂等通过。F06/F07 修复后最终相关回归 288 项，零失败/零跳过。见 [补充验收报告](RESILIENCE-ACCEPTANCE.md) 和 [脱敏明细](RESILIENCE-ACCEPTANCE-20261113.json)。完整 V02/C01 仍保留，未提交。

## 2026-11-13 跨 VM / Redis Cluster：验收未通过

用户选定的三台独立 VM、真实六节点 Redis Cluster 已实测：应用断链、完整复制后的自动选主、原截止通过；复制落后后的确认写入回滚导致同一事务签发两次、旧 Cookie/resume/RT 重新返回 200。发布阻断，不能以原截止保持或前轮回归通过覆盖。见 [失败验收](CLUSTER-ACCEPTANCE.md) 与 [一致性评审稿](FAILOVER-CONSISTENCY-REVIEW.md)。本轮未改生产代码，三 VM 已恢复原停止状态，未提交；V02/C01 仍未完成。

## 2026-11-13 F08 设计修订批准

用户已批准持久化安全账本方案及一次性重新登录，授权先更新双仓至approved后分阶段实施，先不提交。当前批准依据为DESIGN.md、API.md、REQUIREMENTS.md及phases/LEDGER-PHASES.md；原失败证据原样保留。发布仍阻断，验收未完成；current不提前修改。

2026-11-13：L00已完成后进入implementing，L1基础阶段施工；批准记录保留，发布阻断未解除。

L1基础验证通过：15项定向（11项真实MySQL）零失败/跳过；认证链尚未切换，开始L2。详见[基础验证](LEDGER-L1-VALIDATION.md)。

2026-11-14 持久化账本复验：原R1复制回滚连续20轮通过，R2仍在重新批量执行；发布门禁未闭环。最新证据见[账本复验](LEDGER-FAILOVER-REVALIDATION.md)及同名JSON。

2026-11-14 最新进度：[真实页面验收](LEDGER-UI-ACCEPTANCE.md)四项通过，已修复统计JSON类型；candidate5相关后端全量回归通过。R2连续19轮后第20轮登录UNKNOWN，不能计为20轮完成；最终协调包竞争与其他门禁仍在进行，发布阻断、current不更新、不提交。

2026-11-14 F09：用户授权最终审查三项问题修复及真实复验；双仓Spec/任务先同步approved，历史功能收尾结论保留，新增修复未验收。性能独立未通过，不提交。

2026-11-15 F11-00完成：双仓approved决策完整，开始F11-01/02实施；性能发布门禁保留。

2026-11-15 F11完成：两项P1、bootstrap失败返回兼容修复、定向与相关回归及最终包真实复验全部通过；隔离环境与私密工件已清理。性能仍独立未通过、发布仍阻断，保持validating，不更新current/归档，不暂存/提交。

2026-11-15 F12收口：最终包敏感修复路径及实际页面通过，新增标准OAuth RT撤销兼容性反例已双向复现；本轮只修改Spec/证据和临时夹具，产品实现/配置/DDL未改。F12-N01需确认修复设计及新包复验后才能关闭A13/V02。current与归档按用户要求待另轮处理。

2026-11-15 F13-00完成：已先同步approved，开始专用标准撤销provider/账本事务实现与定向复验；原F12失败保留，不提前关闭验收。

2026-11-15 F13完成：F13标准RT撤销P1已修复：新增定向13项、相关八模块410项（包含该13项）零失败/零跳过，最终三成员GR健康后重跑34组真实验收全部通过。A13及V02本地/三VM功能安全范围收口；性能独立仍未通过并阻断发布，目标环境发布另验。不更新current、不归档、不暂存/提交。见[F13报告](LEDGER-F13-OAUTH-REVOCATION.md)及[验收矩阵](ACCEPTANCE-A01-A13.md)。两Auth新包、其余三jar/双端manifest冻结核对；十表静稳一致性通过，三VM原内存/Stopped及非本轮Docker资源保留。中间OOM/夹具失败及最终三成员重跑边界详见报告。

2026-11-15 F14-00完成：双仓先approved、决策完整；现开始F14-01/02，性能门禁保持。

2026-11-15 F14完成：双仓先approved后实施，原两项反例及新增真实竞态已修复复验，资源/凭据清理及原VM状态恢复；主状态validating，性能/目标发布依赖保持。
