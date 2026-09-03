# 任务：canonical viewPath 与菜单视图选择器

## 准备

- [x] 确认本 change README 状态为 `approved`（开工后改为 `implementing`）
- [x] 阅读本 change 的 [REQUIREMENTS.md](./REQUIREMENTS.md)
- [x] 阅读 [CONSTITUTION.md](../../../../CONSTITUTION.md) 与 [ingot-coding-standards](../../../../../.agents/skills/ingot-coding-standards/SKILL.md)
- [x] 确认 DESIGN.md

## 实现

- [x] 布局改为 `layouts/{slot}/IndexPage.vue`；core 扫描 `layout.*`；删 InAppLayout1
- [x] registry `layouts` + `listViews`；context / configurePageResolver 暴露
- [x] 删除 definePluginPages legacy；官方 prefix 改为域名；去掉 Dashboard 别名
- [x] `defineAppLocalPlugin` + create-app / main.ts 同源 appCode
- [x] MenuEditDrawer 选择器
- [x] 文档 `docs/menu-view-path.md` 及插件/运行时/脚手架文档
- [x] 更新单测与脚手架测试

## 验证

- [x] 满足 REQUIREMENTS.md
- [x] packages / 相关插件与 apps 测试通过
- [x] 手动：菜单选择器、目录无默认 path、旧 `@/` unavailable（数据未迁时）

## 收尾

- [x] 验收后更新 current 与归档
