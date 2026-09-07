# 管理台 UI 基础设施规格

本文写已上线的共享壳层与组件行为。接口声明见归档 [API.md](../../../changes/archive/2026/20260904-packages-admin-ui-foundation/API.md)。业务页面如何接入见 [管理台 UI 体验](../../common/admin-ui-experience/spec.md)。详情抽屉标准见 [详情查看/编辑](../detail-edit-pattern/spec.md)。

## 概述

管理台使用语义化 Token 与 `layout.main`：白色顶栏、灰色画布/侧栏、白色工作面。内容滚动由页面原型明确所有者。`InSplitLayout` 与 `InTable` 提供成员页式双栏、紧凑表格、按需工具和原子操作收纳。不复制飞书商标或专有图标。

## 范围

### In Scope

- `@ingot/admin-core` 颜色、排版、间距、圆角、阴影、层级、动效与控件尺寸 Token，以及 Element Plus 单向映射
- `layout.main` 顶栏、侧栏、面包屑、内容沟槽与窄窗口 overlay
- `InPageFrame` / `InPageHeader` / `InContainer` / `InSplitLayout`
- `InTable`、`InTableActions`、`InTableColumnSetting`、`InPicker`
- `InAvatar`、`InCommonStatusTag`、`InAccountStatusTag`
- 加载、空态、禁用、焦点与减少动效

### Out of Scope

- 业务接口、权限码、路由 path、菜单数据或 canonical viewPath
- 新增全局组织/成员/角色语义搜索接口
- 把移动端做成完整业务操作端（小于 1024px 只保证框架可达）

## 用户场景

### 场景 1：使用统一框架

- **角色**：后台管理员
- **前置条件**：已登录，页面使用 `layout.main`
- **步骤**：浏览任意管理台页面
- **预期结果**：顶栏 56px 白底；侧栏与画布同为 `#f5f5f5`；工作面白色；全局顶栏、面包屑和页面头固定

### 场景 2：展开与收起侧栏

- **角色**：后台管理员
- **前置条件**：桌面宽度 ≥ 1024px
- **步骤**：滚动长菜单，点击底部「收起导航」，刷新后再打开其它页
- **预期结果**：展开 236px / 收起 52px；菜单独立滚动；底部控制固定且不随菜单移动；偏好可持久化

### 场景 3：使用双栏列表

- **角色**：组织或权限管理员
- **前置条件**：页面启用 `InSplitLayout` `left-collapsible`
- **步骤**：选择左树节点，折叠左栏，再在窄容器中打开
- **预期结果**：左栏默认 260px，可从分隔线收至 0；左右独立滚动；容器过窄时自动收起，不覆盖用户桌面展开偏好

### 场景 4：使用表格工具与更多菜单

- **角色**：后台管理员
- **前置条件**：列表使用 `InTable` + `InTableActions`
- **步骤**：执行行内详情、打开 `…`、按需隐藏列
- **预期结果**：无内置刷新；固定主操作直出；同组批量操作整组展开或整组进入 `…`；字段偏好只影响当前表格呈现

## 功能需求

### REQ-001：语义化设计 Token

系统 SHALL 在 `@ingot/admin-core` 提供语义 Token，并由 Ingot Token 单向映射 Element Plus 变量。业务页面不得新增与 Token 重复的硬编码品牌色。

**验收标准：**

- [x] 主色 `#3370ff`、主文字 `#1f2329`、次级文字 `#646a73`、页面背景 `#f5f5f5`、弱背景 `#f2f3f5`、边框 `#dee0e3`
- [x] 间距 4px 基线；控件圆角默认 6px
- [x] 明暗主题从同一语义集派生
- [x] 全局 Toast（`Message` / `useMessage`）最小 204×54，语义色描边浅底，正文主文字色

### REQ-002：中性顶栏与内容沟槽

系统 SHALL 使用 56px 白色顶栏；品牌主色只用于操作与状态。内容区使用 `--in-page-gutter`（12px）。

**验收标准：**

- [x] 顶栏 A/B/C/D 四区：品牌、一级入口、搜索、操作；没有入口时不占空白
- [x] 无版权时 contained 工作面贴视口底；页面滚动尽头保留底部沟槽
- [x] `bootstrapAdminApp` 既有 branding / settings 配置保持兼容

### REQ-003：可收起分组侧栏

系统 SHALL 提供 236px / 52px 侧栏；菜单视口与底部导航控制为 DOM 兄弟，只有菜单视口滚动。

