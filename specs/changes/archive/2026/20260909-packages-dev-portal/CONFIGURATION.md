# 配置覆盖：结构化表单与代码扩展

本文件约束本期配置深度；与 API.md 的输入结构及 DESIGN.md 的生成链路共同使用。框架类型和实际消费点是现状依据；不得把当前未生效字段伪装成可用功能。

## 1. App 环境变量

扫描范围：apps/admin 的 env 声明／受版本控制的环境样例／main.ts，scripts/templates/admin-app，以及 admin-core 的配置消费链。不读取 .env.local、.env.*.local 或用户未提交凭据作为默认值。

| 分类 | 内置键（VITE_APP_ 前缀） | 控件与生成行为 |
| --- | --- | --- |
| 身份与品牌 | CODE、TITLE、SYMBOL、COPYRIGHT | 字符串；CODE 绑定 appCode，各 mode 必须一致 |
| 登录 | LOGIN_URI、LOGIN_CALLBACK_URI、ERROR_IMAGE、FINGERPRINT_ENABLED | URL／字符串、布尔；默认回调使用开发端口 |
| 网络 | NET_BASE_URL、NET_DEFAULT_TIMEOUT、NET_DEFAULT_TIMEOUT_MESSAGE | 字符串、正整数毫秒、字符串；完整传入 net |
| 存储 | STORE_PREFIX、COOKIE_DOMAIN、COOKIE_DEFAULT_EXPIRE_TIME | 字符串、字符串、正整数秒 |
| 界面 | SETTINGS_COMPONENT_SIZE、SETTINGS_SHOW_MENU、SETTINGS_SHOW_BREADCRUMB、SETTINGS_SHOW_COPYRIGHT、SETTINGS_SHOW_SEARCH、SETTINGS_SHOW_WATERMARK | default／small／large 枚举和布尔 |
| 请求与资源 | BASIC_TOKEN、BUCKET_NAME | 字符串，说明浏览器构建变量可被客户端读取 |
| 遗留 | TENANT | 现有模板存在而入口未消费；展示为遗留未消费项，默认不新增输出；显式输入时作为自定义变量保留，不承诺改变租户行为 |

- 对以上清单建立自动覆盖检查：新增环境声明／消费键须补充描述或注明不适用原因，不能静默遗漏。
- public env 全部按字符串存储，布尔以 true／false 序列化，数字显式解析。env.d.ts 不再将原始环境值声明为 boolean／number。
- `env.common` 输出 `.env`；`env.modes[mode]` 输出 `.env.<mode>`。默认提供 development、production；自定义 mode 采用小写 kebab-case，拒绝 local 及目录分隔符。
- mode 值覆盖公共值；省略键表示继承，空字符串表示显式清空。必需值清空应报错；可选值按现有运行时语义处理。
- 环境编辑器与基础表单使用同一状态。appCode 固定为目录与本地插件共同标识；标题、存储前缀、回调先派生默认值，用户手工修改后不再被端口等字段静默覆盖。
- 默认沿用受版本控制的模板公开示例值，补齐网络超时 10000、Cookie 时长 7200；原有 net 基址省略语义保持。生产 mode 初始继承公共样例，界面明确提示检查部署地址，不自动复制用户运行环境。
- 自定义变量键匹配 `[A-Za-z_][A-Za-z0-9_]*`；重复键拒绝。说明仅 VITE_ 前缀默认暴露给客户端。正确保留引号、换行、反斜杠、美元符号及 dotenv 展开语义，使用真实解析回读测试。

## 2. App 非环境配置

