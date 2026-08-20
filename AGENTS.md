# Agent Workflow

本仓库用 `specs/` 管理前端变更。影响页面行为、路由、API 对接或共享包的改动，必须遵循以下规则。细节以 [specs/README.md](./specs/README.md) 为准。

1. 改业务代码前，阅读 [变更规格工作流](./specs/README.md)，检索相关 `specs/current/` 与 `specs/changes/active/`，并阅读 [CONSTITUTION.md](./specs/CONSTITUTION.md) 与 [ingot-coding-standards](./.agents/skills/ingot-coding-standards/SKILL.md)。
2. 从 `specs/inbox/` 生成 change 后状态为 `draft`。仅「生成 spec」时不得改业务代码。
3. Active change 状态必须为 `approved`，且 `TASKS.md` 已可执行，才能开始施工；开工时将状态改为 `implementing`。
4. 实现偏离已批准的 `DESIGN.md` / `API.md` / `REQUIREMENTS.md` 时，先更新 Spec 并经用户确认，再继续修改代码。
5. 实施期间同步勾选 `TASKS.md`，不提前修改 `specs/current/`。
6. 变更验收完成后，将页面行为写入 `specs/current/`，状态改为 `completed`，再将 change 移入 `specs/changes/archive/`。
7. 未完成、取消或被替代的变更不得删除，必须记录原因后归档（状态 `cancelled`）。

本仓库约定：

- 用户同一句话要求「根据 inbox 生成并实现」：先产出 `draft` spec，**停下来等确认**。用户明确说可以开工后，再将状态改为 `approved` → `implementing` 并改代码。
- 实现只读该 change 目录（`API.md`、`REQUIREMENTS.md`、`DESIGN.md`），不要再读已清空的 inbox。
