---
name: in-coding-standards
description: Enforces this monorepo's coding standards for Vue 3, TypeScript, Pinia, UnoCSS, Element Plus, and HYBRID envelope crypto. Use when writing or modifying .vue/.ts files, creating pages, components, API modules, stores, hooks, or sensitive API encryption.
---

# 编码规范

本 SKILL 基于本仓库现有良好实践，并纠正已扫描到的不良习惯。编写或修改代码时**必须遵循**。

## 技术栈

Vue 3 + `<script setup>` + TypeScript (strict) + Pinia + UnoCSS + Element Plus + pnpm workspace

## 快速检查清单

编写代码前对照：

```
- [ ] 使用 <script setup lang="ts">，SFC 顺序 template → script → style
- [ ] 页面拆分为 IndexPage + table.ts + useOps.ts + components/
- [ ] API 函数命名 XxxAPI，显式 Promise<R<T>>，import request from "@/net"
- [ ] 新代码无 any / as any / == / console.log / 注释死代码
- [ ] emit 使用 kebab-case 语义名（change、success），带类型签名
- [ ] 样式优先 UnoCSS 原子类，禁止 scss/less
- [ ] 跨 app / 插件公共逻辑优先放 packages/，具体主题放 themes/，不复制
- [ ] 列表筛选：下拉用 `InPicker`，查询框无 label，放 `#tools-start`；条件 > 3 个时只直出第一个，其余进 `InFilterPanel`
- [ ] 列表取数：普通分页默认 20，大数据用游标，树页消费接口树；禁止 `pageSize=200` 冒充全量
- [ ] 详情 Tab 内嵌表格时给 `InBizTabPanel` 加 `fill`：内容区定高，只滚表体
```

## 目录约定

```
apps/{app}/src/             # composition root + 本 App 约定扩展
├── app-plugin.ts           # 冻结 glob，加文件不必改
├── plugins.ts
├── pages/                  # IndexPage 四件套；进 registry
├── layouts/
├── components/             # 全局 Biz* 组件
├── hooks/
├── directives/
└── stores/                 # 与 core 同一 Pinia；persist 需显式声明
plugins/{plugin}/src/       # 业务纵向切片
├── api/
├── components/
├── models/
├── pages/                  # IndexPage + table.ts + useOps.ts + components/
├── stores/
└── plugin.ts
packages/                   # 无页面公共抽象（http-client / admin-core / admin-common / shared）
themes/<id>/                # 正式主题包 @ingot/theme-<id>；默认主题仍在 admin-core
```

官方插件不得互相依赖；跨插件复用进入 `packages/`。具体主题进入 `themes/`，不要放进 `packages/`。App 全局组件必须 `Biz*`，禁止 `In*` / `El*`。页面示例见 `plugins/platform/src/pages/config/dict/`。

## 必须遵循

### Vue 组件

- 组合式 API + `<script setup lang="ts">`，禁止选项式 API（第三方遗留除外）
- 文件名 PascalCase；设计系统 `In*`，业务 `Biz*`；页面入口 `IndexPage.vue`
- 复杂组件用 `defineOptions({ name, inheritAttrs })` + `withDefaults(defineProps<T>(), defaults)`
- 双向绑定优先 `defineModel<T>()`
- 内部事件处理函数加 `private` 前缀（如 `privateOnConfirm`）

### 页面四件套

参考 `plugins/platform/src/pages/config/dict/`：

| 文件            | 职责                              |
| --------------- | --------------------------------- |
| `IndexPage.vue` | 路由入口，编排表格/筛选/抽屉      |
| `table.ts`      | 表头 `TableHeaderRecord[]` 配置   |
| `useOps.ts`     | 筛选 + `useServerPaging` 分页逻辑 |
| `components/`   | 页面私有子组件                    |

### 多页面模块目录

一个业务模块包含多个**独立路由页面**（如列表页 + 详情页）时，**每个页面单独一个子目录**，目录内各自放 `IndexPage.vue`、`table.ts`、`useOps.ts` 及 `components/`：

```
pages/platform/base/app/
├── home/                 # 列表页
│   ├── IndexPage.vue
│   ├── table.ts
│   ├── useOps.ts
│   └── components/       # 列表页私有组件（如 CreateDrawer.vue）
└── detail/               # 详情页
    ├── IndexPage.vue
    └── components/        # 详情页私有组件与各自 table.ts
