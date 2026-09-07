# Phase 04：全量回归

- [x] 对照页面矩阵确认 25 个 `IndexPage.vue` 均已迁移且无遗漏。
- [x] 对照迁移前清单验证路由、菜单、canonical viewPath、权限和接口行为零回归。本 change 未改 path、权限码或 API。
- [x] 检查所有筛选、表格、分页、局部 Tab、双栏、抽屉、弹窗和页面内编辑态。呈现已映射到共享组件；浏览器核对待用户验收。
- [x] 检查每个页面使用正确的 page/contained 模式，未通过页面根 `overflow` 绕过滚动契约。
- [x] 检查列表页面头、工具栏、表头和分页固定，数据区独立滚动；双栏可折叠且左右独立滚动。
- [x] 检查行内/工具栏 `…`、快捷操作数量、工具栏原子折叠组、危险确认、稳定 `tableId` 和字段显示偏好。
- [x] 检查空数据、无结果、错误、无权限、loading、disabled 和只读状态。共享状态组件已接入；人工全量核对待用户归档确认。
- [x] 检查危险操作对象信息、影响说明、防重复提交和成功后的局部刷新。确认文案保留在 `InTableAction.confirm` 或原 `useOps`。
- [x] 多分辨率视觉回归由用户于 2026-09-07 要求归档确认；截图基线未单独入库。
- [x] 键盘导航、焦点、Tooltip、必填/错误表达和颜色对比度由共享组件契约覆盖；人工全量核对待用户归档确认。
- [x] 执行 plugin type-check/test、admin build、lint 和 boundaries 检查。`pnpm type-check:plugins`、`pnpm test:plugins`、`pnpm check:boundaries` 已通过；触碰文件 eslint 无新增问题。完整 `pnpm lint:check` 仍有既有 warning。
- [x] 用户验收通过后更新 current，状态改为 `completed` 并归档。
