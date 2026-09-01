# 任务：构建期插件化后台框架

> `[P]` 表示可与其他 `[P]` 任务并行执行。详细任务见 [phases/README.md](./phases/README.md)。

## 准备

- [x] 确认本 change README 状态为 `approved`（开工后改为 `implementing`）
- [x] 阅读本 change 的 [API.md](./API.md) 与 [REQUIREMENTS.md](./REQUIREMENTS.md)
- [x] 阅读 [CONSTITUTION.md](../../../CONSTITUTION.md) 与 [ingot-coding-standards](../../../../.agents/skills/ingot-coding-standards/SKILL.md)
- [x] 确认 DESIGN.md 的包边界、注册顺序与兼容策略

## 实现

- [x] Phase 1：插件契约、注册中心与共享构建配置
- [x] Phase 2：抽取 admin-core/admin-base 并迁移 ingot-admin
- [x] Phase 3：target-project、发布验证、CI/CD 与脚手架文档

## 验证

- [ ] 满足 REQUIREMENTS.md 全部验收标准
- [ ] 公共 TypeScript API 与 API.md 一致
- [x] `pnpm build:packages`、`ingot-admin`、`ingot-login`、`target-project` 构建通过
- [x] 插件 registry 单元测试与路由集成测试通过
- [x] `pnpm pack` 隔离消费测试通过
- [ ] 手动测试 ingot-admin 等价行为、target A–F 跳转、登录/退出与深层刷新

## 收尾

- [ ] 更新 `current/packages/composable-admin-runtime/spec.md`
- [ ] 在 capability README 记录 change ID，并链到归档后的 API.md
- [ ] 记录后端菜单稳定键迁移的后续事项，保留旧 aliases
- [ ] README 状态改为 `completed`，将 change 移至 `changes/archive/2026/20260829-packages-composable-admin-runtime/`
