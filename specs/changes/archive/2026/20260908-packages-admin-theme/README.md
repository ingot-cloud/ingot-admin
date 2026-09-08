# 20260908-packages-admin-theme

> 状态：completed

## 协作模式

纯前端公共能力变更，以用户对话需求为输入。用户已确认开工。

## 背景与动机

当前 admin-core 已集中管理 `--in-*` Token、Element Plus 映射及暗色样式，但应用无法通过稳定协议选择可复用主题。项目虽然可以注册自定义 layout，却不能以同名注册覆盖核心 `layout.main`。需要让不同项目通过安装主题并在 admin 显式配置，统一定制视觉、主布局编排和展示部件。

## 目标与范围

- 新增独立于业务插件的主题协议，支持本地包和 npm 包，在构建期引入并在启动时选择。
- 支持配色、字体、间距、圆角、阴影、尺寸、动效，以及主布局编排和展示部件替换。
- 内置现有视觉主题一套，包含浅色和深色模式；提供独立自定义主题示例。
- 覆盖 apps/admin 和 create-app 生成的后台，兼容现有路由布局注册及 shellSlots。
- 不包含在线上传、远程主题加载、终端用户切换主题、主题市场、业务页面模板替换、独立登录应用 apps/auth。

## 输入来源

- 2026-09-08 本任务用户对话：规划按协议开发、安装并在 admin 明确使用的主题插件。
- 已确认选择：开发时安装并配置、现有主题一套、允许布局编排与展示部件替换、仅后台及新建后台。
- 后续澄清：保留上层 layout 注册；主题外壳通过核心布局宿主使用，不覆盖项目独立布局。
- 未消费 inbox 文件；无后端接口变更，不创建 API.md。前端公开协议集中在 DESIGN.md。

## 工件

- [需求与验收](./REQUIREMENTS.md)
- [设计与前端公开协议](./DESIGN.md)
- [实施任务](./TASKS.md)

## 风险与依赖

- 主布局现有缓存、滚动恢复、窄屏导航行为必须在拆分后保留。
- 现有 Token 测试包含固定视觉值，需要区分默认主题回归与跨主题协议测试。
- 外部主题包不能依赖消费端扫描源码生成 UnoCSS，需验证独立打包消费。
- App shellSlots、自定义布局、弹出层和暗色消费者需要一起做兼容验证。

## 相关规格

- [工作流](../../../../README.md)
- [宪章](../../../../CONSTITUTION.md)
- [已上线管理台主题](../../../../current/packages/admin-theme/spec.md)
- [UI 基础](../../../../current/packages/admin-ui-foundation/spec.md)
- [后台体验](../../../../current/common/admin-ui-experience/spec.md)
- [App、插件与共享包](../../../../current/packages/app-plugins-shared-scaffold/spec.md)

## 完成记录

- 完成日期：2026-09-08
- 关联提交或 PR：64915f7
- 更新的 current capability：`packages/admin-theme`；并更新 `packages/admin-ui-foundation`、`packages/app-plugins-shared-scaffold`
- 与原设计的差异：主题不作为 `InAdminPlugin`、不覆盖 layout registry（与终版 DESIGN 一致）。App `shellSlots` 原先仅类型未消费，现已接入 header / navigation parts。Editor 暗色判断改为读取 `isDark.value`。完整视觉矩阵与生产构建以用户试用示例主题通过为准。
- 取消原因：
