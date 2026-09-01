# 设计：构建期插件化后台框架

公共接口见 [API.md](./API.md)，页面与验收见 [REQUIREMENTS.md](./REQUIREMENTS.md)。

## 技术方案

采用“构建期插件化 + 启动期统一注册”的模块化单体前端。插件是普通 ESM 依赖，参与 Vite 构建和类型检查；浏览器运行时不加载未知远程代码。每个 app 只创建一次 Vue、Pinia 和 Router，所有插件共享这三个实例。

### 包边界

```text
packages/admin-core
├── bootstrap/       # bootstrapAdminApp 与运行时上下文
├── plugin/          # 契约、拓扑排序、注册表、错误类型
├── app/             # 根组件与公开 shell slots
├── router/          # 公共路由、guards、菜单转换与未知页面
├── stores/          # app/auth/user/router/tabs 等公共 store
├── net/             # Http、拦截器、挑战重试
├── components/      # 公共 In*、ChallengeHost、第三方 Vue plugin 安装
├── layouts/         # main/simple/iframe/external
├── pages/common/    # init、redirect、403/404/500、插件页面不可用
└── styles/

packages/admin-base
├── api/             # dashboard/org/platform 业务 API
├── models/          # 基础业务 DTO/VO/枚举
├── pages/           # 现有 dashboard/org/platform 页面
├── stores/          # 仅基础业务专属 store
└── plugin.ts        # adminBasePlugin 与稳定键/旧路径别名

packages/vite-config
├── app.ts           # defineIngotAppConfig
├── library.ts       # defineIngotLibraryConfig
└── index.ts
```

`admin-core` 只保留所有后台 app 都必须共享的运行时与 UI 壳层；基础业务页面不得反向进入 core。`admin-base` 可以依赖 core 的公开导出，core 不依赖 base，避免循环依赖。

### 插件注册流程

1. `validateAndSortPlugins` 校验 ID、API 版本和依赖图，返回稳定的拓扑顺序；无依赖插件保持 manifest 声明顺序。
2. 创建 app、Pinia、Router 和只读 runtime context。
3. 注册 core 自带布局、公共页面、`In*` 组件、指令和 `vue3-tree-org`。
4. 按插件顺序合并 `pages`、`components`、`directives`、`staticRoutes`；所有 registry 同时记录 owner plugin ID。
5. 静态路由在首次导航前注入；后端菜单在现有 guard 中获取，`viewPath` 改由 page registry 解析。
6. 执行插件 `install`；全部成功后 mount。任一 install 失败时不 mount，并保留原始 error cause。

注册表在 mount 后冻结，只暴露读取方法。插件不能直接获得可修改的其它插件 manifest。

### 页面键与兼容

- core 固定键：`ingot.layout.*`、`ingot.common.*`。
- base 固定前缀：`ingot.base.*`，由功能域和页面语义组成。
- target 固定前缀：`target.*`；真实项目用自身 appCode 替换 `target`。
- `adminBasePlugin` 构建时显式导出页面映射，并为现有 `@/pages/...` 注册同一 loader 的别名。
- core 为四种现有 `@/layouts/...` 注册别名。
- `transformMenu` 不再调用 app 内 `import.meta.glob`；未知键绑定 `PluginPageUnavailable`，通过 route props 传入 `appCode`、`viewPath`。

后端菜单切换为稳定键属于独立后端配置迁移；本 change 不删除兼容别名。

### 组件动态注入

保留两层机制：

1. **编译期自动导入**：共享 Vite 配置扫描当前 app/package 自己的 `components`、`layouts` 和 `hooks`，生成各自的 d.ts。
2. **启动期显式注册**：插件 manifest 声明跨页面全局组件、指令和第三方 Vue plugins，bootstrap 在 mount 前调用 `app.component`、`app.directive`、`app.use`。

package 内部组件不依赖消费 app 扫描 `node_modules` 源码。公开全局组件从 package 根导出，并通过 Vue module augmentation 提供类型。私有页面组件继续显式导入或在 package 自己的构建阶段自动导入。

组件命名规则：core 设计系统使用 `In*`；插件业务全局组件使用 `Biz<Domain><Name>`。相同注册名一律报错，不提供覆盖开关。

### 应用组合

`ingot-admin` 只保留入口、环境配置、HTML/静态资源和 app 专属品牌配置：

```ts
await bootstrapAdminApp({
  appCode: "ingot-admin",
  plugins: [adminBasePlugin],
  branding,
  login,
});
```

`target-project` 使用同一入口并加入本地 `targetPlugin`。D/E/F 分别验证插件元信息展示、共享 Pinia 状态和全局组件/指令注入，不引入虚构后端 API。生产菜单仍由后端下发；测试通过 mock 菜单验证六页面组合。

### 构建与发布

