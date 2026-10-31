# 前端设计：两个管理宿主挂载登录

> 状态：completed；已获用户批准并实施，本地证据与真实环境待验项见 VALIDATION.md。

## 1. 分层与组合

- apps/admin、apps/admin-platform：composition root，显式安装auth插件、注册公开路由、注入本应用AuthSession能力及品牌/配色。
- plugins/auth：保留登录Shell/输入/组织选择/反馈，新增适合管理宿主的插件描述与公开路由导出。不得导入另一业务插件，不访问任何App的@/路径。
- packages/auth-core：共享API工厂、CSRF/事务/错误/返回路径/恢复类型与无页面逻辑。
- packages/admin-core：共享网络、Pinia会话、身份纪元、Bootstrap、退出与全局挑战宿主；通过公共能力向App适配，不反向依赖auth-plugin。
- packages/appearance/shared：http/加密/静态品牌/无页面通用组件继续复用。实际从旧auth App移出的通用验证组件放允许的共享层，不能复制进两个App。
- apps/auth、apps/auth-platform：先迁移被使用能力，完成双宿主接入后移除独立运行、构建/CI/Docker与相关默认配置；不维护四站兼容运行模式。历史Spec和证据保留。

## 2. 路由与宿主

createAuthRoutes不再导出“/重定向challenge”的根路由，避免覆盖管理首页；注册/login/为公开、无后台布局、无需业务bootstrap的路由。
将plugins/auth现有pages/challenge表单与组织选择组织为pages/login/IndexPage.vue、useOps.ts及password/select-tenant等私有组件；复用外观，不重写第二套页面。非表格页不建空table.ts，这是表单场景对四件套模板的适配。
公开错误反馈位于登录路由内或专用受控错误页，不能用query提供任意重定向。
admin-core公开路由守卫放行登录所需静态资源/认证请求；未认证不执行菜单装配，不因bootstrap401重新反复mount登录页。
公开 `permitAuth` 页面以独立、不缓存的包装器渲染，保持当前实例；受保护页面的 KeepAlive 仍按身份纪元/权限版本清理。成功确认期间推进纪元、应用 bootstrap 与菜单时，不重建登录页，不重复触发其 onMounted 事务恢复。正常完成只执行一组“本次事务读取→me→bootstrap→进入业务路由”，异常恢复仍按既有有界流程处理。
旧/auth/start、/auth/complete、/oauth2/challenge仅做本域参数清理和稳定入口replace；删除消费ticket逻辑。旧独立域名的固定引导由运维负责，不由浏览器query决定。

## 3. 能力注入与API对接

AuthSession删除跨域startUrl/followReady/restartIfExpired跳转假设，改成prepare、submit、select、read、resume、onAuthenticated及本地反馈能力。类型集中auth-core，共享状态不能跨App复制。
App通过admin-core公开适配能力注入；admin-core不直接importauth-plugin，auth-plugin不依赖宿主内部文件。新公开能力新增类型和导出，不用服务定位器回避边界。

| API契约 | 共享/适配落点 | 页面职责 |
|---|---|---|
| csrf与transactions | packages/auth-core/src/api.ts、csrf.ts、types.ts；admin-core认证适配 | 点击后串行准备，禁止初始化强制创建 |
| login/select | 同一共享工厂，public LoginAPI/SelectTenantAPI适配 | 整包HYBRID、展示候选/COMPLETED |
| transaction GET/resume | auth-core共享恢复控制；页面useOps消费 | 只读轮询上限、一次恢复与错误反馈 |
| me/logout/bootstrap | admin-core现有auth/iam API和stores | 核对实际Cookie/本次结果、身份失效、受限改密与装配 |

API.ts的命名与显式Promise<R<T>>、strict TS规则沿用前端skill；不要在DESIGN重复DTO字段表。

## 4. CSRF、挑战与请求上下文

- 不把“sessionStorage有Token”当作服务端有效；准备时调用幂等csrf并带入新事务。缓存键带appId，优先内存，刷新后可重新获取；CSRF不得装到外域请求默认头。
- 创建事务刷新绑定期限由服务端负责，不能靠前端猜Cookie或改Domain/Max-Age。
- 整包HYBRID使用现有admin-core加密拦截器；挑战重试恢复明文快照并产生新nonce/时间戳，失败清快照。
- 每宿主只挂一个全局ChallengeHost和solver；auth插件不再绑定独立App的solver。验证码API/组件下沉共享层后统一复用，不直接导入apps/auth源码。
- 412保持既有策略，关闭挑战不弹滑块；挑战取消结束loading。验证码耗时导致事务过期时最多一次未认证修复，不能绕过PassToken或失败计数。
- 认证与业务失败处理分流：认证页403/410留页处理，业务401进入/login/；503不被误判为未登录。没有永不settle的Promise来吞掉认证失败。

## 5. 页面状态与恢复

