# 设计

## 页面

删除 `plugins/org/src/pages/iam/directory/`。菜单由后端去掉，工作台页不改代码。

`plugins/org/src/pages/iam/member-policies/IndexPage.vue` 去掉通讯录可见范围 Tab、预览和场景选择。字段规则与操作规则固定 `PolicyScenario.MANAGEMENT`，操作只保留成员查询、创建、编辑。页头说明改为字段权限。

## 接口封装

从 `plugins/org/src/api/iam/directory.ts` 和 `directory.query.ts` 删除四个 Directory 浏览函数及 query key。`policies.ts` 删除通讯录策略和预览函数。

## 枚举与动作

删除 `SelectionPurpose.DIRECTORY`、`PolicyScenario.DIRECTORY`、`DefaultPolicyKind.DIRECTORY`，以及 `TENANT_DIRECTORY_READ`、`TENANT_DIRECTORY_POLICY_READ`、`TENANT_DIRECTORY_POLICY_UPDATE`、`TENANT_POLICY_PREVIEW`。

`MenuKind.DIRECTORY` 是菜单目录类型，保留。
