# 设计：字段策略按资源接入

## 技术方案

策略页从「成员访问策略」改为「字段策略」。先请求已接入资源，再请求所选资源的草稿。字段和动作的候选项都来自资源清单，不在页面写成员编码。

平台资源编辑增加 `fieldPolicy`。服务器不允许时不提交打开状态。

## 对接映射

| 接口（见 API.md） | 前端 | 说明 |
|-------------------|------|------|
| `GET /v1/tenant/policies/field-resources` | `TenantFieldPolicyResourceAPI`；页面 `pages/iam/field-policies` | 资源、字段、动作 |
| `GET /v1/tenant/policies/fields/{resourceId}` | `TenantFieldPolicyAPI` | 草稿 |
| `PUT /v1/tenant/policies/fields/{resourceId}` | `TenantFieldPolicyUpdateAPI` | 保存 |
| 平台资源更新 | 资源编辑抽屉 | 提交并回显 `fieldPolicy` |

## 数据模型

`FieldRule` 去掉 `scenario`。`FieldOperationRule` 去掉 `resource` 和 `scenario`。删除仅服务策略场景的 `PolicyScenario`。资源清单类型包含资源标识、资源键、名称、字段能力和动作。

## 组件与页面影响

- 页面目录由 `pages/iam/member-policies` 改为 `pages/iam/field-policies`，路由键 `org.iam.field.policies`
- 左侧列出已接入资源，右侧是该资源的规则表。添加、编辑和删除确认后直接保存，仍按当前资源整份替换
- 对话框区分可见性规则和操作规则。查看者里的成员用组织成员对话框，部门用部门树对话框，并在标签上保留「含下级」
- 可见性规则只有一个目标范围，默认全部对象。所在部门只选是否含下级；管理部门用部门树对话框；指定成员用组织成员对话框
- 默认策略版本标识只留在保存请求里，页面不展示
- 平台 `ResourceEditDrawer` 增加接入开关
- 角色向导字段步骤不改

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| 插件不互相依赖 | ✅ | 页面仍在 org 与 platform 各自插件 |
| 整页配置用 InFormContent | ✅ | 本页是资源与规则列表，沿用成员页分栏；规则录入在对话框内 |
| 选择控件用 Element Plus 单选 | ✅ | 规则类型用单选，字段和动作用选择器 |
| 人员用组织成员对话框 | ✅ | 查看者部门用部门树对话框，含下级留在已选标签上。目标范围的含下级是整条规则一个选项 |
| 不在页面写死业务字面量 | ✅ | 字段和动作来自接口 |

## 备选方案

保留「成员访问策略」菜单、等第二个资源再改页面。未采纳，因为页面会继续写死成员，接入新资源时还要再改一次路由和文案。

## 开放问题

- 无