```

- ❌ 禁止把多个页面的入口、组件、table.ts 平铺在模块根目录
- 组件只被某个页面使用 → 放该页面的 `components/`；被多个页面共用 → 上提到模块根 `components/`
- 详情页等非菜单页面通过静态路由注册（见 `router/routes/common.ts`），列表页 viewPath 指向 `xxx/home/IndexPage.vue`

### Pinia Store

- 仅用 Setup Store：`defineStore("domain.feature", () => { ... })`
- 持久化用 `persist: { storage, pick }` 配置
- **不同域的 store 导出名必须带域前缀**，禁止新增同名导出：
  - ✅ `useOrgDeptStore`（org 域）vs `useDeptStore`（platform 域）
  - ❌ 两个模块都导出 `useDeptStore`

### API 层

- 模块级 `const PATH = "/api/..."` 常量
- 函数命名：`动词 + 名词 + API`（如 `UserPageAPI`），**禁止**漏掉 `API` 后缀
- 显式返回 `Promise<R<T>>`；类型来自 `@/models`
- 写操作/查询前对 condition 调用 `filterParams()`
- Http 单例统一：`import request from "@/net"`；API 第三参可选 `options?: RequestOptions`

### 列表筛选

列表、双栏列表的筛选是默认统一标准，参考通讯录成员管理 / 部门管理 / 应用管理：

- 筛选放 `InTable` `#tools-start`（≤ 3 个条件全部直出；> 3 个只直出第一个，其余进 `InFilterPanel`「筛选」浮层 → 字段设置），不要用 `#header`，也不要再铺 `InFilterItem` + `InWithLabel`
- **下拉用 `InPicker`**：带 `label`（如「状态」），选项以「全部」为首项；`value: ""` 表示不传该条件；切换后立即重查。用 `withAllPickerOption` / `resolveStringPickerFilter` / `toStringPickerValue`（布尔条件用 `resolveBooleanPickerFilter`）
- **查询不要 label**：文本搜索用无 label 的 `el-input`，`placeholder` 写成「搜索部门名」这种，`:prefix-icon="Search"`，回车或清空即查；不要 `InWithLabel`，也不要单独的搜索主按钮
- **少的直出、多的进筛选浮层**：条件总数 ≤ 3 时全部直出（主搜索仍排第一）。条件总数 > 3 时只直出第一个（通常是主搜索），其余一律放 `InFilterPanel`。含远程实体选择（`TenantSelect` / `InPageSelect`）时也进浮层，不占用直出位。按钮文案是「筛选」（`aria-label="筛选条件"`），不要叫「更多」（那是 `InTableActions`），也不要用对话框或抽屉。有已生效额外条件时显示数量角标（不含第一个直出条件）。浮层内仍用 `InPicker` / 无 label 查询，切换或回车即查；底部可「重置」清空额外条件
- `InPicker` 只用于工具栏单选，不替代表单 `InSelect`；远程实体选择（`InPageSelect` / `TenantSelect`）不是枚举下拉，保持原控件
- `#top` 只留给会改左树的上下文筛选；字典作用域放左栏（先限制类型树），不要把普通列表查询放回去

### 列表取数

列表、选择器和树的取数是默认统一标准，禁止用大页码假装拿全量。

