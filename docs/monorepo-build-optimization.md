# Monorepo 构建脚本优化指南

## 问题背景

在 monorepo 架构中，随着工具包数量的增加，构建脚本会变得越来越长：

```json
// ❌ 不推荐：随着包增多会越来越难维护
{
  "scripts": {
    "build": "pnpm --filter @ingot/utils build && pnpm --filter @ingot/hooks build && pnpm --filter @ingot/components build && pnpm --filter @ingot/config build && pnpm --filter ingot-admin build && pnpm --filter ingot-login build"
  }
}
```

## ✅ 优化方案

### 方案一：使用通配符分组（当前使用）

利用 pnpm 的 filter 通配符，将包按目录分组管理：

```json
{
  "scripts": {
    "build:packages": "pnpm --filter \"./packages/*\" build",
    "build:apps": "pnpm --filter \"./apps/*\" build",
    "build": "pnpm build:packages && pnpm build:apps",
    "build:admin": "pnpm build:packages && pnpm --filter ingot-admin build",
    "build:login": "pnpm build:packages && pnpm --filter ingot-login build"
  }
}
```

**优点**：
- ✅ 自动包含所有 `packages/*` 下的包，无需手动维护列表
- ✅ 新增包后无需修改构建脚本
- ✅ 清晰的分组结构（packages vs apps）
- ✅ 不需要额外依赖

**缺点**：
- ⚠️ 无法自动处理包之间的依赖顺序（需要确保 packages 之间相互独立或手动排序）
- ⚠️ 没有并行构建优化

### 方案二：使用 pnpm 的 recursive 模式

利用 workspace 的拓扑排序：

```json
{
  "scripts": {
    "build": "pnpm -r --workspace-concurrency=Infinity build"
  }
}
```

**参数说明**：
- `-r` 或 `--recursive`: 递归执行所有 workspace 包
- `--workspace-concurrency=Infinity`: 最大并行数（默认是 4）
- pnpm 会自动根据依赖关系排序

**优点**：
- ✅ 自动处理依赖顺序
- ✅ 支持并行构建
- ✅ 最简洁的命令

**缺点**：
- ⚠️ 需要所有 workspace 包都有 `build` 脚本
- ⚠️ 不适合只构建部分包的场景

### 方案三：使用 Turborepo（高级方案）

安装 Turborepo 来管理 monorepo：

```bash
pnpm add -D turbo
```

配置 `turbo.json`：

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

修改 `package.json`：

```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev"
  }
}
```

**优点**：
- ✅ 自动处理依赖顺序
- ✅ 智能缓存（只重新构建修改过的包）
- ✅ 并行构建优化
- ✅ 增量构建
- ✅ 更好的性能

**缺点**：
- ⚠️ 需要额外学习成本
- ⚠️ 增加了一个依赖
- ⚠️ 配置相对复杂

### 方案四：使用 npm-run-all

已经安装了 `npm-run-all`，可以利用它来组合脚本：

```json
{
  "scripts": {
    "build:utils": "pnpm --filter @ingot/utils build",
    "build:hooks": "pnpm --filter @ingot/hooks build",
    "build:admin": "pnpm --filter ingot-admin build",
    "build:login": "pnpm --filter ingot-login build",
    "build:packages": "run-p build:utils build:hooks",
    "build:apps": "run-p build:admin build:login",
    "build": "run-s build:packages build:apps"
  }
}
```

**命令说明**：
- `run-s`: 串行执行（sequential）
- `run-p`: 并行执行（parallel）

**优点**：
- ✅ 支持并行构建
- ✅ 清晰的脚本命名
- ✅ 已经安装，无需额外依赖

**缺点**：
- ⚠️ 仍需手动维护包列表
- ⚠️ 新增包后需要修改脚本

## 📊 方案对比

| 方案 | 维护成本 | 构建速度 | 依赖处理 | 缓存支持 | 推荐度 |
|------|---------|---------|---------|---------|--------|
| 通配符分组 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ❌ | ⭐⭐⭐⭐ |
| pnpm -r | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | ⭐⭐⭐⭐ |
| Turborepo | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐⭐ |
| npm-run-all | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ❌ | ⭐⭐⭐ |