**验收标准：**

- [x] 计入 8px 左沟槽后，主内容偏移 244px / 60px
- [x] 侧栏与画布同色，无常驻右边框
- [x] 菜单行 40px；展开/收起 300ms，遵守 `prefers-reduced-motion`
- [x] 收起态只显示一级图标；带子级分组不临时展开侧栏
- [x] 底部控制高 44px、距底 8px；展开文案「收起导航」，收起态提供「展开导航」可访问名称
- [x] 小于 1024px 使用独立 overlay（始终 236px，「关闭导航」），不覆盖桌面折叠偏好

### REQ-004：页面框架与页面头

系统 SHALL 用 `InPageFrame` 区分 page / contained 滚动；`InPageHeader` 固定在页面头。

**验收标准：**

- [x] page 模式只滚动 PageBody；contained 模式由内部表格/双栏承担数据滚动
- [x] 页面头主标题 16/24px、500；说明 14/22px、400
- [x] 列表和双栏默认全高白色工作面，不套外层圆角卡片

### REQ-005：可折叠双栏

系统 SHALL 让 `InSplitLayout` 固定 header/top，左栏默认 260px，可从分隔线折叠。

**验收标准：**

- [x] 根 `height: 100%; min-height: 0; overflow: hidden`；左右独立滚动
- [x] `v-model:left-open`、`left-collapsible`、`persistence-key` 可用
- [x] 折叠按钮提供「收起筛选 / 展开筛选」可访问名称
- [x] 容器不足以同时容纳 260px 左栏与最小右栏时自动收起，不覆盖用户桌面偏好

### REQ-006：表格、工具与操作收纳

系统 SHALL 让 `InTable` 只负责工具区布局与数据滚动；字段设置和业务操作为按需组件。

**验收标准：**

- [x] 不再内置刷新按钮；旧 `refresh` emit 仅兼容、无自动触发入口
- [x] `tools-start` / `tools-end`；旧 `#toolbar` 映射到 `tools-start`
- [x] compact 密度：表头 48px、数据行 44px
- [x] 表头默认 14px / `font-weight: 400` / `--in-table-header-text`
- [x] 勾选框 16×16；树列 `checkbox` / `headerCheckbox` 三态 on / off / disabled；`type: selection` 表头默认不显示，需显式 on
- [x] `InTableActions` toolbar：`overflow: never` 直出；相同 `overflowGroup` 整组展开或整组进入 `…`
- [x] row 变体：详情 + 至多一个高频动作 + `…`
- [x] `InTableColumnSetting` 依赖稳定 `tableId`；选择列和操作列默认不可隐藏
- [x] `InPicker` 用于工具栏单选，不替代表单 `InSelect`

### REQ-007：状态展示组件

系统 SHALL 提供统一头像与账号/通用状态标签，不改变枚举值和写操作语义。

**验收标准：**

- [x] `InAvatar` 默认 32px；无图时取姓名最后两个字
- [x] `InAccountStatusTag`：正常 / 已暂停 / 已锁定，依据 `enabled` 与 `locked`
- [x] `InCommonStatusTag` 只根据 `status` 判断

### REQ-008：共享壳层兼容

系统 SHALL 在扩展视觉与交互时保持页面注册、布局扫描和 App 组合契约不变。

**验收标准：**

- [x] `layout.main|simple|iframe|external` canonical 键不变
- [x] 现有公开属性、插槽和事件保持兼容或提供迁移说明
- [x] 页面注册与 App 约定仍见 [App 插件化与共享包](../app-plugins-shared-scaffold/spec.md)

## 非功能需求

- 颜色与动效走 Token；遵守 `prefers-reduced-motion`
- 纯图标控件具备 Tooltip 或可访问名称与 `focus-visible`
- 小于 1024px 保证导航与主操作可达，不作为完整操作端

## 依赖与约束

- 不新增后端接口；列显示偏好仅前端持久化
- `InTableActions` 不调用业务 API
- 业务页面接入规则见 [管理台 UI 体验](../../common/admin-ui-experience/spec.md)

## 验收标准

- [x] 主布局为白顶栏、灰画布侧栏、白工作面
- [x] 侧栏菜单滚动与底部「收起导航」分离
- [x] 双栏可折叠，表格无内置刷新，操作按组收纳
- [x] 布局扫描与公开组件契约兼容
