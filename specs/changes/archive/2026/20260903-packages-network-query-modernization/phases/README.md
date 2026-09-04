# 分阶段任务

本变更按“传输底座 → Query runtime → 试点 → 全域迁移 → 部署验证”推进。

- [Phase 1：HTTP foundation](./phase-01-http-foundation/TASKS.md)
- [Phase 2：Query runtime](./phase-02-query-runtime/TASKS.md)
- [Phase 3：Pilots](./phase-03-pilots/TASKS.md)
- [Phase 4：Domain rollout](./phase-04-domain-rollout/TASKS.md)
- [Phase 5：HTTP/2 deployment](./phase-05-http2-deployment/TASKS.md)

Phase 5 可与前两阶段并行协调外层代理，但必须在最终 validating 前完成。Phase 4 只有在 Phase 3
试点门禁通过后才能开始。
