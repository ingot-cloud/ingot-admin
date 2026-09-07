# 20260907-packages-detail-edit-pattern

> 状态：completed

## 协作模式

一人全栈。本 change 为纯前端共享交互标准与通讯录成员试点，不新增或修改后端接口。

## 背景与动机

通讯录成员「详情」当前直接打开可编辑表单，缺少先查看再编辑的层次。管理台需要一套可复用的实体详情标准：默认只读、底部进入编辑、编辑中离开需确认，后续部门/会员/管理员等详情按同一壳层接入。

## 目标

- 在 `@ingot/admin-core` 提供详情抽屉壳层、页内 Tab 墨条、只读描述列表与编辑会话守卫。
- 将通讯录成员详情改为查看态默认，编辑态由底部按钮进入。
- 添加成员仍走独立创建表单，不套用查看态。

## 范围

### In Scope

- `InBizTabs` 墨条视觉、`before-change` 拦截。
- `InDetailDrawer`、`InDetailIdentity`、`InDescriptionList`、`useDetailEditSession`。
- `InDrawer` 钉住头部布局、`InAvatar` 大号尺寸。
- 通讯录成员页拆分创建抽屉与详情抽屉。

### Out of Scope

- 上一个/下一个、别名、工位、工号、自定义字段、发送提醒等平台没有的能力。
- 本轮不迁移部门、角色、会员用户、平台管理员等其它抽屉。
- 不修改 `20260904-packages-admin-ui-foundation` / `20260904-common-admin-ui-rollout` 已批准范围。
- 不提前更新 `specs/current/`（归档时已写入）。

## 输入来源

- 接口文档：无新增；复用现有组织用户 CRUD。
- 需求文档：2026-09-07 用户对话中的飞书式详情/编辑交互要求。
- 后端来源：无。

## 工件

- [接口](./API.md)
- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

- 共享组件会影响后续所有详情抽屉接入，公开属性必须文档化。
- 离开确认依赖公共 `Confirm`，需固定文案并避免误关。

## 相关链接

- [管理台 UI 基础设施](../../../active/20260904-packages-admin-ui-foundation/)
- [业务页面迁移](../../../active/20260904-common-admin-ui-rollout/)
- 已上线规格：[specs/current/packages/detail-edit-pattern](../../../../current/packages/detail-edit-pattern/)

## 完成记录

- 完成日期：2026-09-07
- 关联提交或 PR：d5b3fcf
- 更新的 current capability：`packages/detail-edit-pattern`
- 与原设计的差异：公共确认框升级为可自定义内容 / 图标 / 关闭按钮的平台 API；操作下拉统一为无箭头、无分割线。
- 取消原因：
