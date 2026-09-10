# 设计：门户、文档和统一创建引擎

## 1. 架构与目录

```text
apps/dev-portal/                 # VitePress composition root
  .vitepress/                   # 站点配置、默认主题扩展、开发中间件接入
  src/                          # 向导组件、状态与 API 客户端
  demos/                        # 独立 Vue 演示入口、案例和固定数据
  .generated/                   # 构建收集的页面／源码展示／覆盖数据，不提交
docs/                           # 开发指南和新增参考手册的单份正文
scripts/lib/                    # scaffold 描述、规范化、校验、render、write
scripts/templates/              # admin-app、admin-plugin、admin-theme
```

沿用 scripts/lib 作为工程 CLI 与本地 Web 共用的生成实现，不将工程文件操作加入运行时公共包。浏览器只接收可序列化 schema、默认值及 HTTP 结果，不导入 fs／Node 模板引擎。生成器采用现有 .mjs＋严格 JSDoc／声明文件方式，为门户提供显式类型；不引入第二套无类型接口定义。

新门户不启动 bootstrapAdminApp，不导入业务页面作为文档布局。向导为自定义 Vue 组件，保留 Element Plus 表单能力、按需引入其样式，以 VitePress 主题变量协调颜色；布局优先 UnoCSS，禁用 Preflight 对文档全局重置。Node server 模块仅由开发配置加载。

## 2. 文档单一来源与页面生成

- docs 保留现有路径，新增框架参考正文按 app／plugin／theme／components／modules／engineering 组织；包内已存在的参考正文继续作为其唯一来源。
- 门户收集脚本使用显式页面映射表，将正文、相对资源和案例源码转换到 .generated；链接重写为站内页／锚点，源码文件链接指向配置的仓库 URL。开发模式监听正文变化，构建前重新生成。
- 不复制 specs 为用户手册，specs 继续管理变更与已验收行为。现有 docs/create-app.md 更新为新入口与兼容命令说明，不留两份脚手架使用正文。
- 开启 VitePress local search、中文 UI 文案、默认主题明暗切换、侧栏和页内导航；创建页与文档页共用默认主题布局（sticky 顶栏、侧栏、页内目录），正文保持阅读宽度。向导控件颜色跟随站点明暗 token，不另做独立页头。
- VitePress 采用与现有基线兼容的稳定版并锁定依赖；门户可以使用其自身兼容的构建依赖，不升级根 catalog 来解决单站兼容问题。若必须改变业务基线，先修订本设计再确认。

### 公开能力覆盖清单

在门户增加受版本控制的文档映射清单，以公开符号／组件名称为键，记录来源、文档页、锚点、示例 ID、演示适用性和不适用原因。

扫描公共包 package exports 的公开入口和再导出链（含 TS 类型），以及 admin-core 的全局组件注册；按公开模块分组。组件参考从 `defineProps` / `defineModel` / `defineEmits` / `defineSlots` / `defineExpose`、同文件或相对导入类型、运行时 Props 与关联类型生成；模块参考输出 JSDoc、源码签名与可展开字段。覆盖 admin-core、admin-common、shared（含 crypto／hooks 子路径）、http-client、vite-config。业务插件按页面 `in-page-header` 说明覆盖，并展开 `domainGlobalComponents`；不把每个业务 API 函数当成框架公共 API。

生成 Markdown 除文档页显式使用的 `DemoFrame` 外不得输出 HTML 标签；类型与签名用 Markdown 反引号或围栏代码块，`<` `>` `&` 一律转义。VitePress 先把 Markdown 当 Vue SFC 解析，源码里的泛型与未闭合括号会被当成标签并导致参考页 404。

未匹配的新公开项、失效锚点、空说明、不存在的示例均使检查失败。第三方 re-export 可映射到集成章节＋官方文档；不适用条目必须给具体原因，不能把整个包标为跳过。覆盖检查保证映射完整，人工验收负责说明准确性及示例质量。所有模板、参数参考以当前实际类型为准，不修改运行时接口来匹配错误文档。

## 3. 演示隔离

- demos 为同一门户内的独立 Vue/Vite 入口，开发时由门户统一启动并按 /demos/ 路径提供；生产先独立构建到站点 demos 子目录，再合入最终静态产物。不作为新的 workspace App，不引入 App → App 依赖。
- 文档用惰性加载 iframe 打开固定 demo ID，演示清单只允许预先编译的案例，不执行用户任意代码。代码展示直接读取该案例源文件。
- 演示消费公共包公开导出，独立配置 Vue、Element Plus、UnoCSS 和 Iconify；必要的 Pinia／Router／Query 上下文在 iframe 中提供，路由使用 memory history，存储使用 demo 专属前缀或内存。
- 不把核心 style.css 和 theme 根变量注入 VitePress 页面；带 Teleport 的组件仍在 iframe 自己的 body 内。按需使用公开主题初始化能力，不启动业务登录和菜单加载。
- iframe 通过限定 origin 与消息类型的 postMessage 同步明暗及尺寸，尺寸设上限并保留内部滚动。布局示例固定演示高度，普通组件支持自然高度。
- 网络示例使用局部 mock adapter，固定用户／租户数据；仅演示明确需要的操作。真实 API 集成文档与模拟运行时清楚区分。

## 4. 向导与生成数据流

