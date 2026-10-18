# 组织角色即时授权与拥有者交互

> 状态：validating
> 2026-10-14 用户评审通过并授权实施：draft → approved → implementing → validating；暂不提交代码，平台既有功能为重点回归范围。

## 协作模式与目标

前后端联合规划、分别维护 active change。创建日期 2026-10-14（Asia/Shanghai），负责人 jy。租户拥有者动态拥有有效开通应用全部权限；平台共享角色租户只读，私有角色由组织直接创建维护；角色修改后关联成员自动生效。租户界面不再包含角色版本、发布、升级或共享定制。

## 范围

包含 org 授权/设置/成员相关页面、平台共享角色管理、admin-common 当前角色/分配/资源委派组件与类型、admin-core 租户权限刷新、API副本、迁移切换及联合验收。平台自有角色的版本/批量应用与平台字段编辑继续使用既有组件；不修改 Member、登录协议、其他产品页面或引入SSE/WebSocket。

## 确认记录与门禁

用户确认共享修改影响所有直接使用的组织；私有角色不继承或复制共享；委派按资源限制范围，同资源新操作自动跟随；拥有者覆盖租户字段限制；保留数据迁移，历史分配统一最新并在冲突处置后切换。本工件已由用户评审批准，进入 validating。不提交代码、不提前修改 current，实际部署和数据库切换另按运行手册执行。

## 输入来源

- [后端关联 change](../../../../../ingot/specs/changes/active/20261014-iam-tenant-live-authorization/README.md)。
- 本次 [API](./API.md) 是后端权威文件的逐字节副本，[来源清单](./SOURCES.md) 记录 SHA-256。
- [后端迁移回滚副本](./sources/BACKEND_MIGRATION.md) 保持原文；前端职责见 [MIGRATION](./MIGRATION.md)。
- 需求来源：本聊天已确认模型和方案；用户明确要求直接创建前后端 active change，没有消费、移动或清空其他 inbox。
- 现有实现：`plugins/org/src/pages/iam/authorization/IndexPage.vue`、`plugins/org/src/pages/iam/settings/IndexPage.vue`、`plugins/platform/src/pages/iam/shared-roles/`、`packages/admin-common/src/components/BizIamRole*`、`packages/admin-core/src/stores/modules/auth.ts`。

## 工件与阅读顺序

1. [需求](./REQUIREMENTS.md)、[设计](./DESIGN.md)。
2. [接口权威副本](./API.md)、[来源校验](./SOURCES.md)。
3. [迁移切换与回滚](./MIGRATION.md)、[后端原文副本](./sources/BACKEND_MIGRATION.md)。
4. [任务](./TASKS.md)、[验收](./ACCEPTANCE.md)、[实施与验收报告](./VALIDATION.md)。
5. [人工验收操作清单](./MANUAL-ACCEPTANCE.md)：未上线测试环境的准备、24组操作步骤、预期结果与记录表。

## 相关变更与适用范围

- [基础 IAM 管理台](../20260913-base-iam-admin/README.md) 保留 implementing 状态和历史证据；本变更批准后接管租户授权中的版本/差异/升级与共享管理交互，其余工作继续独立维护。
- [角色版本页面基线](../../../current/base/role-version-application/README.md) 的平台自有能力保留，租户及共享角色适用范围验收后再修订。
- 旧 current/历史来源不得提前改写或删除；完整页面联调不能仅用接口封装或隐藏按钮宣称完成。

## 风险与依赖

本次租户请求模型是破坏性变更，需要后端、SDK和前端按维护窗口一起切换。不能在旧后端上自动退回版本接口。迁移冲突、真实范围数据和性能验证由后端与发布责任方交付；前端只消费当前模型与可披露提示，不在浏览器合成权限。

## 完成记录

- 当前交付：当前角色/分配/资源委派交互、拥有者与权限刷新、两管理台制品及测试证据，见 [VALIDATION](./VALIDATION.md)。
- 代码、构建、组件自动化及关键真实浏览器联调：完成；完整产品人工验收与发布：待执行。
- 开发及隔离验证完成：2026-10-14；产品验收待确认；提交或 PR：未创建。
- current计划：验收后建立 `org/tenant-live-authorization`，同步平台共享角色和角色版本页面适用范围。
- 与已确认业务模型的差异：无；范围候选与直接分配资格跟随服务器契约，平台自有分支保持。
- 取消原因：不适用；取消或替代时记录原因归档，不能删除。
