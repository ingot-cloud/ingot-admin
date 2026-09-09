# 设计：主题 workspace 分类

## 目录与职责

在 `pnpm-workspace.yaml` 增加 `themes/*`，保持单一 workspace 和 lockfile。新增 `themes/README.md`，不创建空壳 package.json 或正式视觉预设。

| 分类     | 职责                              | 允许的仓库依赖            |
| -------- | --------------------------------- | ------------------------- |
| apps     | 启动、组装、部署                  | plugins、themes、packages |
| plugins  | 业务页面与 API                    | packages                  |
| themes   | 视觉 Token、Shell、展示部件与资源 | packages                  |
| packages | 公共基础能力                      | 其它 packages，保持无环   |

主题不是 InAdminPlugin，不注册路由、权限、业务菜单或服务。主题消费 admin-core 公开接口，核心不反向引用任何具体主题。主题之间的公共能力进入 packages。

## 主题包与公开接口

后续生成位置固定为 `themes/<id>/`，仓库包名 `@ingot/theme-<id>`。最小结构为 `package.json`、`src/index.ts`、`src/theme.ts`、`src/style.css`、`vite.config.ts`、`tsconfig.json`、`README.md`；Shell 和 parts 按需增加。后续生成器需拒绝目录逃逸与覆盖，但本次不实现生成器或创建模板目录。

- 复用 `InAdminTheme`、`defineAdminTheme`、`bootstrapAdminApp`，不新增或修改运行时公开类型。
- 包导出 `.` 与 `./style.css`；正式包导出编译后的 JS、声明和 CSS，CSS 纳入 sideEffects，发布资源随包交付。
- Vue 与 admin-core 为 peerDependencies，打包 external；本地构建所需依赖显式声明，不打包第二份运行时。
- UnoCSS 若被主题使用，由主题构建生成 CSS，消费端不扫描主题源码。
- 禁止 `@/`、core 内部路径和跨包源码引用；CSS 使用主题 ID 作用域，沿用现有 Token 规则。
- 默认主题、基线 Token、默认 Shell、布局宿主、明暗机制继续留在 admin-core。
- App 显式增加主题 workspace 依赖、引入主题和 CSS，再配置 theme；不增加主题总注册表或全量导入。

## 工程命令与检查

- 增加 `build:themes`、`type-check:themes`、`test:themes`、`clean:themes`，动态筛选 `./themes/*`；空目录成功退出。主题包约定提供 build、type-check、test:unit、clean；无测试时 test:unit 可正常通过。
- 根 `build` 顺序为 packages → themes → apps；`build:admin` 同样先构建 packages 和 themes；`build:login` 保持现有流程。
- 根 `check` 在类型检查前构建 themes，根 type-check 与 test:unit 纳入主题，clean 保留既有全 workspace 行为。主题数量增加不要求修改根命令。
- 本期构建全部 workspace 主题以验证官方主题集合，App 打包仍仅导入其选择的主题。主题改动可执行单包 build，再由 Vite 开发服务消费产物；本期不增加统一 watch 编排。
- 检查 ESLint 的实际覆盖范围，保证主题 TS/Vue 可被根 lint 检查；主题使用包内 tsconfig，不依赖逐包添加根 TS references 才能被检查。
- 文档检查增加 themes 目录。保留独立示例检查，不把 examples/admin-theme 加入 workspace。

扩展 `scripts/check-boundaries.mjs`：动态发现四类目录中的 manifest，通过包名和解析后的相对路径识别归属。为新增规则覆盖 dependencies、devDependencies、peerDependencies、optionalDependencies，以及静态 import、side-effect import、export-from 和字面量动态 import。拒绝非法层间依赖、跨主题依赖和主题绕过公共包 exports 的引用；保留原有插件隔离及 manifest 对齐检查。检查逻辑提取为可对临时仓库运行的函数，避免测试修改真实工作区。

## 验证设计

- 临时 fixture 覆盖：空 themes、单主题、多个主题自动发现；合法 apps → themes → packages。
- 反例分别验证 themes → apps/plugins/themes、packages/plugins → themes；manifest、包名导入、相对导入、side-effect import、core 内部路径均应报清晰错误。
- 在隔离临时 workspace 中构建最小主题并由最小 App 消费产物，验证 JS、声明、CSS、资源和 peer external；第二个未选择主题不进入 App 模块图。
- 测试 fixture 留在测试资源目录，生成文件放临时目录，结束清理；不得添加正式预设或修改真实 admin 的主题配置。
- 执行现有主题回归测试、独立示例验证、admin 构建和根检查，确认默认行为兼容。

## 文档与宪章符合性

本 change 是独立的目录架构修订提案，不附带主题 UI 或脚手架产品功能。批准后可按本设计实施 themes 这一明确例外；验收归档后更新宪章第 1、2 条，把主题从“跨 App 复用必须进入 packages”中明确分出，并同步四类目录及依赖方向。其它跨 App/插件公共逻辑仍进入 packages。

同步 AGENTS.md、docs/development-model.md、主题开发文档、根 README、示例说明，以及 in-coding-standards 中相关目录与跨 App 规则，避免继续要求具体主题进入 packages。规则文档的正式更新安排在验收收尾，与宪章保持一致。

| 原则                                 | 符合性                                                 |
| ------------------------------------ | ------------------------------------------------------ |
| 当前三层目录、共享能力进入 packages  | 本提案明确修订，须随本 change 批准；不是声称符合旧规则 |
| 无业务页面的主题、公开 API、依赖无环 | 保持，并增加自动检查                                   |
| Vue/TypeScript、pnpm、UnoCSS         | 保持                                                   |
| 先规格后实施、current 验收后更新     | 遵循；已验收归档                                       |

无后端接口、路由或数据迁移。现行 packages/admin-theme 的验收场景保持，收尾只补充主题安装来源与目录约定；工程细节保留在 docs。

## 已选默认与替代方案

采用独立 themes 分类；不继续把新增主题混放 packages，不迁移默认主题，不复制现有示例为正式主题。本期为未来脚手架确定输出契约，CLI/Web、模板生成与启用交互另立 change。
