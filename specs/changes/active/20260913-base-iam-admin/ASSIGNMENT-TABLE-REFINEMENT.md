# 角色分配表格与操作栏优化

> 状态：validating
> 用户于 2026-10-08 明确批准实施本计划。主 change 保持 implementing；不更新 current，不创建提交。

## 需求与边界

仅调整平台角色分配页，以及 InTable 原生 selection/index 列被空默认插槽覆盖的问题。复用现有列内勾选与 InTableActions；不重写 selection，不调整其他页面的动作或布局，不修改后端接口。

## 设计与兼容

- 批量升级、权限诊断、分配角色接入同一工具栏，依次靠右排列。批量升级 priority=10、诊断 priority=30，均 overflow=auto；分配角色 priority=50、overflow=never。无选择时批量升级禁用并提示“请先选择可升级的分配记录”，收纳后保持行为。
- 移除本页独立 selection 列，在必显的主体列复用 treeColumn/checkbox，关闭树展开。本页 scoped 样式移除展开占位，不改变部门树样式。表头保持列名，选中时显示“主体 · 已选 N 条”，不换行。
- 勾选入口受全局升级操作资格限制，行可选性由服务端逐条升级 capabilities 决定；无资格显示禁用框。表头只全选当前页可选记录，支持半选；加载过程中临时禁用勾选，不能从骨架表头选择上一页数据。批量升级继续调用原抽屉和后端校验，不按角色名称推断关系，不增加查询。
- 搜索、筛选、分页、页大小变化、刷新、升级成功及失去资格时，调用表格 clearSelection 并清空页面选择；仅保留当前页选择，不开启跨页保留。
- InTable 仅在普通/default、expand、树列提供自定义默认插槽，selection/index 回到 Element Plus 原生渲染。列探测行保护仍保留；原生表头默认 off 及 on/disabled 契约不变，公共 API 不变。
- 宪章符合性：业务逻辑留在 platform 插件，公共渲染修正留在 admin-core；不新增依赖或跨插件代码，样式使用现有主题 Token。

## 接口

所有后端 API、请求参数和权限契约不变；TableAPI、表格属性和事件保持兼容。

## 任务

- [x] AT01：补充批准后的需求、设计、兼容边界及验收任务。
- [x] AT02：修正原生列插槽，真实 Element Plus 回归覆盖原生 selection/index、普通列、expand 及部门树勾选。
- [x] AT03：统一工具栏和主体列内勾选，数量与清空状态同步；沿用逐条能力与升级流程。
- [x] AT04：相关组件测试、类型检查、只读 lint、依赖边界和两管理台构建；记录实际结果。
- [ ] AT05：用户人工验收窄屏、横向滚动、固定列、主题及真实身份；开发和自动化不代替人工验收。

## 人工验收

1. 有升级资格时主体列显示勾选框；无资格记录框禁用，无全局资格时不显示框；左侧无空白独立列。
2. 单选、多选、当前页全选与半选正确，显示“主体 · 已选 N 条”；搜索、筛选、翻页、改变页大小、刷新及升级后不残留选择。
3. 宽屏三按钮靠右；缩窄依次收起批量升级、诊断，分配角色可达。未勾选时升级禁用且可看到原因，更多菜单内行为相同。
4. 横向滚动时固定操作列正常；浅色/深色主题、部门树和原生 selection 成员选择对话框无异常。

## 实施证据

2026-10-08：开发和限定自动化完成，增量进入 validating；AT05 人工项未执行，主 change 保持 implementing。

- 生产代码仅修改平台授权页、其 table.ts 和 InTable 插槽条件。勾选复用既有树列 API；展开占位样式仅作用于本页 assignment-table。
- 61 项限定回归通过：admin-core 36（真实原生 selection/index、普通/expand/树列、既有表格动作与列偏好），platform 20（数量、全选/半选、逐条能力变化、筛选/搜索清空、分页/刷新/升级/失权恢复、ResizeObserver 收纳与菜单行为、既有角色查询边界），org 5（实际角色绑定成员对话框及部门页面回归）。没有以这些 Mock 组件测试替代真实账号人工验收。
- 组织插件新增真实 Element Plus 测试需在 vitest 中 inline element-plus，避免 Node 直接加载其 CSS；仅改变测试环境，不改变页面运行配置。测试生成的无关 components.d.ts 声明恢复原内容。
- admin-common/core/platform/org 类型检查、改动文件只读 ESLint、check:boundaries、check:docs、git diff --check 通过。ESLint 无错误；InTable 已有 17 条未使用解构变量 warning 未扩展清理。
- build:packages 完成，正式主题目录无包因此 build:themes 按脚本跳过；admin-platform 与 admin 两管理台的 build（含宿主类型检查）通过。构建保留现有图标扫描、crypto 浏览器 external、静态/动态导入及产物体积提示，未修改构建门禁或其他页面。

验证命令（Node 22.17.0 / pnpm 10.12.4）：

```sh
pnpm --filter @ingot/admin-core test:unit src/components/table/InTable.integration.test.ts src/components/table/InTable.test.ts src/components/table/InTableActions.test.ts src/components/table/columnVisibility.test.ts
pnpm --filter @ingot/platform-plugin test:unit src/pages/iam/authorization/IndexPage.test.ts src/pages/iam/authorization/useRoleWorkspace.test.ts
pnpm --filter @ingot/org-plugin test:unit src/pages/contacts/role/components/AddMemberDialog.test.ts src/pages/contacts/dept/IndexPage.test.ts src/pages/contacts/dept/table.test.ts
pnpm --filter @ingot/admin-common type-check
pnpm --filter @ingot/admin-core --filter @ingot/platform-plugin --filter @ingot/org-plugin type-check
pnpm exec eslint packages/admin-core/src/components/table/InTable.vue packages/admin-core/src/components/table/InTable.integration.test.ts plugins/platform/src/pages/iam/authorization/IndexPage.vue plugins/platform/src/pages/iam/authorization/IndexPage.test.ts plugins/platform/src/pages/iam/authorization/table.ts plugins/org/src/pages/contacts/role/components/AddMemberDialog.test.ts plugins/org/vitest.config.ts
pnpm check:boundaries
pnpm check:docs
pnpm build:packages
pnpm build:themes
pnpm --filter @ingot/admin-platform-app build
pnpm --filter @ingot/admin-app build
git diff --check
```

本轮未修改 current、后端或 API 契约。用户于 2026-10-08 随后要求提交，代码已提交为 `b2cb303`（fix: 让角色分配勾选与批量操作保持一致），Spec 按规范另行提交；人工验收仍待执行。
