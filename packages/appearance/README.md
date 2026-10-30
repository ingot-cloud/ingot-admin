# Ingot 共享外观资源

`@ingot/appearance` 提供无运行时依赖的 CSS/SVG 公共资源，由 admin-core 和两个登录站共用。它不提供页面、主题注册或管理台外壳。

- `styles/tokens.css`：默认浅色语义 Token。
- `styles/dark/tokens.css`：`html.dark` 深色覆盖。
- `styles/el-mapping.css`、`styles/dark/el-css-vars.css`：Element Plus 单向映射。
- `assets/logo/in-light-framed.svg`、`assets/logo/in-dark-framed.svg`：带框品牌 Logo。
- `assets/loading/in-loading-light.svg`、`assets/loading/in-loading-dark.svg`：动态加载标识。

通过包子路径导入资源，由消费方 Vite 打包；包直接交付 `src/` 资源，无 JS 构建步骤。admin-core 公开主题协议与 Token 默认值仍由 admin-core 维护，旧 CSS 路径保留转发。
