# F13 标准RT撤销修复与最终包验收

2026-11-15。F12-N01已修复；新增定向13项、相关八模块410项（包含该13项）全部通过、零跳过，最终三VM实际HTTP/页面34组通过。A13及V02本地/三VM功能安全范围收口，主change保持validating。**性能仍未通过，独立Spec继续阻断正式发布**；目标环境验收另留。不提交、不归档、不更新current。

[脱敏明细与制品](LEDGER-F13-OAUTH-REVOCATION.json) · [验收矩阵](ACCEPTANCE-A01-A13.md) · [原F12失败](LEDGER-F12-OAUTH-REVOCATION.json) · [独立性能Spec](../../../active/20261115-security-session-ledger-performance/README.md)

## 修复及安全边界

Auth标准撤销端点使用LedgerTokenRevocationProvider替换默认“失效授权后调用签发save”的处理器，保留SAS客户端认证、转换和响应处理。只接受已认证注册客户端，以已登记token摘要确定sid与root，核对客户端所有权；不读取提交的账号/sid或Inside作为授权。

账本同一事务按scope→root→session→token锁序执行。RT关闭其固定sid族及全部该sid AT（包括轮换前仍合法AT），仅关闭仍以它为当前sid的root；已消费旧RT不会关闭并发新登录或替换后的sid。重复/未知token幂等200；已知他客户端token拒绝。撤销不依赖剩余active token/旧密码证明，不解除BLOCKED凭据栅栏；保存签发与旧快照准入未放宽。复用原有可靠outbox及USER_LOGOUT审计口径。

AT单独撤销只失效选定AT；当前AT的授权快照同步失效metadata，AT-only不再经过要求active token的expiry保存路径，其他AT/RT仍按既有策略可用。无公开路径/grant/DTO/DDL/配置/序列化或时间契约改变，不改变Cookie。新Auth协调部署到两节点；其余三jar和双端静态manifest匹配F12，六JVM部署摘要逐一核对。只回滚包含本修复的账本兼容版本；已知失败F11 Auth不能作为标准撤销安全回滚包放流量。

## 定向、回归和实际复验

| 验证 | 最终结果 |
|---|---|
| 新增定向 | 13通过、0跳过：真实MySQL11项及provider认证/存储故障2项。覆盖新鲜/已消费/自然AT过期RT、所有AT、重复未知/他客户端、刷新竞争/新登录/同root替换sid、凭据阻断、AT-only与旧AT选择性。修复前原F12双向400且RT仍200保留为红证据。 |
| 相关八模块 | 410通过、0失败/错误/跳过：Auth142、BFF36、Gateway46、commons17、authorization-server60、security-common71、Feign12、account-core26。真实Redis序列化、真实MySQL UTC三时区和3个GR用例显式启用。Auth bootJar成功。13项定向和3个GR已在410中，不重复相加。 |
| 标准RT真实双向 | 每方向9组，共18组：新鲜RT撤销200；两次轮换后用已消费原RT关闭后继族及三个AT；自然AT过期时撤销RT；错误客户端/重复未知；RT消费竞争；新登录竞争；实际暂停旧撤销请求至新登录完成后再交付；DB故障503及只读恢复后显式撤销；对侧Auth实际重启。旧RT在两Auth均400、旧AT真实Gateway/IAM为401且两权威节点均无身份；新登录及其refresh200，DB终态REVOKED/该族ACTIVE凭据0。 |
| 标准AT兼容真实双向 | 每方向2组，共4组：无RT的AT-only撤销200并拒绝；轮换前旧AT选择性撤销、当前AT和RT仍可用，再撤销RT后全部拒绝。错误hint不改变实际类型；无客户端认证的Inside请求保持原始302登录拒绝且原凭据未变，错误密钥401。没有将自动跟随后的登录页200计为成功撤销。 |
| BFF安全回归 | 9组：双向跨租户改密旧恢复拒绝、四组错位绑定/并发新登录、两Auth/BFF实际重启、计划内manager→worker1 GR换主；新会话保持，旧退出身份不恢复，原截止不变。 |
| 正常往返与平台 | API跨节点A→B→A1组，成员/部门重绑、单root两代、旧Cookie拒绝/旧context409及原Cookie UTC截止保持；实际平台页面2组，登录无组织入口/租户候选403、注销200无Set-Cookie。 |
| GR与静稳 | 八模块中首任主节点3项，换主后再3项，6次执行/3个唯一用例、0跳过。停止六JVM后，三成员ONLINE/同view/同REQUIRED incarnation、BEFORE_AND_AFTER/flush1/sync1/ABORT_SERVER，BLOCKED scope0、IAM未决变更0；九Auth表及IAM结果表十表checksum三节点一致。 |
| Python | 包边界10、API契约8、DDL归属6项重新通过。 |

