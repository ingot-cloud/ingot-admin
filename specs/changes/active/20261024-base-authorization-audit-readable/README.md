# 20261024-base-authorization-audit-readable

> 状态：implementing
> 批准记录：2026-10-24，用户确认设计并要求开工（approved → implementing）。

## 协作模式

一人全栈。后端变更为 `ingot/specs/changes/active/20261024-iam-authorization-audit-readable/`。

## 背景与动机

“授权审计”页面（组织端：安全与合规 › 授权审计；平台端：授权审计）目前存在两类问题：

- **分页**：使用页码分页，审计数据持续增长后，翻页和计数越来越慢，翻页期间新写入的审计还会让结果错位。
- **可读性**：列表直接显示“成员 123…”、“角色 · 1876…”等 ID；变更摘要只写“涉及 名称、状态”，悬停提示同样不完整；筛选项要求手工输入成员 ID 和对象类型编码。

## 目标

- 列表改用游标分页，提供“上一页 / 下一页”，不显示总条数。
- 列表与详情不出现内部 ID。操作者、目标、关联对象一律显示名称；没有权限或对象已删除时显示明确的说明文字。
- 变更摘要完整写出每个字段的变更前后值，悬停可查看全部内容。
- 筛选改为成员选择器和对象类型下拉，不再手工输入 ID 或编码。

## 范围

### In Scope

- `packages/admin-core`：新增通用游标分页组合函数 `useCursorPaging` 和分页条 `InCursorPager`。
- `packages/admin-common`：审计模型、API 类型、`BizIamAuthorizationAudit`、详情抽屉，以及变更值格式化。
- `plugins/org`、`plugins/platform`：审计 API 模块改为游标接口；页面支持通过路由参数限定对象。
- 同步更新现有 e2e、单元测试。

### Out of Scope

- 审计导出、跨域查询、按名称模糊搜索。
- 其他页面的分页方式（游标分页组件可以复用，但本次不迁移其他页面）。

## 输入来源

- 接口文档：[API.md](./API.md)，依据后端 change 的 DESIGN 编写。
- 需求文档：对话中用户确认的四项决策（游标分页采用上一页/下一页；平台和租户两个域一起改；筛选改为选择器；详情中的关联对象显示名称，审计 ID 和追踪 ID 保留并可复制）。
- 后端来源：`ingot/specs/changes/active/20261024-iam-authorization-audit-readable/DESIGN.md`

## 工件

- [接口](./API.md)
- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

- 接口是破坏性变更，前端必须与后端同窗口发布。
- 部分取代 `20260913-base-iam-admin` 中“目标仅展示资源及 ID”的展示约定。

## 相关链接

- 后端变更：`ingot/specs/changes/active/20261024-iam-authorization-audit-readable/`

## 完成记录

- 完成日期：
- 关联提交或 PR：
- 更新的 current capability：
- 与原设计的差异：
- 取消原因：