表单依次为基础、配置／扩展、预览、结果；按 app／plugin／theme 拆分组件和 composable，避免一个超大 App.vue。配置描述含 field path、类型、默认、约束、文档链接和输出去向；表单和校验共用，不从 UI 手写第二份默认。

数据流：输入 → defaults／normalize → validate → catalog resolve → render files → preview → 重新校验＋摘要核对 → 排他创建目标 → 写入 → 接入步骤。POST 契约与错误见 API.md。表单改动使预览失效，不复用过期 fingerprint。

生成文本使用可靠的 TS／JSON／dotenv 序列化，二进制按 Buffer 复制。所有文件先在内存渲染，通过后才创建目录；写入失败只回滚本次拥有的产物。rootDir 注入仅允许引擎测试和本地服务启动时使用，不出现在 HTTP 输入中。

## 5. 模板与可发现性

### App

模板保留 main.ts、app-plugin.ts、plugins.ts、header.ts 和约定目录；补充实际被 main.ts 消费的配置扩展模块。结构化 header 配置与可选回调示例集中于 header.ts，修正现有生成模板中 header 文件未接入入口的问题。

所有所选插件同时写入 package dependency、plugins.ts、Vite officialPlugins 显式清单、必要类型解析；不通过伪造只有 InAdminPlugin 的声明掩盖自定义插件的真实类型错误。selected theme 使用公共 export 和 CSS 出口，保持 core CSS 与 App uno.css。

env 与常量的来源遵循 CONFIGURATION.md；mode 的 App code 固定同源，基础表单与环境页编辑同一状态。build.base 同步现有 publicPath；验证现有 router history 与资源路径的子路径表现，若核心确需新增行为支持则先补充设计确认，不夹带运行时重构。

### 插件与主题

模板从现有公开示例和正式目录约定提炼，不能把示例中的 src 导出条件照搬为正式主题发布出口。插件使用源码公开入口和 defineInSourcePluginConfig；主题输出 dist 的 JS、声明、CSS、资源，脚本遵循 themes workspace 约定。

新插件／主题 package.json 增加工具专用字段：

```json
{
  "ingotScaffold": {
    "version": 1,
    "kind": "plugin",
    "id": "ingot-sales",
    "exportName": "salesPlugin",
    "canonicalPrefix": "sales"
  }
}
```

主题 kind=theme，id 使用主题 ID，不含 canonicalPrefix。此字段只辅助本地工具发现，不影响 InAdminPlugin／InAdminTheme 协议，不新增全局注册表；扫描时仍校验 manifest 和公开入口，不能信任字段就执行源码。既有官方包使用内置映射，不要求为发现功能批量修改官方插件。

### 构建与边界

现有 officialPlugins 已可显式接受自定义 packageName，继续沿用名称和公开类型。新插件的自身 Vite 检查配置显式包含自身包，宿主配置显式包含全部所选插件，保证 importer alias、SFC、glob、自动导入、样式和图标的源码目录一致。

扩展依赖／注册一致性检查至动态发现的自定义业务插件，保留既有官方隔离规则；官方插件不得互相依赖，生成器也不提供跨业务插件依赖。主题保持 themes → packages，不导入另一具体主题。

## 6. 命令、构建与兼容

- 增加 dev:portal、build:portal、preview:portal；build:portal 先构建所需公共包，然后检查／收集文档、构建 demos 和 VitePress。产物统一落在门户 dist。
- 旧 create:app、dev:create-app 重定向新包 dev；旧 create:app:cli 保留。插件／主题增加对应 Web 和 CLI 命令，详情见 API.md。
- 更新根 apps 构建／测试筛选中的旧 create-app 排除项。门户独立参与 check 的 build:portal 和自身单测；常规 build:apps 排除门户，避免业务构建重复收集和构建文档。
- type-check:apps 包含门户；根单测以门户实际脚本接入，不能假定门户是业务 App 的 Vitest 结构。check:docs 增加站点链接／锚点、覆盖清单与演示映射检查，并保留现有检查。
- 支持配置文档站点 base，内部链接、iframe、搜索与资源均相对该 base；默认 /。不在本 change 自动部署或绑定域名。
- 不默认持久化表单和 API 内容，不将本机路径／配置值打进静态站；配置默认数据来自模板公开样例。

## 7. 宪章符合性与验收收尾

| 原则 | 符合性 |
| --- | --- |
| apps 为运行入口，plugins／themes／packages 单向依赖 | 门户是独立 App；演示为门户内部入口；工程生成器留 scripts，运行时不反向依赖门户 |
| Vue＋TS、pnpm、UnoCSS、无 any | 向导、类型、模板遵循规范；VitePress 使用 Vue，不另起框架 |
| 主题无业务页面、只消费公开接口 | 主题模板遵守已完成的 themes workspace 契约 |
| 先规格、后批准施工 | 用户确认开工后 implementing；验收后写入 current 并归档 |
| current 只写验收行为 | 收尾新增门户场景，更新已有创建入口，不复制本地 API 字段表 |

验收使用隔离临时 workspace 和自动化浏览器，禁止把测试生成的 App／插件／主题留在正式目录。文档、生成器、组合消费、静态部署场景均通过后才完成；已有失败必须单独记录，不以其为由跳过新增验证。
