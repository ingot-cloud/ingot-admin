# 需求：稳定依赖版本基线升级

## 场景与页面

### 场景 1：开发者安装与构建

- **角色**：前端开发者、CI runner。
- **入口**：仓库根目录与 GitLab CI。
- **步骤**：使用规定的 Node.js/pnpm 安装依赖，依次构建共享包和两个应用。
- **预期结果**：依赖解析唯一，类型检查和生产构建通过，不出现已废弃 tsconfig 选项错误。

### 场景 2：用户访问现有应用

- **角色**：管理台和登录应用用户。
- **入口**：`ingot-admin`、`ingot-login`。
- **步骤**：登录、刷新、访问动态路由和常用 Element Plus 页面，再退出登录。
- **预期结果**：升级前后的登录态、菜单、路由、页签、组件交互与视觉表现保持一致。

### 场景 3：后续维护者升级依赖

- **角色**：依赖维护者。
- **入口**：workspace manifest。
- **步骤**：查看公共版本声明与 overrides，升级某个公共依赖。
- **预期结果**：公共依赖版本来源明确，应用之间不再声明互相冲突的 Vue 生态版本。

## 目标版本基线

| 依赖 | 目标版本 |
|------|----------|
| Node.js | 22.17.0 或更高的兼容 Node 22 版本 |
| pnpm | 10.12.4 |
| Vue / compiler-sfc / shared | 3.5.42 |
| Element Plus | 2.14.5 |
| Pinia | 4.0.3 |
| Vue Router | 5.3.0 |
| Vite | 8.2.2（经 Vite 7 过渡验证） |
| UnoCSS | 66.8.1 |
| VueUse | 14.4.0 |
| TypeScript | 6.0.3 |
| vue-tsc | 3.3.11 |
| ESLint | 10.9.1 |
| Vitest | 4.1.11 |
| Playwright | 1.62.1 |
| TinyMCE | 7.9.3 |

实施时如 registry 已发布新的补丁版本，只允许在同一 minor 内前进；任何新的 major/minor 必须先更新
本 change 的 DESIGN.md 并重新确认。

## 验收标准

- [x] Node.js、pnpm、根 manifest、两个应用和 CI 使用一致的工具链约束。
- [x] 所有 tsconfig 不再使用 `baseUrl` 或 `moduleResolution: node10/node`。
- [x] 两个应用的 Vue、Element Plus、Pinia、Router、UnoCSS 和 VueUse 安装结果一致。
- [x] TypeScript 6、vue-tsc、ESLint、Vitest 与 Vite 的 peer dependencies 无冲突。
- [x] `pnpm install --frozen-lockfile` 可复现安装。
- [x] `pnpm build:packages` 和两个应用的 type-check/production build 通过。
- [x] lint 不产生新增错误；自动生成的组件和 auto-import 类型声明可正常生成。
- [ ] 登录、退出、状态持久化、动态路由、菜单、页签和异常路由通过 smoke test。
- [ ] 表格、表单、弹窗、抽屉、上传、日期组件、暗色模式、自定义 SVG、TinyMCE 和二维码无明显回归。
- [ ] 加密挑战与请求封装行为不变；安全库替换不在本次范围内。
- [x] 生产依赖审计结果相较升级前下降，剩余例外在完成记录中说明。

## ADDED

### REQ-A001：公共依赖单一版本来源

**验收标准：**

- [x] workspace 公共版本集中声明，应用 manifest 不再与根 overrides 互相冲突。
- [x] overrides 仅保留传递依赖兼容或安全约束，并注明原因。

### REQ-A002：分阶段可回滚升级

**验收标准：**

- [x] 环境、运行时、状态路由、构建、质量工具分别验证。
- [x] 任一阶段失败时可单独撤回，不依赖未完成的后续阶段。
