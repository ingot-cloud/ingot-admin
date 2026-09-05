# 20260904-common-admin-ui-rollout

> 状态：draft

## 协作模式

一人全栈。本 change 为跨 `platform`、`org`、`member`、`security` 四个官方业务插件的前端页面迁移，不新增或修改后端接口。

## 背景与动机

关联 change `20260904-packages-admin-ui-foundation` 将在 `@ingot/admin-core` 建立新的管理台视觉和交互基础。第二轮人工视觉复核已补充固定页面头、contained 数据滚动、可折叠双栏、行内更多菜单和字段显示设置契约；2026-09-05 又新增 Phase 07，专项补强全局左侧导航及固定底部控制。现有 25 个业务页面入口仍包含不同的筛选布局、工具栏、表格密度、局部 Tab、双栏结构、抽屉和状态反馈，若不统一迁移，基础组件更新后仍会产生明显的页面差异。

本 change 在共享基础稳定后，按照“试点 → platform/org → member/security → 全量回归”的顺序迁移业务页面。迁移只改变布局和交互呈现，不改变现有接口、权限、路由、菜单或业务约束。

## 目标

- 将四个官方插件中的现有业务页面映射到统一页面模板。
- 保留全部已上线业务行为、权限控制、查询条件、分页和写操作语义。
- 统一标题、说明、筛选、操作区、表格、双栏、设置页、局部 Tab、抽屉和弹窗。
- 按页面原型明确滚动所有者，保证页面头、筛选工具栏、表头和分页按设计固定。
- 统一行内“详情 + 至多一个高频动作 + …”、工具栏“固定操作 + 原子折叠组”和字段显示设置的页面接入方式。
- 消除业务页面新增的基础色、固定间距和通用组件外观硬编码。
- 建立跨页面视觉回归与关键业务交互回归清单。

## 范围

### In Scope

- `plugins/platform/src/pages/` 下 13 个 `IndexPage.vue` 页面及其私有组件。
- `plugins/org/src/pages/` 下 5 个 `IndexPage.vue` 页面及其私有组件。
- `plugins/member/src/pages/` 下 3 个 `IndexPage.vue` 页面及其私有组件。
- `plugins/security/src/pages/` 下 4 个 `IndexPage.vue` 页面及其私有组件。
- 页面级布局、文案层级、筛选区、表格、页内 Tab、抽屉、弹窗和状态反馈迁移。
- `InPageFrame` page/contained 模式、`InTableActions`、可折叠 `InFilterContainer` 和 `InColumnSetting` 的业务页面接入。
- 试点页面和全量页面的截图基线、键盘检查及关键行为回归。
- 对已触碰页面中与新共享组件冲突的局部样式进行清理。

### Out of Scope

- 修改业务接口、权限码、路由 path、菜单配置或 canonical viewPath。
- 重写 TanStack Query、分页、缓存失效或表单提交业务逻辑。
- 新增 Dashboard 数据指标或报表接口。
- 新增全局组织、成员、角色语义搜索。
- 将官方插件互相依赖或把业务页面移动回 `apps/admin`。
- 本 change 之外的新功能、字段、批量操作或产品流程调整。
- 复制飞书品牌资产、营销插画或专有图标。

## 输入来源

- 接口文档：无新增接口；现有接口以各 capability 已归档 change 为准。
- 需求文档：2026-09-04 用户对话中的后台整体 UI、布局和交互整改要求。
- 调研来源：用户授权登录后的飞书管理后台只读采样；现有 25 个业务页面源码盘点。
- 后端来源：无。

## 工件

- [接口](./API.md)
- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)
- [分阶段任务](./phases/README.md)

## 风险与依赖

- 强依赖 `20260904-packages-admin-ui-foundation` Phase 07 完成“全局左侧导航”专项验收，并连同 Phase 06 的成员工作区契约一起冻结；依赖未通过用户视觉验收时本 change 不得进入 `implementing`。
- 25 个页面业务复杂度差异较大，必须先做代表性试点并由用户确认视觉方向。
- 安全域页面包含懒挂载 Tab、权限控制、危险操作和独立保存逻辑，视觉迁移不得改变请求时机。
- 表格滚动所有权变化可能影响固定列、分页和左右双栏高度计算。
- 页面不得通过重新给根容器增加 `overflow: auto` 绕过 foundation 的 page/contained 契约。
- 当前本地完整视觉验收依赖登录服务和后端 API 可用。

## 相关链接

- [依赖的 UI 基础设施 change](../20260904-packages-admin-ui-foundation/)
- [已上线 App 插件化与共享包规格](../../../current/packages/app-plugins-shared-scaffold/spec.md)
- [访问防护 current](../../../current/security/access-protection/spec.md)
- [账号保护 current](../../../current/security/account-protection/spec.md)
- [会话管理 current](../../../current/security/session-management/spec.md)

## 完成记录

- 完成日期：
- 关联提交或 PR：
- 更新的 current capability：`common/admin-ui-experience`（验收完成后新建）以及发生行为变化的既有 capability
- 与原设计的差异：
- 取消原因：
