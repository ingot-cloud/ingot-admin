# 任务：App 插件化重组与脚手架可视化

## 准备

- [x] 确认本 change README 状态为 `approved`（开工后改为 `implementing`）
- [x] 阅读本 change 的 API.md 与 REQUIREMENTS.md
- [x] 阅读 CONSTITUTION 与 ingot-coding-standards
- [x] 确认 DESIGN.md

## 实现

- [x] 合并 utils/crypto/hooks 为 `@ingot/shared`，更新 login/core/alias/pack
- [x] admin-base 回迁 ingot-admin，导出 adminPlugin，废弃 admin-base
- [x] target + vite-config 支持依赖官方 App 插件并验证构建
- [x] admin-core 静态+动态菜单混合 API、单测与模板示例
- [x] 公共 API JSDoc + composable-admin-runtime / create-app 文档
- [x] apps/create-app Web UI + 抽取共享 scaffold 逻辑

## 验证

- [x] 满足 REQUIREMENTS.md 验收标准
- [x] 对接行为与 API.md 一致
- [x] 本地构建通过
- [x] 手动测试：独立 admin、组合 target、create-app 生成

## 收尾

- [x] 更新 current capability（若需要）
- [x] README 状态改为 completed 并归档
