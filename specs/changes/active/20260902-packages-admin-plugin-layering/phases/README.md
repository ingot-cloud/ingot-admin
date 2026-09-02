# 分阶段任务

本变更以已完成的 `20260902-packages-admin-feature-app-split` 为基线，按以下顺序实施：

1. [Plugin 层与构建基础设施](./phase-01-plugin-layer/TASKS.md)
2. [Admin 收敛与 App 工具](./phase-02-admin-app/TASKS.md)
3. [示例与开发文档](./phase-03-documentation/TASKS.md)
4. [验证、治理与归档](./phase-04-validation/TASKS.md)

共享 workspace 配置、Vite 公共接口、lockfile 和根脚本由单一任务修改。四个插件的业务目录迁移可并行，
但必须等源码插件解析和边界约定确定后进行。
