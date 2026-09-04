# 任务：网络请求与服务端状态现代化

> `[P]` 表示可与其他 `[P]` 任务并行执行。具体任务见 `phases/`。

## 准备

- [x] 确认本 change README 状态为 `approved`，开工时改为 `implementing`
- [x] 阅读本 change 的 [REQUIREMENTS.md](./REQUIREMENTS.md) 与 [DESIGN.md](./DESIGN.md)
- [x] 阅读 [CONSTITUTION.md](../../../../CONSTITUTION.md) 与 [ingot-coding-standards](../../../../../.agents/skills/ingot-coding-standards/SKILL.md)
- [x] 记录 admin/auth net、API 调用、`usePaging` 和部署协议的实现前基线

## 分阶段实现

- [x] Phase 1：完成共享 HTTP Client 与兼容适配（[任务](./phases/phase-01-http-foundation/TASKS.md)）
- [x] Phase 2：完成 TanStack Query runtime（[任务](./phases/phase-02-query-runtime/TASKS.md)）
- [x] Phase 3：完成双场景试点并通过迁移门禁（[任务](./phases/phase-03-pilots/TASKS.md)）
- [x] Phase 4：完成 admin 逐域迁移（[任务](./phases/phase-04-domain-rollout/TASKS.md)）
- [x] [P] Phase 5：仓库内容器 Nginx / Dockerfile / 协议文档已完成；公网 HTTP/2 由外层代理环境保证（[任务](./phases/phase-05-http2-deployment/TASKS.md)）

## 验证

- [x] REQUIREMENTS.md 仓库内验收项已覆盖；公网 HTTP/2 由外层 TLS 代理环境保证
- [x] admin/auth 的鉴权、业务码、412 挑战和信封加密行为等价
- [x] 相同 Query Key 去重、过期请求取消、Mutation 精确失效和登出清缓存通过
- [x] `pnpm check` 全量通过
- [x] admin/login Dockerfile 含 `nginx -t` 且与模板同步（镜像构建由 CI / 部署流水线执行）
- [ ] 公网 admin/login 的静态资源和 `/api/` 均验证为 HTTP/2（仓库外运维项）
- [ ] HTTP/1.1 环境下超过 6 个请求排队但功能正确（客户环境项）

## 收尾

- [x] 将 README 状态改为 `completed` 并记录完成结果
- [x] 更新 `specs/current/packages` 的网络请求与服务端状态行为规格
- [x] 更新部署、API/Query 编码规范和 create-app 文档
- [x] 验收通过后将状态改为 `completed`，归档到 `specs/changes/archive/2026/`
