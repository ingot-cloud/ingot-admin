# 前端实施与验证记录（2026-10-31）

状态：completed。代码/本地回归及用户主流程验收完成，current已更新；目标环境余项移交发布验收。联合A01–A24证据与边界见 [后端完整记录](../../../../../../ingot/specs/changes/archive/2026/20261031-security-same-origin-login/VALIDATION.md)。

## 已实现

- admin/admin-platform安装同一auth-plugin；各自公开/login/，App注入公共会话能力。auth-core无页面，admin-core不反向依赖业务插件。
- 打开页不建事务，提交时csrf/create/login；SELECT_TENANT本页选择，COMPLETED先核对本次Cookie再有界resume/me并bootstrap。密码只在内存，成功清空。
- CSRF仅按应用留内存、只发本源；事务/返回路径/显式退出使用appId命名空间；两宿主所有API固定当前origin。旧URL只本域规范化，无ticket交换。
- 恢复轮询有15秒总预算（含请求时间）、每次HTTP请求不超过剩余预算；不重新执行Auth。nonce重复/并发冲突只查原状态。
- 当前会话通知忽略自己发出的事件，旧身份请求按epoch丢弃；正常登录显式安装动态路由；空菜单不重复bootstrap。显式退出在Cookie/存储异常时仍能进入表单，改密身份只进入受限流程。
- 登录配色/favicon/属性离开时恢复管理主题，360px无横向溢出；复用唯一挑战宿主，412取消支持键盘操作且静默登录不重复toast。
- 独立auth/auth-platform App及运行/构建脚本退役；文档、脚手架、Vite允许主机、Nginx双部署样例同步。

## 本地验证

| 命令/检查 | 结果 |
|---|---|
| pnpm build:packages | 通过；自动生成文件在构建后恢复用户原改动 |
| auth-core/auth-plugin/admin-core/admin/admin-platform type-check | 通过 |
| 两个管理App生产build | 通过 |
| auth-core / auth-plugin test:unit | 21 / 2项通过 |
| admin-core认证/路由/epoch/challenge/envelope/bootstrap定向测试 | 8文件36项通过 |
| App脚手架回归 / vite-config | 4 / 45项通过 |
| ESLint变更代码、check:boundaries | 通过（沿用仓库ignore） |
| verify-same-origin-login-browser.mjs | 两种HTTPS部署模型及16类场景通过；真实前端+受控BFF夹具 |
| 两种Nginx nginx -t | 通过 |
| API与后端来源SHA、git diff --check | 一致/通过 |

浏览器覆盖：模拟一小时停留、整包HYBRID、多组织、丢响应/自动重传后恢复、受限改密、动态路由与保存深链、空菜单403稳定屏、Cookie隔离/独立退出、旧URL、360px、主题恢复、Cookie拒绝有界提示、412键盘取消。自签测试证书忽略信任错误，不算客户CA或真实Auth验收。

## 已有全量测试失败

admin-core全量516项中514通过、2失败：

1. `src/components/__fixtures__/visual-contract.test.ts`：“顶栏按品牌/导航/搜索/小部件/用户五区划分”。
2. `src/components/table/InTable.test.ts`：“使用模板 ElTable 并让表格自身滚动，避免露出 hidden-columns 和双滚动条”（现有source不含断言要求的background-position写法）。

这些组件/断言文件与本次变更无交集，git diff已核对，不扩大范围修改。认证相关定向测试全部通过。packages/admin-common/components.d.ts和plugins/org/components.d.ts在开工前各已有InCursorPager单行新增；已恢复并原样保留，没有混入构建自动删除的声明。

## 待目标环境验收

真实Auth/IAM账号资格/锁定/改密、安全踢出、真实 Auth/IAM 下多标签与网络丢包、实际长停留/休眠、客户CA/SAN/代理/CSP，以及维护窗口切换/回滚仍需部署环境执行。F08/V03/V04及current/归档不提前完成。

移动端空表单截图（无凭证）：

