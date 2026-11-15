# F11 两项P1修复与最终包复验

后续同一冻结制品的三VM/GR及实际页面结果见[F12](LEDGER-F12-MULTINODE.md)；两项P1复验通过结论保持，F12另发现标准OAuth撤销失败，不能将本阶段通过视为当前整体验收通过。

日期：2026-11-15（Asia/Shanghai）。用户明确授权先同步双仓Spec/任务，再修复并补定向、相关回归及真实复验，先不提交。两项P1的本轮功能/安全复验通过，active change保持`validating`；性能仍未通过、发布仍阻断，不更新current、不归档、不暂存/提交。

## 修复与边界

| 问题 | 最终实现 | 定向覆盖 |
|---|---|---|
| 已完成结果的迟到COMMIT绕过严格恢复 | Auth命令执行入口对任何携带COMPLETED事务及session的响应统一执行严格交付门禁，覆盖COMMIT、TRANSITION、REGISTER_ISSUANCE、完成快速返回和预检失败后的completed回退。原提交事务结束后校验凭据证明/代次，行锁外查询IAM账号，最终事务再次锁定凭据/撤销范围并核对原操作/绑定/当前root/代次/sid/token、原截止和恢复窗口。 | 新增6项真实MySQL组件测试：原工作者暂停后后台完成及全局凭据变更；三个出口同结果/同截止；账号拒绝/依赖故障；IAM不在事务内且外呼后凭据变更；竞争回退；替换/过窗/注销拒绝。原普通READ_SESSION和正式AT作用域保持。 |
| 焦点重验提前发布组织版本 | 共享auth-core.me只查询；admin-core验证app/domain/version，变更时先同步暂停、推进纪元并完整清理旧身份，再接纳新版本。AuthSession为插件显式包装me，保留首屏组织页等原消费方；焦点直接使用首个已确认结果，不再第二次me。HTTP钩子保存创建时暂停事实，Header/最终identity门禁双重拒绝；只有公开permit、认证请求和框架标记的GET bootstrap/改密状态可在暂停中执行，标记不能放行写操作。 | 新增8项前端测试（auth-core1、admin-core7）：纯查询、实际焦点路径、暂停后延迟发送、只读bootstrap例外、错误域/缺版本、失败不接纳、插件宿主接纳、bootstrap失败返回重试。旧微任务窗口、异步信封、重试和多标签回归保留。 |

真实故障复验发现“返回当前组织”复用普通返回路径导致暂停标志未释放、空白页，已在F11恢复职责内修复：已暂停身份返回复用enter/beginIdentitySwitch，成功bootstrap和路由后解除暂停；不可访问状态进入安全页并解除渲染暂停，正常零候选仍不清理身份。

没有新增公开路径、OAuth grant、DDL、序列化版本或时间字段；错误/依赖语义保持。HTTP新字段只属可选本地元数据，不替代服务端安全校验。只为结果交付增加账号外呼和最终权威重验，不给普通业务认证增加缓存或外呼；性能未重新评估。禁止回退Redis权威或恢复已撤销身份。

## 最终回归与构建

- 九模块合并去重：**1924项，1915通过、0失败/错误、9条件跳过**。Auth129项中126通过/3个GR跳过；IAM1527项中1521通过/6个独立可选项跳过；其余模块全部通过。先跑九模块后补启用37项真实MySQL HTTP功能测试，去重纳入总数，没有将跳过计作通过。
- 真实MySQL账本/UTC和Redis序列化/派生副本用例已启用。3个GR本轮未跑；F10历史GR证据保留原包归属。其余6项为3个IAM性能、2个IAM浏览器、1个OSS。
- 前端：HTTP40、auth-core40、admin-core578，**658通过、0失败、0未处理错误**。发现一次既有bootstrap集成测试的loading定时器在jsdom销毁后访问window；测试改为等待实际路由结束动画再卸载，产品loading逻辑未改，最终全套重跑通过。
- Auth、BFF、IAM、Gateway四服务构建通过；Auth运行类与最终jar内类逐字节一致。auth-core/admin-core包构建、应用类型检查、租户端/平台端构建、前端分层门禁通过。最终四jar和两端静态产物manifest摘要见JSON。
- Python包边界10项、接口契约8项、DDL归属6项全部通过。

命令（Java21/Node22；私密连接信息只通过本轮临时配置注入）：

