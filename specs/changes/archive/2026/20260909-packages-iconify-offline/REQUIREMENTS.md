# 需求：Iconify 离线打包与全屏图标

## 场景与页面

### 场景 1：内网打开带 Iconify 图标的页面

- **角色**：管理员
- **入口**：任意使用 `InIcon` / 菜单图标 / 顶栏图标的页面
- **步骤**：在无外网环境下打开后台
- **预期结果**：源码、`collections`/`extra` 或 `iconify-offline.used.json` 中的 Iconify 图标正常显示，浏览器不请求 `api.iconify.design`

### 场景 2：全屏小部件

- **角色**：管理员
- **入口**：顶栏功能区全屏按钮
- **步骤**：进入全屏、退出全屏
- **预期结果**：未全屏显示 `bi:fullscreen`，已全屏显示 `bi:fullscreen-exit`

### 场景 3：开发时粘贴菜单图标并预览

- **角色**：前端
- **入口**：应用详情 / 菜单编辑「菜单 icon」
- **步骤**：从 Iconify 复制 `mynaui:config` 等名字贴入输入框
- **预期结果**：开发环境右侧预览立刻出图；该图标 SVG 写入 `iconify-offline.used.json`，生产构建后内网也能显示

### 场景 4：后端菜单使用未写在源码里的图标

- **角色**：实施 / 前端
- **入口**：used.json、或 Vite `iconifyOffline.extra` / `collections`
- **步骤**：开发时打开带该图标的页面以收集，或手动配置 extra/collections
- **预期结果**：构建产物包含这些图标，运行时无需外网

## 验收标准

- [x] 开发环境 `InIcon` 使用 `@iconify/vue`，可请求 Iconify API 预览
- [x] 生产环境 `InIcon` 使用 `@iconify/vue/offline`，不走 Iconify 公共 API
- [x] 构建扫描 `.vue/.ts/.tsx/.js/.jsx` 中引号包裹的 `prefix:name`（跳过测试文件）
- [x] App 可通过 `iconifyOffline.extra`、`collections` 与 `used.json` 补充扫描不到的图标
- [x] 缺本地 `@iconify-json/<prefix>` 且 used.json 也没有该图标时构建告警，生产不静默请求外网
- [x] 全屏按钮图标为 `bi:fullscreen` / `bi:fullscreen-exit`
- [x] `unplugin-icons` 构建期不 `autoInstall`
- [x] 文档说明 dev/prod 差异、used.json 须提交、整包体积取舍
