# 20260902-packages-admin-plugin-layering

> 状态：completed

## 协作模式

架构重构；需求和设计来自 2026-09-02 对话确认，不涉及新增后端接口。

## 前置条件

- 前置 change：[`20260902-packages-admin-feature-app-split`](../20260902-packages-admin-feature-app-split/)（已 `completed` 并归档）
- 用户于 2026-09-02 明确要求：以前置 change 当前工作树为基线直接实施本 change，验收一并延后。
- 本 change 不回改、替代或取消前置 change 的历史工件。

## 背景与动机

前置 change 将平台控制面、安全中心、组织管理和会员管理拆成四个可独立运行的业务 App，并让
`apps/admin`、`apps/target-project` 通过插件清单组合能力。进一步梳理后，四个业务域并不需要各自成为
可运行、可部署的应用；它们本质上是供管理台选择的业务插件。

项目需要明确区分三种职责：App 负责启动和部署，Plugin 负责完整业务能力，Package 负责无页面的
公共抽象。同时，`target-project` 与全插件 `admin` 的定位重复。日常开发应直接使用通用 `apps/admin`，
仅在需要独立 appCode、品牌、环境或部署流水线时使用 create-app。

## 目标

- 建立 `apps/`、`plugins/`、`packages/` 三层结构和单向依赖规则。
- 将 platform、security、org、member 从可运行 App 迁为不可独立运行的 workspace 源码插件。
- 以 `apps/admin` 作为唯一默认通用后台，默认注册全部官方插件并允许项目裁剪或扩展。
- 删除重复的 `apps/target-project`，将其插件示例迁入 `examples/admin-plugin`。
- 让 create-app 专注于创建需要独立运行和部署的新后台 App。
- 补齐开发模式、插件开发、App 开发、运行时和脚手架的完整使用文档。

## 范围

### In Scope

- 新增 workspace `plugins/*`，迁移四个官方业务插件及完整纵向切片。
- 清理四个插件的独立启动、构建、端口和部署能力。
- 收敛 `apps/admin` 为通用 composition root，新增集中式插件清单。
- 删除 `apps/target-project` 及其根脚本、Docker/CI 和文档引用。
- 新增不参与默认构建的 `examples/admin-plugin`，并保持示例可类型检查。
- 泛化 Vite 官方源码插件解析，增加源码插件配置和分层边界检查。
- 更新 create-app 默认插件、生成模板和使用提示。
- 重写根 README 和管理台开发文档体系。
- 更新 AGENTS、coding standards、CONSTITUTION 与 current specs 中的架构事实。

### Out of Scope

- 运行时远程插件、Module Federation 或微前端。
- 修改现有业务 API 的路径、请求/响应或鉴权。
- 修改后端菜单接口 wire shape 或改为前端静默过滤菜单。
- 拆分 `apps/auth` 和 `apps/create-app` 自身的页面。
- 建设可发布的官方插件 dist 或跨仓库插件市场。
- 新增自动创建 workspace 插件的脚手架命令。
- 重做迁移页面的产品交互和视觉设计。

## 输入来源

- 接口文档：无；沿用前置 change 完成后的接口契约，不创建 `API.md`
- 需求文档：2026-09-02 对话确认的三层架构、默认 admin 与文档要求
- 后端来源：无新增后端变更；菜单继续按登录应用/OAuth Client 配置返回

## 工件

- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)
- [分阶段任务](./phases/README.md)

## 风险与依赖

- 实施强依赖前置 change 已完成；在当前未完成工作树上提前移动目录会造成大量冲突和规格漂移。
- `@ingot/*-app` 改为 `@ingot/*-plugin` 是源码依赖的破坏性迁移，仓库内引用必须原子更新。
- 官方插件由 App 直接编译源码，Vite 和 TypeScript 都必须正确处理插件内部 `@/`、自动导入和组件类型。
- 删除 target-project 会同步影响 CI、Docker、根命令、脚手架测试和现有文档。
- admin 默认全插件；项目移除插件时还必须同步后端菜单配置，否则会显示 plugin-unavailable 诊断页。
- 文档成为该开发模式的主要入口，必须通过示例类型检查和链接检查降低失效风险。

## 相关链接

- 前置 change：[`20260902-packages-admin-feature-app-split`](../20260902-packages-admin-feature-app-split/)
- [当前 App 插件化规格](../../../../current/packages/app-plugins-shared-scaffold/spec.md)
- [项目宪章](../../../../CONSTITUTION.md)

## 完成记录

- 完成日期：2026-09-02
- 关联提交或 PR：
- 更新的 current capability：`packages/app-plugins-shared-scaffold`
- 与原设计的差异：前置 change 尚未验收时用户要求直接开工；admin 对官方插件使用 `*-plugin.d.ts` 类型垫片，避免宿主 vue-tsc 混用插件 `@/`。Phase 04 模块图产物断言与手工菜单/裁剪回归未单独勾完；用户于 2026-09-02 要求归档视为验收。
- 取消原因：
