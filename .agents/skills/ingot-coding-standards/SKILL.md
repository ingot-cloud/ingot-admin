---
name: ingot-coding-standards
description: Enforces ingot-admin monorepo coding standards for Vue 3, TypeScript, Pinia, UnoCSS, and Element Plus. Use when writing or modifying .vue/.ts files, creating pages, components, API modules, stores, or hooks in this repository.
---

# ingot-admin 编码规范

本 SKILL 基于 ingot-admin monorepo 现有良好实践，并纠正已扫描到的不良习惯。编写或修改代码时**必须遵循**。

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
- [ ] 跨 app 逻辑优先放 packages/，不复制
```

## 目录约定

```
apps/{app}/src/
├── api/           # 按业务域拆分（common/org/platform）
├── components/    # 全局组件 In* / Biz*（自动注册）
├── hooks/         # biz/ web/ components/
├── layouts/
├── models/        # DTO/VO/枚举/R<T>/Page<T>
├── net/           # Http 单例 + 拦截器
├── pages/         # 页面（非 views/）
├── router/
├── stores/modules/
└── utils/
```

## 必须遵循

### Vue 组件

- 组合式 API + `<script setup lang="ts">`，禁止选项式 API（第三方遗留除外）
- 文件名 PascalCase；设计系统 `In*`，业务 `Biz*`；页面入口 `IndexPage.vue`
- 复杂组件用 `defineOptions({ name, inheritAttrs })` + `withDefaults(defineProps<T>(), defaults)`
- 双向绑定优先 `defineModel<T>()`
- 内部事件处理函数加 `private` 前缀（如 `privateOnConfirm`）

### 页面四件套

参考 `apps/ingot-admin/src/pages/platform/base/dict/`：

| 文件            | 职责                            |
| --------------- | ------------------------------- |
| `IndexPage.vue` | 路由入口，编排表格/筛选/抽屉    |
| `table.ts`      | 表头 `TableHeaderRecord[]` 配置 |
| `useOps.ts`     | 筛选 + `usePaging` 分页逻辑     |
| `components/`   | 页面私有子组件                  |

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
- Http 单例统一：`import Http from "@/net"`

### 样式

- 布局/间距优先 UnoCSS 原子类（`flex`、`gap-10px`、`w-full`）
- 组件样式用 `<style lang="postcss">` + nesting，需要隔离时加 `scoped`
- 主题色/边框用 CSS 变量 `var(--in-*)`
- **禁止** scss/less；**避免** inline `style="width: 160px"`，改用 UnoCSS

### Hooks

- 放 `src/hooks/{biz,web,components}/`
- Vue/Pinia/VueRouter/VueUse 由 auto-import 提供，无需显式 import
- 分页逻辑复用 `usePaging` + `transformPageAPI`

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
| 跨 app 复制 net/utils/组件               | 抽取到 `packages/@ingot/utils` 或 `@ingot/hooks`                 |
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
