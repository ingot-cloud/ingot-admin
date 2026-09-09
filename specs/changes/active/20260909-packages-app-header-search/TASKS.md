# 任务：顶栏菜单搜索（本地路由第一版）

> `[P]` 表示可与其他 `[P]` 任务并行执行。

## 准备

- [x] 确认本 change README 状态为 `approved`（开工后改为 `implementing`）
- [x] 阅读本 change 的 [REQUIREMENTS.md](./REQUIREMENTS.md) 与 [DESIGN.md](./DESIGN.md)
- [x] 阅读 [CONSTITUTION.md](../../../CONSTITUTION.md) 与 [in-coding-standards](../../../../.agents/skills/in-coding-standards/SKILL.md)
- [x] 确认 DESIGN.md 的页面路径与对接映射（无 API.md）

## 实现

- [x] 菜单扁平与按名称过滤纯函数及单测
- [x] Pinia persist 搜索历史（按用户、去重、上限、清空）及单测
- [x] `InAppBarSearch` 聚焦弹出面板：历史胶囊、结果列表、脚底、↑↓/Enter；紧凑模式复用
- [x] 将 `--in-app-bar-search-width` 调整为 `400px`，并同步 Token 测试与文档
- [x] 更新 `docs/app-header.md` 与组件测试
- [x] 常用 `header.search.shortcuts`、空态占位、检索 loading、结果卡片与关键词高亮

## 验证

- [x] 相关 Vitest 与 `admin-core` type-check 通过
- [ ] 满足 REQUIREMENTS.md 验收标准（待登录后浏览器走查）
- [ ] 本地构建通过（`pnpm build:packages` + 相关 app build）
- [ ] 手动测试关键场景（宽屏聚焦、历史、跳转、紧凑浮层）

## 收尾

- [ ] 验收通过后再更新 `current/`（实施期间不改）
- [ ] README 状态改为 `completed`，将变更目录移至 `changes/archive/<year>/`
