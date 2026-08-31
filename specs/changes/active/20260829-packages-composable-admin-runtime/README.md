# 20260829-packages-composable-admin-runtime

> 状态：draft

## 协作模式

前端架构演进（一人全栈）

## 背景与动机

当前 `ingot-admin` 与 `ingot-login` 是 pnpm workspace 中彼此独立的 Vite 应用。管理台的动态路由通过 `import.meta.glob("@/pages/**/*.vue")` 解析当前 app 内的页面，组件自动导入也只扫描当前 app 的 `src/components` 与 `src/layouts`。因此，仅在 `apps/target-project` 增加页面并不会让它与 `ingot-admin` 的页面组合为同一个应用。

后续项目需要复用稳定的后台壳层和基础页面，只开发项目增量能力，并在一个二级域名下构建、部署为一个 SPA。框架同时需要保留现有组件自动导入和第三方组件安装能力，并为插件提供显式的页面、组件、指令和 Vue plugin 注入协议。

## 目标

- 建立构建期插件化、启动期统一注册的后台运行时。
- 把管理台公共壳层与基础业务能力拆成可版本化依赖的 workspace packages。
- 将 `ingot-admin` 改为组合基础插件的参考 app，保持现有页面行为不变。
- 新增 `target-project` 示例 app，将基础页面与三个项目示例页面构建为一个 SPA。
- 保留 app/package 内部的组件自动导入，并支持插件清单显式注入全局组件、指令和第三方 Vue plugins。
- 为未来独立仓库消费提供 ESM、类型声明、CSS、共享 Vite 配置和安装验证。

## 范围

### In Scope

- `@ingot/admin-core`：插件契约、启动器、注册中心、壳层、公共路由、Pinia、鉴权、请求层、公共组件、指令和样式。
- `@ingot/admin-base`：现有 dashboard、org、platform 等基础页面及其业务 API/models，导出 `adminBasePlugin`。
- `@ingot/vite-config`：app 与 Vue library 共用的 Vite、UnoCSS、自动导入、组件解析和 SVG 配置工厂。
- `ingot-admin`：改为 `admin-core + admin-base` 的薄组合入口。
- `target-project`：组合基础插件和本地 target 插件，提供 D/E/F 三个无后端依赖的验证页面。
- 后端菜单 `viewPath` 的稳定页面键解析与旧 `@/pages/**`、`@/layouts/**` 值兼容。
- 插件依赖排序、冲突检测、未知页面受控错误、独立打包消费验证、构建脚本、CI/CD 示例和开发文档。

### Out of Scope

- 上线后从远程地址安装、卸载或热替换未知插件。
- Module Federation、qiankun、iframe 或其它运行时微前端方案。
- 插件市场、在线安装界面、插件签名与远程沙箱。
- target 覆盖 core/base 的同名组件、页面、路由、store 或 guard。
- 重构 `ingot-login` 为管理台插件；登录应用继续独立构建部署。
- 本 change 直接修改后端接口或批量更新后端菜单数据；仅提供兼容解析和迁移约定。

## 输入来源

- 接口文档：无独立 inbox 投递；根据现有 `UserMenuAPI` 与本次前端公共接口整理 `API.md`
- 需求文档：用户对话中的“构建期插件化 Ingot 后台框架”完整方案
- 后端来源：现有 `/api/pms/v1/auth/user/menus`，本次不新增后端端点

## 工件

- [接口](./API.md)
- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)
- [分阶段任务](./phases/README.md)

## 风险与依赖

- 管理台当前大量代码依赖 app 级 `@/` 别名和 auto-import；抽包时必须改为包内边界，避免发布产物依赖消费方源码结构。
- Vue、Vue Router、Pinia 与 Element Plus 必须保持单实例；package 需要正确配置 peer dependencies 和 Vite externals。
- 当前工具链基线已升级为 Vue 3.5、Vue Router 5、Pinia 4、Element Plus 2.14、TypeScript 6 与 Vite 8；新 packages 必须复用 workspace catalog，禁止重新维护一套版本。
- Vite 8 已使用 Rolldown，新的共享构建配置必须使用 `build.rolldownOptions`，不得继续新增已弃用的 `rollupOptions`。
- UnoCSS、全局 CSS、SVG 虚拟模块和异步页面 chunk 在 library/app 两种构建方式下都要验证。
- 旧后端菜单使用源码路径作为 `viewPath`；兼容别名移除前必须完成后端数据迁移。
- 这是大范围文件移动，实施期间不得与其它修改 admin 公共组件、Router、net 或 stores 的 change 并行施工。

## 相关链接

- [项目宪章](../../../CONSTITUTION.md)
- [编码规范](../../../../.agents/skills/ingot-coding-standards/SKILL.md)
- [现有 monorepo 构建说明](../../../../docs/monorepo-build-optimization.md)

## 完成记录

- 完成日期：
- 关联提交或 PR：
- 更新的 current capability：
- 与原设计的差异：
- 取消原因：
