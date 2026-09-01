# 新应用 TypeScript 配置模板

当你在 `apps/` 目录下创建新的 Vue 应用时，请使用以下模板创建 `tsconfig.app.json`：

```json
{
  "extends": "../../tsconfig.vue-base.json",
  "include": ["env.d.ts", "src/**/*", "src/**/*.vue", "*.d.ts"],
  "exclude": ["src/**/__tests__/*"],
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 配置说明

- `paths` - 路径相对于当前 tsconfig，只需配置应用特有的路径映射（如 `@/*`）
- **不需要 `references`**：packages 依赖通过根目录统一管理
- **packages 路径映射统一在 `tsconfig.vue-base.json` 中管理**

## 优势

### 🎯 统一管理 packages 路径

- 所有 `@ingot/*` 包的路径映射都在 `tsconfig.vue-base.json` 中
- 新增 packages 时只需在一个地方添加配置
- 所有应用自动继承新的 packages 配置

### 🚀 开发时直接使用源码

- TypeScript 和 Vite 都配置为直接引用源码文件
- 修改 packages 代码后无需重新构建
- 实时类型检查和热更新

### 📦 生产构建使用编译版本

- 构建时自动使用 packages 的编译后版本
- 确保生产环境的性能和稳定性

### 🔧 极简配置

- 应用配置文件最小化
- 无需重复的 references 声明
- 维护成本最低

## References 管理策略

### 根目录统一管理（必须保留）

```json
// tsconfig.json
{
  "references": [
    { "path": "./apps/admin" },
    { "path": "./apps/auth" },
    { "path": "./packages/utils" }
  ]
}
```

### 应用级别无需重复

- ✅ 增量编译通过根目录 references 实现
- ✅ 类型解析通过 paths 映射实现
- ✅ 配置更简洁，维护更容易

## 添加新应用步骤

1. 复制上述 `tsconfig.app.json` 到新应用目录
2. 在根目录 `tsconfig.json` 的 `references` 中添加新应用路径
3. 在新应用的 `package.json` 中添加 `"@ingot/utils": "workspace:*"`
4. 在新应用的 `vite.config.ts` 中添加 packages 别名（参考现有应用）

## 添加新 packages 步骤

1. 在 `tsconfig.vue-base.json` 的 `paths` 中添加新包路径映射
2. 在根目录 `tsconfig.json` 的 `references` 中添加新包路径
3. 在各应用的 `vite.config.ts` 中添加对应的别名配置
4. 在需要使用的应用的 `package.json` 中添加 workspace 依赖
