# F09 最终审查三项修复与复验

状态：本轮三项修复验收完成；active change 保持 `validating`。性能门禁仍未通过，发布仍阻断；不更新 current、不归档、不提交。

## 实现与边界

| 项目 | 修复 | 定向证据 |
|---|---|---|
| R01 请求创建身份 | `http-client` 在全部11个公共方法进入Axios前同步执行可选元数据钩子，`admin-core` 捕获纪元/组织版本。复制调用选项再捕获，复用选项不污染后续新请求；真正重试保留来源快照。 | 原微任务窗口回归：旧载荷在身份推进后不进入adapter；11方法同步捕获/重试及共享选项复用通过。 |
| R02 初次登录恢复 | BFF使用独立 `RECOVER_SESSION`；Gateway无此能力。Auth要求已登记凭据证明，在行锁外校验账号安全，在最终事务再次校验凭据与正式范围及原当前结果；缺失证明/变更/依赖故障不能回退普通读取。 | 其他租户改密后正式AT既定范围保持，而恢复401；缺失证明、IAM拒绝/503、预检后凭据变更、原截止/窗口/错误Cookie；IAM账号禁用/锁定/不存在/强改与成员无关门禁通过。 |
| R03 错位绑定注销 | 当前Origin/CSRF不放宽；正式Cookie的账本证明只能关闭原root。两个绑定按稳定顺序锁定；原绑定仍占旧root时取消旧登录/切换候选并推进代次，后来新root及其意图保留。 | 公共操作ID/其他root Cookie不能撤销；交错绑定并发、原绑定已被新root占用、旧候选后台完成拒绝；注销无Set-Cookie。 |

没有新增公开OAuth grant、公开路径、数据库迁移或序列化版本。Auth、BFF、IAM需协调发布新增内部命令/账号只读端口；缺少能力不降级放行。前端通用包保持无业务身份依赖。

## 实际回归

- 九模块分批合并 **1918项：1909通过、0失败、9条件跳过**。Auth最终123项中120通过/3个GR条件跳过；IAM1527项中1521通过/6个独立可选项跳过；其余模块全部通过。
- 已启用真实MySQL账本/时间和Redis序列化/派生副本测试；另补跑 **37项IAM真实MySQL HTTP功能测试**，全部通过。未将跳过计入通过。
- 前端 `http-client` **40**、`auth-core` **39**、`admin-core` **571**，合计 **650通过**。相关包构建/声明类型检查、应用类型检查、租户端及平台端构建、分层边界检查通过。
- Auth、BFF、IAM、Gateway四服务构建通过。最终Auth补齐缺失证明的拒绝后重新全量回归、构建、重启，并从头重跑下面三组真实验收；包摘要见JSON。
- Python包边界10项、接口契约8项、共享DDL所有权6项通过。所有权门禁补计此前已批准的IAM结果表（53→54），明确该表属于IAM且不属于共享框架，DDL没有变化。

执行命令（Java21、Node22；连接信息只从本轮临时私密配置注入）：

```text
./gradlew --offline --console=plain --continue -I <temporary-worker-settings> <Auth/BFF/IAM/Gateway/commons/authorization-server/security-common/account-core/feign>:test
./gradlew --offline -I tools/iam/tenant_live/verification.gradle :ingot-service:ingot-iam:ingot-iam-provider:test --tests '*RoleWorkspaceMySqlHttpTest' --tests '*TenantLiveMySqlHttpTest'
./gradlew --offline :ingot-service:ingot-auth:ingot-auth-provider:test :ingot-service:ingot-auth:ingot-auth-provider:bootJar
pnpm --filter @ingot/http-client --filter @ingot/auth-core --filter @ingot/admin-core test:unit
pnpm --filter @ingot/http-client build
pnpm --filter @ingot/auth-core build
pnpm --filter @ingot/admin-core build
pnpm type-check:apps
pnpm build:apps
pnpm check:boundaries
python3 tools/iam/test_package_boundaries.py
python3 tools/iam/test_contract.py
python3 tools/iam/test_framework_schemas.py
```

## 第2、3项真实环境复验

使用本轮独立的真实MySQL8.4、Redis8.2、四个JVM服务和Chrome同源HTTPS。账号、A/B组织、成员及改密均经真实业务API创建/执行。下列结果为最终Auth包重启后的独立批次：

| 场景 | 实际结果 |
|---|---|
| R02 原结果恢复、依赖故障与跨租户改密 | 正常恢复保持同Cookie/sid/截止；真实IAM恢复RPC故障返回503且无Cookie，恢复依赖后仍可恢复同结果；错误设备返回409且无Cookie。在B组织真实改密后，A组织原正式会话仍可读取，旧登录结果连续3次恢复均401且无Cookie；Gateway签名身份不能调用恢复。 |
| R03 真实迟到绑定响应 | 代理暂停最先发起的匿名CSRF响应，另一请求建立X绑定并登录、准备旧登录/切换；随后释放迟到Y绑定Set-Cookie，Chrome实际成为正式CookieX+绑定Y。me仍有效，注销成功且无Set-Cookie；原root及旧登录/切换/恢复均拒绝，随后新登录可用。 |
| R03 注销与新登录并发 | 上述错位状态下暂停已携带原Cookie/context的注销请求，在Y绑定完成新登录后再放行原注销；原root关闭，新Cookie/sid/root/截止保持。重复原context注销200但无Set-Cookie，新登录仍有效。公共操作ID无正式Cookie和错误设备均拒绝。 |

本轮拓扑为单机隔离真实运行，未重跑跨机网络分区、Redis晋升或GR故障转移；candidate10历史20轮/1000竞争及固定root RT证据保持原版本归属。9项条件跳过的完整名称见JSON：3个GR、3个IAM性能、2个IAM浏览器、1个OSS。性能未重新评估或标记通过。

## 执行问题与清理

初始Mockito换桩方式、默认IAM测试worker堆不足、测试Gateway多余配置、独立OAuth夹具缺少必需布尔TokenSettings、浏览器错误设备断言遗漏已有409语义及旧表数断言均已定位修正；失败尝试未混计为最终通过。原始执行记录在本轮临时目录，脱敏结果随本工件保留。

本轮JVM/HTTPS代理、独占容器及持久卷已删除，监听端口关闭；私密配置、密钥、异常录制、运行日志和提取的运行文件已销毁。原三台VM均仍为Stopped，本轮未改变其状态或修改其他Docker资源。双仓diff检查通过，无暂存/提交；保留原有其他改动。
