# 20260909-packages-app-header-search

> 状态：implementing

## 协作模式

纯前端公共能力变更。依据已确认的「顶栏菜单搜索（本地路由第一版）」计划生成 spec；用户已确认开工，进入 implementing。

## 背景与动机

默认顶栏搜索仍是占位输入，没有结果、历史或跳转。第一版不接后端全局搜索服务，改为检索与侧栏同一份已按权限过滤的菜单，并在本地保存搜索历史。

## 目标

聚焦或点击顶栏搜索框时弹出面板：空关键词展示可清空的本地历史，有关键词则按菜单名匹配叶子并跳转。紧凑顶栏复用同一套输入与面板。

## 范围

### In Scope

- 以 `useRouterStore().getMenus` 为唯一数据源，叶子扁平化后按名称（及祖先标题）过滤。
- 选中结果 `router.push`，并把当前关键词写入按用户隔离的 localStorage 历史。
- 宽屏聚焦弹出面板；紧凑模式仍由现有图标入口打开浮层，浮层内同一实例。
- 键盘 ↑↓ / Enter、Escape / 点外部关闭。
- 文档与自动化测试。

### Out of Scope

- 后端搜索接口、全量 `router.getRoutes()`、公共 403/404/init 等 `hideMenu` 路由。
- 高级搜索、常用列表及 `header.search` 可配置常用项。
- 全局快捷键（如 ⌘+Shift+F）。
- 修改正在施工的 `20260908-packages-app-header` 范围；不提前更新 `specs/current/`。
- 自定义 `header.search.component` 整区替换后的默认面板绑定。

## 输入来源

- 2026-09-09 用户对话、参考图及已确认计划。
- 未消费 inbox；无后端对接，不创建 API.md。

## 工件

- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

- 依赖现有动态菜单已按权限裁剪并剔除 `hideMenu`；搜索结果与侧栏一致。
- 历史按用户 phone/email 隔离；无标识时落入匿名桶。
- 面板需 Teleport 到 body，避免 shell `overflow: hidden` 裁切。

## 相关链接

- [顶栏 APP 配置](../../../../docs/app-header.md)
- [20260908-packages-app-header](../20260908-packages-app-header/README.md)
- [变更流程](../../../README.md)

## 完成记录

- 完成日期：待验收
- 关联提交或 PR：待填写
- 更新的 current capability：待验收后更新
- 与原设计的差异：无
- 取消原因：不适用
