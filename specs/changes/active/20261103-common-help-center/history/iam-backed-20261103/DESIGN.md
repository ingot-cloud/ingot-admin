# 设计：双端共用帮助阅读插件

## 1. 架构与固定域

新增 `plugins/help`（包 `@ingot/help-plugin`），由apps/admin与apps/admin-platform装配同一插件工厂。`createHelpPlugin({ entry: "tenant" | "platform" })`只由各宿主构建配置指定，无运行时域切换；服务端身份才是最终权限来源。插件依赖admin-core/admin-common/shared，不依赖org/platform/security插件，也不包含文档源、文章目录或图片字节。

保留两端现有BizHeaderHelp薄包装，通过公共帮助导航契约打开首页，删除示例提示。顶栏功能搜索仍是原菜单搜索，帮助页提供自己的文档搜索。

帮助采用同origin下的独立受保护阅读布局 `HelpReaderLayout`，包含品牌、帮助中心、当前端标识、文档搜索与“返回管理台”；不并排再放原业务侧栏，不永久修改菜单展开/主题偏好。离开帮助回到安全的当前端业务位置；品牌/返回按钮也可回系统当前默认可访问页。布局与视觉目标见 [UX.md](./UX.md)。

## 2. 页面、路由和文件职责

插件用staticRoutes注册隐藏公共业务路由，**不设置permitAuth=true**，继续走既有会话/身份/强制改密守卫。页面通过plugin registry注册，canonicalPrefix为help。

| URL | 页面目录 | canonical viewPath / routeName |
| --- | --- | --- |
| `/help` | `plugins/help/src/pages/home/` | help.home |
| `/help/categories/:categoryId` | `plugins/help/src/pages/category/` | help.category |
| `/help/search?q=...&categoryId=...&page=1` | `plugins/help/src/pages/search/` | help.search |
| `/help/articles/:articleId#heading-id` | `plugins/help/src/pages/article/` | help.article |

每页使用 `IndexPage.vue`（编排）、`table.ts`（该页展示配置，不伪造表格）、`useOps.ts`（查询、路由、页面操作）；页面私有子组件放该页 `components/`。文章的Markdown、大纲、配图及预览位于article/components；搜索、分类树、文章列表和状态反馈为跨页组件，放 `plugins/help/src/components/`。无私有子组件的简单页面不创建空目录，阅读头由布局编排。

`layouts/HelpReaderLayout.vue` 负责阅读布局，`models/help.ts` 负责类型，`api/help.ts`及`api/help.query.ts`负责请求和Query。HTTP别名使用本插件的 `@/net`薄出口指向admin-core统一request，不能创建独立Axios实例。

初次访问静态受保护帮助页时仍需bootstrap。若现有DynamicRouterGuard在有效身份但无动态菜单时取消导航，最小修正为：完成身份bootstrap后，已注册且受保护的帮助staticRoute允许继续，普通未知业务路由保持原拒绝；不引入匿名例外或改写全部路由权限。该路径必须有定向回归验证。

## 3. 业务页说明与跨插件契约

基础注入契约 `helpNavigationKey`、`useHelpNavigation` 定义在admin-core，由admin-common统一再导出，并在admin-common提供 `BizHelpLink`。这是为了core内置下载页也能复用而避免core反向依赖common；对业务插件的接入方式不变。契约为openHome/openForView/openArticle及可用状态。help插件在install中注册实现；其他插件只依赖公共包，不导入help插件。未装配帮助插件的宿主，BizHelpLink隐藏，不提供无目标按钮。

- 正式业务页使用 `BizHelpLink` 传当前canonical viewPath；点击时按catalog.pageBindings解析主文章。动作级教程可传CONTENT中稳定articleId，不允许传任意URL或域。
- 链接放现有页头/操作区，不覆盖主要操作。无页头工作台使用既有概况区的轻量说明链接，不新增标题白条或帮助卡片，不改变其已确认布局。
- 涉及org/platform/security各正式页面的入口都记入功能覆盖账本；隐藏导入导出页也接说明。
- 仅打开说明时才按需取得目录，不在每个业务页挂载时预拉正文/图片。
- 文章“前往功能”与 `useRouterStore().getMenus` 同源可导航菜单按viewPath匹配，使用已有菜单path。只显示当前可访问目标；无目标时说明需要对应权限，不调用目录接口猜路径、不额外申请业务读取权限。
  - 菜单转换保留服务端canonical viewPath到route meta及MenuRouteRecord，仅用于已授权目标关联；首次动态菜单装配显式保留query和hash，避免章节深链丢失。
- 返回来源只存当前origin的内部业务路径内存，拒绝协议、双斜杠、登录/回调路径、帮助自循环和外部跳转；无有效来源回默认可访问入口。

## 4. API与模型映射

对外字段、错误、限额只看本目录 [API.md](./API.md)。

| 接口 | API函数及调用方 |
| --- | --- |
| GET catalog | HelpCatalogAPI；布局、首页、分类树、按viewPath打开说明 |
| GET search | HelpSearchAPI；search/useOps，分页默认20 |
| GET articles/{id} | HelpArticleAPI；article/useOps |
| GET assets/{id} | HelpAssetAPI；BizHelpFigure/预览，沿用JSON文件响应 |

