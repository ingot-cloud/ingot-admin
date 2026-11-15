# F08-C02 IAM安全变更事务记录（approved 2026-11-13）

## 发现与设计差异
已批准设计要求账号改密/锁定/禁用先持久阻断、跨库可靠补偿，且认证账本九表只部署Auth库。现有账号域在业务COMMIT后调用撤销RPC，FeignSessionRevocationAdapter吞异常返回0。仅把这条RPC换成Auth账本不能证明IAM事务在宕机时提交还是回滚；自动解除未知阻断会重新放行旧凭据。Auth作用域阻断不能依赖请求线程的afterCommit回调。

建议保留Auth九张安全权威表，另外在IAM库增加一张**业务变更结果表** `iam_security_mutation`，只证明IAM本地业务事务结果，不保存密码、token、Cookie，不承担认证放行。该额外迁移是对原Auth-only表范围的补充，用户已确认“批准增加 IAM 结果表（推荐）”，可开始实施迁移和协议。

## 表与协议
- `id`不透明字符串主键；`account_id`、`user_type`、`expected_version`、`mutation_type`、`request_digest`；状态`PREPARED/APPLYING/COMMITTED/ROLLED_BACK`，`lease_fence`、执行租约和硬截止、created_at/updated_at均UTC DATETIME(6)。唯一请求摘要/操作键约束，敏感业务载荷不进表。
- 单独短事务登记意图后，IAM调用Auth持久阻断账号凭据及既有撤销范围，固定同一操作ID/目标/摘要。Auth未知时不执行业务写入。
- IAM业务事务锁本意图并验证当前fence、截止及未终结；在同一IAM事务完成账号/凭据变更、结果COMMITTED。Auth外呼位于IAM和Auth行锁之外。
- 回滚由独立结果确认事务持久记ROLLED_BACK。节点崩溃后，IAM有界收敛任务在租约到期后取得意图行锁：已提交保留COMMITTED；未提交则提高fence并记录ROLLED_BACK。原业务事务若在途会持有意图锁；迟到工作者若未开始写入会被新fence拒绝。
- Auth从IAM已认证的只读结果接口取得终态后，以同一操作及scopeEpoch CAS解除阻断；每次结束都推进新代次，旧会话、RT和预授权证明均不复活。结果未知/依赖503保持阻断和重试，不作成功NoOp。
- 状态查询、阻断、完成接口使用独立IAM服务签名/能力；外部账号/成员仍由IAM权限及Auth可信身份确定，不新增公开OAuth grant。审计与清理使用持久outbox，不以Redis证明结果。

## 兼容、发布与回滚
增加一张IAM增量表，无旧数据回填。先迁移Auth九表+IAM结果表，再协调部署具备新端口的IAM/Auth/资源节点。未提供真实适配器必须拒绝相关安全变更，不能NoOp返回成功。只支持能读取本协议的回滚包；禁止通过删除意图或清阻断恢复旧身份。

## 验收补充
- 在阻断前后、IAM业务COMMIT前后、结果确认回包及Auth解除阻断前后逐点断网/杀进程，改密/重置/锁定/禁用/解除锁定分别验证。
- 结果COMMITTED与业务字段必须同事务；回滚或进程退出后迟到worker不能再写；未知结果不可自动放行。
- 旧AT/RT/已打开预授权/未完成切换均不可越过阻断；新鲜密码在安全解除后可登录；跨租户正式撤销范围保留原契约，凭据证明单独使用账号安全代次。
- 校验MySQL迁移可重入、UTC/序列化、双节点竞争、幂等恢复、任务积压和兼容回滚。未通过仍阻断发布。

若不接受额外IAM表，安全替代是未知账号变更持续保持阻断、人工核对与解除；不宣称具备自动可靠恢复。其余已批准账本和R1/R2复验可独立继续。
