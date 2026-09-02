# Phase 01：Plugin 层与构建基础设施

## Workspace 与 Vite

- [x] 在 workspace 和根 tsconfig 中加入 `plugins/*`
- [x] 将 official-app 解析 API 泛化并重命名为 official-plugin 解析
- [x] 新增 `defineInSourcePluginConfig` 及自动导入、组件声明和 Vitest 配置
- [x] 更新 Vite 单测，覆盖 workspace 发现、package exports、importer-aware `@/`、dedupe 和 fs.allow
- [x] 更新根 type-check/test/check scripts，插件不加入独立 production build

## 官方插件迁移

- [x] [P] 将 platform App 迁到 `plugins/platform`，移除运行入口并接收 Dashboard
- [x] [P] 将 security App 迁到 `plugins/security`，移除运行入口
- [x] [P] 将 org App 迁到 `plugins/org`，移除运行入口
- [x] [P] 将 member App 迁到 `plugins/member`，移除运行入口
- [x] 将包名改为四个 `@ingot/*-plugin` 并使用源码根 exports
- [x] 分别完成四插件 type-check、lint 和 unit test
- [x] 确认业务接口、模型、Store、组件和页面行为仅发生目录迁移
