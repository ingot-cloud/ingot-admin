# 分阶段任务：管理台业务页面 UI 迁移

阶段按依赖顺序推进：

1. [Phase 01：试点](./phase-01-pilots/TASKS.md)
2. [Phase 02：platform 与 org](./phase-02-platform-org/TASKS.md)
3. [Phase 03：member 与 security](./phase-03-member-security/TASKS.md)
4. [Phase 04：全量回归](./phase-04-regression/TASKS.md)

开始 Phase 01 前，foundation Phase 06 必须通过“成员工作区”专项视觉验收并冻结 `InFilterContainer`、`InTable`、`InTableActions` 与 `InColumnSetting` 契约；其他既有基础设施契约保持不变。Phase 01 必须取得用户视觉确认后才能开始批量迁移。每个阶段可以独立进入验证，但在最终验收前不更新 `specs/current/`。
