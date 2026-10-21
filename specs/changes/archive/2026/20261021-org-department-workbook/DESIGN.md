# 设计：部门批量导入导出页

## 技术方案

导入导出为隐藏路由页 `plugins/org/src/pages/iam/departments/workbook/IndexPage.vue`，由 glob 注册为 `org/iam/departments/workbook`。`plugin.ts` 增加与成员工作簿同构的隐藏目录。工具栏在具备 create 或 export 时显示并 `router.push`。页头 `InPageHeader` `showBack`，步骤区 `InFormContent` 设 `--in-form-content-max-width: 824px`。

## 对接映射

| 接口 | 前端 | 说明 |
|------|------|------|
| `GET/POST .../departments/workbook/*` | `directory.ts` `TenantDepartmentWorkbook*` | 模板、导出、导入、历史、文件 |
| `GET .../departments?purpose=MANAGED_DEPARTMENT` | 范围树 | 部分部门勾选 |

## 数据模型

admin-common 增加 `IamAction.TENANT_DEPARTMENT_EXPORT` 与 `DepartmentWorkbookExportInput`。任务、文件、模式复用成员工作簿类型。

## 组件与页面影响

- 新增 `workbook/IndexPage.vue`、`DeptExportScopePicker.vue`、`pollWorkbook.ts`、`workbookFile.ts`
- `deptTable.ts` 增加路径与标题常量；无创建且无导出时不渲染按钮
- `DeptTab.vue` 点击跳转，去掉「即将开放」
- 部门范围只用管理部门树，不复用带成员行的 `ExportScopePicker`

尺寸对齐成员导入导出页与飞书部门页：页头高 53、分段高 32、拖拽区高 210、按钮 80×32。

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| 规格驱动 | ✅ | 只读本 change |
| 官方插件不互依 | ✅ | 只改 org 插件与 admin-common |
| 整页配置表单 | ✅ | 步骤区用 InFormContent |
| 时间契约 | ✅ | 任务时间走共享格式化 |
| 编码规范 | ✅ | script setup、无 any、原子类 |
