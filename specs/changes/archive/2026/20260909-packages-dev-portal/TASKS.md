# 任务：Ingot 开发者中心

各阶段按依赖顺序执行；阶段完成不代表整个 change 验收完成。实施期间逐项勾选，不提前更新 current。

## 00：准备与基线

- [x] 用户确认本 change 后设为 approved，开工设为 implementing；阅读 REQUIREMENTS、DESIGN、API、CONFIGURATION、宪章与编码规范。
- [x] 核对已归档 themes workspace 的当前实现，记录工作区与现有检查基线，不覆盖用户改动。
- [x] 盘点全部环境声明／实际读取、bootstrap／header／Vite 公开配置，建立字段描述及输出映射；核对遗留 TENANT 与 header 接线。
- [x] 盘点全部公共 exports、全局组件、hooks／stores／模块、官方插件功能，建立文档映射清单及演示适用性；按 CONFIGURATION 明确已有能力，不静默缩减范围。
- [x] 验证 VitePress 稳定版与当前基线、SSR 和独立 demo 构建可共存，记录锁定依赖；需要改变已批准设计时先修订确认。

## 01：更名与文档网站基础

- [x] 将 apps/create-app 更名为 apps/dev-portal，包名 @ingot/dev-portal，替换旧包名引用与根筛选；保留规定的根命令兼容。
- [x] 配置 VitePress 默认主题扩展、中文导航与搜索、明暗、窄屏及创建页布局。
- [x] 建立单份正文页面映射、收集／watch、链接和资源重写、.generated 忽略规则；不迁移或复制 specs 为使用文档。
- [x] 接入 dev:portal、build:portal、preview:portal，验证根路径和子路径构建产物；常规业务 build:apps 排除门户。

## 02：共享生成引擎与本地契约

- [x] 提取共享 schema／defaults／类型、规范化、校验、render 和 write；提供 Web 可用的描述数据，不将 Node 模块导入浏览器。
- [x] 实现固定 workspace catalog 扫描、官方适配、ingotScaffold 元数据和手动导出名校验，不执行被发现的包。
- [x] 实现预览文件树／文本／二进制信息、输出摘要与接入步骤；预览不写入目标目录。
- [x] 实现受限本地 API：能力检测、catalog、preview、create，Host／Origin／session 校验、body 上限、中文字段错误。
- [x] 实现固定根路径检查、符号链接拒绝、排他创建、并发冲突与失败回滚，保证不覆盖其它产物。
- [x] 保留 App CLI 位置参数与交互，增加三类 JSON 配置和 dry-run，新增插件／主题 CLI；全部共用引擎。
- [x] 单测覆盖默认值、模式覆盖、空值、非法枚举、输入转义、版本错误、摘要失效、目录逃逸、符号链接、重复及并发创建、失败回滚和二进制一致性。

## 03：App 模板与向导

- [x] 实现 CONFIGURATION 中全部 env 分类、mode／自定义变量与生效值展示；基于实际 dotenv 解析验证值不失真，生成原始字符串类型和显式转换。
- [x] 实现基础／品牌／网络／存储／界面／顶栏／Vite／代理／图标配置，确保每个字段存在真实消费点。
- [x] 实现仓库插件与主题选择，生成依赖、真实类型解析、imports、plugins.ts、officialPlugins 和 CSS 的一致配置。
- [x] 生成被入口引用的 header 和类型化扩展文件，保留冻结约定插件；实现 Demo 裁剪、资源复制与有效 Docker／代理模板。
- [x] 完成 App 向导配置、预览、修改失效、生成反馈、后续步骤和文档链接。
- [x] 在隔离 fixture 验证默认、无插件、无 Demo、多 mode、自定义字段，以及 CLI／Web 相同输入输出一致。

## 04：插件和主题模板与向导

- [x] 插件模板实现标识／导出／canonical prefix、空骨架、Demo 和可选扩展；提供源码 exports、检查脚本、域命名及 ingotScaffold 元数据。
- [x] 插件自身和生成宿主均显式配置源码编译清单，验证 alias、glob、AutoImport、UnoCSS、Iconify 和 optimizeDeps。
- [x] 主题模板实现全部公开 Token 编辑、明暗独立覆盖、可选 Shell／parts；输出正式 dist 出口、声明、CSS／资源及 peer external。
- [x] 完成插件／主题向导及准确接入步骤；不修改现有 App、不安装或运行生成物。
- [x] 扩展动态插件依赖／注册一致性检查，保留官方插件与主题边界规则，增加正反例测试。
- [x] 隔离创建插件和主题，再生成选择二者的 App；执行类型检查、构建及模块图断言，验证未选项不入包。

## 05：完整手册与在线示例

- [x] 完成快速开始、App／auth 配置和定制、插件使用开发、主题使用开发、页面／路由／菜单／权限、网络／查询／加密、状态、顶栏、图标及工程部署指南。
- [x] 按公开能力清单补全所有框架组件 Props／事件／插槽／方法、hooks／stores／工具／配置类型参考；第三方集成明确说明差异和官方链接。
- [x] 补全官方四插件各模块功能与接入指南；不以标题页或 TODO 作为完成。
- [x] 实现独立 demo 入口、最小运行时上下文、固定模拟数据、iframe 明暗／尺寸同步和源码同源展示。
- [x] 为全部可独立运行的公开 UI 组件提供交互演示；其它能力提供模拟或接入示例及具体限制，不发真实业务请求。
- [x] 实现公开能力映射、页面锚点、示例映射及示例类型检查；新增公开项未覆盖时使检查失败。
- [x] 更新 README、旧创建指南、包内引用与相关命令文档，确保单份正文和站内链接一致。

## 06：综合验证

- [x] 将门户构建、自身类型／单测、生成器测试、文档覆盖／链接和示例检查接入根 check，避免重复业务构建。
- [x] 完成 API 无效 JSON、媒体类型、body 大小、Origin／Host／session、静态模式无 API 等测试。
- [x] 自动化浏览器验证三个向导、表单错误、预览失效、成功／失败反馈及旧根命令入口。用例在 `apps/dev-portal/e2e`；运行 `pnpm test:portal-e2e`（需已安装 Playwright 浏览器）。
- [x] 验证根路径和子路径静态部署的搜索、导航、资源和演示；无 SSR 浏览器对象错误、本地 API 请求、真实业务请求。静态客户端不请求 `/__dev-portal/api`；`build:portal` 纳入根 `check`。
- [x] 检查桌面与窄屏、明暗下的文档／向导／iframe／弹层，验证示例操作和主题 Shell 行为。创建页与文档共用 sticky 顶栏；向导跟随站点明暗；E2E 含窄屏与外观开关。
- [x] 执行生成产物完整组合检查，以及 pnpm type-check、lint:check、test:unit、check:boundaries、check:examples、check:docs、build:admin 和根 check；记录既有失败及本次结果。用户已验收；本轮补充 `check:docs`、提取器单测通过。Playwright 浏览器未预装，未在本环境跑通 E2E。
- [x] 按 REQUIREMENTS 验收矩阵逐项验证，清理测试产物，确认未修改现有 App 行为；状态设为 validating。

## 07：验收与归档

- [x] 验收通过后新增 current/packages/dev-portal 页面行为规格；更新现有脚手架与主题创建入口行为，不复制本地 API 表格。
- [x] current README 记录变更 ID，并链接本次归档 API／DESIGN；保留旧规格的可追溯记录。
- [x] README 记录验证、完成日期和差异，状态改 completed，整体移至 archive/2026 并修正相对链接。
- [x] 再次检查文档链接；若取消则记录原因并以 cancelled 归档，禁止删除未完成 change。
