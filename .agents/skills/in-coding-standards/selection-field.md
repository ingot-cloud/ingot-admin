# 已选标签与录入框

选择成员、部门、用户组、角色、应用、选项等「点开选择器、框内回显已选项」时，外壳和标签只用 `@ingot/admin-core` 的 `InSelectionField` 与 `InSelectionTag`。业务组件负责打开对话框和维护选中值，不手写边框、`el-tag`、只读 `el-input` 或「张三、李四 等 N 人」文字摘要。

`InInputTag` 只用于自由输入逗号分隔的字符串，不能拿来做已选回显。

## 用哪个

- 编辑态录入框：`InSelectionField`。点击框体、Enter、Space 发出 `click`，由业务打开自己的对话框。
- 框外单独一枚标签（只读列表、详情、换行芯片）：`InSelectionTag`。
- 人员带头像；部门、角色、用户组、应用、选项设 `show-avatar="false"`。部门图标放进 `#tag-avatar`，不要再画一套标签背景。
- 名字后的附加内容（如「含下级」「部门主负责人」）放 `#tag-suffix`（标签上是 `#suffix`）。删除和 suffix 已阻止冒泡，不会误开选择器。

## 数据

每项是 `InSelectionItem`：`{ id, name, avatar? }`。提交仍用稳定 ID，标签只展示 `name`。

- `closable` 控制能否删除；单项 `closable` 优先。`disabled` 时不响应点击、不显示删除。
- `max-visible` 与 `total` 控制 `+N`。`total` 用服务端总数，不要用当前页长度冒充。
- `wrap` 默认换行；单行截断时设 `:wrap="false"`。
- 右侧图标默认 `ep:edit`，换成别的图标或传 `false` 隐藏。
- 标签背景默认 `--in-selection-tag-bg`（浅色 `#e1eaff`，深色为主色混透明）。只有语义不同时才用 `tag-background` / `background` 覆盖，不要在业务页重写背景、圆角和高度。

无图片时头像是主题色圆、名字最后一个字。有头像时标签是胶囊形，无头像时圆角用 `--in-selection-tag-radius`。

## 不要做

- 复制 `.dept-field`、`.option-tag-field` 或按钮套文字的外壳。
- 在插件里另写一套「头像 + 名字 + 删除」样式。
- 用 `el-tag` 表示已选实体。状态、枚举仍用 `InTag` / `StatusTag`，与已选标签无关。
