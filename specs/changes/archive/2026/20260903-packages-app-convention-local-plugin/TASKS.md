# 任务：App 约定本地插件与自动注入

> `[P]` 表示可与其他 `[P]` 任务并行执行。

## 准备

- [x] 确认本 change README 状态为 `approved`（开工后改为 `implementing`）
- [x] 阅读本 change 的 [REQUIREMENTS.md](./REQUIREMENTS.md)
- [x] 阅读 [CONSTITUTION.md](../../../../CONSTITUTION.md) 与 [ingot-coding-standards](../../../../../.agents/skills/ingot-coding-standards/SKILL.md)
- [x] 确认 DESIGN.md 的页面路径与对接映射

## 实现

- [x] admin-core：`definePluginComponents` / `definePluginDirectives` + `defineAppLocalPlugin` glob + 单测
- [x] vite-config：App hook/store AutoImport + 约定守卫 + 单测
- [x] apps/admin：约定目录、`app-plugin.ts`、`createAdminPlugins(appCode)`
- [x] create-app 模板与脚手架：始终约定插件；Demo 不再手写 components 映射
- [x] 更新 docs 与编码规范

## 验证

- [x] 满足 REQUIREMENTS.md 验收标准
- [x] admin-core 与 vite-config、scaffold 单测通过
- [x] 本地相关包测试通过

## 收尾

- [x] 更新 `current/packages/app-plugins-shared-scaffold/spec.md`
- [x] 在 capability README 记录变更 ID
- [x] README 状态改为 `completed`，将变更目录移至 `changes/archive/2026/`
