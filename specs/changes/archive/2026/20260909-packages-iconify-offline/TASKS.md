# 任务：Iconify 离线打包与全屏图标

> `[P]` 表示可与其他 `[P]` 任务并行执行。

## 准备

- [x] 确认本 change README 状态为 `approved`（开工后改为 `implementing`）
- [x] 阅读本 change 的 [REQUIREMENTS.md](./REQUIREMENTS.md)
- [x] 阅读 [CONSTITUTION.md](../../../../CONSTITUTION.md) 与 [in-coding-standards](../../../../../.agents/skills/in-coding-standards/SKILL.md)
- [x] 确认 DESIGN.md 的页面路径与对接映射

## 实现

- [x] vite-config：扫描、抽取、`virtual:iconify-offline` 插件与单测
- [x] 接入 shared Vite 配置；组件库 build external 该虚拟模块；关闭 unplugin-icons `autoInstall`
- [x] InFullscreen 使用 `bi:fullscreen` / `bi:fullscreen-exit`
- [x] 补齐源码用到的 `@iconify-json/*`；admin 默认 `collections: ["ep"]`
- [x] serve 在线 / build 离线虚拟 Icon 模块
- [x] dev 中间件写入 used.json，构建并入离线包
- [x] InIcon 开发态预览成功后 POST；直接 Icon 引用改走同一模块
- [x] 文档说明 dev/prod 与 used.json

## 验证

- [x] 满足 REQUIREMENTS.md 验收标准
- [x] `pnpm --filter @ingot/vite-config test:unit` 与 admin-core 相关单测通过
- [x] `pnpm check:docs`

## 收尾

- [x] 验收通过后再写入 `specs/current/` 并归档（本次不提前改 current）
