# Phase 04：验证与收尾

## 自动化验证

- [x] 运行 App 边界检查，确认无 `@base`、跨 App import 或业务 App 依赖
- [ ] 验证 canonical、semantic legacy、file legacy 三类页面 key
- [ ] 验证 org-only、security-only、org+member、全量四插件组合
- [ ] 从构建模块图确认未选择插件页面未进入产物
- [ ] 运行 packages build、workspace type-check、lint check 和 unit tests

## 手动回归

- [ ] 在 admin 全量宿主验证 Dashboard 和四类业务菜单
- [ ] 在 security-only 宿主验证租户/Client 筛选与安全页面
- [ ] 在默认 org target 验证组织页面和本地 Demo 页面共存
- [ ] 验证后端误配缺失插件菜单仍进入 plugin-unavailable 诊断页

## 文档与归档

- [x] 状态改为 `validating`，记录构建、测试和手动验收结果
- [x] 更新 current 的官方插件组合行为及 security 页面键说明
- [x] 用户验收后填写完成记录、改为 `completed` 并归档
