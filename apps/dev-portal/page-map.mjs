/**
 * 文档单一来源映射：仓库正文 → 站点路径。
 * 不把 specs 当作使用文档。
 */
export const PAGE_MAP = [
  { source: "apps/dev-portal/pages/index.md", dest: "index.md" },
  { source: "apps/dev-portal/pages/create/app.md", dest: "create/app.md" },
  { source: "apps/dev-portal/pages/create/plugin.md", dest: "create/plugin.md" },
  { source: "apps/dev-portal/pages/create/theme.md", dest: "create/theme.md" },
  { source: "docs/getting-started.md", dest: "guide/getting-started.md" },
  { source: "docs/development-model.md", dest: "guide/development-model.md" },
  { source: "docs/app-development.md", dest: "guide/app.md" },
  { source: "docs/plugin-development.md", dest: "guide/plugin.md" },
  { source: "docs/theme-development.md", dest: "guide/theme.md" },
  { source: "docs/create-app.md", dest: "guide/create.md" },
  { source: "docs/app-header.md", dest: "guide/header.md" },
  { source: "docs/menu-view-path.md", dest: "guide/menu.md" },
  { source: "docs/network.md", dest: "guide/network.md" },
  { source: "docs/envelope-crypto.md", dest: "guide/crypto.md" },
  { source: "docs/icons.md", dest: "guide/icons.md" },
  { source: "docs/composable-admin-runtime.md", dest: "guide/runtime.md" },
  { source: "docs/add-new-package.md", dest: "engineering/package.md" },
  { source: "docs/typescript-config-template.md", dest: "engineering/typescript.md" },
  { source: "docs/monorepo-build-optimization.md", dest: "engineering/build.md" },
  { source: "apps/dev-portal/pages/reference/components.md", dest: "reference/components.md" },
  { source: "apps/dev-portal/pages/reference/modules.md", dest: "reference/modules.md" },
  { source: "apps/dev-portal/pages/reference/plugins.md", dest: "reference/plugins.md" },
  { source: "apps/dev-portal/pages/examples.md", dest: "examples.md" },
];

export const LINK_REWRITE = [
  { from: "./getting-started.md", to: "/guide/getting-started" },
  { from: "./development-model.md", to: "/guide/development-model" },
  { from: "./app-development.md", to: "/guide/app" },
  { from: "./plugin-development.md", to: "/guide/plugin" },
  { from: "./theme-development.md", to: "/guide/theme" },
  { from: "./create-app.md", to: "/guide/create" },
  { from: "./app-header.md", to: "/guide/header" },
  { from: "./menu-view-path.md", to: "/guide/menu" },
  { from: "./network.md", to: "/guide/network" },
  { from: "./envelope-crypto.md", to: "/guide/crypto" },
  { from: "./icons.md", to: "/guide/icons" },
  { from: "./composable-admin-runtime.md", to: "/guide/runtime" },
  { from: "./add-new-package.md", to: "/engineering/package" },
  { from: "./typescript-config-template.md", to: "/engineering/typescript" },
  { from: "./monorepo-build-optimization.md", to: "/engineering/build" },
];