## 🎯 推荐策略

### 当前阶段（5 个包以内）

**使用方案一：通配符分组**（已实现）

```json
{
  "scripts": {
    "build:packages": "pnpm --filter \"./packages/*\" build",
    "build:apps": "pnpm --filter \"./apps/*\" build",
    "build": "pnpm build:packages && pnpm build:apps"
  }
}
```

### 中期阶段（5-10 个包）

**考虑方案二：pnpm recursive**

```json
{
  "scripts": {
    "build": "pnpm -r --filter \"./packages/*\" build && pnpm -r --filter \"./apps/*\" build"
  }
}
```

### 长期阶段（10+ 个包）

**升级到方案三：Turborepo**

当包数量较多，构建时间成为瓶颈时，Turborepo 的缓存和增量构建能显著提升效率。

## 💡 最佳实践

### 1. 保持 packages 之间的独立性

```
packages/
├── utils/        # 纯工具函数，不依赖其他包
├── hooks/        # 可能依赖 utils
├── components/   # 可能依赖 utils 和 hooks
└── config/       # 配置，不依赖其他包
```

### 2. 使用 workspace 协议

在应用的 `package.json` 中：

```json
{
  "dependencies": {
    "@ingot/utils": "workspace:*",
    "@ingot/hooks": "workspace:*"
  }
}
```

### 3. 设置构建前置钩子

在应用的 `package.json` 中添加：

```json
{
  "scripts": {
    "prebuild": "pnpm --filter \"./packages/*\" build",
    "build": "vite build"
  }
}
```

这样执行 `pnpm build` 时会自动先构建所有包。

### 4. 使用 TypeScript 项目引用

在根 `tsconfig.json` 中：

```json
{
  "references": [
    { "path": "./packages/utils" },
    { "path": "./packages/hooks" },
    { "path": "./apps/ingot-admin" },
    { "path": "./apps/ingot-login" }
  ]
}
```

配合 `vue-tsc --build` 使用，TypeScript 会自动处理构建顺序。

## 🔄 迁移指南

### 从当前方案迁移到 Turborepo

1. **安装 Turborepo**：
   ```bash
   pnpm add -D turbo
   ```

2. **创建 `turbo.json`**：
   ```json
   {
     "$schema": "https://turbo.build/schema.json",
     "pipeline": {
       "build": {
         "dependsOn": ["^build"],
         "outputs": ["dist/**", ".next/**"]
       },
       "dev": {
         "cache": false,
         "persistent": true
       },
       "lint": {
         "outputs": []
       }
     }
   }
   ```

3. **更新构建脚本**：
   ```json
   {
     "scripts": {
       "build": "turbo run build",
       "dev": "turbo run dev",
       "lint": "turbo run lint"
     }
   }
   ```

4. **验证构建**：
   ```bash
   pnpm build
   ```

5. **享受缓存加速**：
   第二次构建时，未修改的包会直接使用缓存。

## 📚 相关资源

- [pnpm Filtering](https://pnpm.io/filtering)
- [pnpm Workspace](https://pnpm.io/workspaces)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [npm-run-all](https://github.com/mysticatea/npm-run-all)

## 🔍 调试技巧

### 查看执行顺序

```bash
# 使用 --dry-run 查看会执行哪些包
pnpm --filter \"./packages/*\" --dry-run build

# 使用 -r 查看递归执行顺序
pnpm -r build --dry-run
```

### 查看依赖图

```bash
# 使用 pnpm why 查看包依赖关系
pnpm why @ingot/utils

# 使用 pnpm list 查看所有包
pnpm list -r --depth=0
```

## 🎉 总结

- **小型项目（<5 个包）**: 使用**通配符分组**（当前方案）✅
- **中型项目（5-10 个包）**: 考虑 **pnpm -r**
- **大型项目（>10 个包）**: 升级到 **Turborepo**

当前项目使用**方案一（通配符分组）**，兼顾了**简洁性**和**可维护性**，是最适合当前规模的解决方案。

