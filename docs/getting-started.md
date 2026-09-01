# 首次构建流程

本文档将指导你如何首次设置和构建 Ingot Admin 项目。

> 插件化后台运行时见 [composable-admin-runtime.md](./composable-admin-runtime.md)；脚手架见 [create-app.md](./create-app.md)。

## 📋 前置要求

- **Node.js**: 版本 >= 18
- **pnpm**: 版本 >= 8.0（项目使用 pnpm 10.12.4）

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd ingot-admin
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 构建基础包（⚠️ 重要）

在首次运行项目之前，**必须先构建 packages 目录下的基础包**，否则会遇到类型错误：

```bash
# 方式一：构建所有基础包（推荐）
pnpm build:packages

# 方式二：构建单个包
pnpm build:utils && pnpm build:hooks

# 方式三：构建所有（包括应用）
pnpm build
```

#### 为什么需要先构建基础包？

在 monorepo 模式下，项目的 `apps/` 依赖 `packages/` 中的工具包。虽然 TypeScript 配置了路径映射指向源码：

```json
"paths": {
      "@ingot/shared": ["../../packages/shared/src/index.ts"],
      "@ingot/shared/hooks": ["../../packages/shared/src/hooks/index.ts"]
    }
```

但构建时，TypeScript 和 Vite 仍然会查找 `package.json` 中定义的类型声明文件：

```json
{
  "types": "dist/index.d.ts"
}
```

如果没有先构建这些包，`dist` 目录不存在，就会导致以下错误：

```
error TS2307: Cannot find module '@ingot/shared' or its corresponding type declarations.
```

### 4. 启动开发服务器

构建完基础包后，就可以启动开发服务器了：

```bash
# 启动管理后台
pnpm dev:admin

# 或启动登录页面
pnpm dev:login

# 或同时启动所有应用
pnpm dev
```

#### 开发模式下自动重新构建

如果你需要修改 `packages/` 下的代码，建议使用以下命令，它会同时启动基础包的 watch 模式：

```bash
# 启动管理后台 + 自动重新构建 utils
pnpm dev:admin-with-utils

# 启动登录页面 + 自动重新构建 utils
pnpm dev:login-with-utils

# 启动所有应用 + 自动重新构建 utils
pnpm dev:with-utils
```

这样当你修改 `packages/utils` 或 `packages/hooks` 的代码时，会自动重新编译。

### 5. 构建生产版本

```bash
# 构建所有应用（会自动先构建基础包）
pnpm build

# 只构建管理后台
pnpm build:admin

# 只构建登录页面
pnpm build:login
```

## 🔧 常见问题

### Q1: 遇到 "Cannot find module '@ingot/shared'" 错误

**原因**: 基础包未构建。

**解决方案**:
```bash
pnpm build:packages
# 或
pnpm build:shared
```

### Q2: 修改了 packages 下的代码，但应用没有更新

**原因**: 基础包需要重新构建。

**解决方案**:

方式一（推荐）：使用 watch 模式开发
```bash
pnpm dev:admin-with-utils
```

方式二：手动重新构建
```bash
pnpm build:packages
```

### Q3: TypeScript 类型检查报错

**解决方案**:
```bash
# 先确保基础包已构建
pnpm build:packages

# 然后运行类型检查
cd apps/admin
pnpm type-check
```

### Q4: 清理后如何重新构建

如果运行了 `pnpm clean`，需要重新安装依赖并构建：

```bash
# 重新安装依赖
pnpm install

# 构建基础包
pnpm build:packages

# 启动开发
pnpm dev:admin
```

## 📁 项目结构

```
ingot-admin/
├── apps/                      # 应用目录
│   ├── admin/                # 管理后台应用
│   └── auth/                 # 登录页面应用
├── packages/                  # 共享包目录
│   ├── utils/                # 工具函数包
│   └── hooks/                # React/Vue Hooks 包
├── docs/                     # 文档目录
├── scripts/                  # 脚本目录
├── package.json              # 根 package.json
├── pnpm-workspace.yaml       # pnpm workspace 配置
└── tsconfig.json             # 根 TypeScript 配置
```

## 📝 可用的脚本命令

### 开发命令

```bash
pnpm dev                      # 启动所有应用
pnpm dev:admin                # 启动管理后台
pnpm dev:login                # 启动登录页面
pnpm dev:admin-with-utils     # 启动管理后台 + utils watch 模式
pnpm dev:login-with-utils     # 启动登录页面 + utils watch 模式
pnpm dev:with-utils           # 启动所有应用 + utils watch 模式
```

### 构建命令

```bash
pnpm build                    # 构建所有（基础包 + 应用）
pnpm build:packages           # 只构建所有基础包（推荐）⭐
pnpm build:apps               # 只构建所有应用
pnpm build:admin              # 构建管理后台（含基础包）
pnpm build:login              # 构建登录页面（含基础包）
pnpm build:utils              # 只构建 utils 包
pnpm build:hooks              # 只构建 hooks 包
```

### 其他命令

```bash
pnpm clean                    # 清理所有 node_modules 和 dist
pnpm lint                     # 运行 ESLint 检查
pnpm format                   # 格式化代码
pnpm create:package           # 创建新的共享包（交互式）
```

## 🎯 最佳实践

1. **首次克隆后**: 先运行 `pnpm install` 和 `pnpm build:packages`
2. **开发时**: 使用 `pnpm dev:admin-with-utils` 启动，避免手动重新构建
3. **提交前**: 运行 `pnpm lint` 确保代码规范
4. **构建生产版本**: 使用 `pnpm build` 确保所有依赖都是最新的

## 🔗 相关文档

- [添加新 Package 指南](./add-new-package.md)
- [TypeScript 配置模板](./typescript-config-template.md)
- [Monorepo 构建优化指南](./monorepo-build-optimization.md) - 构建脚本优化方案详解

## ⚡ 性能优化建议

### 1. 使用 watch 模式

开发时始终使用带 `-with-utils` 后缀的命令，避免频繁手动构建。

### 2. 增量构建

TypeScript 配置了 `composite: true` 和 `tsBuildInfoFile`，支持增量编译，能大幅提升构建速度。

### 3. 并行构建

构建脚本使用了 `concurrently` 并行运行多个任务，充分利用多核 CPU。

## 🆘 获取帮助

如果遇到问题：

1. 查看本文档的"常见问题"部分
2. 确保 Node.js 和 pnpm 版本符合要求
3. 尝试清理并重新构建：`pnpm clean && pnpm install && pnpm build:packages`
4. 查看项目的 GitHub Issues

