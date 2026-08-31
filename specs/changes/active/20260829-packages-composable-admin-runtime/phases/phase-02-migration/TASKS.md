# Phase 2：管理台抽取与迁移

## 实现

- [x] 创建 `@ingot/admin-base` package 与 `adminBasePlugin`
- [x] 将根组件、layouts、公共路由/guards、公共 stores、net、公共 hooks/components/directives/styles 移至 admin-core
- [x] 将 dashboard/org/platform 页面、业务 API/models 和专属 stores 移至 admin-base
- [x] 消除 package 对消费 app `@/` 的依赖，包间引用只使用公开 exports
- [x] 为所有菜单页面建立稳定页面键，并注册现有 `@/pages/**` legacy aliases
- [x] 将 `vue3-tree-org` 安装迁移到 core 的 `vuePlugins`，保留组件自动导入和全局组件类型
- [x] 将环境变量转换为 typed bootstrap options，改造 `ingot-admin` 为薄组合入口
- [x] 修正迁移中触碰到的 any、松散比较、旧 Http 命名等编码规范问题
- [x] [P] 增加菜单解析、静态路由、公共组件注册和 Pinia 单实例集成测试

## 验证

- [x] `ingot-admin` type-check、unit、production build 通过
- [x] 原后端菜单旧 viewPath 全部可解析
- [x] 核对原有路由、权限、登录、挑战验证、页面和全局组件行为等价
- [x] `ingot-login` 构建与行为未回归
