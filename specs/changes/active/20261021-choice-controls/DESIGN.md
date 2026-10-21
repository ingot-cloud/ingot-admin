# 设计：勾选框与树展开规范

## 全局样式

在 `packages/admin-core/src/styles/` 增加 `choice.css` 与 `tree.css`，由 `styles/index.ts` 引入。

尺寸继续用 `--in-checkbox-size`（16px）、`--in-checkbox-radius`（4px）。新增：

- `--in-radio-size: 16px`
- `--in-tree-caret-size: 12px`

两处都写入 `tokens.css`、`theme/tokens.ts` 与 `defaultTokens.ts` 的浅色和深色表。深色不单独改数值，箭头颜色读 `--in-text-color-secondary`。

`choice.css` 把 `--el-checkbox-*`、`--el-radio-*` 写在 `:root:root .el-checkbox` / `:root:root .el-radio` 上。Element Plus 把这些变量声明在控件自身，只写在 `:root` 上会被盖掉。勾号不另画 SVG。半选横条覆盖 Element Plus 的 `top` + `scale(0.5)`。单选选中态改成透明底、主题色边框和圆心。`large` / `small` 尺寸也固定到同一 token，避免组件变体把盒子缩回 14px 或 12px。

`tree.css` 只作用在 `.el-tree .el-tree-node__expand-icon`，因此 `el-tree`、`InTree`、`el-tree-select` 一起生效。箭头资源是 `assets/tree-caret.svg`（朝下），用 mask 吃 `--in-text-color-secondary`，不再把 `#646a73` 写进 data-uri。关掉 Element Plus 对图标的旋转：`::before` 收起时旋转 -90deg（朝右），展开时不旋转（朝下）。叶子节点 `visibility: hidden` 占位。

## 去掉重复

- `MemberDepartmentField.vue`、`DepartmentScopePicker.vue`：删除 `--el-checkbox-*`、`--dept-caret-*` 和展开箭头、勾选内框的尺寸覆盖。树行高和勾选间距保留。
- `InTree.vue`：删除复用表格小箭头的展开样式。
- `InTable.vue`：删除自定义勾选 SVG 和隐藏 `::after` 的规则。单元格对齐、表头隐藏勾选、表格行展开保留。
- `organization-member-picker.css`：删除重复的勾选尺寸变量和半选 `translateY` + `scale`。

## 规范

`.agents/skills/in-coding-standards/choice-controls.md` 约束：多选和单选只用 `el-checkbox` / `el-radio`；树展开只用全局三角；表格行展开除外；状态标签和已选标签不是勾选框。`tenant-member-picker.md` 的半选说明改为指向这篇。
