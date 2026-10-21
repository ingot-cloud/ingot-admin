# 勾选框与树展开规范

> 状态：implementing

## 协作模式

前端独立

## 背景与动机

成员详情「选择部门」对话框里的多选是 16px、圆角 4px 的方框，选中为主题色底加白色勾；树展开是 12px 灰色实心三角，收起朝右、展开朝下。这套外观目前只写在该对话框和部门导入范围选择里。其余 `el-checkbox`、`el-radio`、`el-tree` 仍是 Element Plus 默认，或表格自己的勾选图和小箭头。

## 目标

把勾选框、单选框和树展开箭头收成 admin-core 全局样式。业务页不再各自改尺寸、圆角、勾号、圆心和树箭头。

## 范围

### In Scope

- 全局 `choice.css`、`tree.css`，以及 `--in-radio-size`、`--in-tree-caret-size`
- 去掉部门选择、范围选择、`InTree`、表格勾选和成员选择里的重复覆盖
- 编码规范 `choice-controls.md`

### Out of Scope

- 表格行展开（`.el-table__expand-icon`）保持现有小箭头
- 状态标签、已选标签
- 选择对话框的数据与接口

## 工件

- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

纯视觉统一。`el-tree-select` 的下拉树与 `el-tree` 共用同一套箭头。

## 完成记录

-
