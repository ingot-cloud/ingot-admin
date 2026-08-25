# 任务：账号保护 · 账号锁定

> `[P]` 表示可与其他 `[P]` 任务并行执行。

## 准备

- [x] 确认本 change README 状态为 `approved`（开工后改为 `implementing`）
- [x] 阅读本 change 的 [API.md](./API.md) 与 [REQUIREMENTS.md](./REQUIREMENTS.md)
- [x] 阅读 [CONSTITUTION.md](../../../CONSTITUTION.md) 与 [ingot-coding-standards](../../../../.agents/skills/ingot-coding-standards/SKILL.md)
- [x] 确认 DESIGN.md 的页面路径与对接映射

## 实现

- [x] models：`AccountLockoutPolicy`，并在 `models/index.ts` 导出
- [x] [P] API：`accountLockoutPolicy.ts`（列表 GET + 更新 PUT；可选按 userType GET）
- [x] 页面：`pages/platform/security/account-protection/`（IndexPage Tab 容器 + `LockoutPolicyPanel` 两栏 + `LockoutPolicyColumn` + `useLockoutPolicy`）
- [x] 权限：无 update 权限时只读；B 端永久锁定、C 端禁止 0 分钟；保存成功文案与前端校验

## 验证

- [x] 满足 REQUIREMENTS.md 验收标准
- [x] 对接行为与 API.md 一致
- [ ] 本地构建通过（`pnpm build:packages` + 相关 app build）
- [x] 手动测试关键场景（两栏独立保存、B 永久锁、C 禁止永久、无删除）

## 收尾

- [x] 更新 `current/security/account-protection/spec.md`（页面行为，不要合并整份 API.md）
- [x] 在 capability README 记录变更 ID，并链到归档后的 `API.md`
- [x] README 状态改为 `completed`，将变更目录移至 `changes/archive/2026/20260825-security-account-protection/`
