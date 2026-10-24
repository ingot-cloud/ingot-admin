# 任务：授权审计游标分页与可读展示

> `[P]` 表示可与其他 `[P]` 任务并行执行。

## 准备

- [x] 确认本 change README 状态为 `approved`（开工后改为 `implementing`），且后端 change 同为 approved
- [x] 阅读本 change 的 [API.md](./API.md) 与 [REQUIREMENTS.md](./REQUIREMENTS.md)
- [x] 阅读 [CONSTITUTION.md](../../../CONSTITUTION.md) 与 [in-coding-standards](../../../../.agents/skills/in-coding-standards/SKILL.md)
- [x] 确认 DESIGN.md 的页面路径与对接映射

## 实现

- [x] F1：admin-core 新增 `useCursorPaging`、`InCursorPager` 及单元测试（游标栈、上一页/下一页、条数切换、筛选重置、身份变化后重置）
- [x] [P] F2：admin-common 模型、`createIamCursorQueryOptions`，以及补全的资源标签
- [x] [P] F3：`references.ts`、`formatters.ts`，并按字段编写单元测试（含历史编码和占位值、JSON 损坏、HIDDEN/DELETED）
- [x] F4：两个插件的 API 改为游标接口，并更新 API 测试
- [x] F5：`BizIamAuthorizationAudit`、`useOps`、`AuditDetailDrawer` 改造（筛选选择器、路由限定对象、摘要提示、详情名称与复制）
- [x] F6：更新 e2e 夹具与 `authorization-audit.spec.ts`

## 验证

- [ ] 满足 REQUIREMENTS.md 验收标准
- [ ] 对接行为与 API.md 一致
- [ ] 本地构建通过（`pnpm build:packages`，以及 admin、admin-platform 的 build），类型检查与 lint 通过
- [ ] 两个站点手动验收：翻页、筛选、名称、无权限/已删除、窄屏抽屉

## 收尾

- [ ] 更新 `current/base/platform-capabilities/spec.md` 中的授权审计页面行为
- [ ] 在 capability README 记录变更 ID，并链到归档后的 `API.md`
- [ ] README 状态改为 `completed`，将变更目录移至 `changes/archive/<year>/<change-id>/`
