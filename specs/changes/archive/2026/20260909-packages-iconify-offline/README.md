# 20260909-packages-iconify-offline

> 状态：completed

## 协作模式

纯前端公共能力。用户确认内网不能运行时拉取 Iconify；开发创建菜单时需粘贴任意 Iconify 名并预览，仅生产走离线包。

## 背景与动机

`InIcon` 一律 `@iconify/vue/offline` 后，菜单编辑粘贴 `mynaui:config` 等未打进本地的名字时预览空白。开发环境应走 Iconify API 以便预览；生产仍须零外网。开发时成功显示过的图标要把 SVG 记下来，构建打进产物。

## 目标

- **dev**：`@iconify/vue` 在线组件，菜单 icon 输入旁可预览任意 `prefix:name`
- **production**：`@iconify/vue/offline` + `virtual:iconify-offline`，不请求 Iconify API
- 开发会话里渲染成功的图标写入 `iconify-offline.used.json`（SVG 正文），构建并入离线包
- 全屏按钮使用 `bi:fullscreen` / `bi:fullscreen-exit`

## 范围

### In Scope

- 按 Vite command 切换 Icon 实现（serve 在线 / build 离线）
- 源码扫描 + `extra` + `collections` + `used.json`
- dev 中间件收集已预览图标；used.json 提交进 Git
- `unplugin-icons` 关闭 `autoInstall`
- 工程文档

### Out of Scope

- 开发时自动 `pnpm add @iconify-json/*`
- 自动改 `vite.config.ts`
- 菜单选择器浏览全部 Iconify 集合
- 生产回退 Iconify API
- 不提前更新 `specs/current/`

## 输入来源

- 2026-09-09 用户对话：全屏图标、内网打包、菜单粘贴预览
- 未消费 inbox；无后端对接，不创建 API.md

## 工件

- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

- 未在本机打开过的菜单图标不会进入 used.json，CI 构建会缺图；须提交该文件
- 整包打入大会显著增大产物，默认只整包较小的 `ep`

## 相关链接

- 顶栏五区：`20260908-packages-app-header`
- 顶栏搜索：`20260909-packages-app-header-search`
- [已上线 Iconify 规格](../../../../current/packages/iconify-offline/spec.md)

## 完成记录

- 完成日期：2026-09-09
- 关联提交或 PR：ebb1292、a825aac、1e6a918、4dc018f
- 更新的 current capability：`packages/iconify-offline`
- 与原设计的差异：开发成功渲染后写入 used.json，而不是扫描全部源码名去改 Vite 配置。
- 取消原因：
