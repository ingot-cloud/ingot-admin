# Vue 组件与页面规范

## SFC 标准模板

```vue
<template>
  <div flex flex-col gap-10px>
    <in-table
      :headers="tableHeaders"
      :data="pageInfo.records"
      :loading="loading"
      :page="pageInfo"
      @change="privateOnPageChange"
    />
    <edit-drawer v-model="visible" @success="privateOnSuccess" />
  </div>
</template>

<script setup lang="ts">
import { tableHeaders } from "./table";
import { useOps } from "./useOps";
import EditDrawer from "./EditDrawer.vue";

const { loading, pageInfo, fetchUserData } = useOps();
const visible = ref(false);

const privateOnPageChange = () => {
  fetchUserData();
};

const privateOnSuccess = () => {
  visible.value = false;
  fetchUserData();
};

onMounted(() => {
  fetchUserData();
});
</script>

<style lang="postcss" scoped>
.page-toolbar {
  & .el-button + .el-button {
    margin-left: 8px;
  }
}
</style>
```

**要点**：template 在前；UnoCSS 原子类布局；emit 监听用 kebab-case（`@change`、`@success`）。

---

## 通用组件模板

复杂组件（如 `InTable`）使用分离 props 文件 + 类型化 emits：

```vue
<script lang="ts" setup>
import type { InTableProps } from "./props";
import { DefaultProps } from "./props";

defineOptions({
  name: "InTable",
  inheritAttrs: false,
});

const props = withDefaults(defineProps<InTableProps>(), DefaultProps);

const emits = defineEmits<{
  "size-change": [size: number];
  "current-change": [current: number];
  refresh: [];
}>();
</script>
```

### props 定义（props.ts）

```typescript
// ✅ 正确：interface + 具体类型
export interface InSelectProps {
  options: Array<{ label: string; value: string | number }>;
  placeholder?: string;
  disabled?: boolean;
}

// ❌ 错误：泛型里用构造函数类型
defineProps<{ title: String }>(); // String 是 JS 构造函数，不是 TS 类型

// ✅ 正确
defineProps<{ title?: string }>();
```

### defineModel

```vue
<script setup lang="ts">
const model = defineModel<string>();
// 或带默认值
const visible = defineModel<boolean>("visible", { default: false });
</script>
```

---

## emit 命名规范

| 场景 | 正确 | 错误 |
|------|------|------|
| 值变化 | `change` | `onChanged`、`on-changed` |
| 操作成功 | `success` | `onSuccess` |
| v-model | `update:modelValue` | `onUpdate` |
| 模板监听 | `@change="handler"` | `@onChanged="handler"` |

```typescript
// ✅ 带类型签名
const emits = defineEmits<{
  change: [value: string];
  success: [];
}>();

// ❌ 无类型字符串数组
const emits = defineEmits(["onChanged"]);
```

---

## 页面四件套

以 `pages/platform/admin/user/` 为参考：

### table.ts — 表头配置

```typescript
import type { TableHeaderRecord } from "@/components/table";

export const tableHeaders: Array<TableHeaderRecord> = [
  { label: "用户名", prop: "username", minWidth: "120" },
  { label: "手机号", prop: "phone", minWidth: "140", transform: (v) => v ?? "-" },
  { label: "状态", prop: "status", width: "80", align: "center" },
  { label: "操作", prop: "actions", width: "200", fixed: "right", align: "center" },
];
```

### useOps.ts — 业务逻辑

```typescript
import type { PageChangeParams } from "@/models";
import { UserPageAPI } from "@/api/platform/admin/user";

export const useOps = () => {
  const paging = usePaging(transformPageAPI(UserPageAPI));

  const resetFilter = () => {
    paging.condition.phone = undefined;
    paging.condition.email = undefined;
    fetchUserData();
  };

  const fetchUserData = (params?: PageChangeParams): void => {
    paging.exec(params);
  };

  return {
    loading: paging.loading,
    condition: paging.condition,
    pageInfo: paging.pageInfo,
    resetFilter,
    fetchUserData,
  };
};
```

### components/ — 页面私有组件

- 抽屉/对话框：`EditDrawer.vue`、`TypeEditDrawer.vue`
- 仅本页面使用的面板：`components/LeftContent.vue`
- 不在 `src/components/` 注册全局组件

### 多页面模块目录结构

