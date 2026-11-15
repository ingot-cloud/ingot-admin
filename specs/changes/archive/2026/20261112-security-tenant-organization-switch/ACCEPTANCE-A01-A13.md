# A01–A13 验收证据矩阵（F14收口）

2026-11-15。最终审查新增组织恢复P1及AT-only/REJECT名额P2已由F14修复，57定向/418回归与40组三VM最终包验收通过；A13/V02本地功能安全范围重新收口。性能和目标环境验收仍各自阻断发布；主change保持validating，不更新current、不归档、不提交。

[F14报告](LEDGER-F14-RECOVERY-AT-ONLY.md) · [F14脱敏证据](LEDGER-F14-RECOVERY-AT-ONLY.json) · [矩阵JSON](ACCEPTANCE-A01-A13.json) · [F13历史验收](LEDGER-F13-OAUTH-REVOCATION.md)

本轮仅Auth/BFF两处业务实现及定向测试变化；未变化的前端658/构建、焦点/双标签/首菜单及长期故障/RT批次按原版本复用，不把40组当前实测解释为全部历史批次在新包重跑。418包含57定向和GR前3项，换主后同3项为重复执行。

| ID | 验收项 | 结论 | 证据及边界 |
|---|---|---|---|
| A01 | 正常A→B→A；成员、部门、菜单与权限刷新 | 通过（当前包实测＋明确复用） | F14最终40组/418相关补验；F13真实往返/安全及410组件回归补验；F12 switchRoundTrip、twoTabs；businessEdges无菜单；F11回归；candidate10 FIRST-MENU。F11：跨节点往返、重新解析成员/部门、各标签每代一次bootstrap。首个非工作台菜单为candidate10历史实证；目标差异权限重载由F11组件与本轮无角色账号安全空态共同覆盖。 F13仅标准撤销/provider新增，未变动其他前端产品路径；原证据保留版本边界。 F14 Auth/BFF新包敏感路径补验，前端/IAM及历史长期批次保留原版本边界。 |
| A02 | 无其他有效组织友好返回且不改变会话 | 通过（F11实际页面） | F12 businessEdges 第1组。零switch请求，Cookie/AT/sid/context/generation相同；router.replace后返回不反复进入选择页。 |
| A03 | 搜索无结果不等于无组织 | 通过（F11实际页面） | F12 businessEdges 第2组。搜索total0、switchableTotal1，保留选择页，清空恢复候选。 |
| A04 | 候选提交前失效 | 通过（F11真实API＋页面） | F12 businessEdges 第5组；F11 IAM/BFF组件。prepare后实际停用目标成员；commit拒绝且无Cookie、原身份保持；刷新零候选友好返回。 |
| A05 | 缺失/伪造/过期/撤销/不一致凭据拒绝 | 通过（当前包组合证据） | F14最终40组/418相关补验；F12 tokens第1/2/4组、security R02/R03；F11 JWT/BFF定向。两Auth真实JWT/错sid、Cookie不能由Bearer或Inside替代；自然AT过期与BFF已撤销身份拒绝；issuer/domain/client及三个浏览器操作的完整组合由F11组件覆盖。F12原标准撤销失败已由F13 A13实证关闭，历史失败保留。 F14 Auth/BFF新包敏感路径补验，前端/IAM及历史长期批次保留原版本边界。 |
| A06 | 依赖不可用fail-closed且不伪造零候选 | 通过（版本边界内组合证据） | F14最终40组/418相关补验；F12 lateCommit/security IAM503；F11依赖/零候选组件；MYSQL-FAULT及RESILIENCE历史。F11最终包实际IAM503且无Cookie，无token调用。Auth/Redis/MySQL完整断链与少数派反例引用原故障版本，非本轮重跑；Redis不再是身份权威，不以Redis回滚恢复身份。 F14 Auth/BFF新包敏感路径补验，前端/IAM及历史长期批次保留原版本边界。 |
| A07 | 原组织失效可恢复／无其他时安全空态 | 通过（F11实际页面） | F12 businessEdges第3/4组。不使账号会话失效；有效其他组织可切；全无时保留新当前身份和切换/退出入口，不恢复失效权限。 |
| A08 | 原截止与连续refresh不延长 | 通过（当前包截止＋历史长窗） | F14最终40组/418相关补验；F13真实往返/安全及410组件回归补验；F12 switch/lateCommit/security/focus/tokens；F11 MySQL截止；candidate10 FIXED-ROOT-RT。F11各切换/恢复/重启保持固定root截止和Set-Cookie UTC Expires；独立机密客户端本轮自然AT过期及3次RT轮换，不冒称其为BFF-root RT。21次BFF-root RT及自然截止仍为candidate10历史；标准RT撤销已由F13 A13闭环，历史失败不计通过。 F13仅标准撤销/provider新增，未变动其他前端产品路径；原证据保留版本边界。 F14 Auth/BFF新包敏感路径补验，前端/IAM及历史长期批次保留原版本边界。 |
| A09 | 双击／双标签／退出重登录竞态 | 通过（当前包敏感路径＋历史竞争） | F14最终40组/418相关补验；F13真实往返/安全及410组件回归补验；F12 twoTabs、security R03与lateCommit；F11 CAS组件；candidate10 RACES。实际双标签只加一代；错位绑定注销不关闭并发新登录；同操作结果唯一。1000次竞争保持candidate10归属，不宣称F11压力次数。 F13仅标准撤销/provider新增，未变动其他前端产品路径；原证据保留版本边界。 F14 Auth/BFF新包敏感路径补验，前端/IAM及历史长期批次保留原版本边界。 |
| A10 | 丢响应／节点重启／清理恢复 | 通过（所列范围） | F14最终40组/418相关补验；F13真实往返/安全及410组件回归补验；F12 security/lateCommit/GR/quiescent；F11幂等组件；candidate10 RECOVERY/原故障批次。当前包跨节点恢复同结果，实际两Auth/BFF重启、计划内GR换主及十表静稳一致；历史全崩溃点/备份回滚不重计。前两批恢复期失败和精确原因未知的OAuth403保留，不宣称立即恢复SLO。 F13仅标准撤销/provider新增，未变动其他前端产品路径；原证据保留版本边界。 F14 Auth/BFF新包敏感路径补验，前端/IAM及历史长期批次保留原版本边界。 |
| A11 | 多标签、旧请求/响应、写操作不重放 | 通过（F11实际页面＋HTTP组件） | F14最终40组/418相关补验；F13真实往返/安全及410组件回归补验；F12 focus双向6组、twoTabs、switch旧context409；F11 HTTP40/admin-core578。漏广播后首个me同步清理旧身份；旧按钮在held bootstrap期间0 POST/库0行；版本按创建时固定，迟到响应/异步加密/重试由F11组件覆盖，不自动重放写。 F13仅标准撤销/provider新增，未变动其他前端产品路径；原证据保留版本边界。 F14 Auth/BFF新包敏感路径补验，前端/IAM及历史长期批次保留原版本边界。 |
| A12 | 无工作台/无菜单/初始强制改密落地 | 通过（当前页＋明确复用） | F14最终40组/418相关补验；F12 businessEdges第2/6组；candidate10 FIRST-MENU；F11守卫回归。真实无菜单稳定空态并保留入口；初始密码进/init、business bootstrap403 PasswordChangeRequired。首个可访问菜单为历史candidate10实证；账号禁用/锁定及栅栏故障引用candidate10 MUTATIONS与F11相关组件。 F14 Auth/BFF新包敏感路径补验，前端/IAM及历史长期批次保留原版本边界。 |
| A13 | 原登录/退出/改密及平台兼容回归 | 通过（F14修复及双向三VM实证） | F14 RT18、AT4、BFF安全9、A→B→A1、平台2、组织恢复2、AT-only/REJECT4；相关418。标准RT撤销后旧族AT/RT拒绝；AT-only唯一AT撤销释放REJECT名额，重复/迟到及并发撤销不影响新登录；跨租户真实改密在IAM成功回包期间完成后组织resume401无Cookie、普通另一租户AT保持、fresh密码登录成功。性能及目标发布独立未通过。 |

原F12标准撤销失败、F13修复证据及F14审查反例均保留。三VM同宿主，性能不计通过；目标CA/真实休眠与部署验收另留。静稳十表一致及资源清理见F14，未提交、未归档、current不变。