独立OAuth RT客户端沿原有滚动TTL：并发refresh可以更新其非BFF寿命，不能把竞争前后TTL差异归因于撤销。撤销单独调用前后期限严格相等，固定BFF登录截止由组件及真实A→B→A/重启恢复另行严格验证；没有用独立客户端替代BFF固定root长窗证据。

## 环境、失败尝试与恢复

三台既定Ubuntu VM、三个独立内核、同一物理宿主，运行两Auth/BFF及IAM/Gateway，三MySQL8.4强GR与六Redis8.2 Cluster。组件回归另用了manager上的独占standalone MySQL/Redis，GR用例始终指向真实强GR，应用无standalone覆盖。私有健康阈值沿F12由默认10GB调到128MB以适配小测试盘，不改产品配置，不宣称容量/性能/生产就绪通过。

组件实例与六JVM叠加时，manager原GR进程被全局OOM杀死（137）；其余两成员保持持久多数派并自动选主。初轮18+4虽通过，但只保留为两成员阶段证据，不计最终三成员34组。释放已完成组件实例后，使用原持久数据重启manager，增量恢复三成员ONLINE，无Clone/应用历史重置或强提落后节点；核对后恢复基线主节点，从零重跑18+4及后续12组，最终34组全部通过。三数据库并非全程在线，未据此宣称容量通过。

其他失败尝试独立保留：SAS构造器适配在验证前修正；新AT夹具沿用旧invalidated metadata后按实际SAS生成行为对齐重跑；standalone拒绝用例误指GR后改独占组件库并重跑全部410；独立滚动RT错误截止断言纠正；自动跟随302误看登录页200后改核原始HTTP及凭据未变；浏览器公钥描述补自同一实际配置；新增故障代理局部变量遮蔽导致CSRF500，修复夹具并仅重启宿主代理、保留六JVM和账本，再只读确认连接稳定。均未通过修改产品安全断言或重放写请求掩盖，最终结果只计完整通过批次。

## 版本复用与清理

前端产品文件和两个manifest未变，复用F11/F12的658项前端回归、类型/分层/双端构建及实际焦点/双标签/空态证据；本轮平台实际页面重新验证，不冒称前端全套重跑。IAM产品/jar未变，沿原证据；6个独立可选IAM性能/浏览器/OSS未执行且不计通过。candidate10原R1/R2各20轮、1000竞争、21次固定root RT及原生备份/兼容回滚保持其原版本，不宣称F13重复。

仅本轮Auth两个实现文件改动、新provider及两测试类新增，前端无产品改动；无DDL/部署基线/current/archive改动。三VM恢复原3/2/2GiB并Stopped，原Docker名称/运行状态和共享镜像保留，独占服务/容器/数据/监听、私密文件/原始日志删除。清理发现初始快照早于既有Swarm demo_api的启动恢复；已确认该服务创建于本轮之前、三个任务不属本轮标签，原样保留，没有删除或修改默认Docker资源；原空快照未被静默覆盖，核实过程见JSON。已脱敏证据与制品核对后同步双仓，最终解析/链接/秘密扫描/diff检查见JSON。

性能继续由独立draft Spec承接，门槛未过，不因A13/V02收口解除发布阻断。客户CA、真实休眠/隔天、目标部署/监控及首次恢复仍由[目标环境发布验收](../../../../../../ingot/specs/changes/active/20261031-security-same-origin-release-acceptance/README.md)承接。本轮不更新current、不归档、不暂存/提交。

最终检查：双仓88份JSON解析、252处相对链接、14组新证据/性能文档/批准章节逐字一致通过；JWT及新增证据原始凭据字段零匹配，私密文件剩余0；四jar/双端manifest匹配F13最终包，两仓diff检查通过、暂存区为空。三VM最终Stopped及3/2/2GiB只读复核通过。
