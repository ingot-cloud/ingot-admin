# 任务：稳定依赖版本基线升级

## 准备

- [x] 确认用户已批准上一轮版本矩阵与分阶段方案
- [x] 将本 change 状态改为 `implementing`
- [x] 阅读本 change 的 REQUIREMENTS.md 与 DESIGN.md
- [x] 阅读 CONSTITUTION.md 与 ingot-coding-standards
- [x] 确认另一个 active change 仍为 draft，本 change 不实施其拆包设计

## Phase 1：环境、配置与依赖单一来源

- [x] 固定 Node.js 22 和 pnpm 10，统一根目录及 CI 约束
- [x] 修复 CI 中陈旧 Node/pnpm 与无效构建脚本
- [x] 将公共版本迁移到 pnpm catalog，清理冲突 overrides
- [x] 迁移所有 tsconfig，删除 baseUrl/node10 moduleResolution
- [x] 调整共享 package 的 Vue peer dependency
- [x] 建立升级前 type-check/build/audit 记录

## Phase 2：Vue 运行时兼容簇

- [x] 升级 Vue、compiler-sfc/shared、Element Plus、UnoCSS 和 VueUse
- [x] 升级 Axios、qs、js-cookie、PostCSS、TinyMCE 7 等安全稳定版本
- [x] 修复 Element Plus 内部类型和 locale 导入
- [x] 验证两个应用 type-check/build 与应用壳 HTTP smoke test

## Phase 3：状态与路由兼容簇

- [x] 升级 Pinia 4、@vue/devtools-api、persistedstate 与 Vue Router 5
- [x] 修复刷新动态页面时首次路由解析产生的 `VUE_ROUTER_R0004`
- [ ] 验证登录态、持久化、动态路由、guards、菜单和页签

## Phase 4：Vite 8 与插件

- [x] 先升级到 Vite 7 并完成 type-check/build
- [x] 升级到 Vite 8 与匹配的 Vue/unplugin 工具
- [x] 删除 vite-plugin-html 和无实际用途的 top-level-await 插件
- [x] 修复 Vite 8 开发代理 rewrite 的双斜杠回归
- [x] 修复 Vite 8/Rolldown 对 crypto-js 多入口预构建的 CommonJS 互操作回归
- [ ] 验证或替换 vite-plugin-svg-icons，并完成自定义 SVG 视觉回归
- [x] 核对默认浏览器目标与构建产物大小/chunk

## Phase 5：类型、Lint 与测试工具链

- [x] 升级 TypeScript 6、Vue tsconfig 与 vue-tsc 3.3，并补齐表格组件公开插槽类型
- [x] 升级 ESLint 10、typescript-eslint、Vue ESLint 配置
- [x] 升级 Vitest 4、jsdom、Playwright、Prettier
- [x] 补齐可执行的 lint/check/test 根脚本

## 验证

- [ ] 满足 REQUIREMENTS.md 全部验收标准
- [x] clean/frozen lockfile 安装通过
- [x] `pnpm build:packages` 通过
- [x] 两个 app 的 type-check 与 production build 通过
- [ ] lint、单元测试和 E2E 通过（lint 0 error、单测通过；E2E 缺 Playwright 1.62 浏览器）
- [ ] 人工 smoke checklist 通过
- [x] 重新执行生产依赖 audit 并记录剩余例外

## 收尾

- [ ] 更新 `current/packages/stable-dependency-baseline/spec.md`
- [ ] 在 capability README 记录 change ID
- [ ] README 状态改为 `completed`，归档至 `changes/archive/2026/`