- `admin-core`、`admin-base` 使用 Vue library build 输出 ESM、`.d.ts`、CSS 和异步页面 chunks。
- 当前实现基线为 Node 22.17、pnpm 10.12.4、Vue 3.5.42、Vue Router 5.3.0、Pinia 4.0.3、Element Plus 2.14.5、TypeScript 6.0.3 和 Vite 8.2.2。
- workspace 普通/开发依赖统一引用 `pnpm-workspace.yaml` catalog；不得在三个新 package 中重复硬编码同一依赖的精确版本。
- Vue、Vue Router、Pinia、Element Plus、VueUse 及直接引用的 `@vue/shared` 作为 peer dependencies，并通过 Vite 8 `build.rolldownOptions.external` 排除。
- peer ranges 以当前 catalog 的 compatible major/minor 为边界；升级 catalog 时必须同步更新 peer ranges 和隔离消费测试。
- Vue packages 继承根 TypeScript 6 配置，保持 `moduleResolution: "Bundler"`，不回退到 Node resolution。
- package 内部不使用指向消费 app 的 `@/`；包间引用只走公开的 `@ingot/*` exports。
- `vite-config` 提供 app/library 配置工厂，各 app 只补端口、代理、标题、图标目录等参数。
- 根 scripts 增加 core/base/config 构建和 target dev/build；build 顺序由 workspace 依赖决定。
- CI 为 target 增加 build、Docker、deploy 模板参数；OAuth client 与 callback URI 仍由部署环境配置。
- 隔离消费验证先 `pnpm pack` 三个 package，检查 tarball manifest 已将 `catalog:`/`workspace:` 转换为 semver，再在临时 fixture 安装并执行 TypeScript 6 type-check 和 Vite 8 production build。

## 对接映射

| 接口（见 API.md） | 前端 | 说明 |
|-------------------|------|------|
| `GET /api/pms/v1/auth/user/menus` | `@ingot/admin-core` 的 router store 与 page registry | 响应结构不变，`viewPath` 支持稳定键和旧别名 |
| 插件 TypeScript API | `packages/admin-core/src/plugin/` | manifest、context、错误、排序与 registry |
| App/Library Vite API | `packages/vite-config/src/` | app 与发布包共用配置工厂 |
| 基础页面清单 | `packages/admin-base/src/plugin.ts` | 稳定页面键及旧路径 aliases |

## 数据模型

- `InAdminPlugin`、`InAdminPluginContext`、`InAdminAppOptions`、`InAdminRuntime`、`InBrandingConfig`、`InLoginConfig` 见 `API.md`。
- registry 内部记录 `{ ownerPluginId, value }`，用于冲突诊断；不公开可变 Map。
- shell slot 使用有限联合类型，第一版仅开放 header/sidebar 四个位置。
- target 共享状态使用 `defineStore("target.shared", () => ...)`，用于验证单 Pinia 实例。

## 组件与页面影响

- 原 `ingot-admin/src/App.vue`、layouts、公共组件、Router、stores、net 和公共页面迁入 core 后，由公开 exports 使用。
- 原 dashboard/org/platform 页面与业务 API/models 迁入 base，页面行为和后端 API 不变。
- `ingot-admin` 的环境变量兼容现有名称，通过入口转换为 typed bootstrap options。
- `ingot-login` 不依赖 admin core，继续使用现有共享 utils/hooks/crypto。
- 新增 target 三个验证页遵循 `IndexPage.vue` 页面结构；无表格的简单验证页不创建空 `table.ts`/`useOps.ts`。

## 迁移与回滚

- 迁移按 phases 顺序进行，每一阶段必须保持 type-check/build 可运行。
- 抽取采用文件移动并保留 Git 历史，不复制两套实现。
- 在 `ingot-admin` 完成等价验证前不删除原入口兼容配置。
- 若 package 构建或运行时行为无法达到等价，回滚当前 phase，不允许以跨 app 深层导入作为临时长期方案。
- 旧菜单 aliases 在本 change 完成后继续保留，后续通过独立 change 删除。

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| Monorepo 边界 | ✅ | 跨 app 的 shell、状态、路由、组件与构建配置全部进入 packages |
| 页面结构 | ✅ | 迁移保留现有结构；target 简单验证页使用独立 `IndexPage.vue` |
| API 层 | ✅ | 现有 API 行为不改；base 内继续遵守 XxxAPI 与显式返回类型 |
| 类型安全 | ✅ | 公共插件契约与 registry 全类型化，禁止 any/as any |
| 组件约定 | ✅ | 保留 `In*`/`Biz*`，新增全局资源冲突校验与类型声明 |
| UnoCSS | ✅ | 共享 Vite 配置保留 UnoCSS，package 输出自身 CSS |
| 输入先行 | ✅ | 本 change 先停在 draft，批准后施工 |
| 可追溯 | ✅ | 分阶段 TASKS、验收、current 更新和归档完整保留 |

## 备选方案

- **微前端/远程插件**：未采用。当前目标不需要独立运行时部署，复杂度与安全成本过高。
- **复制 ingot-admin 模板**：未采用。无法通过版本化依赖持续获得基础修复。
- **target 深层导入 ingot-admin/src**：未采用。破坏 app 边界，无法支持独立仓库。
- **让消费 app 扫描 package 源码**：未采用。发布产物依赖构建器内部目录且类型、CSS不稳定。

## 开放问题

无。实现偏离本设计时必须先更新本 change 并重新确认。
