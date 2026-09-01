# 接口：App 插件、共享包与静态菜单

## 来源

- 计划：App-as-plugin 重组
- 后端：`GET /api/pms/v1/auth/user/menus`（响应结构不变）

## 1. 官方 App 插件导出

```ts
// apps/ingot-admin 对外
export const adminPlugin: InAdminPlugin;
// package.json exports:
// "." → 可选聚合
// "./plugin" → adminPlugin
// "./style.css" → 若有 App 级样式
```

约束：

- 插件 `id` 使用 App 名 kebab-case，如 `ingot-admin`。
- `dependsOn` 必须包含 `ingot-admin-core`。
- 页面稳定键：新键优先 `ingot.admin.<domain>...`；兼容期保留 `ingot.base.*` 与 `@/pages/**` 别名。
- 业务 App 不得互相循环依赖；只依赖 `@ingot/admin-core` 与 `@ingot/shared`。

## 2. `@ingot/shared`

```ts
// 主入口聚合常用工具
export * from "./utils-surface";
// 子路径
import { ... } from "@ingot/shared/crypto";
import { useStateResettable } from "@ingot/shared/hooks";
```

原 `@ingot/utils` / `@ingot/crypto` / `@ingot/hooks` 删除，引用全部改为 `@ingot/shared`。

## 3. 静态菜单（admin-core）

```ts
/** 与后端菜单节点同构，供 transformMenu 使用 */
export type InStaticMenuNode = MenuTreeNode;

export interface InAdminPlugin {
  // ...既有字段
  /** 插件贡献的静态菜单（参与侧栏，viewPath 走 page registry） */
  staticMenus?: InStaticMenuNode[];
}

export interface InAdminAppOptions {
  // ...既有字段
  /** App 级静态菜单，与各插件 staticMenus、后端动态菜单合并 */
  staticMenus?: InStaticMenuNode[];
}

/**
 * 合并静态菜单树与动态菜单树。
 * - 静态在前，动态在后（同级顺序）
 * - 任一节点 path 或 routeName 冲突则抛错
 */
export function mergeMenuTrees(
  staticMenus: InStaticMenuNode[],
  dynamicMenus: InStaticMenuNode[],
): InStaticMenuNode[];

/** 便于声明静态菜单的小助手（原样返回，提供类型提示） */
export function defineStaticMenus(
  menus: InStaticMenuNode[],
): InStaticMenuNode[];
```

合并时机：`fetchRoutes` 内在 `UserMenuAPI` 成功后，先 `mergeMenuTrees(app+plugins static, response.data)`，再 `transformMenu`。

## 4. 脚手架清单（create-app）

官方插件注册表（前端配置，非运行时远程）：

```ts
interface OfficialPluginOption {
  id: string;          // ingot-admin
  packageName: string; // ingot-admin
  importPath: string;  // ingot-admin/plugin
  exportName: string;  // adminPlugin
  label: string;
  available: boolean;
}
```
