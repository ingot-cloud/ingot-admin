# 需求：移除全局路由 Tabs

> 相对 [管理台主题](../../../../current/packages/admin-theme/spec.md) 与设置开关的增量。页内 Tab 行为见 [UI 基础设施](../../../../current/packages/admin-ui-foundation/spec.md) REQ-004，本次不改。

## 场景与页面

### 场景 1：配置抽屉不再提供 Tabs

- **角色**：后台管理员
- **入口**：顶栏配置
- **步骤**：打开「配置」抽屉
- **预期结果**：可见主题模式、字体大小、面包屑、版权信息、搜索栏、水印；没有 Tabs 开关

### 场景 2：主布局不再渲染全局标签栏

- **角色**：后台管理员
- **前置条件**：使用 `layout.main` / 默认主题或示例主题
- **步骤**：在多个菜单页之间跳转
- **预期结果**：内容区上方没有已打开页面的标签栏；侧栏、面包屑、页内 Tab 仍按原设置工作

### 场景 3：新建后台没有 Tabs 环境变量

- **角色**：项目开发者
- **步骤**：查看 `apps/admin` 与 create-app 模板的 `.env` / `main.ts`
- **预期结果**：没有 `VITE_APP_SETTINGS_SHOW_TABS`，`bootstrapAdminApp` settings 不再接收 `showTabs`

## 验收标准

- [x] 配置抽屉没有 Tabs 开关
- [x] 默认 Shell 与示例 Horizon Shell 不提供 `#tabs`
- [x] `InTabs` 与 `useTabsStore` 已删除且不再导出
- [x] 页内 `InBizTabs` / `InPageFrame` `#tabs` 仍可用
- [x] admin 与 create-app 模板不再映射 Tabs 环境变量

## ADDED

无。

## MODIFIED

### REQ-M001：主题 REQ-003 → Shell 区域不再包含 tabs

**变更说明：** 主布局 Shell 区域改为 header、navigation、breadcrumb、content、footer。`parts` 不再包含 `tabs`。

**验收标准：**

- [x] `InAdminThemePartName` / `InAdminThemeShellSlotName` 不含 `"tabs"`
- [x] `InAdminThemeLayout` 不再注入标签栏部件
- [x] 主题开发文档与 `packages/admin-theme` current spec 同步

## REMOVED

### REQ-R001：全局路由 Tab（`showTabs` / `InTabs`）

**移除原因：** 与侧栏导航重复，产品上无意义；默认已关闭，开关与主题协议增加噪音。
