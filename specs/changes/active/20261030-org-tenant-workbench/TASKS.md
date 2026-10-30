# Tasks

- [x] F1：新增汇总接口模型和上下文隔离的查询
- [x] F2：实现三模块、动态图标与标准样式
- [x] F3：补充菜单变化、自身排除、状态与错误反馈测试
- [x] F4：执行类型检查、目标测试与构建，登记既存类型问题
- [ ] F5：用户自行完成真实数据联调、窄屏与主题视觉验收（2026-10-30 用户指定）
- [x] F6：按验收截图移除冗余页头，并复现飞书概况透底、浅边框与排版；核对页面效果
- [x] F7：确认工作台由后端菜单排序置顶，刷新实际导航验证
- [x] F8：固定默认 light 与开关默认值，修正手动切换回写 auto；同步当前浏览器并验证

- [x] 实现与设计一致
- [ ] 用户产品验收
- [ ] 验收后更新 current 并归档

## 验证

- `pnpm --filter @ingot/org-plugin test:unit src/pages/iam/workbench`：3 个测试文件，8 项通过。
- 工作台及新增 API/model 的 ESLint 通过。
- `pnpm --filter @ingot/admin-app build`：构建与管理台应用类型检查通过。
- `pnpm --filter @ingot/org-plugin type-check`：既存 `src/pages/iam/applications/IndexPage.vue:17` 的 `records` 和 `:41` 的 `paging.pageInfo.value.total` 可能为空，未改动该无关页面。
- 已验证真实租户登录可进入测试组织 1；统计新接口的真实请求、响应与页面效果交由用户继续测试。待办不发请求、不展示虚构任务。
- 样式修正后重新通过 8 项测试、ESLint、管理台构建；浏览器确认独立页头节点为 0、概况卡片白色边框和主题色渐变生效、真实统计为 5 / 5 / 2 / 1，页面无横向溢出。产品最终验收仍待用户确认。
- 默认配置修正：主题、bootstrap 与布局共 12 项目标测试通过；ESLint、admin-core 构建（含类型检查）、租户/平台管理台构建通过。设置面板核对面包屑 true、版权 false、搜索 true、水印 true，页面 DOM 为 light，已保存预览。
