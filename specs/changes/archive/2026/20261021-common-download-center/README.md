# 20261021-common-download-center

> 状态：completed（已更新 current，已归档）

## 协作模式

一人全栈

## 背景与动机

成员表格导出需要前端轮询等待，用户不想等或超时后找不到结果。后续还会有更多导出，需要统一的「我的下载」查看历史并下载。

## 目标

- 顶栏增加「我的下载」入口，进入独立页面查看自己发起的导出任务并下载
- 成员表格导出提交后立即提示，不再阻塞页面等待

## 范围

### In Scope

- `admin-core` 内置顶栏小部件「我的下载」与公共路由 `/downloads`
- 「我的下载」页：分页列表、状态、下载、进行中自动刷新
- 成员导入导出页的导出改为提交即返回

### Out of Scope

- 平台管理台（`apps/admin-platform`）入口
- 导入历史、错误报告、一次性密码下载（保持现状）
- 成员 JSON 导出、删除任务、重新生成

## 输入来源

- 接口文档：根据后端 change 整理为 [API.md](./API.md)
- 需求文档：对话确认（入口在顶栏、提交不等待、保留 7 天）
- 后端来源：`ingot/specs/changes/archive/2026/20261021-framework-download-center/`

## 工件

- [接口](./API.md)
- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

- 依赖后端同批发布；导出接口返回值语义变化（下载任务 ID），旧前端不可与新后端混用
- 修订 [成员批量导入导出](../20261020-org-member-batch/README.md) 的导出交互；该变更已于 2026-10-21 验收归档

## 相关链接

-

## 完成记录

- 完成日期：2026-10-21。用户确认验收后更新 current 并归档。
- 关联提交或 PR：随本次提交
- 更新的 current capability：[packages/download-center](../../../../current/packages/download-center/README.md)、[org/members-departments](../../../../current/org/members-departments/README.md)、[packages/app-header](../../../../current/packages/app-header/README.md)
- 与原设计的差异：列表轮询使用查询定时刷新；提交成功用确认框提供「前往我的下载」，轻提示无法放置跳转
- 取消原因：
