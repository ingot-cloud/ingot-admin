# Phase 06：成员工作区与表格工具补强

## 准备

- [x] 用户明确确认 Phase 06 可以开工；change 延续既有 `implementing` 状态，本次 spec 修订本身不视为业务代码开工授权。
- [x] 只读取本 change 的 `API.md`、`REQUIREMENTS.md` 与 `DESIGN.md`，不重新扩大到全局顶栏和侧栏。
- [x] 记录 `InFilterContainer`、`InTable`、`InColumnSetting` 当前公开属性、插槽、事件和调用点。

## InFilterContainer

- [x] 将根、SplitBody、RightPane 调整为固定高度和 `min-height: 0` 链路，header/top 不参与内容滚动。
- [x] 保留 `left-width`、`left-collapsible`、`v-model:left-open` 与 `persistence-key`，新增 `auto-collapse`、`min-right-width` 类型化契约。
- [x] 实现 260px → 0px 的左栏收缩和右栏无重建扩展。
- [x] 实现分隔线中线 16×32px 右侧圆角折叠标签、箭头翻转、Tooltip、键盘和 focus-visible 状态。
- [x] 使用容器 `ResizeObserver` 实现临时自动收起，并在宽度恢复后还原用户手动状态。
- [x] 确保左栏和右侧表格数据区独立滚动；旧页面未启用 `left-collapsible` 时保持兼容。

## InTable 与 tools

- [x] 移除内置刷新按钮、内部 handler 及默认 tools 占位；保留并废弃无自动触发入口的 `refresh` emit 类型，待 rollout 清理页面监听后再删除。
- [x] 新增 `tools-start`、`tools-end` 插槽，并为旧 `toolbar` 提供有期限的兼容映射。
- [x] 将字段设置改为按需导入的 32px 完整按钮，`InTable` 不再自动渲染。
- [x] 重构 `InColumnSetting` 为约 213×426px 普通复选列表，支持全部半选、必选列、即时生效、持久化、Esc 和焦点返回。
- [x] 实现 MetaRow、ToolsRow、TableDataViewport、Pagination 的固定/滚动边界。
- [x] 增加成员式 compact 密度：48px 表头、44px 数据行、`#f2f3f5` 表头和 `#dee0e3` 行分隔。
- [x] 验证固定选择列/操作列、表格内部横向滚动和右下分页。

## 自适应操作收纳

- [x] 新增或收敛 `InTableActions<Row>` 与 action 严格类型。
- [x] 在兼容现有 permission/group/confirm/onSelect 的基础上新增 `icon`、`priority`、`overflow: auto|never|always` 与 `overflowGroup`；quick 主操作默认 never。
- [x] row 变体继续固定“详情 + 至多一个高频快捷操作 + …”；toolbar 变体支持固定操作和原子折叠组。
- [x] 使用 actions 容器 `ResizeObserver`、固定操作宽度、折叠组总宽度、gap 和更多按钮预留宽度计算状态。
- [x] 同组操作全体直出或全体收纳；宽度恢复后一次性展开整组，无折叠项时不渲染“…”按钮。
- [x] 联动左栏折叠动画验证 ToolsEnd 宽度自动复算，页面无需手动 refresh/resize，动画结束后无来回抖动。
- [x] 增加成员页式 fixture：邀请/添加始终直出，三个批量操作同组，菜单顺序和未选成员禁用态与实测一致。
- [x] 自动收纳仅支持配置型 action；任意自定义 tools 不复制、不移动、不重复挂载。
- [x] 更多菜单支持 disabled reason、danger、分组、键盘导航、Esc 和焦点返回。
- [x] 防止初次测量闪烁、ResizeObserver 循环和动态文案导致的顺序抖动。

## 自动化与视觉验收

- [x] [P] 为 260/0px 手动折叠、自动收起、宽度恢复和减少动效补充测试。
- [x] [P] 为 tools 插槽、无内置刷新、compact 表格、固定区域和 200 行数据补充测试。
- [x] [P] 为 1200/940/700/520/360px actions 容器的整组收纳和恢复补充测试，断言不存在部分展开中间态。
- [x] [P] 为 `InColumnSetting` 半选、必选列、持久化、Esc 和焦点返回补充测试。
- [x] 更新组件 README、fixture、导出和旧 API 迁移说明。
- [x] 运行 admin-core type-check/test、packages build、admin app build、lint 和 boundaries 检查。
- [ ] 在 1280、1000、920、900、800px 视口完成成员式 fixture 视觉检查。
- [ ] 取得用户对成员工作区的视觉确认后再把状态改为 `validating`。
