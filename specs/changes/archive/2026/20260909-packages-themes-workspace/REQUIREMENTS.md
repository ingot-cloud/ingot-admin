# 需求：主题 workspace 分类

## 场景

1. 主题开发者在 `themes/<id>/` 新建独立主题包，workspace 能识别，统一命令可以构建和检查，无需逐个登记主题名称。
2. App 开发者通过包名导入一套主题及其 CSS，传入既有 `bootstrapAdminApp({ theme })`，重新构建后生效；未选择的主题不进入 App 模块图。
3. 后续脚手架开发者可按文档明确将生成文件写入 `themes/<id>/`；生成主题与为 App 启用主题是两个独立动作。

## ADDED

### REQ-A001：独立主题目录

- [x] 同一 workspace 增加 `themes/*`，目录内一个子目录对应一个主题包。
- [x] 提供 `themes/README.md`，说明命名、最小文件结构、依赖、命令与 App 接入。
- [x] 初期没有正式主题包时，相关工程命令正常成功；新增包后自动纳入。

### REQ-A002：工程流程与边界

- [x] 根构建、类型检查、单测、lint、文档检查覆盖主题；提供主题独立命令。
- [x] App 可以依赖主题；主题只依赖公共包及外部库，不依赖 App、业务插件或另一具体主题。
- [x] packages 与 plugins 不得依赖具体主题；共享主题能力提取到 packages。
- [x] 同时检查 manifest 与源码引用，覆盖包名、相对路径及绕过公开 exports 的导入。
- [x] 新增主题不用修改边界检查中的包名白名单。

### REQ-A003：未来脚手架产物约定

- [x] 文档约定目录 `themes/<id>/`、仓库内包名 `@ingot/theme-<id>`，id 为小写 kebab-case。
- [x] 最小产物包含主题声明、公开入口、CSS、构建与 TypeScript 配置及 README；自定义 Shell/parts 可选。
- [x] 创建主题不自动修改 App 依赖或启用配置；本次不新增创建命令或 Web 功能。

## MODIFIED

### REQ-M001：现行 REQ-001 的 workspace 主题位置

- [x] 仓库新增正式主题使用 themes；外部 npm 主题仍可消费，现有公开主题接口保持兼容。
- [x] 默认主题、Token 合并、明暗偏好、布局宿主与现有 App 配置不变。
- [x] `examples/admin-theme` 保留为不加入 workspace 的示例，更新其文档中的正式主题目录说明。

## 验收边界

本次是工程分类与规则修订，不新增业务页面。使用临时测试主题验证 workspace 发现、打包与 App 消费，不交付新的正式预设，也不提前更新 current。
