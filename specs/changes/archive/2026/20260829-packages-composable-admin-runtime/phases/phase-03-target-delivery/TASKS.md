# Phase 3：目标应用与交付

## 实现

- [x] 创建 `target-project` app、typed config 和本地 `targetPlugin`
- [x] 创建 D 插件概览、E 共享 Pinia 状态、F 全局组件/指令验证页面
- [x] 为 target 插件声明稳定页面键、业务全局组件、指令和必要的静态路由
- [x] 增加 mock 后端菜单的 target 路由/状态/组件集成测试
- [x] 更新 workspace、根 scripts 与构建顺序，增加 target dev/build/preview
- [x] 增加 target Docker/Nginx SPA 配置与参数化 CI build/deploy 示例
- [x] 实现 `pnpm pack` 隔离消费 fixture/脚本，验证 ESM、d.ts、CSS、peer 单实例及发布 manifest 无 `catalog:`/`workspace:`
- [x] 增加创建 app/插件脚手架或模板，生成 manifest、页面键、配置和测试骨架
- [x] 编写插件开发、组件注入、菜单键迁移、版本升级和独立仓库消费文档

## 验证

- [x] target type-check、unit、production build 通过
- [ ] A–F 在一个 SPA 内跳转且共享 Router/Pinia/鉴权/主题（需联调后端菜单配置 `target.demo.*`）
- [x] 全局组件、指令、第三方 Vue plugin 与自动导入同时正常（集成测试覆盖注册；页面需菜单可达）
- [ ] 深层刷新、登录回调、退出登录与 Nginx fallback 正常（需部署/联调）
- [x] 隔离工程不访问 monorepo 源码即可完成类型检查和构建（`pnpm test:pack`）
- [x] 隔离工程使用 TypeScript 6 与 Vite 8 完成验证，workspace catalog 升级后能够同步校验 peer ranges
