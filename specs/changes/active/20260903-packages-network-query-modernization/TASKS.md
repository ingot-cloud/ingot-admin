# 任务：网络请求与服务端状态现代化

> `[P]` 表示可与其他 `[P]` 任务并行执行。具体任务见 `phases/`。

## 准备

- [ ] 确认本 change README 状态为 `approved`，开工时改为 `implementing`
- [ ] 阅读本 change 的 [REQUIREMENTS.md](./REQUIREMENTS.md) 与 [DESIGN.md](./DESIGN.md)
- [ ] 阅读 [CONSTITUTION.md](../../../CONSTITUTION.md) 与 [ingot-coding-standards](../../../../.agents/skills/ingot-coding-standards/SKILL.md)
- [ ] 记录 admin/auth net、API 调用、`usePaging` 和部署协议的实现前基线

## 分阶段实现

- [ ] Phase 1：完成共享 HTTP Client 与兼容适配（[任务](./phases/phase-01-http-foundation/TASKS.md)）
- [ ] Phase 2：完成 TanStack Query runtime（[任务](./phases/phase-02-query-runtime/TASKS.md)）
- [ ] Phase 3：完成双场景试点并通过迁移门禁（[任务](./phases/phase-03-pilots/TASKS.md)）
- [ ] Phase 4：完成 admin 逐域迁移（[任务](./phases/phase-04-domain-rollout/TASKS.md)）
- [ ] [P] Phase 5：完成 HTTP/2、代理与部署验证（[任务](./phases/phase-05-http2-deployment/TASKS.md)）

## 验证

- [ ] REQUIREMENTS.md 所有验收项有自动化测试或人工验收记录
- [ ] admin/auth 的鉴权、业务码、412 挑战和信封加密行为等价
- [ ] 相同 Query Key 去重、过期请求取消、Mutation 精确失效和登出清缓存通过
- [ ] `pnpm check` 全量通过
- [ ] admin/login Docker 镜像构建和 Nginx 配置检查通过
- [ ] 公网 admin/login 的静态资源和 `/api/` 均验证为 HTTP/2
- [ ] HTTP/1.1 环境下超过 6 个请求排队但功能正确

## 收尾

- [ ] 将 README 状态改为 `validating` 并记录验收结果
- [ ] 更新 `specs/current/packages` 的网络请求与服务端状态行为规格
- [ ] 更新部署、API/Query 编码规范和 create-app 文档
- [ ] 验收通过后将状态改为 `completed`，归档到 `specs/changes/archive/2026/`
