# Ingot Admin

基于 Vue 3 + TypeScript + Element Plus 的管理后台系统，采用 Monorepo 架构。

## ✨ 特性

- 🚀 **Vue 3**: 最新的 Vue 3 Composition API
- 💪 **TypeScript**: 完整的 TypeScript 支持
- 🎨 **Element Plus**: 企业级 UI 组件库
- 📦 **Monorepo**: 使用 pnpm workspace 管理多包项目
- ⚡️ **Vite**: 下一代前端构建工具
- 🔥 **热更新**: 极速的模块热替换（HMR）
- 📱 **响应式**: 支持多种设备尺寸
- 🎯 **TypeScript**: 严格的类型检查

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### ⚠️ 首次构建（重要）

首次运行项目前，必须先构建基础包，否则会遇到类型错误：

```bash
pnpm build:packages
```

> 💡 **为什么需要这一步？**
>
> 详细说明请查看 [首次构建流程文档](./docs/getting-started.md#3-构建基础包重要)

### 启动开发服务器

```bash
# 启动管理后台（推荐使用 with-utils 模式）
pnpm dev:admin-with-utils

# 或启动登录页面
pnpm dev:login-with-utils
```

### 构建生产版本

```bash
pnpm build
```

## 📚 文档

- [📋 SDD 规格与变更](./specs/README.md) - 产品/能力规格与变更提案（规格驱动开发）
- [📖 首次构建流程](./docs/getting-started.md) - **必读**，包含完整的设置和构建说明
- [📦 添加新 Package 指南](./docs/add-new-package.md) - 如何在 monorepo 中添加新的共享包
- [⚙️ TypeScript 配置模板](./docs/typescript-config-template.md) - TypeScript 配置说明
- [🚀 Monorepo 构建优化](./docs/monorepo-build-optimization.md) - 构建脚本优化方案和最佳实践

## 📁 项目结构

```
ingot-admin/
├── apps/                      # 应用目录
│   ├── ingot-admin/          # 管理后台应用
│   │   ├── src/              # 源代码
│   │   ├── public/           # 静态资源
│   │   ├── dist/             # 构建输出
│   │   └── package.json
│   └── ingot-login/          # 登录页面应用
│       ├── src/
│       ├── public/
│       └── package.json
├── packages/                  # 共享包目录
│   ├── utils/                # 工具函数包
│   │   ├── src/
│   │   ├── dist/             # 构建输出
│   │   └── package.json
│   └── hooks/                # Vue Hooks 包
│       ├── src/
│       ├── dist/
│       └── package.json
├── docs/                     # 文档目录
├── scripts/                  # 脚本目录
├── package.json              # 根 package.json
├── pnpm-workspace.yaml       # pnpm workspace 配置
└── tsconfig.json             # 根 TypeScript 配置
```

## 🛠️ 技术栈

- **框架**: Vue 3.5
- **语言**: TypeScript 5.8
- **构建工具**: Vite 6.2
- **UI 框架**: Element Plus 2.13
- **状态管理**: Pinia 3.0
- **路由**: Vue Router 4.5
- **HTTP 客户端**: Axios 1.9
- **样式**: UnoCSS + PostCSS
- **代码规范**: ESLint + Prettier
- **包管理器**: pnpm 10.12

## 📝 可用的脚本命令

### 开发命令

```bash
pnpm dev                      # 启动所有应用
pnpm dev:admin                # 启动管理后台
pnpm dev:login                # 启动登录页面
pnpm dev:admin-with-utils     # 启动管理后台 + utils watch 模式（推荐）
pnpm dev:login-with-utils     # 启动登录页面 + utils watch 模式
pnpm dev:with-utils           # 启动所有应用 + utils watch 模式
```

### 构建命令

```bash
pnpm build                    # 构建所有（基础包 + 应用）
pnpm build:admin              # 构建管理后台
pnpm build:login              # 构建登录页面
pnpm build:utils              # 只构建 utils 包
pnpm build:hooks              # 只构建 hooks 包
```

### 其他命令

```bash
pnpm clean                    # 清理所有 node_modules 和 dist
pnpm lint                     # 运行 ESLint 检查
pnpm format                   # 格式化代码
pnpm type-check               # TypeScript 类型检查
pnpm test:unit                # 运行单元测试
pnpm test:e2e                 # 运行 E2E 测试
pnpm create:package           # 创建新的共享包（交互式）
```

## 🔧 常见问题

### 遇到 "Cannot find module '@ingot/utils'" 错误？

这是因为基础包还没有构建。运行以下命令：

```bash
pnpm build:packages
```

详细说明请查看 [首次构建流程文档](./docs/getting-started.md#常见问题)。

### 修改了 packages 下的代码，但应用没有更新？

使用带 `-with-utils` 后缀的开发命令，它会自动监听并重新构建基础包：

```bash
pnpm dev:admin-with-utils
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📄 License

[LICENSE](./LICENSE)

## 📮 联系方式

如有问题或建议，欢迎提交 Issue。
