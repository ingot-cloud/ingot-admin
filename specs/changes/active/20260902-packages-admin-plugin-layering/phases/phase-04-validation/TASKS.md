# Phase 04：验证、治理与归档

## 分层与组合验证

- [x] 将 App 边界脚本升级为 apps/plugins/packages 分层检查
- [x] 检查非法反向依赖、官方插件互相依赖、遗留 `@base` 和清单/依赖不一致
- [x] 用临时 fixture 构建 platform-only、security-only、org-only、org+member 和全插件组合（Vite resolver 单测覆盖发现与裁剪）
- [ ] 从模块图确认未选择插件未进入产物
- [ ] 验证 canonical 与 legacy page key、菜单冲突和 plugin-unavailable 行为

## 工程验证

- [x] 运行 packages build、plugins type-check/test、apps type-check、lint 和 unit tests
- [ ] 运行 admin production build、create-app 生成物构建、example type-check 和 docs check（example type-check 与 docs check 已通过）
- [ ] 手动验证 admin 全插件菜单、Dashboard 和四类业务页面
- [ ] 手动验证从 admin 删除插件后的启动、菜单和构建裁剪

## CI、规范与收尾

- [x] 更新 CI changes 规则，使 plugins 变化触发 admin 和插件检查
- [x] 更新 AGENTS、coding standards 和架构开发约定
- [x] 状态改为 `validating`，记录自动化与手动验收结果
- [ ] 验收后更新 CONSTITUTION 和 current specs
- [ ] 填写完成记录、状态改为 `completed` 并归档
