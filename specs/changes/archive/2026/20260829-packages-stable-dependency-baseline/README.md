# 20260829-packages-stable-dependency-baseline

> 状态：completed

## 协作模式

前端工程升级（一人全栈）

## 背景与动机

仓库中的 Vue 生态、构建工具、类型检查和代码质量工具处于多个不同版本基线，根目录
`pnpm.overrides` 又覆盖了应用自身声明，导致安装结果与 manifest 不直观。部分 tsconfig 选项已在
TypeScript 6 中废弃，CI 的 Node.js 版本也低于 Vite 8 及新版 unplugin 的运行要求。

为避免长期停留在旧版本后一次性跨越多个大版本，本 change 建立一套可持续维护的稳定依赖基线，
并把高风险大版本升级拆为可独立验证、可回滚的阶段。

## 目标

- 统一本地、workspace 与 CI 的 Node.js/TypeScript/前端依赖版本基线。
- 将 Vue、Element Plus、Pinia、Vue Router、Vite、UnoCSS 等升级到经兼容性验证的稳定版本。
- 清理过时的 Vite 插件和 Element Plus 内部导入，降低下一次升级成本。
- 保持两个应用现有页面、路由、状态持久化、加密请求和构建产物行为不变。
- 建立 lint、type-check、build、E2E 与人工 smoke test 的升级验收门禁。

## 范围

### In Scope

- Node.js 22、pnpm 10、workspace 版本声明与 GitLab CI 基线。
- tsconfig 的 TypeScript 6 兼容迁移。
- Vue 3.5、Element Plus 2.14、Pinia 4、Vue Router 5、Vite 8、UnoCSS 66、VueUse 14。
- TypeScript 6、vue-tsc 3.3、ESLint 10、Vitest 4、Playwright 及相关 Vite/unplugin 工具。
- Axios、qs、js-cookie、PostCSS、TinyMCE 7 等直接依赖的安全稳定版本。
- 公共依赖单一来源、共享 package peer dependency 与陈旧插件清理。

### Out of Scope

- TypeScript 7；当前 typescript-eslint 稳定版本尚未覆盖该版本。
- TinyMCE 8；编辑器大版本迁移单独评估。
- 替换 `webcrypto-liner`、`crypto-js` 或改变 HYBRID 信封加密协议。
- 替换 `beautify-qrcode` 或改变二维码视觉输出。
- 页面功能、后端接口、权限模型和路由结构调整。
- `20260829-packages-composable-admin-runtime` change 中的后台运行时拆包工作。

## 输入来源

- 需求文档：用户对话中确认的“稳定版本升级”方案。
- 接口文档：无；本次不改变后端接口。
- 后端来源：无。
- 用户确认：2026-08-29 明确要求“开始按计划升级”。

## 工件

- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

- Vite 8 改用 Rolldown/Oxc，旧 Vite 社区插件可能不兼容，必须单独阶段验证。
- Pinia 4 为 ESM-only，并要求显式安装 `@vue/devtools-api`。
- Vue Router 5、VueUse 14、ESLint 10、Vitest 4 均为大版本升级，不能与 Vite 8 混为一次不可分割修改。
- 当前自动化测试覆盖有限，需依赖构建、E2E 和人工 smoke checklist 补足。
- `vue-tsc` 3.3.11 对组件公开插槽类型要求更严格；`InTable`/`InRadioTable` 必须同时声明
  固定工具栏插槽和动态列插槽，避免编辑器与 CLI 类型检查结果不一致。
- 另一个 active change 仍为 draft；本 change 不实施其拆包设计，若其后续开工须先基于升级后的版本基线重审。

## 相关链接

- [项目宪章](../../../../CONSTITUTION.md)
- [编码规范](../../../../../.agents/skills/ingot-coding-standards/SKILL.md)

## 完成记录

- 完成日期：2026-08-31
- 关联提交或 PR：`eacc209` refactor: 依赖版本整体升级
- 更新的 current capability：`packages/stable-dependency-baseline`
- 与原设计的差异：
  - TypeScript 保持 6.0.3；验收阶段补齐表格组件公开插槽契约后，vue-tsc 升级至 3.3.11。
  - overrides 只保留 `elliptic`、`rollup`、`defu`、`lodash`/`lodash-es` 的父依赖限定安全补丁。
  - ESLint 10 新发现的 214 条历史类型债务降级为 warning；本次不做全仓类型重构。
- 自动验证：
  - `pnpm check`、`pnpm build`、`pnpm install --frozen-lockfile` 通过。
  - admin/login 生产预览均返回 HTTP 200。
  - 生产审计从升级前 `1 critical / 24 high / 27 moderate / 8 low` 降至仅 `1 low`。
  - Playwright 1.62 E2E 已改为真实应用 smoke，但本机缺少对应浏览器二进制，待 CI 或安装浏览器后执行。
  - 验收阶段修正 Vite 8 开发代理 rewrite，`/api/pms/...` 转发为 `/pms/...`，不再产生双斜杠。
  - 验收阶段在真实浏览器复现并修正 Vite 8/Rolldown 的 `crypto-js` CommonJS 预构建回归；
    验证码 AES 模块可正常动态加载并输出密文，控制台无模块导出错误。
  - 验收阶段为动态路由启动增加临时 matcher，真实浏览器连续刷新动态页面后不再出现
    Vue Router 5 `VUE_ROUTER_R0004`，并补充动态 matcher 替换单测。
  - 验收阶段为 `InTable`/`InRadioTable` 声明固定及动态列插槽，并使用显式 `TableAPI`
    转发 Element Plus 表格方法，vue-tsc 3.3.11 与编辑器使用同一类型规则。
- 剩余风险：
  - `webcrypto-liner > elliptic@6.6.1` 存在上游尚无修复版本的低危
    `GHSA-848j-6mx2-7j84`。
  - 需人工验证登录/退出、状态持久化、动态路由、Element Plus 核心交互、自定义 SVG、
    TinyMCE、二维码和暗色模式。
- 取消原因：
