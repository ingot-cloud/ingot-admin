# 20260903-packages-app-convention-local-plugin

> 状态：completed

## 协作模式

一人全栈（无新后端接口）

## 背景与动机

App 层（含 `apps/admin`）缺少约定目录的本地插件。页面/布局已能 glob 进 registry，但组件和指令仍要手写注册；admin 还关掉了 hook AutoImport。开发者应只在约定目录放文件，即可使用 App 自定义组件/hook，同时继续使用 admin-core 的 `In*` 与 `usePaging` 等。重名必须失败，禁止静默覆盖。

## 目标

每个管理台 App 默认具备约定本地插件：`pages` / `layouts` / `components` / `hooks` / `directives` / `stores`。加文件不必改注册逻辑。组件走运行时 `app.component()`，hook/store 走 AutoImport。与 core / 官方插件重名时构建或启动失败。Store 与 core 共用同一 Pinia；`persist` 需显式声明。

## 范围

### In Scope

- `definePluginComponents` / `definePluginDirectives` 与 `defineAppLocalPlugin` glob 输入
- App Vite 约定守卫（`In*` / `El*`、保留 hook/store 导出名）
- `apps/admin` 约定目录与 `createAdminPlugins(appCode)`
- create-app 始终生成约定插件；原「本地插件骨架」只控制 Demo
- 文档与编码规范

### Out of Scope

- 官方插件 `domainGlobalComponents` 改为 glob
- App store 默认 persist
- 从 pages 自动生成菜单
- 运行时远程加载插件

## 输入来源

- 接口文档：无
- 需求文档：对话与已确认计划「App 层约定本地插件与自动注入」
- 后端来源：无

## 工件

- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

- unplugin 重名可能在启动前静默覆盖，必须有构建期检查
- `apps/admin` 增加本地插件后仍不得复制官方插件页面

## 相关链接

- [docs/app-development.md](../../../../../docs/app-development.md)
- [packages/admin-core/src/plugin/local.ts](../../../../../packages/admin-core/src/plugin/local.ts)

## 完成记录

- 完成日期：2026-09-03
- 关联提交或 PR：
- 更新的 current capability：`packages/app-plugins-shared-scaffold`
- 与原设计的差异：约定守卫由管理台 App 显式 `enforceAppConventions: true` 开启，不默认作用于 `apps/auth`
- 取消原因：
