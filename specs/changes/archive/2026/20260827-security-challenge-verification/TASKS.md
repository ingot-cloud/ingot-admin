# 任务：挑战验证

> `[P]` 表示可与其他 `[P]` 任务并行执行。

## 准备

- [x] 确认本 change README 状态为 `approved`（开工后改为 `implementing`）
- [x] 阅读本 change 的 [API.md](./API.md) 与 [REQUIREMENTS.md](./REQUIREMENTS.md)
- [x] 阅读 [CONSTITUTION.md](../../../CONSTITUTION.md) 与 [ingot-coding-standards](../../../../.agents/skills/ingot-coding-standards/SKILL.md)
- [x] 确认 DESIGN.md 的页面路径与对接映射

## 实现

- [x] models：`GatewayChallengePolicy`；枚举 `ChallengeTriggerEnum`、`ChallengeTypeEnum`；`AccessProtectionTabEnum` 增加挑战 Tab
- [x] [P] API：`policy.ts` 增加 challenges CRUD
- [x] 访问防护：挑战策略 Tab CRUD + 校验
- [x] `@ingot/utils`：412 解析、动态路径、同 scope 队列、重试上限、挑战 Header 拼接
- [x] login / admin：axios 全局 412 拦截（按 `data` 拉码/验码/Header 重试；`/vc` 不套；信封明文恢复）
- [x] 两端 `ChallengeHost` + verifition 动态 URL / Header 名；登录页去掉本地 412 处理

## 验证

- [x] 满足 REQUIREMENTS.md 验收标准
- [x] 对接行为与 API.md 一致
- [x] 本地构建通过（`pnpm build:packages` + `ingot-admin` / `ingot-login` build）
- [x] 手动测试：挑战 Tab；登录 412；其它业务 API 412；滑块失败不重试；关闭挑战不弹窗

## 收尾

- [x] 更新 `current/security/access-protection/spec.md`
- [x] 视情况补 `current/ingot-login/` 与公共 412 行为
- [x] 在 capability README 记录变更 ID，并链到归档后的 `API.md`
- [x] README 状态改为 `completed`，将变更目录移至 `changes/archive/2026/20260827-security-challenge-verification/`
