# 20260908-packages-remove-global-route-tabs

> 状态：validating

## 协作模式

纯前端公共能力变更。用户已确认拆除清单并要求开工。

## 背景与动机

主题布局中的全局路由标签栏（`showTabs` / `InTabs`）是访问过页面的 tags-view，与侧栏菜单重复，默认已关闭。配置抽屉里的 Tabs 开关、环境变量和主题 `parts.tabs` 增加维护成本，没有实际产品价值。

## 目标

彻底移除全局路由 Tabs：配置开关、环境变量、运行时设置、主题插槽/部件、`InTabs` 组件与 `useTabsStore` 一并删除。页内 `InBizTabs` 与 `InPageFrame` `#tabs` 保持不变。

## 范围

### In Scope

- 配置抽屉 Tabs 开关
- `VITE_APP_SETTINGS_SHOW_TABS`、`settings.showTabs`、脚手架模板
- 主题 Shell `#tabs`、`parts.tabs`、`useAdminShell().showTabs`
- `InTabs`、`useTabsStore`、路由 `meta.isAffix`
- 仅服务全局 Tab 的 `--in-tabs-height` / `--in-tabs-font-size` / `--in-tabs-border-color`

### Out of Scope

- `InBizTabs` / `InBizTabsHeader` / `InBizTabPanel`
- `InPageFrame` / `InPageHeader` 的页内 `#tabs`
- `--in-biz-tabs-*` 与 `--in-motion-*-tabs-ink`
- 页面 KeepAlive、滚动恢复、`useRefreshPage`

## 输入来源

- 2026-09-08 用户对话：整理并拆除主题布局 `showTabs` 及相关组件、开关、环境变量
- 未消费 inbox；无后端接口，不创建 API.md

## 工件

- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

- 公开 API 收缩：已发布的 `InTabs`、`settings.showTabs`、`parts.tabs`、`useTabsStore` 将不存在
- 本地 `app.state` / `tabs` 持久化字段会残留，停止读取即可
- 自定义主题若声明 `parts.tabs` 或 Shell `#tabs`，升级后类型会报错

## 相关链接

- [已上线管理台主题](../../../current/packages/admin-theme/spec.md)
- [UI 基础](../../../current/packages/admin-ui-foundation/spec.md)

## 完成记录

- 完成日期：
- 关联提交或 PR：
- 更新的 current capability：
- 与原设计的差异：
- 取消原因：
