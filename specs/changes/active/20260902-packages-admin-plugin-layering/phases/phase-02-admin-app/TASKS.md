# Phase 02：Admin 收敛与 App 工具

## 默认 Admin

- [ ] 将 admin 依赖切换为四个 `@ingot/*-plugin`
- [ ] 新增 `src/plugins.ts` 并默认注册全部官方插件
- [ ] 清除 admin 内业务页面和本地 Dashboard 插件残留
- [ ] main.ts 从 `VITE_APP_CODE` 读取 appCode，默认 `ingot-admin`
- [ ] 验证现有 admin dev/build、Docker 和部署产物

## Target 移除

- [ ] 删除 `apps/target-project`
- [ ] 删除 target 根 dev/build 命令和 package/TS references
- [ ] 删除 target 的 CI build、Docker、deploy job 和所有文档引用

## Create App

- [ ] 将官方选择项切换为四个 `@ingot/*-plugin` 并默认全选
- [ ] 生成集中式 `src/plugins.ts` 和一致的 package dependencies
- [ ] 保留可选 App 私有插件骨架，更新其 dependsOn 和页面注册
- [ ] 在 UI、CLI 输出和模板 README 中说明 admin 是普通项目首选
- [ ] 更新 scaffold 单测，覆盖全选、裁剪、空插件和私有插件
