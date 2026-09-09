# 图标（内网 / Iconify）

后台有三条图标路径。**开发**可以请求 Iconify API 做菜单预览；**生产**只使用打进产物的本地数据。

| 写法 | 用途 | 开发 | 生产 |
|------|------|------|------|
| `ingot:bell-outlined` | 设计系统本地 SVG | 精灵图 | 同左 |
| `i-ep-search` 等 Uno 类 | 模板里写死的装饰图标 | `@iconify-json/*` | 同左 |
| `<in-icon name="ep:user" />` | 菜单、顶栏、后端下发 | `@iconify/vue`（可走 API 预览） | `@iconify/vue/offline` + 构建打包 |

生产环境不要让 `InIcon` 访问 `api.iconify.design`。纯内网拿不到。

## 开发：粘贴 Iconify 名并预览

菜单编辑「菜单 icon」可直接粘贴 Iconify 的 `prefix:name`（如 `mynaui:config`），输入框右侧会预览。成功显示过的图标，Vite 会把 SVG 写入 App 根目录的 `iconify-offline.used.json`。

**该文件要提交到 Git。** CI 和生产构建读它，没有打开过的菜单图标不会出现在文件里，产物里也就没有。

## 构建时打进产物

`@ingot/vite-config` 会生成 `virtual:iconify-offline`，合并：

1. **扫描**宿主 `src`、官方插件 `src`、`admin-core/src` 中引号包裹的 `prefix:name`（跳过测试文件）
2. **extra**：写在 Vite 配置里的额外名字
3. **collections**：整包打入某个 `@iconify-json/<prefix>`。`apps/admin` 默认 `ep`
4. **used.json**：开发预览收集的 SVG，不要求安装对应 `@iconify-json` 包

```ts
export default defineInAppConfig({
  rootDir,
  iconifyOffline: {
    collections: ["ep"],
    extra: ["bi:fullscreen"],
    // usedFile 默认 iconify-offline.used.json
  },
});
```

扫描/extra 用到的集合必须已安装 `@iconify-json/<prefix>`。缺包且 used.json 也没有时构建告警，生产不会回退到外网。

不要把 `mdi`、`carbon` 整包打进默认配置，体积是 MB 级。

`unplugin-icons` 已关闭 `autoInstall`，开发也不会因为预览而自动 `pnpm add` 图标集。

## 新增图标

- 设计系统图标：把 SVG 放进 `admin-core` 的 `assets/icons/`，使用 `ingot:文件名`
- 源码里写死的 Iconify 名：直接写 `ep:user`，构建会扫到
- 菜单里粘贴的任意 Iconify 名：开发时打开该页预览一次，提交更新后的 `iconify-offline.used.json`
- 或在 `extra` / `collections` 中显式声明

顶栏全屏按钮使用 `bi:fullscreen` / `bi:fullscreen-exit`。