- [平台/IP](./validation/ip-platform-login.png)
- [租户/IP](./validation/ip-tenant-login.png)
- [平台/域名模型](./validation/domains-platform-login.png)
- [租户/域名模型](./validation/domains-tenant-login.png)


## 运行残留清理验证（2026-10-31）

用户要求保留历史 Spec、不提交，清理结果覆盖 F07a：

- 删除旧 App 剩余声明/目录、六个旧 CI job、无路由引用的登录错误页；当前运行链只交付 admin/admin-platform，登录插件随宿主构建。
- 更新 README、首次启动、插件接入、运行时、构建、信封缓存和共享外观说明，Vite 夹具改用管理 App；旧三种页面兼容引导、旧状态只读盘点和回滚说明保留。
- 平台手工脚本与租户使用独立镜像/容器/域名；两个构建脚本从任意目录解析 workspace，先构建各自完整 App。容器代理与脚手架保留 IP:端口 Host 及可信边缘的 HTTPS scheme。
- 后端五类 Nacos 配置三环境种子已对齐，Auth 移除未消费的旧登录站 loginFormUrl；当前后端部署副本及来源摘要同步。

本轮 packages → 两个 App 生产构建通过；auth-core 21、auth-plugin 2、vite-config 45、App 脚手架 4 项通过。根 CI YAML 核对仅六个管理 App job，产物/依赖链完整。两 App 与脚手架 Nginx 1.28.3 语法及实际头转发请求均通过。四份手工脚本 bash -n 与隔离命令替身检查通过，未推送镜像或部署服务。check:docs、check:boundaries、diff --check 通过。

首次直接 build:apps 因 packages 声明产物未就绪失败，按正确前置顺序重建后通过。995 份历史/基线 Spec 快照未改变，用户两份 components.d.ts 原始字节保留；删除的 App 目录未再生成。后端相关 158 项测试通过；IAM 数据工具另有六项 HEAD 原始夹具同样可复现的既有失败，详见后端验证记录，未扩大范围修改。

真实环境验收边界、current 与归档状态保持不变。


## 租户 select / UNKNOWN 回归（2026-10-31）

后端发现并修复 BFF 误读公开 Token 响应内部用户字段的缺陷，正式提交前改用已有 Auth sid 权威查询绑定身份；见后端 VALIDATION.md。本轮浏览器 API 与前端运行代码不变。

前端新增租户多组织进入选择后 select 返回 503、状态持续 UNKNOWN 的回归：只调用一次 select、一次密码认证，最多查询 15 次后抛 LoginRecoveryPendingError，保留线索；用户返回登录显式 reset 才清该事务。auth-core 共 22 项、类型与 ESLint 检查通过。后端设计副本及 SHA 同步，真实账户重启后复测待用户进行，不能把夹具回归视为真实环境已验收。


## 成功后重复确认/Bootstrap 修正（2026-10-31）

用户已确认上轮修正后租户登录成功，随后发现 select 完成后的 transaction GET → me → bootstrap → transaction GET 重复多轮，最后一个事务请求取消后才进入首页。

根因：InRouteRenderer 把公开登录页也放进按 contextEpoch / permissions.version 作为 key 的 KeepAlive 容器。onAuthenticated 清旧身份并 bootstrap 时两者变化会销毁当前登录页，新实例 onMounted 又从 sessionStorage 恢复同一完成事务，重复确认和 bootstrap；并发 enter 还会重复消费 returnTo，覆盖原始深链。原浏览器夹具的快速 bootstrap 未覆盖这一时序。

修正仅涉及路由渲染边界：permitAuth 页面独立使用不缓存的稳定包装器；受保护页面保留原有带身份/权限代次的 KeepAlive。公共页正常导航不额外销毁后台缓存；身份切换仍清理已失活后台页面，不复用旧身份内容。事务确认、Cookie/sid 校验和 bootstrap 顺序不变，未通过提前删除恢复线索或跳过安全检查规避重复请求。

验证：

