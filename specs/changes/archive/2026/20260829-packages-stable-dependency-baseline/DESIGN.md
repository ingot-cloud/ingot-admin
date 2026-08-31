# 设计：稳定依赖版本基线升级

## 技术方案

采用“先统一环境，再按兼容簇升级”的方式，避免一次安装同时跨越所有大版本：

1. 固定 Node.js 22/pnpm 10，修复 CI 和 tsconfig，并建立升级前验证基线。
2. 升级 Vue 3.5、Element Plus、UnoCSS、VueUse 和常规直接依赖。
3. 升级 Pinia 4、Vue Router 5，验证状态持久化和动态路由。
4. 将 Vite 先升级到 Vite 7 验证，再升级到 Vite 8；同步清理不再需要的旧插件。
5. 升级 TypeScript 6、vue-tsc 3.3、ESLint 10、Vitest 4、Playwright 和格式化工具；
   自定义组件通过显式公开插槽契约兼容新版 Vue 语言服务。
6. 执行完整构建、E2E、人工 smoke test 和生产依赖审计。

### 版本声明

- 在 `pnpm-workspace.yaml` 使用 catalog 管理 app 共同使用的运行时和开发依赖。
- app 通过 `catalog:` 引用公共依赖；app 专属依赖继续在各自 manifest 管理。
- `pnpm.overrides` 不再承担主要版本管理职责，只保留必要的传递依赖约束。
- Vue、`@vue/compiler-sfc`、`@vue/shared` 使用同一个精确版本。
- `packages/hooks` 将 Vue 声明为 peer dependency，并在 dev dependency 中提供构建类型。

### tsconfig 迁移

- app 配置采用 `moduleResolution: "Bundler"`。
- 删除已废弃的 `baseUrl`，保持现有 `paths` 别名。
- Node/Vite 配置继承新版 `@tsconfig/node22` 与 `@vue/tsconfig`。
- 不使用 `ignoreDeprecations` 作为长期解决方案。

### Vite 插件策略

- 用 Vite HTML `%VITE_APP_TITLE%` 替换 `vite-plugin-html` 的标题注入。
- 仓库没有 top-level await 使用时删除 `vite-plugin-top-level-await`。
- 对仍在使用的 CommonJS 依赖启用 Vite 8 `legacy.inconsistentCjsInterop` 兼容行为，避免
  Rolldown 开发期预构建 `crypto-js` 主入口与子入口时产生不一致导出；不改变生产协议或加密实现。
- `vite-plugin-svg-icons` 先在 Vite 8 阶段验证；迁移到现有 `unplugin-icons` 自定义集合前必须完成自定义 SVG 视觉回归。
- Vite 8 默认浏览器目标变化需要通过产物和部署环境确认；有旧浏览器要求时显式配置 target。

### Element Plus 与状态路由

- Element Plus 类型和 locale 仅通过公开入口导入，禁止继续依赖 `element-plus/lib` 或 `dist` 内部路径。
- Pinia 4 增加 `@vue/devtools-api`，保留 persistedstate 4 的 `pick` 配置。
- 当前项目不使用文件路由，Vue Router 5 保留手写 routes 和 guards，不改变业务路由结构。
- 初始路由表提供仅在动态路由启动阶段存在的兜底 matcher，避免刷新动态页面时首次解析产生
  `VUE_ROUTER_R0004`；菜单路由注入成功后立即移除该 matcher，再重定向回原始地址。

### 安全依赖边界

本次只升级能安全替换的直接依赖。`webcrypto-liner`、`crypto-js` 和 `beautify-qrcode`
的替换涉及协议或视觉行为，记录为后续独立 change，不在本次隐式改写。允许通过父依赖限定
override 将 `elliptic`、`rollup`、`defu`、`lodash`/`lodash-es` 升到向后兼容的安全补丁；
这些覆盖必须通过完整构建和生产审计复核。

### 质量工具兼容基线

- `InTable`/`InRadioTable` 使用 `defineSlots` 声明固定工具栏插槽和动态列插槽，消除
  vue-tsc 3.3.11 对未声明插槽的诊断，并让 CLI 与编辑器保持同一检查基线。
- ESLint 10 会发现 214 条已有类型债务。旧验证码 vendor 目录从 lint 范围隔离，其余历史
  `any`、未使用变量等保留 warning；结构性错误和本次新增错误仍作为 error。
- E2E 从脚手架的 `You did it!` 占位断言改为两个真实应用壳的 HTTP/title smoke，并使用
  admin 5798、login 1798 的实际开发端口。

## 对接映射

本次没有后端接口变化。依赖升级只影响构建配置、应用入口、公开类型导入和 package manifest。

## 数据模型

不新增业务 DTO、VO 或枚举。只允许为第三方公开 API 变化调整编译期类型，不改变接口数据结构。

## 组件与页面影响

- 两个 app 的入口、Pinia、Router、Element Plus locale、Vite config 和 HTML 模板可能被触及。
- 业务页面不主动重构；只修复升级导致的类型或公开 API 兼容问题。
- 自定义 SVG 渲染、Element Plus 组件、TinyMCE、二维码和暗色模式纳入人工回归。

## 迁移与回滚

- 每个兼容簇完成后立即执行 type-check/build；失败时只回退当前簇。
- lockfile 与 manifest 同阶段提交，不手工编辑 lockfile。
- 最终通过 clean install 验证可复现性。
- 发布前保留上一稳定构建产物；运行回归时回滚到升级前依赖和 lockfile。

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| Monorepo 边界 | ✅ | 公共版本和工具链在 workspace 根统一管理 |
| 页面结构 | ✅ | 不改变页面目录与路由页面结构 |
| API 层 | ✅ | 不改变后端接口或请求数据模型 |
| 类型安全 | ✅ | 迁移到 TS 6，使用第三方公开类型入口，不引入 any |
| 组件约定 | ✅ | 只做依赖兼容修复，不改变组件模式 |
| UnoCSS | ✅ | 保留 UnoCSS 并统一相关包版本 |
| 输入先行 | ✅ | 用户已确认升级方案，本 change 已建立后再施工 |
| 可追溯 | ✅ | 分阶段任务、版本矩阵、验证和剩余安全例外均记录 |

## 备选方案

- **一次性执行全量 latest**：未采用；无法快速定位 Vite、TypeScript、Pinia 等大版本回归。
- **只添加 ignoreDeprecations**：未采用；会把 tsconfig 迁移成本继续推迟。
- **本次直接采用 TypeScript 7**：未采用；当前 lint 工具链稳定兼容范围不足。
- **同时替换加密依赖**：未采用；协议兼容和安全验证需要独立 change。

## 开放问题

无。超出目标版本同一 minor 的变化或改变业务行为时，必须先更新本设计并重新确认。