页面状态为FORM、PREPARING、SUBMITTING、SELECTING、RECOVERING、FINISHING；服务端状态使用API判别联合，不以allows空/非空推断平台或成功。
用户点击捕获一次表单内存，串行csrf→transactions→login；合并点击并禁重入。每次用户新尝试创建新事务，不复用FAILED事务。
SELECT时移除密码/加密快照；返回表单放弃原选择事务，不把其视作新密码已验证。事务自然到期及服务端补偿负责秘密回收。
transactionId仅作本标签恢复线索，可存appId命名的sessionStorage；不存密码、Token、sid、候选长期快照或结果sessionId。刷新后先验证归属和状态；别人的旧URL不能导入认证结果。
网络不确定或busy最多按1000ms提示查询15秒；不重复提交密码。GET本次COMPLETED且未建立Cookie时一次resume；失败、超时明确停留表单，不循环。
长时间停留没有需保活的未认证事务；focus/visibilitychange只取消陈旧UI状态，不创建心跳或自动POST密码。
错误按API code处理，有限重试只在当前同源，永不切另一应用。
提交、选组织、恢复、成功确认与宿主进入分别合并在途操作。恢复或不确定结果查询刚读取的同一个 COMPLETED 对象，可在本流中用于一次确认，仍必须核对本次事务 sessionEstablished 与 me；POST 返回或外部对象不能跳过事务 GET。避免刷新恢复紧接着重复查询同一完成结果。

## 6. 成功、身份纪元与退出

COMPLETED后先读本次结果/me以实际Cookie验证，必须属于当前appId、domain及本次结果；旧me有效不代表新身份成功。
先推进身份纪元、清旧菜单/权限/query/详情/表单，再bootstrap新身份；epoch不符的迟到请求全部忽略。新Session未确认不能重新显示旧身份内容。
发布同origin BroadcastChannel身份失效通知，其他标签页清理并重验；明确的 logged-out 通知则直接清理和进入强制表单，不执行 bootstrap/远端退出、不重复广播。不同origin不共享通知，平台/租户互不清理。
重验与退出使用受保护页面渲染屏障，身份清理、bootstrap、路由安装和导航全部完成后才挂载新业务页面。重验内触发强制改密仍属于本次切换；更新身份和退出可终止旧切换。业务请求触发的改密检查与跳转合并，先暂停旧业务挂载；新身份不复用旧身份尚未完成的改密状态/能力刷新，旧任务结束不清除新任务的合并锁。相同路由指纹不重复 remove/add。
HTTP 请求在异步准备前标记身份纪元，在指纹/CSRF/信封准备后再次检查；旧请求和挑战重试不能被当作新身份请求发送。响应在信封清理后、业务码/401处理前核对纪元，旧成功/失败均以取消处理，不能回填或退出新身份。
显式退出仅合并执行一次撤销，最长等待1500ms并 AbortSignal 中止；本地401只清理本地并强制显示表单，保留安全深链，不再次请求退出或在登录页重复 me。退出菜单等待同一退出/导航任务；并发签退提示合并，取消提示不退出。
浏览器Set-Cookie可能迟到，前端不能宣称能拦截HttpOnly Cookie覆盖；后端代次拒绝旧身份，前端暂停展示，恢复最新合法结果或重新认证。
强制改密仍先进入受限流程，改密成功旧sid不可再用；无菜单合法空态。未知域或bootstrap身份不符阻断，不重定向另一应用。
深链只恢复本应用相对路径；显式退出/切换账号强制表单，不被已有me直接弹回。普通打开登录且已有有效会话可进入管理页，但仅在没有显式再认证意图时执行。切换组织显式强制表单并保存当前安全深链，已有Cookie不触发自动进入；普通退出清除深链。导航合并至本次文档离开，避免连续 location.assign。

## 7. 外观与配置

沿用20261030外观change的Logo、语义表单、键盘、默认light及auto/dark/light、宽窄/矮屏与挑战反馈。
登录配色/标题/版权/指纹配置迁到对应管理宿主的runtime.ts/config及env，App组合注入；取消跨域VITE_APP_ADMIN_START_URL。
登录路由主题仅在该路由作用，离开恢复后台主题/持久偏好；不让useAuthAppearance无条件覆盖已登录后台设置。CSS作用域避免登录变量污染列表/表单。
HttpOnly会话Cookie完全由BFF管理；前端旧cookieDomain工具不再参与认证Cookie，不做无关cookie工具全仓重构。
开发/构建/镜像只发布两个宿主，/login/深链和资源base以实际反代验证，规范来源见sources/BACKEND-DEPLOYMENT.md。

## 8. 宪章符合性

| 原则 | 结论 |
|---|---|
| apps→plugins/packages、插件不互依 | 通过App组合与无页面能力注入，无admin-core→auth-plugin依赖 |
| 业务页留插件 | 登录及选择留auth-plugin，宿主只注册/配置 |
| strict TS、统一请求、API命名 | 使用判别联合与现有共享HTTP，不新增any或裸Axios副本 |
| 页面组织 | IndexPage/useOps/私有组件；非表格登录不建空table |
| 品牌与样式 | 复用appearance、Token与现有外观，未改主题体系 |
| Spec单一事实来源 | API逐字复制；current待联合验收后更新 |

## 9. 兼容与验证

本次为协调发布，不让旧四站前端与新BFF混跑。Cookie改名一次重登；旧页面只同域引导，旧Auth App被替代后移除，不删除其历史Spec。
验证按REQUIREMENTS及sources/BACKEND-ACCEPTANCE.md执行；Mock/类型通过不能替代真实Cookie、HTTPS和多身份验收。用户既有components.d.ts改动不触碰。
