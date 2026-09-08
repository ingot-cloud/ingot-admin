# 任务：移除全局路由 Tabs

> `[P]` 表示可与其他 `[P]` 任务并行执行。

## 准备

- [x] 确认本 change README 状态为 `approved`（开工后改为 `implementing`）
- [x] 阅读本 change 的 [REQUIREMENTS.md](./REQUIREMENTS.md)
- [x] 阅读 [CONSTITUTION.md](../../../../CONSTITUTION.md) 与 [in-coding-standards](../../../../../.agents/skills/in-coding-standards/SKILL.md)
- [x] 确认 DESIGN.md 的拆除范围与页内 Tab 边界

## 实现

- [x] 去掉配置抽屉 Tabs 开关与 `app.state` 的 `showTabs`
- [x] 去掉 `settings.showTabs`、环境变量与脚手架映射
- [x] 主题布局宿主、默认/示例 Shell、theme types、`useAdminShell` 去掉 tabs
- [x] 删除 `InTabs`、`useTabsStore`、全局注册与公开导出；删除 `meta.isAffix`
- [x] 删除 `--in-tabs-height` / `--in-tabs-font-size` / `--in-tabs-border-color`
- [x] 更新布局测试、主题文档与组件 README

## 验证

- [x] 满足 REQUIREMENTS.md 验收标准
- [x] 相关单元测试通过
- [x] 页内 Tab 页面源码仍使用 `InPageFrame` `#tabs`

## 收尾

- [x] 更新 `current/packages/admin-theme/spec.md`
- [x] 在 capability README 记录变更 ID
- [x] README 状态改为 `completed`，将变更目录移至 `changes/archive/<year>/<change-id>/`
