# 设计：Iconify 离线打包与全屏图标

## 技术方案

图标有三条路径：

| 路径 | 开发 | 生产 |
|------|------|------|
| UnoCSS `i-ep-search` | 本地 `@iconify-json/*` | 同左 |
| 本地 SVG `ingot:*` | 精灵图 | 同左 |
| `<in-icon name="prefix:name" />` | `@iconify/vue`（可走 Iconify API 预览） | `@iconify/vue/offline` + 构建期 `addCollection` |

Vite 虚拟模块 `virtual:ingot-iconify-icon`：`serve` 导出 `@iconify/vue` 的 `Icon`/`loadIcon`/`getIcon`；`build` 先导入 `virtual:iconify-offline`，再导出 offline `Icon`。

`virtual:iconify-offline` 合并：

1. 扫描宿主 / 官方插件 / `admin-core` 源码中的 `"prefix:name"`
2. `iconifyOffline.extra`
3. `iconifyOffline.collections` 整包（`apps/admin` 默认 `ep`）
4. `iconify-offline.used.json`：开发预览成功后写入的 SVG 正文（按前缀分组），**不依赖**对应 `@iconify-json` 包

开发中间件 `POST /__ingot/iconify-used`：校验 `prefix:name`，合并写入 used 文件（防抖、去重）。`InIcon` 仅 `import.meta.env.DEV` 且非 `ingot:` 时 `loadIcon` 成功后 POST。

找不到 `@iconify-json` 且 used 也没有时 `this.warn`，生产不回退 CDN。

全屏小部件使用 `bi:fullscreen` / `bi:fullscreen-exit`。

## 对接映射

无后端接口。菜单 `icon` 仍是后端字符串。

## 数据模型

```ts
iconifyOffline?: {
  extra?: string[];
  collections?: string[];
  scan?: boolean; // 默认 true
  usedFile?: string; // 默认 rootDir/iconify-offline.used.json
}
```

used.json 形如 `{ "mynaui": { "prefix": "mynaui", "icons": { "config": { "body": "..." } } } }`。

## 组件与页面影响

- `packages/vite-config`：扫描、used 中间件、两个虚拟模块
- `packages/admin-core`：`InIcon` 与其它 Icon 引用走 `virtual:ingot-iconify-icon`
- `apps/admin`：默认 `collections: ["ep"]`；提交 `iconify-offline.used.json`
- `apps/auth`：同一虚拟模块
- `docs/icons.md`

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| Monorepo 边界 | ✅ | 构建逻辑放 `packages/vite-config`，运行时组件放 `admin-core` |
| 三层目录 | ✅ | App 只配置 extra/collections/usedFile |
| 类型安全 | ✅ | 新代码无 any |
| UnoCSS 优先 | ✅ | 不新增 scss |
| 施工门禁 | ✅ | 本 change 仍为 implementing |
| 包管理 | ✅ | 不自动 pnpm add 图标集 |

## 备选方案

- 开发时自动安装 `@iconify-json/*`：整包体积大、改锁文件，放弃，改为记录 SVG
- 启动时整包所有已安装集合：`mdi`/`carbon` 数 MB，放弃
- 生产也走 API：内网不可用，放弃

## 开放问题

无。