一个业务模块含多个**独立路由页面**（列表页 + 详情页等）时，**按页面拆子目录**，每个子目录内各自放四件套：

```
pages/platform/base/app/
├── home/                 # 列表页（菜单 viewPath 指向 home/IndexPage.vue）
│   ├── IndexPage.vue
│   ├── table.ts
│   ├── useOps.ts
│   └── components/
│       └── CreateDrawer.vue
└── detail/               # 详情页（静态路由 /platform/base/app/detail/:appId）
    ├── IndexPage.vue
    └── components/
        ├── BasicInfoPanel.vue
        ├── MenuPanel.vue
        ├── menuTable.ts
        └── ...
```

要点：

- ❌ 不要把多个页面的 `IndexPage.vue`、`table.ts`、组件平铺在模块根目录
- 组件仅单页面使用 → 放该页面 `components/`；多页面共用 → 上提模块根 `components/`
- 非菜单页面（如详情页）用静态路由注册：`router/routes/common.ts` 内挂在 `LAYOUT_MAIN` 下并 `hideMenu: true`
- 页面间跳转用 `useGo({ path })`，路径与路由 `path` 对齐

---

## Pinia Setup Store

```typescript
import type { UserInfo } from "@/models/security";
import { UserInfoAPI } from "@/api/common/user";

export const useUserInfoStore = defineStore("security.user", () => {
  const userInfo = reactive<UserInfo>({
    user: undefined,
    roles: [],
    allows: [],
    mustChangePwd: false,
  });

  const fetchUserInfo = async (): Promise<void> => {
    const { data } = await UserInfoAPI();
    Object.assign(userInfo, data);
  };

  const clear = (): void => {
    userInfo.user = undefined;
    userInfo.roles = [];
  };

  return { userInfo, fetchUserInfo, clear };
});
```

### 持久化

```typescript
export const useLoginStore = defineStore(
  "login",
  () => {
    const state = ref<string>();
    const codeVerifier = ref<string>();
    return { state, codeVerifier };
  },
  {
    persist: {
      storage: localStorage,
      pick: ["state", "codeVerifier"],
    },
  },
);
```

### Store 命名（避免混淆）

| 域 | 正确导出名 | Pinia id |
|----|-----------|----------|
| platform 部门 | `useDeptStore` | `"dept"` |
| org 部门 | `useOrgDeptStore`（新代码） | `"org.dept"` |
| platform 角色 | `useRoleStore` | `"role"` |
| org 角色 | `useOrgRoleStore`（新代码） | `"org.role"` |

---

## 样式规范

### UnoCSS 优先

```vue
<!-- ✅ -->
<div flex flex-col gap-10px p-16px>
  <in-select class="w-160px" />
</div>

<!-- ❌ inline style -->
<in-select style="width: 160px" />
```

### PostCSS nesting + CSS 变量

```vue
<style lang="postcss" scoped>
.card {
  border: 1px solid var(--in-border-color);

  & .card-header {
    padding: 12px 16px;
    color: var(--in-text-color-primary);
  }
}
</style>
```

### 禁止

- `lang="scss"` / `lang="less"`
- 硬编码颜色值（应用 CSS 变量或 UnoCSS 语义类）

---

## 类型：避免 any

### 树组件回调

```typescript
import type Node from "element-plus/es/components/tree/src/model/node";

// ✅
const privateAllowDrag = (node: Node) => node.data.isGroup;

// ❌ 现有不良模式
const privateAllowDrag = (node: any) => node.data.isGroup;
```

### defineExpose

```typescript
// ✅ 声明暴露的类型
defineExpose<{ refresh: () => void }>({ refresh });

// ❌
defineExpose({} as any);
```

---

## 好/坏对比

### 事件处理命名

```typescript
// ✅ 项目惯例：private 前缀
const privateOnConfirmClick = () => { /* ... */ };

// ❌ 无前缀或与 emit 混淆
const onConfirmClick = () => { /* ... */ };
const onChanged = (v: string) => emits("onChanged", v);
```

### 组件体量

| 行数 | 建议 |
|------|------|
| < 200 | 正常 |
| 200–300 | 考虑拆分 |
| > 300 | 必须拆分子组件或 composable |

现有需关注的大文件：`EditDrawer.vue`（menu ~409 行）、`dict/IndexPage.vue`（~361 行）、`verifition/` 第三方遗留（~450 行，应抽 package 共享）。
