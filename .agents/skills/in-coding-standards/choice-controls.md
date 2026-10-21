# 勾选框与树展开

多选、单选和树展开箭头由 `@ingot/admin-core` 的全局样式统一。业务页使用 Element Plus 控件即可，不要再改尺寸、圆角、勾号、圆心或另一套箭头。

## 用哪个

- 多选：`el-checkbox`。16px、圆角 4px。未选是白底、1px `--in-gray-500` 边框；选中是主题色底和边框，白色 12px 勾（`checkbox-checked.svg`）。半选用同一底色和 12px 横杠（`checkbox-indeterminate.svg`）。
- 单选：`el-radio`。16px 圆，未选边框同样是 `--in-choice-border`。选中是主题色边框加圆心。不要把单选画成方框。
- 禁用不用透明度。底色 `--in-choice-disabled-bg`，边框 `--in-choice-disabled-border`，勾和圆心用禁用底色，避免洗淡后看不清。
- 树展开：`el-tree`、`InTree`、`el-tree-select` 共用 12px 实心三角。收起朝右，展开朝下，颜色是 `--in-text-color-secondary`。叶子节点占位但不显示箭头。

## 不要做

- 不要在页面里设置 `--el-checkbox-*`、`--el-radio-*`，也不要改 `.el-checkbox__inner` / `.el-radio__inner` 的宽高、圆角、边框色或另画勾号。勾和半选只用全局 SVG。
- 不要再写 `.el-tree-node__expand-icon::before`，也不要内联另一套 SVG 或写死 `#646a73`。
- 表格行展开（`.el-table__expand-icon`）保持现有小箭头，不套这套三角。
- `InTag`、`InStatusTag`、`InSelectionTag` 是标签，不是勾选框。
