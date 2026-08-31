# Phase 1：运行时与构建基础

## 实现

- [x] 创建 `@ingot/admin-core`、`@ingot/vite-config` package manifests、TS/Vite 配置与 public exports；依赖复用 workspace catalog，peer ranges 对齐当前 catalog
- [x] 实现插件类型、API 版本、错误类型、依赖校验和稳定拓扑排序
- [x] 实现页面/组件/指令/路由 registry、owner 追踪、冲突检测与 mount 后冻结
- [x] 实现 typed bootstrap 骨架和插件 `vuePlugins`、声明式资源、`install` 的固定执行顺序
- [x] 实现 core 稳定布局键、旧布局路径 aliases 与未知插件页面组件
- [x] 实现 `defineIngotAppConfig`、`defineIngotLibraryConfig`，使用 Vite 8 `rolldownOptions`，保留 UnoCSS、AutoImport、Components、SVG 和 CSS 输出
- [x] 确认 Vue package 的 TypeScript 6 配置继承 `moduleResolution: "Bundler"`，类型产物不依赖 app 源码 alias
- [x] [P] 为插件排序、版本/依赖错误、所有 registry 冲突和未知页面解析补单元测试

## 验证

- [x] core/config 类型检查和 library build 通过
- [x] Vite 8 构建不使用已弃用的 `rollupOptions`
- [x] registry 测试覆盖 API.md 中全部错误码
- [x] 测试确认失败插件不会 mount 应用
