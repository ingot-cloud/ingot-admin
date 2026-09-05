# 管理台设计 Token

`@ingot/admin-core` 使用「基础 Token → 语义 Token → 组件 Token → Element Plus 映射」的单向链路。业务插件只消费 `--in-*`，不要在页面里覆盖 `--el-*` 或硬编码品牌色。

## 文件

| 文件 | 职责 |
|------|------|
| `tokens.css` | 浅色基础 / 语义 / 组件 Token，以及旧变量别名 |
| `el-mapping.css` | `--el-*` 只从 `--in-*` 读取 |
| `dark/tokens.css` | 同一语义集的暗色覆盖 |
| `dark/el-css-vars.css` | 暗色 Element Plus 映射 |

## 关键语义值（浅色）

| Token | 值 |
|-------|----|
| `--in-color-primary` | `#3370ff` |
| `--in-text-color` | `#1f2329` |
| `--in-text-color-secondary` | `#646a73` |
| `--in-text-color-placeholder` | `#8f959e` |
| `--in-text-color-disabled` | `#bbbfc4` |
| `--in-bg-color-canvas` / `--in-bg-color-sidebar` | `#f5f5f5` |
| `--in-bg-color-surface` | `#ffffff` |
| `--in-bg-color-muted` | `#f2f3f5` |
| `--in-bg-color-subtle` | `#fbfbfb` |
| `--in-bg-color-hover` / `--in-bg-color-active` | `rgba(31, 35, 41, 0.05)` |
| `--in-bg-color-menu-hover` | `rgba(31, 35, 41, 0.06)` |
| `--in-bg-color-control-hover` | `rgba(31, 35, 41, 0.08)` |
| `--in-border-color` | `#dee0e3` |
| `--in-app-bar-height` | `56px` |
| `--in-app-bar-nav-max` / `--in-app-bar-actions-max` / `--in-app-bar-search-width` | `560px` / `360px` / `240px` |
| `--in-sidebar-gutter` | `8px` |
| `--in-sidebar-panel-expanded` / `--in-sidebar-panel-collapsed` | `236px` / `52px` |
| `--in-menu-item-height` / `--in-menu-icon-size` / `--in-menu-icon-gap` | `40px` / `20px` / `8px` |
| `--in-menu-nested-indent` / `--in-menu-text-plain-color` / `--in-menu-text-active-color` | `20px` / `#1f2329` / `#2b2f36` |
| `--in-menu-control-height` / `--in-menu-footer-clearance` / `--in-menu-divider-gap` | `44px` / `18px` / `8px` |
| `--in-motion-duration-sidebar` / `--in-motion-ease-sidebar` | `300ms` / `cubic-bezier(0.25, 0.1, 0.05, 1)` |
| `--in-container-bg` | `var(--in-bg-color-surface)` |
| `--in-container-radius` | `0px` |
| `--in-split-left-width` | `260px` |
| `--in-split-rail-width` | `0px` |
| `--in-split-collapse-width` / `--in-split-collapse-height` / `--in-split-collapse-radius` | `16px` / `32px` / `8px` |
| `--in-motion-duration-split` | `180ms` |
| `--in-table-header-height` / `--in-table-row-height-compact` | `48px` / `44px` |
| `--in-page-gutter` | `12px`（`--in-space-3`） |
| `--in-page-breadcrumb-height` / `--in-page-header-min-height` | `46px` / `80px` |
| `--in-control-height` | `32px` |
| `--in-radius-control` / `--in-radius-card` | `6px` / `8px` |

间距使用 `--in-space-1` 到 `--in-space-8`（4 / 8 / 12 / 16 / 20 / 24 / 32px）。

侧栏主内容位移为沟槽 + 面板，即 `244px` / `60px`。旧名 `--in-bg-color`、`--in-bg-color-page`、`--in-menu-show` / `--in-menu-hide` 仍指向新语义 Token。

## 兼容

旧名如 `--in-app-bar-bg`、`--in-common-padding`、`--in-text-color-light` 仍可用，已指向新语义 Token。不要再让 `--in-*` 依赖 `--el-*`。

暗色模式切换 `html.dark`（`InSwitchDark` / `useDark`），不在业务页面维护主题分支。
