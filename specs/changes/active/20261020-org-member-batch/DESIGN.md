# 设计：成员批量变更部门与导入导出页

## 技术方案

成员页继续用现有工具栏顺序。变更部门用 `MemberBatchDepartmentDialog` 替换抽屉：复用部门树、搜索、拖曳与主部门标记，但不预填原任职，未选时右栏不出现「已选」头。确认层用第二层 `InDialog`，自定义成员/部门标签。任职仍逐人 `TenantMemberDepartmentsAPI`。

导入导出改为隐藏路由页 `plugins/org/src/pages/iam/members/workbook/IndexPage.vue`，由 glob 注册为 `org/iam/members/workbook`，不新增菜单。工具栏在具备 create 或 export 时显示并 `router.push`。页头 `InPageHeader` `showBack`，步骤区 `InFormContent` 设 `--in-form-content-max-width: 824px`。颜色和圆角走主题 Token。

## 对接映射

| 接口（见 API.md） | 前端 | 说明 |
|-------------------|------|------|
| `PUT .../members/{id}/departments` | `directory.ts` `TenantMemberDepartmentsAPI`；`MemberBatchDepartmentDialog` | 确认后逐人 |
| `GET/POST .../workbook/*` | `directory.ts` `TenantMemberWorkbook*`；`workbook/IndexPage.vue` | 模板、导出、导入、历史、文件 |

## 数据模型

admin-common 增加 `MemberWorkbookKind`、`MemberWorkbookMode`、`MemberWorkbookArtifact`、`MemberWorkbookTask`、`MemberWorkbookFile`、`MemberWorkbookHistoryItem`、`MemberWorkbookExportInput`。

## 组件与页面影响

- 替换 `MemberBatchDepartmentDrawer.vue` 为对话框；`MemberTab.vue` 改引用
- `MemberExportDrawer.vue` 成员页不再打开，文件可保留
- 新增 `workbook/IndexPage.vue`、同对话框内的导出范围选择、历史与结果对话框。部分成员可勾选部门，提交前展开为该部门及其下级的成员 ID。导出提交即返回，不在页内轮询下载，提示「前往我的下载」，见 [20261021-common-download-center](../../archive/2026/20261021-common-download-center/DESIGN.md)
- `memberTable.ts` 导入按钮权限改为 create 或 export
- `DeptTab` 批量导入导出保持即将开放
- 单人 `MemberDepartmentField` 不改预填行为

尺寸按飞书实测：选择框 894×732、分栏 846×522、确认 420、页头高 53 左右 20 上下 12、分段高 32、步骤卡浅底无圆角、拖拽区高 210 虚线圆角 5、按钮 80×32 圆角 6。

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| 规格驱动 | ✅ | 只读本 change |
| 官方插件不互依 | ✅ | 只改 org 插件与 admin-common 模型 |
| 整页配置表单 | ✅ | 步骤区用 InFormContent |
| 时间契约 | ✅ | 任务时间走共享格式化 |
| 编码规范 | ✅ | script setup、无 any、原子类 |

## 备选方案

继续用抽屉铺 JSON 表：与实测不符，否决。
