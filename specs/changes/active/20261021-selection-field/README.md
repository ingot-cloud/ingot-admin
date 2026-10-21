# 统一标签录入框

> 状态：implementing

## 协作模式

前端独立

## 背景与动机

选择成员、部门、角色、选项等编辑态录入框目前各写各的外壳：有的是按钮 + 文字标签（「张三、李四 等 N 人」），有的是 el-tag，有的是自写 chip。外框高度、圆角、标签背景、删除按钮、右侧图标不一致。

## 目标

在 `@ingot/admin-core` 提供基础标签 `InSelectionTag` 与录入框 `InSelectionField`，业务 select / picker 组合它们，统一「头像 + 名字 + 删除」的已选回显。

## 范围

### In Scope

- `InSelectionTag`、`InSelectionField`、`selectionOverflow` 与主题变量 `--in-selection-tag-*`
- 迁移成员、部门、授权接收人、选项、角色、委派候选等录入壳
- 单测与 dev-portal 演示

### Out of Scope

- 选择对话框、数据加载与接口
- 自由输入的 `InInputTag`

## 工件

- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

迁移面广，属于纯视觉/交互壳替换，业务数据流不变。

## 完成记录

- 完成日期：
- 关联提交或 PR：
- 更新的 current capability：
- 与原设计的差异：
- 取消原因：
