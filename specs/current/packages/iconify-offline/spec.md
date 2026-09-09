# Iconify 离线打包规格

本文写已上线的图标加载行为。工程步骤见 [docs/icons.md](../../../../docs/icons.md)。顶栏全屏入口见 [顶栏 APP 配置](../app-header/spec.md)。

## 概述

后台图标三条路径：设计系统 `ingot:*` 精灵图、模板 Uno 类 `i-ep-*`、以及 `<in-icon name="prefix:name" />`（菜单、顶栏、后端下发）。后两者开发可预览；生产必须零外网。

## 范围

### In Scope

- `InIcon` 开发走 `@iconify/vue`、生产走 `@iconify/vue/offline`
- 扫描源码字面量、`extra`、`collections`、`used.json` 打进离线包
- 开发会话把成功渲染过的 `prefix:name` 写入 used.json
- 顶栏全屏按钮 `bi:fullscreen` / `bi:fullscreen-exit`

### Out of Scope

- 开发时自动 `pnpm add @iconify-json/*` 或改 `vite.config.ts`
- 菜单选择器浏览全部 Iconify 集合
- 生产回退 Iconify 公共 API
- 未走过 `InIcon` 的图标自动写入 used.json

## 用户场景

### 场景 1：内网打开带 Iconify 的页面

- **角色**：管理员
- **前置条件**：生产构建已包含扫描 / extra / collections / used.json 中的图标
- **步骤**：无外网打开后台
- **预期结果**：菜单与顶栏 Iconify 图标正常显示；浏览器不请求 `api.iconify.design`

### 场景 2：开发时粘贴菜单图标

- **角色**：前端
- **入口**：应用详情 / 菜单编辑「菜单 icon」
- **步骤**：粘贴 `prefix:name` 并预览
- **预期结果**：开发环境立刻出图；SVG 写入 `iconify-offline.used.json`，提交后生产内网可显示

### 场景 3：切换全屏

- **角色**：管理员
- **入口**：顶栏功能区全屏按钮
- **步骤**：进入 / 退出全屏
- **预期结果**：未全屏 `bi:fullscreen`，已全屏 `bi:fullscreen-exit`

## 功能需求

### REQ-001：开发在线、生产离线

系统 SHALL 按 Vite command 切换 Icon 实现，生产不访问 Iconify API。

**验收标准：**

- [x] serve 使用 `@iconify/vue`；build 使用 offline + `virtual:iconify-offline`
- [x] 扫描宿主 / 官方插件 / `admin-core` 源码中的 `"prefix:name"`（跳过测试）
- [x] App 可用 `iconifyOffline.extra`、`collections`（admin 默认 `ep`）与 used.json 补充
- [x] 缺 `@iconify-json/<prefix>` 且 used.json 也没有时构建告警，生产不静默请求外网
- [x] `unplugin-icons` 关闭 `autoInstall`

### REQ-002：used.json 须提交

系统 SHALL 把开发里 `InIcon` 成功渲染过的非 `ingot:` 图标写入 App 根目录 used.json。

**验收标准：**

- [x] 文件含 SVG 正文，构建并入离线包，不要求安装对应 `@iconify-json`
- [x] 未在本机打开过的后端动态菜单图标不会自动出现；文档要求提交该文件
- [x] 不扫描源码字面量以外的路径来改 `vite.config.ts`

## 非功能需求

- 不要默认整包打入 `mdi` / `carbon` 等大集合
- `ingot:*` 与 Uno 类路径不受本能力切换影响

## 依赖与约束

- 菜单 `icon` 字段仍由后端下发
- 工程说明以 [docs/icons.md](../../../../docs/icons.md) 为准

## 验收标准

- [x] 开发可预览任意已安装或可 API 加载的 Iconify 名
- [x] 生产离线显示已打包图标，全屏按钮使用 Bootstrap Icons 全屏对
