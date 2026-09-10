# 20260909-packages-dev-portal

> 状态：completed

## 协作模式

前端工程与开发工具变更，需求来自对话。用户已确认开工（approved → implementing）。

## 背景与动机

`apps/create-app` 目前是本地 App 创建表单，仅配置编码、标题、端口、四个官方插件和 Demo。生成逻辑与 CLI 共用，但环境、运行时和构建配置覆盖不足，也没有插件与主题创建功能。框架说明分散在 docs、包内 README 和 examples，缺少统一搜索、完整公开能力参考和组件演示。

## 目标与范围

- 更名为 `apps/dev-portal` / `@ingot/dev-portal`，网站名「Ingot 开发者中心」。
- 真正使用 VitePress 默认主题扩展，交付可静态部署的中文文档、搜索、公开能力参考和组件在线演示。
- 提供 App、源码业务插件、管理台主题三个创建向导；完整环境变量编辑、常用配置表单化、复杂配置生成类型化扩展文件。
- 保持 CLI 与 Web 共用生成引擎，本地直接写入当前仓库；新插件和主题不自动修改现有 App。
- 完成自定义插件／主题到新 App 的生成、构建、类型、样式和边界检查闭环。

### 不包含

- 在线模板压缩包下载、远程插件市场、运行时远程加载、独立跨仓库项目生成。
- 现有 App 自动改写、自动安装依赖、自动执行生成后的命令。
- auth 模板生成、auth 主题协议、修改现有管理台或 auth 的业务行为。
- 将任意函数／Vue 组件做成可视化编辑器，或逐个解释内部私有函数。
- 自动部署网站、购买域名或引入业务后端接口。

## 输入来源与已确认决策

- 需求文档：本次对话的五项需求与已确认计划；用户选择 `dev-portal`、可部署文档＋本地生成、结构化配置＋扩展示例、全部公开能力＋在线演示、只生成并提供接入步骤。
- inbox：无本次投递，不移动或清空其它内容。
- API.md：本 change 自行定义的本地开发工具契约，不是后端服务副本，不使用业务 R<T>。
- 前置基础：`20260909-packages-themes-workspace` 已于 2026-09-09 completed 并归档；不重复实施目录架构修订。

## 工件

- [需求与验收](./REQUIREMENTS.md)
- [技术设计](./DESIGN.md)
- [本地 API 与 CLI 契约](./API.md)
- [配置覆盖与默认值](./CONFIGURATION.md)
- [分阶段任务](./TASKS.md)

## 风险与依赖

- VitePress 需与当前 Vue、Vite、Node、pnpm 基线共存；不为门户升级业务应用依赖基线。
- admin-core 有样式、浏览器运行时及虚拟模块依赖，组件演示须与文档页面隔离，不能在 VitePress SSR 中直接启动管理台。
- 当前插件自动发现限于官方清单；自定义插件通过现有显式 `officialPlugins` 配置接入，生成和边界检查需一起覆盖。
- 当前模板中 env 声明、默认文件、实际读取不完全一致；必须核对消费链路，不能仅增加表单字段。
- 文档范围大，以公开能力覆盖清单和可运行示例验收，不以页面数量或目录占位验收。
- 前置主题变更记录过 org 既有单测失败；实施时重新核对基线，分别记录既有问题与本次回归，不直接认定仍然失败。

## 相关链接

- [工作流](../../../../README.md)
- [宪章](../../../../CONSTITUTION.md)
- [脚手架现行规格](../../../../current/packages/app-plugins-shared-scaffold/spec.md)
- [主题现行规格](../../../../current/packages/admin-theme/spec.md)
- [主题 workspace 已归档设计](../20260909-packages-themes-workspace/DESIGN.md)
- [现有创建工具指南](../../../../../docs/create-app.md)
- [编码规范](../../../../../.agents/skills/in-coding-standards/SKILL.md)

## 完成记录

- 完成日期：2026-09-10
- 关联提交或 PR：abfe503
- 更新的 current capability：packages/dev-portal；同步 app-plugins-shared-scaffold、admin-theme 创建入口
- 与原设计的差异：创建页与文档页共用 VitePress 默认布局（sticky 顶栏／侧栏），不再使用独立 CreateLayout；组件／模块／插件参考改为构建时从源码提取。生成 Markdown 除 `DemoFrame` 外不输出 HTML 标签，以免 VitePress 把参考页当 Vue SFC 解析失败
- 取消原因：不适用
- 验证结果：
  - `node --test apps/dev-portal/scripts/extract-api.test.mjs` 通过
  - `pnpm check:docs` 通过（覆盖清单锚点对照生成参考）
  - 组件参考从源码提取 Props／`defineModel`／事件／插槽／公开方法／关联类型；模块参考含 JSDoc、签名与 interface 字段
  - 创建页 sticky 顶栏、明暗与默认文档布局已人工核对
  - Playwright 用例位于 `apps/dev-portal/e2e`；本环境未安装浏览器，需 `pnpm exec playwright install` 后运行 `pnpm test:portal-e2e`
  - 未把测试生成的 App／插件／主题写入正式目录