```text
./gradlew --offline --console=plain --continue -I <isolated-worker-settings> <nine-related-modules>:test <Auth/BFF/IAM/Gateway>:bootJar
./gradlew --offline --console=plain -I tools/iam/tenant_live/verification.gradle -PiamLiveHttp=true -PiamPlatformHttp=true :ingot-service:ingot-iam:ingot-iam-provider:test --tests '*RoleWorkspaceMySqlHttpTest' --tests '*TenantLiveMySqlHttpTest'
pnpm --filter @ingot/http-client --filter @ingot/auth-core --filter @ingot/admin-core test:unit
pnpm --filter @ingot/auth-core build
pnpm --filter @ingot/admin-core build
pnpm type-check:apps
pnpm build:apps
pnpm check:boundaries
python3 tools/iam/test_package_boundaries.py
python3 tools/iam/test_contract.py
python3 tools/iam/test_framework_schemas.py
```

## 迟到COMMIT真实复验

隔离真实MySQL8.4、Redis8.2、四个JVM服务与Chrome同源HTTPS。账号、A/B组织及成员通过业务API创建，跨租户密码修改经真实密码接口完成。Auth使用显式隔离standalone测试配置，此处不替代三VM/GR验收。为稳定暂停原BFF请求，夹具将内部权威调用读超时设为60秒，原30秒租约/60秒恢复窗口及root截止不变；不修改产品配置。

代理只暂停原BFF已经发起、尚未进入Auth的COMMIT；真实Auth后台reconciler完成同一候选，再释放原请求。不是仅直接调用RECOVER_SESSION的模拟。

| 场景 | 最终实际结果 |
|---|---|
| 正常迟到COMMIT | 200；同Cookie/sid/token/截止，Cookie不越过原截止，数据库该操作仅一个session。 |
| 后台完成后在B组织实际改密 | 等待权威凭据栅栏ACTIVE；旧显式恢复401，原A正式会话仍按既定租户范围有效；放行原BFF COMMIT返回401且没有任何Set-Cookie，浏览器未建立正式Cookie，数据库仍仅一个结果。拒绝发生在原恢复窗口内（约3秒，明细见JSON）。 |
| 最终账号校验RPC故障 | 原迟到请求503且无Cookie；恢复依赖后resume恢复同sid，数据库仍仅一个结果。 |
| 新密码登录及注销 | 新密码可正常登录；注销200无Set-Cookie，原正式Cookie及旧resume均拒绝，没有恢复已退出身份。 |

## 实际管理页面焦点复验

使用最终构建的`apps/admin`页面，实际登录、菜单、用户组向导、HTTP拦截器、路由和bootstrap；没有用空白API页面替代前端焦点路径。第二标签页通过真实BFF切换共享Cookie，不写organization-sync记录、不发BroadcastChannel，从而确定复验漏通知分支。Chrome中派发focus/visibility事件驱动实际监听器，不宣称物理桌面前后台/休眠验收。

| 场景 | 最终实际结果 |
|---|---|
| A界面未保存向导，Cookie已切B，焦点重验 | 第一个me确认B后只执行一次B bootstrap，没有第二次me窗口。阻塞bootstrap期间旧向导已卸载，尝试原保存按钮无业务POST，数据库验收组记录为0；释放后进入B首页，同root、generation只推进一次、原截止保持。 |
| 同版本focus和visibilitychange | 不重复bootstrap、不产生写操作。 |
| 再切A并注入bootstrap503 | 保留A Cookie和新身份，原草稿不恢复；点击“返回当前组织”重试成功进入A首页并解除暂停，仍零旧写入，截止保持。 |

后端组件测试的JWT/IAM夹具、前端单元的网络/宿主替身与上述真实API/页面证据分开记录。F09/F10原证据原样保留，仅对其原覆盖场景和原包负责。本轮未重跑三VM、GR选主、Redis回滚、长期RT或性能专项。

## 执行记录与清理

失败尝试不混入最终通过：隔离Gateway误带BFF字段、独立OAuth客户端缺设置/旧缓存、故障代理未转发chunked请求体、初始改密栅栏未收敛、可省略null断言、Python解释器和向导异步等待均已修正。真实发现的bootstrap失败空白页已修复后重跑整个前端与三组页面验收；最后全套零未处理错误。

清理已确认：四服务、HTTPS/故障代理、独占MySQL/Redis容器及持久卷、全部API/管理/数据监听与20项私密运行文件/录制/密钥已删除；三台VM始终未变更，当前均Stopped。其他Docker资源未修改。双仓diff检查通过，无暂存/提交；F11-06完成。性能和发布门禁保持，不改current/归档。
