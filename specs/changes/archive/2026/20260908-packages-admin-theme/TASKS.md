# 任务：可扩展管理台主题

## 准备

- [x] 获得用户对本 change 的明确确认，状态改为 approved；开工时改为 implementing。
- [x] 阅读本 change 的 REQUIREMENTS.md、DESIGN.md，以及宪章和 in-coding-standards；本次无后端 API.md。
- [x] 核对现有主题、主布局、暗色消费者及脚手架基线；记录与设计冲突并先更新 spec 获取确认。

## 协议与视觉基础

- [x] 新增 theme 模块，定义并导出 InAdminTheme、InThemeTokens、defineAdminTheme 和 defaultAdminTheme。
- [x] 整理现有浅深色 Token 与兼容别名，抽取默认主题，保留 style.css 入口与默认外观。
- [x] 实现主题解析、缺省覆盖、ID/协议版本校验、挂载前根样式应用和主题作用域。
- [x] InAdminAppOptions 增加 theme，bootstrap 接入默认回退；实现公开 useAdminTheme，统一现有暗色消费者。
- [x] 检查并替换阻碍主题生效的固定视觉值，保持 Element Plus 单向映射和弹层继承。

## 布局协议

- [x] 从 layout.main 抽取核心宿主与内容组件，公开 InAdminThemeLayout，保留路由键和现有 registry 冲突规则。
- [x] 将默认排布抽为默认 Shell，提供六个区域插槽及五类 parts 替换入口。
- [x] 公开 useAdminShell 和必要复用部件，复用菜单权限、导航状态、品牌与设置数据源。
- [x] 接入 KeepAlive、滚动恢复、窄屏控制和内容容器约定；保留 shellSlots 的传递与显示。
- [x] 验证项目独立布局不被自动替换，并提供主动组合主题宿主的示例。

## 应用、示例与文档

- [x] admin 显式选择默认主题；更新 create-app 共用模板及生成测试。
- [x] 创建 examples/admin-theme 独立示例包，展示 Token 覆盖、顶栏替换、区域重排及浅深色适配。
- [x] 配置主题包编译产物、类型、CSS/资源导出和 peerDependencies，增加实际打包消费验证。
- [x] 编写主题开发与接入指南，补充 Token、布局上下文、插槽、明暗、独立 layout 和发布说明。
- [x] 按需更新示例、边界、文档检查入口，确保新增主题示例被验证。

## 验证

- [x] 完成主题协议、默认主题、样式应用、模式初始化相关单元测试。
- [x] 完成宿主组合、parts、shellSlots、设置和自定义布局兼容测试。
- [x] 回归缓存页面、滚动恢复、菜单权限和窄屏导航。
- [x] 检查默认/示例主题 × 浅色/深色 × 桌面/窄屏，以及 Teleport 弹层、表单、双栏页面。
- [x] 执行相关包单测、类型检查和只读 lint；通过 pnpm check:boundaries、pnpm check:examples、pnpm check:docs。
- [x] 执行 pnpm build:packages、admin 构建及 pnpm test:scaffold；通过独立主题打包消费测试。
- [x] 逐项满足 REQUIREMENTS.md 验收标准，记录验证结果，状态改为 validating。

## 收尾

- [x] 验收完成后新增 current/packages/admin-theme 能力规格，并更新相关 UI 基础与 App/脚手架规格的主题行为。
- [x] README 补充完成记录、关联提交和实际设计差异，current README 链接归档后的本 change。
- [x] 状态改为 completed，将整个 change 移入 changes/archive/2026/，不得删除历史工件。
