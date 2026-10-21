# 勾选框与树展开

多选、单选和树展开箭头由 `@ingot/admin-core` 的全局样式统一。业务页使用 Element Plus 控件即可，不要再改尺寸、圆角、勾号、圆心或另一套箭头。

## 用哪个

- 多选：`el-checkbox`。16px、圆角 4px。未选是 1px 边框、透明底；选中是主题色底和边框，勾用 Element Plus 原生白色勾。
- 单选：`el-radio`。16px 圆，选中是主题色边框加圆心。不要把单选画成方框。
- 半选横条由全局样式一次 `translate(-50%, -50%)` 居中。不要再叠加 `scale` 或 `translateY`。
- 树展开：`el-tree`、`InTree`、`el-tree-select` 共用 12px 实心三角。收起朝右，展开朝下，颜色是 `--in-text-color-secondary`。叶子节点占位但不显示箭头。
- 禁用态降低不透明度，不要另写一套灰色图标。

## 不要做

- 不要在页面里设置 `--el-checkbox-*`、`--el-radio-*`，也不要改 `.el-checkbox__inner` / `.el-radio__inner` 的宽高、圆角和勾号。
- 不要再写 `.el-tree-node__expand-icon::before`，也不要内联另一套 SVG 或写死 `#646a73`。
- 表格行展开（`.el-table__expand-icon`）保持现有小箭头，不套这套三角。
- `InTag`、`InStatusTag`、`InSelectionTag` 是标签，不是勾选框。
