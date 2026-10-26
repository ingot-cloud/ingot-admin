# 20261024-org-remove-directory-browse

> 状态：implementing

## 协作模式

一人全栈

## 背景与动机

租户工作台的普通通讯录与组织管理成员页重复。项目未上线，连同只服务通讯录的可见范围和字段场景一起去掉。

## 目标

工作台不再出现通讯录。成员访问策略只保留后台管理字段权限。

## 范围

### In Scope

- 删除 `org.iam.directory` 页面及只被它调用的接口封装
- 成员访问策略去掉「通讯录可见范围」Tab、普通通讯录场景和预览
- 去掉对应动作常量与枚举值

### Out of Scope

- 组织成员、部门、用户组页面
- 成员工作簿「导出通讯录」文案
- 字段权限的后台管理场景

## 输入来源

- 接口文档：后端 `specs/changes/active/20261024-iam-remove-directory-browse/`
- 需求文档：同上
- 后端来源：`/Users/jy/Repositories/Github/ingot-cloud/ingot/specs/changes/active/20261024-iam-remove-directory-browse/`

## 工件

- [接口](./API.md)
- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

依赖后端同步去掉菜单和接口。菜单由服务端下发，前端删页面后若菜单仍在会指向空视图。

## 相关链接

- 后端 change：`20261024-iam-remove-directory-browse`

## 完成记录

- 完成日期：
- 关联提交或 PR：
- 更新的 current capability：
- 与原设计的差异：
- 取消原因：
