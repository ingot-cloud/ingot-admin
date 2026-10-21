# 部门批量导入导出页

> 状态：completed（已更新 current，已归档）

## 完成与归档（2026-10-21）

- 完成日期：2026-10-21。用户确认测试通过后更新 current 并归档。
- 当前能力：[org/members-departments](../../../../current/org/members-departments/README.md)
- 另一仓库对应归档：`ingot/specs/changes/archive/2026/20261021-iam-department-workbook/`
- 与原设计的差异：部分部门树的行高、展开箭头和复选框间距对齐创建成员时的部门选择

## 协作模式

一人全栈，对接 `ingot/specs/changes/archive/2026/20261021-iam-department-workbook/`。

## 背景与动机

部门页「批量导入/导出」仍提示即将开放，与已落地的成员导入导出页和飞书部门页不一致。

## 目标

部门工具栏进入隐藏路由页，走 xlsx 模板、范围导出和页内导入轮询。文案对齐飞书部门页，布局遵循导入导出规范。

## 范围

### In Scope

- 部门工具栏「批量导入/导出」进入 `/org/iam/departments/workbook`
- 分段「导入新部门」/「导出并修改部门信息」
- 部门范围对话框、拖拽上传、导入历史、结果与错误报告
- 具备创建或导出权限时显示按钮

### Out of Scope

- 导入导出负责人
- 飞书改文件名与短信验证
- 改成员导入导出页

## 输入来源

- 接口文档：./API.md
- 需求文档：./REQUIREMENTS.md
- 后端来源：`ingot/specs/changes/archive/2026/20261021-iam-department-workbook/`

## 工件

- [接口](./API.md)
- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

后端 workbook 接口未上线时页面只能看到失败提示。

## 相关链接

- 飞书管理后台「管理员批量导出组织架构信息」部门步骤

## 完成记录

- 完成日期：2026-10-21
- 关联提交或 PR：随本次提交
- 更新的 current capability：`specs/current/org/members-departments`
- 与原设计的差异：部分部门树样式对齐创建成员时的部门选择
- 取消原因：
