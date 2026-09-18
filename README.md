# Ingot Admin

基于 Vue 3 + TypeScript + Element Plus 的管理后台 monorepo。租户后台是 `apps/admin`，平台后台是 `apps/admin-platform`。

## 快速开始

```bash
pnpm install
pnpm build:packages
pnpm dev:admin
```

平台管理台与两套登录：

```bash
pnpm dev:admin-platform
pnpm dev:login
pnpm dev:login-platform
```

首次 clone 后必须先构建 `packages/`，否则类型声明和运行时入口还不存在。详见 [首次构建](./docs/getting-started.md)。

## 四类结构

```
apps/          可运行、可部署的应用（composition root）
plugins/       不可独立运行的业务源码插件
themes/        无业务页面的视觉主题包
packages/      无页面的公共抽象
examples/      不参与默认构建的示例
```

依赖只允许 `apps → plugins/themes/packages`、`plugins → packages`、`themes → packages`。普通项目直接使用 `apps/admin`；只有独立 appCode、品牌、环境或部署流水线时才 [创建新 App](./docs/create-app.md)。

```
ingot-admin/
├── apps/
│   ├── admin/              # 租户管理台
│   ├── admin-platform/     # 平台管理台
│   ├── auth/               # 租户登录应用
│   ├── auth-platform/      # 平台登录应用
│   └── dev-portal/         # Ingot 开发者中心（文档 + 本地创建）
├── plugins/
│   ├── platform/           # 平台控制面 + Dashboard
│   ├── security/           # 安全中心
│   ├── org/                # 组织管理
│   └── member/             # 会员管理
├── themes/                 # 正式主题包，初期可为空
├── packages/
│   ├── admin-core/         # 管理台 runtime、shell、插件契约与默认主题
│   ├── admin-common/       # 多插件共享的无页面能力
│   ├── shared/             # 框架无关工具与 crypto
│   └── vite-config/        # App / library / 源码插件 Vite 配置
└── examples/
    ├── admin-plugin/       # 完整插件示例
    └── admin-theme/        # 独立主题包示例（不加入 workspace）
```

## 常用命令

```bash
pnpm dev                      # 并行启动租户/平台 admin + 两套 login
pnpm dev:admin                # 租户后台 http://tenant.local:5798
pnpm dev:admin-platform       # 平台后台 http://platform.local:5799
pnpm dev:login                # 租户登录 http://tenant-login.local:1798
pnpm dev:login-platform       # 平台登录 http://platform-login.local:1799
pnpm dev:portal               # 开发者中心 :5801
pnpm dev:packages             # watch 构建全部 packages
pnpm dev:admin-with-packages  # admin + packages watch
pnpm preview:admin            # 预览租户 admin 生产构建
pnpm preview:admin-platform   # 预览平台 admin 生产构建
pnpm build                    # packages → themes → apps
pnpm build:packages           # 构建共享包
pnpm build:themes             # 构建正式主题（空目录成功退出）
pnpm build:apps               # 构建两套 admin + 两套 login
pnpm build:admin              # 构建租户后台（含 packages 与 themes）
pnpm build:admin-platform     # 构建平台后台（含 packages 与 themes）
pnpm type-check               # packages + themes + plugins + apps
pnpm type-check:plugins       # 仅官方插件
pnpm test:unit                # apps + plugins + packages + scaffold + themes + 边界
pnpm check                    # 构建、类型、lint、测试、边界与文档检查
pnpm check:plugins            # 插件 type-check + 单测
pnpm check:boundaries         # 四类目录依赖边界
pnpm check:examples           # 示例 vue-tsc
pnpm check:docs               # 文档链接与过时包名
pnpm clean                    # 清理 workspace node_modules 与 dist
pnpm clean:plugins            # 仅清理插件
```

本机 DEV 请先在 `/etc/hosts` 写入 `127.0.0.1 tenant.local tenant-login.local platform.local platform-login.local`，用这些 hostname 打开，不要用 `localhost:端口`。

## 文档

- [开发模式](./docs/development-model.md) — 四类目录、依赖规则和入口选择
- [插件开发](./docs/plugin-development.md) — 源码插件结构、页面、菜单、注册和测试
- [菜单 view_path](./docs/menu-view-path.md) — 页面/布局编码与菜单数据迁移
- [App 开发](./docs/app-development.md) — bootstrap、裁剪插件、构建和部署
- [主题开发](./docs/theme-development.md) — Token、壳层协议与独立主题包
- [运行时参考](./docs/composable-admin-runtime.md) — 插件排序、页面键、菜单合并
- [开发者中心 / 创建工具](./docs/create-app.md) — 文档站与创建 App／插件／主题
- [首次构建](./docs/getting-started.md)
- [变更规格](./specs/README.md)
- [Agent 工作流](./AGENTS.md)
- [插件示例](./examples/admin-plugin/README.md)
- [主题示例](./examples/admin-theme/README.md)

## 技术栈

- Vue 3.5、TypeScript 6、Vite 8
- Element Plus 2.14、Pinia 4、Vue Router 5
- UnoCSS + PostCSS、Axios
- pnpm 10.12 workspace
