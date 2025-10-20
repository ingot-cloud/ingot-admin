# 添加新 Package 指南

## 🚀 自动化方式（推荐）

使用自动化脚本快速创建新的 package：

### 方式一：交互式创建

```bash
pnpm create:package
```

然后按照提示输入 package 名称和描述即可。脚本会询问是否自动更新配置文件。

### 方式二：命令行参数创建

```bash
# 基本用法
pnpm create:package <package-name>

# 带描述
pnpm create:package my-package "这是一个工具包"
```

### 单独更新配置文件

如果你已经创建了 package，只需要更新配置文件（tsconfig.vue-base.json 和 vite.config.ts）：

```bash
pnpm create:package:config <package-name>
```

### 自动化脚本会创建：

- ✅ 完整的目录结构（`packages/your-package/`）
- ✅ `package.json`（包含所有必要配置）
- ✅ `tsconfig.json`（TypeScript 配置）
- ✅ `tsconfig.eslint.json`（ESLint 配置）
- ✅ `eslint.config.ts`（ESLint 规则）
- ✅ `src/index.ts`（入口文件）
- ✅ `README.md`（说明文档）
- ✅ 自动更新根目录 `tsconfig.json` 的 `references`
- ✅ 自动更新 `tsconfig.vue-base.json` 的路径映射
- ✅ 自动更新所有 `vite.config.ts` 文件的别名

### 创建后的步骤：

1. 在需要使用的应用的 `package.json` 中添加依赖：

   ```json
   {
     "dependencies": {
       "@ingot/your-package": "workspace:*"
     }
   }
   ```

2. 安装依赖并构建：

   ```bash
   pnpm install
   pnpm --filter @ingot/your-package build
   ```

3. 开始开发：
   ```bash
   pnpm --filter @ingot/your-package dev
   ```

---

## 📝 手动方式

如果你想手动创建或了解详细配置，可以参考以下步骤：

## 快速添加新包的步骤

### 1. 创建包目录结构

```bash
packages/
└── your-new-package/
    ├── package.json
    ├── tsconfig.json
    └── src/
        └── index.ts
```

### 2. 配置 package.json

```json
{
  "name": "@ingot/your-new-package",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rimraf node_modules dist"
  }
}
```

### 3. 配置 tsconfig.json

```json
{
  "extends": "../.././tsconfig.base.json",
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.*", "**/*.spec.*"],
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "declarationDir": "dist",
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "emitDeclarationOnly": false,
    "noEmit": false,
    "tsBuildInfoFile": "dist/tsconfig.tsbuildinfo"
  }
}
```

### 4. 添加到基础配置中

**需要在以下三个地方添加配置：**

#### 4.1 在根目录 `tsconfig.json` 中添加 references：

```json
{
  "references": [
    {
      "path": "./apps/ingot-admin"
    },
    {
      "path": "./apps/ingot-login"
    },
    {
      "path": "./packages/utils"
    },
    {
      "path": "./packages/hooks"
    },
    {
      "path": "./packages/your-new-package" // 👈 添加这一行
    }
  ]
}
```

#### 4.2 在 `tsconfig.vue-base.json` 中添加路径映射：

```json
{
  "compilerOptions": {
    "paths": {
      "@ingot/utils": ["../../packages/utils/src/index.ts"],
      "@ingot/your-new-package": ["../../packages/your-new-package/src/index.ts"] // 👈 添加这一行
    }
  }
}
```

#### 4.3 在 Vite 配置中添加别名（两个应用都要添加）：

```js
// apps/ingot-login/vite.config.ts 和 apps/ingot-admin/vite.config.ts
resolve: {
  alias: {
    "@": fileURLToPath(new URL("./src", import.meta.url)),
    "@cmps": fileURLToPath(new URL("./src/components", import.meta.url)),
    "@models": fileURLToPath(new URL("./src/models", import.meta.url)),
    "@ingot/utils": fileURLToPath(new URL("../../packages/utils/src/index.ts", import.meta.url)),
    "@ingot/your-new-package": fileURLToPath(new URL("../../packages/your-new-package/src/index.ts", import.meta.url))  // 👈 添加这一行
  },
}
```

### 5. 在应用中添加依赖

在需要使用新包的应用的 `package.json` 中添加：

```json
{
  "dependencies": {
    "@ingot/your-new-package": "workspace:*"
  }
}
```

### 6. 构建和使用

```bash
# 构建新包
pnpm --filter @ingot/your-new-package build

# 在应用中使用
import { someFunction } from '@ingot/your-new-package';
```