| 能力 | 本期表单 | 代码扩展／产物 |
| --- | --- | --- |
| 基础 | appCode、品牌 Logo 路径／URL、Demo | package 默认 name=appCode，保留现有命名；HTML、资源、README |
| 开发与构建 | port=5800、host=localhost、base=/、DevTools 开关 | defineInAppConfig；base 同步 publicPath，路由子路径行为必须经组合验证 |
| 代理 | 按规则配置 prefix、target、changeOrigin、stripPrefix；默认 /api → http://localhost:7980 | 序列化生成固定 rewrite 函数；任意 rewrite 逻辑在 Vite 扩展文件修改 |
| 图标 | collections 默认 ep、extra、scan 默认 true、usedFile 默认 iconify-offline.used.json | 文件路径限生成 App 内；保留核心 iconDir 与 used 清单 |
| 插件 | 官方默认全选＋其它本地源码插件 | plugins.ts、dependency、显式 officialPlugins、类型解析同步 |
| 主题 | defaultAdminTheme 或已有仓库主题 | 主题 dependency、公开导出 import、style.css import |
| 顶栏 | 品牌／导航／搜索／用户区的公开可见性设置、内置小部件及用户菜单的选择与顺序 | header.ts 实际传入 bootstrap；具体字段取现有公开类型 |
| 挂载点 | 默认 #app，不增加自由表单 | 入口代码扩展，修改时须与 index.html 同步 |
| 菜单／路由 | Demo 开关 | staticMenus、路由、布局、页面在类型化示例中扩展 |
| 函数／组件 | 不提供任意代码输入执行 | net 拦截器、shellSlots、响应式 header、Vue 安装、aliases／autoImports／extraPlugins／extend 的注释示例和类型化扩展文件 |
| Docker | 沿用当前容器 3000 端口及网关 HTTP/1.1 模板 | 文档说明外部 TLS、部署域名、CI、代理差异；不自动创建部署流水线 |

可序列化设置只保留一个来源，不同时在 env 与常量内生成互相覆盖的值。提供 app 扩展配置并在 main.ts 引用；可选扩展示例被选择后必须产生有效接线，未选能力不添加无用 import。

## 3. 插件配置

| 字段 | 默认与约束 |
| --- | --- |
| directoryId | 必填小写 kebab-case，写入 plugins/<directoryId> |
| pluginId | 默认 ingot-<directoryId>；合法且不与现有插件／core 重复 |
| packageName | 派生 @ingot/<directoryId>-plugin，不提供任意路径／包名输入 |
| exportName | 默认 <camelCase(directoryId)>Plugin，可改为合法非保留 JS 标识符 |
| canonicalPrefix | 默认 directoryId 的短横线转点，允许点分小写标识；拒绝保留 common、layout 及冲突前缀 |
| description | 默认空字符串 |
| withDemo | 默认 true；false 生成空 pages／api／models／components／stores 等必要骨架 |
| extensions | layouts、components、directives、stores、install 布尔选项，默认 false；Demo 使用 staticMenus，关闭 Demo 不生成示例菜单 |
| dependsOn | 固定核心协议依赖，不开放跨业务插件依赖表单 |

模板使用 definePluginPages、当前协议版本和 canonical key。全局组件用 Biz 前缀；store ID 和导出名带插件域前缀。官方和自定义插件均服从宿主编译及公共包依赖规则。

## 4. 主题配置

| 字段 | 默认与约束 |
| --- | --- |
| id | 必填小写 kebab-case，与既有主题及默认主题 ID 不冲突 |
| packageName | 派生 @ingot/theme-<id> |
| name | 默认 id，可自定义中文展示名 |
| exportName | 默认 <camelCase(id)>Theme，可改合法非保留 JS 标识符 |
| tokens.light／dark | 默认空覆盖；键来自 IN_THEME_TOKEN_NAMES，值字符串；支持搜索、分组、清除覆盖 |
| shell | 默认 false，开启生成符合 useAdminShell 契约的最小 Shell |
| parts | header／navigation／breadcrumb／footer 多选，默认空；复用公开部件与插槽，不复制业务页面 |

主题创建只生成源码与配置；编译由后续 build 执行。未知 Token 拒绝，Token 值遵循核心验证规则；源码序列化必须转义。主题私有 CSS 使用自己的前缀和主题 ID 作用域。
