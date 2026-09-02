# Phase 03：宿主与脚手架迁移

## Admin 宿主

- [x] 将 `apps/admin` 改为四插件全量组合宿主
- [x] 将 Dashboard 收敛到本地 `adminHostPlugin`
- [x] 删除公开 `adminPlugin`、`@ingot/admin-app/plugin` exports 和旧依赖约定
- [x] 更新 admin package、Vite 配置、tsconfig 和根 dev/build scripts

## Target Project

- [x] 将 target-project 默认示例改为 `orgPlugin + targetPlugin`
- [x] 移除 `@ingot/admin-app` 依赖及手写 admin source alias
- [x] 更新 targetPlugin 依赖和现有插件测试

## Create App

- [x] 把四个官方业务插件加入 OFFICIAL_PLUGINS，默认选择 `ingot-org`
- [x] 根据选择生成精确 package dependencies、imports 和 plugins 数组
- [x] 本地插件默认只依赖 `ingot-admin-core`
- [x] 更新 CLI、Web UI、模板、使用文档和 scaffold 测试
