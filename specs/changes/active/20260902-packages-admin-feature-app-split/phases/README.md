# 分阶段任务

本变更按依赖顺序拆成四个阶段：

1. [共享基础设施](./phase-01-foundation/TASKS.md)
2. [四个业务 App 迁移](./phase-02-domain-apps/TASKS.md)
3. [宿主与脚手架迁移](./phase-03-host-scaffold/TASKS.md)
4. [验证与收尾](./phase-04-validation/TASKS.md)

后续阶段不得绕过前置阶段的边界和公共接口。并行项只允许修改互不重叠的 App 目录；共享 package、
workspace 配置和 lockfile 由单一任务统一处理。
