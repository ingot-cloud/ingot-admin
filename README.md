# Ingot Admin

基于 Vue 3 + TypeScript + Element Plus 的管理后台 monorepo。默认通用后台是 `apps/admin`，通过构建期源码插件组合平台、安全、组织和会员能力。

## 快速开始

```bash
pnpm install
pnpm build:packages
pnpm dev:admin
```

登录应用：

```bash
pnpm dev:login
```

首次 clone 后必须先构建 `packages/`，否则类型声明和运行时入口还不存在。详见 [首次构建](./docs/getting-started.md)。

## 三层结构

```
apps/          可运行、可部署的应用（composition root）
plugins/       不可独立运行的业务源码插件
packages/      无页面的公共抽象
examples/      不参与默认构建的示例
```

依赖只允许 `apps → plugins/packages`、`plugins → packages`。普通项目直接使用 `apps/admin`；只有独立 appCode、品牌、环境或部署流水线时才 [创建新 App](./docs/create-app.md)。

```
ingot-admin/
├── apps/
│   ├── admin/              # 默认通用后台，注册全部官方插件
│   ├── auth/               # 独立登录应用
│   └── create-app/         # 本地 App 生成工具
├── plugins/
│   ├── platform/           # 平台控制面 + Dashboard
│   ├── security/           # 安全中心
│   ├── org/                # 组织管理
│   └── member/             # 会员管理
├── packages/
│   ├── admin-core/         # 管理台 runtime、shell、插件契约
│   ├── admin-common/       # 多插件共享的无页面能力
│   ├── shared/             # 框架无关工具与 crypto
│   └── vite-config/        # App / library / 源码插件 Vite 配置
└── examples/
    └── admin-plugin/       # 完整插件示例
```

## 常用命令

```bash
pnpm dev                      # 并行启动 admin + login
pnpm dev:admin                # 默认后台 :5798
pnpm dev:login                # 登录应用
pnpm dev:create-app           # 脚手架 UI :5801
pnpm dev:packages             # watch 构建全部 packages
pnpm dev:admin-with-packages  # admin + packages watch
pnpm preview:admin            # 预览 admin 生产构建
pnpm build                    # packages → apps
pnpm build:packages           # 构建共享包
pnpm build:apps               # 构建 admin + login
pnpm build:admin              # 构建默认后台
pnpm type-check               # packages + plugins + apps
pnpm type-check:plugins       # 仅官方插件
pnpm test:unit                # apps + plugins + packages + scaffold
pnpm check                    # 构建、类型、lint、测试、边界与文档检查
pnpm check:plugins            # 插件 type-check + 单测
pnpm check:boundaries         # 三层依赖边界
pnpm check:examples           # 示例 vue-tsc
pnpm check:docs               # 文档链接与过时包名
pnpm clean                    # 清理 workspace node_modules 与 dist
pnpm clean:plugins            # 仅清理插件
```

## 文档

- [开发模式](./docs/development-model.md) — 三层职责、依赖规则和入口选择
- [插件开发](./docs/plugin-development.md) — 源码插件结构、页面、菜单、注册和测试
- [菜单 view_path](./docs/menu-view-path.md) — 页面/布局编码与菜单数据迁移
- [App 开发](./docs/app-development.md) — bootstrap、裁剪插件、构建和部署
- [运行时参考](./docs/composable-admin-runtime.md) — 插件排序、页面键、菜单合并
- [create-app](./docs/create-app.md) — 何时创建独立 App
- [首次构建](./docs/getting-started.md)
- [变更规格](./specs/README.md)
- [Agent 工作流](./AGENTS.md)
- [插件示例](./examples/admin-plugin/README.md)

## 技术栈

- Vue 3.5、TypeScript 6、Vite 8
- Element Plus 2.14、Pinia 4、Vue Router 5
- UnoCSS + PostCSS、Axios
- pnpm 10.12 workspace
