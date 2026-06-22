# ingot-admin 项目宪章（CONSTITUTION）

本文档定义 ingot-admin monorepo 的**不可协商原则**。所有 SDD 变更（`changes/`）的设计与实现必须符合本宪章。

详细编码规范见：[ingot-coding-standards SKILL](../.agents/skills/ingot-coding-standards/SKILL.md)

## 技术栈

- Vue 3 + `<script setup>` + TypeScript（strict）
- Pinia、UnoCSS、Element Plus
- pnpm workspace monorepo
- Vite 构建

## 不可协商原则

### 架构与代码组织

1. **Monorepo 边界**：跨 app 复用逻辑必须放在 `packages/`，禁止在 `apps/` 间复制
2. **页面结构**：页面拆分为 `IndexPage.vue` + `table.ts` + `useOps.ts` + `components/`
3. **API 层**：函数命名 `XxxAPI`，显式 `Promise<R<T>>`，统一 `import request from "@/net"`
4. **目录语义**：业务页面在 `pages/`（非 `views/`）；API 按业务域拆分

### 代码质量

1. **类型安全**：新代码禁止 `any`、`as any`；使用 `===` / `!==`
2. **清洁代码**：禁止 `console.log`、注释掉的死代码
3. **组件约定**：组合式 API + `<script setup lang="ts">`；设计系统组件 `In*`，业务组件 `Biz*`
4. **事件命名**：emit 使用 kebab-case 语义名（`change`、`success`），带类型签名

### 样式

1. **UnoCSS 优先**：使用原子类；禁止 scss/less（遗留代码除外）
2. **响应式**：支持多种设备尺寸

### SDD 流程

1. **规格先行**：非 trivial 变更须在 `changes/active/` 有对应提案后再实现
2. **真相单一**：`current/` 始终反映系统当前行为；变更通过 REQUIREMENTS 合并，不维护平行规格
3. **可追溯**：完成的变更归档至 `changes/archive/<year>/`，保留完整 artifact 集

### 构建与依赖

1. **首次构建**：新 clone 后须先 `pnpm build:packages` 再启动开发服务器
2. **包管理**：统一使用 pnpm，遵循 workspace 协议

## 符合性检查

在 `DESIGN.md` 中填写「宪章符合性」章节，确认本变更不违反上述原则。若有例外，须明确记录理由与范围。

## 修订

本宪章修订须通过独立变更提案，归档后更新本文档。
