# 添加新 Package 指南

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

**只需要在以下两个地方添加一行配置：**

#### 4.1 在 `tsconfig.vue-base.json` 中添加路径映射：

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

#### 4.2 在 Vite 配置中添加别名（两个应用都要添加）：

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