- 新增两例路由回归，分别覆盖公开页在纪元/权限/菜单变化中只挂载一次，以及公共导航保留业务缓存、身份切换仍清旧业务缓存；修正前两例失败（`/private/tmp/ingot-login-remount-before.log`），修正后通过。
- renderer、auth store、user guard、router store、common routes、bootstrap integration 共 6 文件 24 项通过（`/private/tmp/ingot-login-remount-tests.log`）。
- packages → admin/admin-platform 生产构建通过（`/private/tmp/ingot-login-remount-build-packages.log`、`ingot-login-remount-build-apps.log`），变更 ESLint 与分层边界通过。
- 浏览器主租户场景加入 500ms bootstrap 延迟，修正前原始深链被覆盖而失败（`/private/tmp/ingot-login-remount-browser-before.log`）。修正后两种 HTTPS 部署模型均通过，明确断言正常成功后的请求序列恰为一次 transaction GET、一次 me、一次 bootstrap；事务恢复线索在完成后清除，原始 query/hash 深链保留。
- 同一浏览器脚本继续验证长停留、丢响应/一次 resume、强制改密、Cookie/独立退出、空菜单、旧 URL、窄屏、主题恢复和 412 取消；结果见 [本轮浏览器记录](./validation/login-completion-20261031.json)。本轮是生产前端与受控 BFF 夹具，不能代替真实 Auth/IAM、CA、休眠及回滚验收。

用户已有两份 components.d.ts 原样保留；历史 Spec/current 不改写，继续 validating，不创建提交。需加载重建后的 admin-core 前端产物，由用户退出后重新登录复测实际链路。


## 平台与租户登录/退出全链路审查（2026-10-31）

用户追加要求检查重复请求、重复挂载和跳转，继续在批准的同源 change 内修正验收缺陷，不新增浏览器接口、不更改 Nacos/部署契约，不提交代码。

发现与修正：

- 切换组织原先走普通登录地址，会被已有 Cookie 自动带回后台。现在显式强制表单，保留当前安全深链；旧身份不因打开表单而撤销。
- 并发401/退出原先可能多次远端撤销和 location.assign，调用方也无法等待导航。退出及导航按文档合并；显式退出只发送一条撤销，1500ms超时 AbortSignal 中止；本地401不发远端退出，强制表单并保留深链。
- 原退出广播只表示 invalidated，其他标签会在 Cookie 已清后 bootstrap。区分 logged-out：接收页直接清本应用状态与强制表单，不查询/撤销/重复广播；正常身份替换只对活动管理标签重验一次，登录表单不自动进入旧身份。
- 恢复 COMPLETED 时此前 restore 已读过事务，随后 confirm 又读一次。只复用本流刚从服务端读取的同一结果对象一次；仍检查本次 sessionEstablished 和 me，POST/外部对象不跳过 GET。提交、组织选择、恢复、确认、宿主进入分别合并在途操作。
- 重验期间清纪元/菜单会提前重挂旧业务组件。增加重验/退出渲染屏障，完成 bootstrap 与导航后才挂载新业务页；公开登录页保持稳定。相同路由指纹不重复安装。
- HTTP 在指纹/CSRF/信封准备前后核对身份纪元，响应在业务码/401处理前丢弃旧成功和失败；挑战/公钥更新重试保留原纪元。旧401不能退出新身份，迟到旧请求不能用新会话继续发送。
- 强制改密门禁自身会推进纪元，不能被误认为另一身份而停在登录页；以切换版本控制完成。业务触发的并发改密只暂停/检查/跳转一次；旧状态与旧权限刷新结束不得覆盖新身份或清掉新在途任务。并发签退弹窗合并，取消不退出。
- 浏览器后退暴露了“已401却再me”的多余调用；本地退出统一强制表单后消除。

精确次数（双域名/纯 IP HTTPS 双端口，平台/租户四种组合）：

