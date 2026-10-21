# 成员批量变更部门与导入导出页

> 状态：completed（已更新 current，已归档）

## 完成与归档（2026-10-21）

- 完成日期：2026-10-21。用户确认成员批量处理验证成功后更新 current 并归档。
- 当前能力：[org/members-departments](../../../../current/org/members-departments/README.md)
- 另一仓库对应归档：`ingot/specs/changes/archive/2026/20261020-iam-member-batch/`
- 与原设计的差异：导入历史的状态列直接显示任务状态值；勾选部门后展开成员 ID 与设计一致

## 协作模式

一人全栈，对接 `ingot/specs/changes/archive/2026/20261020-iam-member-batch/`。

## 背景与动机

成员页「批量变更部门」仍是芯片抽屉，「批量导入/导出」仍是 JSON 导出抽屉，与飞书管理后台实测交互不一致。

## 目标

批量变更部门改为两层对话框（选部门 → 确认替换）。批量导入/导出进入居中新页面，走 xlsx 任务。部门页按钮仍提示即将开放。

## 范围

### In Scope

- 成员工具栏「批量变更部门」两层对话框
- 成员工具栏「批量导入/导出」进入 `/org/iam/members/workbook`
- 创建/更新分段、范围导出、拖拽上传、导入历史、结果与错误报告
- 具备创建或导出权限时显示导入导出按钮

### Out of Scope

- 部门页批量导入导出
- 详情里单人改部门
- JSON 导出抽屉能力迁入本页（该契约保留给其它调用方，成员页不再打开它）

## 输入来源

- 接口文档：./API.md
- 需求文档：./REQUIREMENTS.md
- 后端来源：`ingot/specs/changes/archive/2026/20261020-iam-member-batch/`

## 工件

- [接口](./API.md)
- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

后端 workbook 接口未上线时页面只能下载失败提示。批量任职仍逐人 PUT。

## 相关链接

- 飞书管理后台组织架构成员页实测（2026-10-21）

## 完成记录

- 完成日期：2026-10-21
- 关联提交或 PR：随本次提交
- 更新的 current capability：`specs/current/org/members-departments`
- 与原设计的差异：导入历史状态列显示任务状态值，设计未规定用标签展示
- 取消原因：
