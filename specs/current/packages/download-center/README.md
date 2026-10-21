# 我的下载

## 概述

已登录的租户用户从顶栏进入「我的下载」，查看自己发起的导出任务并在保留期内下载。导出页面只负责提交，不在页内等待文件生成。

## 相关源码

- [packages/admin-core/src/pages/common/downloads](../../../../packages/admin-core/src/pages/common/downloads)
- [packages/admin-core/src/models/download.ts](../../../../packages/admin-core/src/models/download.ts)
- [packages/admin-core/src/api/common/download.ts](../../../../packages/admin-core/src/api/common/download.ts)
- [apps/admin/src/header.ts](../../../../apps/admin/src/header.ts)
- 成员导出入口：[plugins/org/src/pages/iam/members/workbook](../../../../plugins/org/src/pages/iam/members/workbook)

## 对接接口

- [20261021-common-download-center API](../../../changes/archive/2026/20261021-common-download-center/API.md)
- 后端基线：`ingot/specs/current/framework/download-center/`

## 变更记录

| 日期 | 变更 ID | 说明 |
|------|---------|------|
| 2026-10-21 | [20261021-common-download-center](../../../changes/archive/2026/20261021-common-download-center/) | 用户确认验收；顶栏入口、下载页与成员导出提交即返回 |
