# F10 最终修复包三VM多节点与GR补验

日期：2026-11-15（Asia/Shanghai）。结论：本轮功能与安全补验通过，active change 保持 `validating`；性能仍未通过、发布仍阻断。未修改产品代码或配置、未暂存/提交、不更新 current/归档。

## 最终包和环境

四服务包SHA-256与F09最终工件完全一致；部署到VM后的6个JVM包逐一再次核对一致，摘要见JSON。

| VM | 运行内容 |
|---|---|
| test-manager | MySQL GR成员、Redis主/副本、IAM、Gateway |
| test-worker1 | MySQL GR成员、Redis主/副本、Auth0、BFF0 |
| test-worker2 | MySQL GR成员、Redis主/副本、Auth1、BFF1 |

三台Ubuntu具有独立启动ID/内核，位于同一物理宿主。实际MySQL8.4三成员单主GR、Redis8.2三主三副本；Auth/BFF在不同VM，使用同一持久账本。运行profile为dev，未启用ledger-isolated-test/standalone。GR强制BEFORE_AND_AFTER、flush=1/sync_binlog=1、ABORT_SERVER。浏览器经同源HTTPS→Gateway→指定BFF及Auth，私有证书用于本次隔离验证，不代替正式域名/CA发布验收。

## 实际验收结果

最终完整批次 **9组全部通过**，另有 **1组跨节点A→B→A接口冒烟通过**。公开结果不含凭证、sid或正式sessionId。路由证明只统计最终完整批次的事件，两个BFF/Auth节点均实际执行恢复与注销。

| 场景 | 实际结果 |
|---|---|
| R02，分别从节点0和1发起 | 改密前两个节点均恢复同Cookie/sid/token/截止，无额外token签发调用；故障注入时两个节点均503且无Cookie。B组织真实改密后，两个节点均拒绝旧登录结果。等待权威凭据栅栏ACTIVE后再次各拒绝3次，合计两个方向24次401、均无Cookie；拒绝在原恢复窗口内完成（两批约10/13秒），排除了仅因暂时BLOCKED或过窗而拒绝。原A正式AT在其既定租户范围内保持可读，新密码重新登录成功。 |
| R03，0→1和1→0迟到响应 | 一节点的匿名CSRF响应被实际延迟；另一节点建立X绑定并登录后，再释放Y绑定Set-Cookie。Chrome实际携带正式CookieX+绑定Y，me仍可用；原Cookie可证明并注销原root，注销无Set-Cookie。原登录/切换/恢复入口随后均拒绝。 |
| R03，两个方向的新登录竞争 | 原注销请求固定Cookie/context并停在一个BFF节点，另一节点完成Y绑定的新登录后才放行；原root被关闭，旧候选无法使用，新Cookie/sid/root/token/截止在两个Auth节点核对一致。重复旧context注销200但不发Cookie、不影响新登录。 |
| 错误证明边界 | 公开操作ID无正式Cookie、独立真实对照账号的其他活跃root Cookie、错误设备均拒绝；对照账号会话保持。沿用既有并发会话策略，没有为验收关闭策略或放宽校验。 |
| Auth/BFF逐对重启 | 0、1两对分别真实重启并健康就绪；新身份各字段及截止保持，已退出旧Cookie在两个Auth节点仍不可用。 |
| GR计划内主节点切换 | test-manager→test-worker1，三个成员保持ONLINE，不重置应用历史；切换后旧root仍撤销，新身份及原截止保持。属于计划内切换，不冒充崩溃/网络分区演练。 |
| 跨节点A→B→A接口冒烟 | 创建和提交分配至不同BFF/Auth节点，两次均替换来源sid、同root推进两代；成员与部门按组织重载，回A重新取得A身份；原截止和实际Set-Cookie UTC Expires保持，旧Cookie拒绝，旧context配新Cookie在Gateway返回409。 |

Cookie时间额外核对：浏览器模型有小于1秒的小数分量，沿用既有秒级比较；同时独立读取实际Set-Cookie头，要求UTC Expires与账本原截止**精确相等**，JWT截止也不得超出。内部Long字符串仅在验收端按数值转换，没有修改接口或时限。

## GR定向测试

3个原条件跳过用例分别在切换前的test-manager主节点、切换后的test-worker1主节点各执行一次，共 **6次执行、0失败、0跳过**：

- `newPhysicalTransactionMustCheckItsOwnBarrierAndOuterMarkerIsRestored`
- `nestedRequiredOperationsUseOneBarrierAndCommitAtomically`
- `caughtNestedFailureStillRollsBackWholeRequiredTransaction`

```text
LEDGER_GR_JDBC_URL=<本轮当前真实GR主节点>/ingot_gr_test
LEDGER_GR_JDBC_USER/PASSWORD=<私密配置注入>
JAVA_HOME=<Java21>
./gradlew --offline --console=plain :ingot-service:ingot-auth:ingot-auth-provider:test --tests '*LedgerGroupReplicationIntegrationTest'
```

测试使用`LedgerStorageGuard(..., false)`及随机独占测试库，结束删除随机库，不采用standalone门禁。上一轮9项条件跳过中的3项GR已补齐；其余6项独立IAM可选项仍保留原边界，没有记作本轮通过。未重跑前端全量构建、长期RT/Redis回滚和性能专项，也未混用candidate10历史计数。

## 静稳、失败尝试与清理

停止全部6个JVM并逐一核对进程后，三节点同视图、3个ONLINE、同一REQUIRED实例及持久性门禁均通过；9张Auth权威表和IAM结果表共10表的实际数值校验和一致，BLOCKED范围=0、IAM非终态安全变更=0。未修改任何账本记录以促成通过。

前序6次浏览器不完整尝试保留在临时证据中，均不计最终通过：包括未等待已批准异步栅栏收敛即尝试新登录、浏览器小数/内部Long字符串比较、以及误用同账号已被既有并发策略退休的旧root作活跃对照。最终改为等待权威ACTIVE后再拒旧结果，并使用独立真实对照账号，从零完成两方向整批。新建环境准备还修正了测试代理chunked转发、回环健康检查、GR恢复用户密码长度及空实例初始化GTID分歧；最后一项处理前已断言三实例仅有系统库，应用库/账本建立后从未重置历史。

本轮独占容器、数据库目录、私有Docker守护进程、JVM、HTTPS/路由监听、临时私密文件和运行镜像归档已清理；临时tmpfs改动随VM停止释放，未修改持久挂载配置。三台VM均恢复Stopped，内存恢复3G/2G/2G；原Docker容器名称及运行状态在停止VM前逐一核对保持。共享镜像保留，其他既有改动保留。双仓仅同步本轮Spec/任务与脱敏证据，性能门禁继续单独保留。