API函数返回显式 `Promise<R<T>>`，RequestOptions传递signal、silent反馈等选项。固定PATH前缀由宿主entry和已有IAM_API_PREFIX构造。domain复用共享AuthorizationDomain类型，不创建第二套TENANT/PLATFORM字符串体系；closed取值用类型/常量，类型不使用any。模型保存ISO时间点原值，更新日期经shared工具按当地时区显示，无法识别时回退Asia/Shanghai。

## 5. Query、路由与恢复

- 目录按需读取，分类树直接消费服务端树，不用大页分页拼树。搜索使用服务端分页；清空搜索回帮助首页/当前分类，空关键词不发search请求。
- 查询键至少包含身份纪元、当前端/账号/成员/tenantId、contentVersion、资源类型与参数；复用当前身份及查询基础设施，不能仅以articleId/q为键。响应落地再次核对纪元、domain和version。
- 不持久化帮助Query或位置。URL只记录q/categoryId/page及articleId/hash；来源和列表滚动位置按当前身份存在内存，浏览器后退同一结果页恢复，首次直达没有历史位置则从顶部开始。
- catalog未成功前不请求search/正文；目录确认对象存在后再请求正文。源文章版本变化时清正文、搜索、预览和所有Blob URL，目录重取后原动作至多重试一次；持续409显示明确刷新按钮。
- 取消的请求不显示失败Toast；503显示局部错误与重试，不能退出有效登录；401由统一链清理、保存安全深链并回登录。错误阶段不展示旧成功内容作为当前结果。

## 6. Markdown、链接与图片

采用支持受限CommonMark/GFM的解析器，禁用raw HTML，渲染结果经DOMPurify白名单净化；依赖在实施时按仓库包管理与锁文件固定。仅支持CONTENT列出的节点/提示块。禁止iframe、script、事件属性、style和任意HTML扩展。

章节 `{#id}` 由受控规则转成toc中的稳定id；解析出的标题顺序和toc必须一致。帮助链接只解析当前catalog中的articleId/章节，使用router导航；外部仅允许经校验HTTPS链接、noopener/noreferrer，禁止javascript/data/file/协议相对URL及另一端内部帮助链接。图片src不接受任意URL，`help-asset:id`必须存在于当前文章assets列表，渲染为BizHelpFigure。

图片通过统一HelpAssetAPI取JSON，校验媒体类型、解码大小及domain/version后创建Blob URL；首屏附近才加载缩略图，点击预览再取原图。限制同时最多4个图片请求，同资源在当前文章会话内去重，不预取所有原图。保留宽高比例避免布局位移。

文章卸载/版本变化/退出或身份变更时，中止取图、清DOM/元数据、关闭预览、撤销全部Blob URL，旧响应即使成功也不能重新创建URL。禁止将图片API地址直接绑定img、写入存储或经公开OSS/CDN旁路。缩略图和原图均需覆盖401/403/404/409/503处理。

## 7. 主题、可访问性与兼容

视觉尺寸和断点集中在help阅读组件/局部Token层，映射项目语义Token；不新增全站视觉主题或全局覆盖Element样式。布局优先UnoCSS，必要样式用scoped PostCSS，无scss/less。

分类树使用项目全局三角展开规则，键盘与ARIA保持一致；图文列表不是业务CRUD表格，不强套InTable筛选布局。help为源码业务插件，双宿主只装配；公共导航契约是无页面抽象，符合分层。

## 8. 发布、回滚与验证

2026-11-03用户说明暂时登录失败，确认真实操作截图后补。先完成程序、文字教程、概念图及受控浏览器验证，真实账号/BFF联调、操作截图和逐篇截图实操证据留待补齐；开发联调用后端显式preview构建，正式发布门禁仍要求必需截图及实操证据齐全。不得用虚构操作截图或受控接口夹具宣称完成真实环境验收。

后端先发布新接口/内容，再发布两管理台。缺接口或未知schemaVersion显示帮助暂不可用，保留返回管理台；不向另一端探测。前端回滚移除插件及入口接线，旧业务不受新增只读接口影响；与后端成套回滚时核对内容/功能版本。

定向测试关注域与纪元隔离、版本恢复上限、文本高亮净化、资产验证/URL销毁、树/大纲和路由恢复、无菜单/强制改密守卫。执行插件/受影响包类型检查、测试和边界检查，两管理台构建；真实BFF联调及视觉/图文实操证据见UX和TASKS。不为纯样式细节编写镜像断言。

## 9. 与CONSTITUTION符合性

| 原则 | 结论 | 依据 |
| --- | --- | --- |
| apps→plugins/packages；插件不互依赖 | 符合 | help独立插件；业务页通过admin-common契约接入 |
| packages无页面；页面进入plugins/pages | 符合 | 四个页面只在help插件，公共包只有导航与链接组件 |
| Vue3/TS strict/四件套/API命名 | 符合 | 显式目录、模型与XxxAPI映射，无any |
| UnoCSS/语义Token/响应式 | 符合 | UX目标映射局部阅读样式，支持375px至桌面与dark |
| 先规格后实现/不提前改current | 符合 | 获得实施授权后施工；现为validating，current保持未修改 |

没有阻塞性开放设计问题；实际文章/截图编写及发布功能核实在任务中逐项执行。
