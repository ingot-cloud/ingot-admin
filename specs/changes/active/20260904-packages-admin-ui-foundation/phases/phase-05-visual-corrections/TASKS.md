# Phase 05：第二轮视觉复核补强

## 准备

- [x] 开工时将 change 状态从 `approved` 改为 `implementing`。
- [x] 复核 `API.md`、`REQUIREMENTS.md` 与 `DESIGN.md` 的修订内容，不再按旧滚动模型施工。
- [x] 保存当前 fixture 和组件契约基线，识别必须保留的旧属性、插槽和事件。

## 画布、壳层与顶栏

- [x] 拆分 canvas/sidebar/surface/muted Token，保留旧背景变量兼容别名。
- [x] 将侧栏背景改为 `#f5f5f5`，移除常驻右边框，落实 8px 沟槽和 244/60px 总占位。
- [x] 将 `layout.main`、Workspace、MainViewport 改为固定高度和 `min-height: 0` 链路，移除框架内容根节点的无差别滚动。
- [x] 新增 `InPageFrame` 的 page/contained 模式及组件契约测试。
- [x] 调整面包屑和页面头为固定区域，页面头约 80px、白底、底部分隔。
- [x] 重构顶栏左/中/右区域，提供产品入口、搜索 adapter、utility registry 与用户/企业菜单扩展位。
- [x] 将组织切换从侧栏头迁移或映射到顶栏，保持原登录切换语义。

## 双栏、表格与操作

- [x] 扩展 `InFilterContainer` 的 260px 左栏、折叠柄、`v-model:left-open`、持久化与窄屏覆盖层。
- [x] 确保左树、右侧数据区和宽表格分别拥有正确滚动边界。
- [x] 将 `InTable` 改为全高 flex：工具栏固定、数据区滚动、表头 sticky、分页固定。
- [x] 补齐固定操作列及横向滚动分隔状态。
- [x] 新增类型化 `InTableActions`，实现详情、高频动作、`…`、批量上下文、禁用原因、危险确认与键盘交互。
- [x] 重构 `InColumnSetting` 为普通复选列表，实现全部半选、必选列、即时应用、焦点返回与 `user + tableId` 持久化。
- [x] 更新公共导出、组件文档、fixture 和兼容迁移说明。

## 自动化验证

- [x] [P] 为 Token 别名、`InPageFrame` 滚动模式和 keep-alive 滚动恢复补充单元测试。
- [x] [P] 为侧栏 244/60px 占位、双栏折叠和窄屏覆盖层补充组件测试。
- [x] [P] 为 `InTable` 固定工具栏/分页、内部纵横滚动和固定操作列补充测试。
- [x] [P] 为 `InTableActions` 的快捷数量、权限、禁用、危险确认和键盘行为补充测试。
- [x] [P] 为 `InColumnSetting` 的半选、必选列、持久化、Esc 和 focus return 补充测试。
- [x] 运行 `pnpm build:packages`、admin-core type-check/test、admin app build、lint 和 boundaries 检查。

## 人工视觉验收

- [ ] 在 1440×900、1280×800、1024×768 和小于 1024px 视口检查顶栏、侧栏、面包屑、页面头和工作面。
- [ ] 使用至少 200 行数据确认页面头、筛选工具栏、表头和分页固定，只有数据区滚动。
- [ ] 检查侧栏与画布同色、白色工作面、8px 沟槽、菜单活动态和折叠动效。
- [ ] 检查成员式左树右表的 260px 展开、折叠、独立滚动和覆盖层行为。
- [ ] 检查成员/部门式行操作、批量更多菜单、危险操作和字段显示设置。
- [ ] 取得用户视觉确认后把状态改为 `validating`；通过最终验收前不更新 current、不启动 rollout。

> 本阶段代码任务已经完成，但成员页式双栏和表格工具区未获得针对性视觉确认。后续收敛工作进入 [Phase 06](../phase-06-member-workspace/TASKS.md)，本文件保留为已实施历史，不回退勾选状态。