| 路径 | 预期与实测 |
|---|---|
| 正常完成 | 本次事务 GET、me、bootstrap 各一次；慢 bootstrap 不重挂登录页 |
| 普通打开有效会话登录页 | me、bootstrap 各一次，无新事务/凭证请求 |
| 刷新恢复已完成事务 | CSRF、事务 GET、me、bootstrap 各一次，无第二次完成查询 |
| 切换组织进入表单 | 无认证/业务请求，Cookie 保留，登录后恢复安全深链 |
| 同源活动标签接收新身份 | bootstrap 一次，旧业务页暂停后重建 |
| 显式退出及其他标签同步 | CSRF 一次、DELETE logout 一次；无 me/bootstrap |
| 退出后后退 | bootstrap 返回401一次，直接强制表单；无额外 me/远端退出 |
| 慢退出后立即重登（平台/IP单独用例） | 请求超时中止，旧延迟清 Cookie 响应不覆盖新会话/绑定；me有效 |

验证证据：

- admin-core 认证/会话/路由/渲染/网络/退出菜单：14 文件 **69 项通过**，`/private/tmp/ingot-flow-audit-targeted-final.log`。
- auth-core **25项通过**、http-client **27项通过**，前端合计 **121项定向测试通过**。初始回归曾复现并发退出/强制表单缺陷；强制改密新回归也在修正前失败。
- 本轮中途全量扫描 admin-core 535项，533通过，仍为前文相同两项已有 UI 断言失败；相关组件/断言未修改。其后新增的认证回归全部纳入上述定向通过记录，不将全量测试称为全绿。
- 生产产物 + 受控 BFF 的真实 Chrome：**22类场景通过**，含原生 BroadcastChannel 与实际内置菜单操作。[详细浏览器次数记录](./validation/login-logout-audit-20261031.json)。日志 `/private/tmp/ingot-flow-audit-browser.log`，截图及原始记录位于该日志 artifacts 目录。
- 共享 packages 构建/类型检查、auth-plugin 类型检查、admin/admin-platform 生产构建通过；最终构建日志 `/private/tmp/ingot-flow-audit-build-final.log`。变更代码 ESLint、check:boundaries、check:docs、git diff --check 通过。
- 后端 BFF 28项通过；新增退出与 Token 换取并发的参数化用例覆盖两入口，并在三节点隔离 Redis Cluster 再验证2项通过：无迟到正式 Cookie、已知 sid 补偿、另一应用不受影响。仅增加后端测试，运行实现未变。
- 四份后端权威接口/设计/部署/验收副本与 SOURCES.md 摘要一致；995份历史/current快照一致，两份用户 components.d.ts 原样保留。

本轮已验证浏览器前端与受控 BFF、隔离 Redis；真实平台/租户账号资格、真实 Auth/IAM 下多标签与故障、客户 CA/休眠和生产回滚仍待目标环境验收。两个 change 保持 validating，current/归档不提前变更。


## 用户本地验收确认与归档（2026-10-31）

用户按本地验收清单复测后明确确认：“平台和租户的登录、退出、切换组织和多标签页都正常了”，并要求更新前后端 Spec、归档及提交。验收方式为用户实际本地联调；未提供各请求计数的独立网络导出，因此不将此前夹具的精确次数冒充用户逐项抓包记录。

| 验收对象 | 本轮结果 | 证据来源 |
|---|---|---|
| 平台与租户登录 | 通过 | 用户确认 |
| 平台与租户退出 | 通过 | 用户确认 |
| 平台与租户切换组织/重新认证 | 通过 | 用户确认 |
| 多标签页身份与退出同步 | 通过 | 用户确认 |
| 精确次数、慢 bootstrap/退出、后退、旧响应与安全边界 | 保留既有自动化/受控浏览器通过证据 | 本文此前记录，不额外推断人工覆盖 |
| 客户 CA/SAN、实际休眠、真实策略故障与生产切换/回滚 | 未宣称完成，移交发布验收 change | 后续 E01–E04 |

据此更新已验收实现的 current 基线，并将本 change 标记 completed 后归档；没有执行生产发布或远端推送。此前各阶段“待用户复测/暂不提交/不更新current”是当时状态，现由本条最终确认收口。原有无关测试失败及其边界不被本次验收掩盖。

后续环境验收跟踪：[20261031-security-same-origin-release-acceptance](../../../../../../ingot/specs/changes/active/20261031-security-same-origin-release-acceptance/README.md)。
