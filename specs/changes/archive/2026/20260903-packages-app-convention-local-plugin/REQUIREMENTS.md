# 需求：App 约定本地插件与自动注入

## 场景与页面

### 场景 1：在 admin 约定目录扩展本部署能力

- **角色**：后台项目开发者
- **入口**：`apps/admin/src/{pages,layouts,components,hooks,directives,stores}`
- **步骤**：在对应目录新增 `IndexPage.vue` / `Biz*` 组件 / hook / store，不改 `app-plugin.ts`
- **预期结果**：页面进入 registry；组件可在模板中直接使用；hook/store 可直接调用；`InButton`、`usePaging` 仍可用

### 场景 2：自定义与核心能力重名

- **角色**：后台项目开发者
- **入口**：App `src/components/InButton.vue` 或 `src/hooks/usePaging.ts` / `src/stores/useAppStore.ts`
- **步骤**：保存后启动或构建
- **预期结果**：构建或启动失败，不静默覆盖 admin-core

### 场景 3：create-app 始终带约定插件

- **角色**：需要独立 App 的开发者
- **入口**：`pnpm create:app`
- **步骤**：默认或关闭「本地 Demo」后生成
- **预期结果**：始终存在 `src/app-plugin.ts` 与约定目录；关闭 Demo 时无示例页/菜单，仍注册约定插件

### 场景 4：App store 与 persist

- **角色**：后台项目开发者
- **入口**：`src/stores/`
- **步骤**：用 `defineStore` 新建 store；需要落盘时写 `persist: { storage, pick }`
- **预期结果**：与 admin-core 同一 Pinia 实例；未写 `persist` 不落盘；写了则使用 `storePrefix` 键前缀

## 验收标准

- [ ] `apps/admin` 具备约定目录与冻结的 `app-plugin.ts`
- [ ] 新增组件/页面/hook/指令不必改注册文件
- [ ] `In*` / `El*` 组件名与保留 hook/store 导出名构建失败
- [ ] 与官方插件全局组件重名时启动失败
- [ ] create-app 始终生成约定插件；Demo 可关
- [ ] Store 不默认 persist

## ADDED

### REQ-A001：App 约定目录与零注册扩展

系统 SHALL 为每个管理台 App 提供约定本地插件。开发者在 `pages` / `layouts` / `components` / `hooks` / `directives` / `stores` 创建文件即可，不必维护组件或指令映射。

**验收标准：**

- [ ] `defineAppLocalPlugin` 接受组件/指令 glob
- [ ] 全局组件仅扫描 `src/components/**/*.vue`，文件名必须 `Biz*`
- [ ] hook/store 由 AutoImport 注入
- [ ] 菜单不从 pages 自动生成

### REQ-A002：自动注入与重名失败

系统 SHALL 将 App 组件注册为运行时全局组件，并自动导入 App hook/store；与 admin-core 或已注册插件资源重名时失败。

**验收标准：**

- [ ] 模板可同时使用 `<InButton />` 与 App `<BizXxx />`
- [ ] 构建期拒绝 `In*` / `El*` 组件文件及保留导出名
- [ ] 运行时 `DUPLICATE_COMPONENT_NAME` 仍生效

### REQ-A003：同一 Pinia，persist 显式声明

系统 SHALL 让 App store 使用 bootstrap 创建的同一 Pinia 与已安装的 persistedstate 插件。persist 必须在 store 上显式声明。

**验收标准：**

- [ ] App 不得再 `createPinia`
- [ ] 未写 `persist` 的 store 不写入 localStorage
- [ ] Pinia id 使用 appCode 点分前缀

## MODIFIED

### REQ-M001：REQ-003 → admin 允许约定目录扩展

**变更说明：** admin 仍是 composition root，不复制官方插件页面；允许本部署专属扩展落在约定本地插件。

**验收标准：**

- [ ] `createAdminPlugins(appCode)` 包含官方插件与约定本地插件
- [ ] admin 不包含 Demo 业务页

### REQ-M002：REQ-005 → 脚手架始终生成约定插件

**变更说明：** create-app 始终写入 `app-plugin.ts`；原本地插件开关只控制 Demo。

**验收标准：**

- [ ] 无 Demo 时仍有约定目录与 `createAppLocalPlugin(appCode)`
- [ ] Demo 组件不再手写 `components: { ... }`