- **普通分页**：列表和远程选择器走服务端分页，默认 `pageSize`/`size` 为 20，翻页或「加载更多」再请求下一页。数据量不大也用正常分页，不要一次拉满。
- **大数据**：总量大或需要连续滚动时用游标（cursor / `nextToken`），不要靠加大页码或循环翻页拼全集。
- **树**：页面需要树形结构时，必须消费接口直接返回的树（如 `view=tree` 或独立 `/tree`）。禁止把平铺分页在前端按 `parentId` 组树，也禁止为组树把 `pageSize` 调到上限。
- **Tab 内表格**：详情抽屉等 Tab 里放 `InTable` 时，面板加 `fill`。Tab 内容区定高，工具栏/分页固定，只滚表体；不要让整个 Tab 跟着列表一起滚。
- **禁止**：`pageSize`/`size = 200`，或把接口允许的最大页（例如 IAM `MAX_SIZE=200`）当成「一次拿全量」的手段。选择器预填、详情回显用已选 ID 查名称，不要为回显预拉全集。

### 样式

- 布局/间距优先 UnoCSS 原子类（`flex`、`gap-10px`、`w-full`）
- 组件样式用 `<style lang="postcss">` + nesting，需要隔离时加 `scoped`
- 主题色/边框用 CSS 变量 `var(--in-*)`
- **禁止** scss/less；**避免** inline `style="width: 160px"`，改用 UnoCSS

### Hooks

- 放 `src/hooks/{biz,web,components}/`
- Vue/Pinia/VueRouter/VueUse 由 auto-import 提供，无需显式 import
- 分页逻辑复用 `useServerPaging`（含手机号搜索同样走 Query，Key 用敏感指纹）

### 命名语言

- 标识符、文件名、类型名：**英文**
- 注释、UI 文案、错误提示：**中文**
- Prettier：双引号、分号、`printWidth: 100`

## 禁止清单

基于代码扫描（`: any` 100 处、`as any` 11 处等），**新代码严格禁止**；修改已有文件时顺手修复触碰到的违规项。

| 禁止项                                   | 正确做法                                                         |
| ---------------------------------------- | ---------------------------------------------------------------- |
| `: any` / `as any`                       | 用具体类型或泛型；树节点用 Element Plus `Node` 类型              |
| `==` 松散比较                            | 始终 `===`                                                       |
| emit 名 `onChanged` / `@on-changed` 混用 | 统一 kebab-case 语义名：`change`、`success`、`update:modelValue` |
| `defineEmits(["onChanged"])` 无类型      | `defineEmits<{ change: [value: T] }>()`                          |
| `defineProps<{ title: String }>()`       | 用小写 TS 类型：`title?: string`                                 |
| `import Http from "@/net"`               | 统一 `import request from "@/net"`                               |
| 注释掉旧代码保留                         | 直接删除，Git 可追溯                                             |
| `console.log` / `console.debug`          | 移除或用 `@/utils/message`                                       |
| `eslint-disable` 掩盖未用参数            | 修正函数签名或移除参数                                           |
| `throw "字符串"`                         | `throw new Error("...")`                                         |
| 跨 app 复制 net/utils/组件               | 抽取到 `packages/shared` 或 `packages/admin-core`                |
| 新增正式主题放进 `packages/`             | 放到 `themes/<id>/`，包名 `@ingot/theme-<id>`                    |
| 新增无域前缀的同名 store                 | 带域前缀命名                                                     |

## 修改已有代码时

1. **触碰到的 `any`**：优先替换为正确类型
2. **触碰到的 emit/props**：对齐 kebab-case + 类型签名
3. **新增 API**：必须带 `API` 后缀 + 显式返回类型
4. **新增页面**：必须拆四件套，不单文件堆逻辑
5. **文件 > 300 行**：考虑拆分子组件或 composable

## 详细参考

- Vue 组件/页面/Store/样式示例 → [vue-conventions.md](vue-conventions.md)
- API/TypeScript/Net 层示例 → [api-conventions.md](api-conventions.md)
- Git 提交信息 → [in-conventional-commits](../in-conventional-commits/SKILL.md)
