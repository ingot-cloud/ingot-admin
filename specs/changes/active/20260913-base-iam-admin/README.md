# 20260913-base-iam-admin

> 状态：draft

## 协作模式与目标

前后端分离。根据后端 20260912-iam-identity-access-management 生成前端规格，覆盖 IAM 后台页面、公共授权能力与接口切换。当前仅生成文档，不修改业务代码，不代表后端接口已上线或前端获准施工。

平台和租户各不超过四个一级目录；角色共享固定版本、租户只存差异；配置、授权、预览及诊断形成可理解的闭环。

## 范围

包含 packages/admin-core、packages/admin-common、plugins/platform、plugins/org、plugins/security 的 IAM 相关能力，以及 apps/admin 的必要组合注册；apps/auth 仅在后端更名确有调用影响时更新服务目标，不改认证协议。业务页面不放进宿主。

不包含后端实现、数据库迁移工具、前端迁移控制台、复制模板旧语义、平台进入租户业务、多级委派、动态组、会员体系重构、新增业务微服务。数据库迁移由后端负责；前端需要在新库/新会话环境联调。

## 输入来源与真相归属

后端来源：同级 ingot 仓库 specs/changes/active/20260912-iam-identity-access-management，2026-09-13 读取，源状态 review。
本次直接从指定仓库复制输入到 change，未消费、移动或清空 inbox，未修改后端源文件。

- API.md：后端 API 原文副本，接口真相仍在后端。
- INTERACTIONS.md：后端 FRONTEND.md 原文副本，页面语义约束。
- sources/：后端需求、领域设计、迁移和验收原文快照。
- SOURCES.md：源路径、SHA-256、文件对应关系及阅读顺序。
- REQUIREMENTS/DESIGN/TASKS/ACCEPTANCE：本次前端方案与任务，不另造授权语义。

副本保留源文件相对链接原文，其中部分链接按后端目录组织；前端实现按 SOURCES.md 的本地映射阅读，无须依赖源仓库或聊天记录。

## 工件

- [接口](./API.md)
- [前端需求](./REQUIREMENTS.md)
- [前端设计](./DESIGN.md)
- [逐页交互](./INTERACTIONS.md)
- [任务](./TASKS.md)
- [验收](./ACCEPTANCE.md)
- [来源与契约缺口](./SOURCES.md)

## 风险与依赖

后端契约仍为目标设计：操作码、完整 OpenAPI、选择器地址及部分 DTO 尚未交付。详见 DESIGN 的集成门禁；不得自行发明线上接口、硬编码角色绕过或宣称可直接联调。组件布局可在批准后用明确标记的夹具开发，API 集成必须先校对后端契约。

本 change 没有与其他 active change 的文件冲突（生成时目录无既有 active 文件）。当前基线为 RBAC data-authorization、network-query、detail-edit-pattern 和插件架构，实施后再更新 current。

## 完成记录

- 完成日期：未完成
- 关联提交或 PR：未创建
- current 更新：尚未更新
- 与设计差异：未实施
- 取消原因：不适用
