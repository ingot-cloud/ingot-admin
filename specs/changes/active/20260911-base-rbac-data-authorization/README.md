# 20260911-base-rbac-data-authorization

> 状态：implementing

## 协作模式

前后端分离。后端 change 已完成开发并输出前端联调文档；本仓库按该契约一次性切换，不兼容旧字段混跑。

## 背景与动机

PMS 已切换为「菜单可见性 / 功能权限 / 资源数据范围」三套事实来源。登录用户资料不再带业务权限码，菜单不再返回按钮节点，权限树去掉 `type` / `managed` / `readOnly`。前端若继续从菜单 `permissionCode` 刮权限、或继续传已删除字段，登录后按钮、路由和配置页都会对不上新接口。

## 目标

- 登录后并行 bootstrap `info` / `menus` / `permissions` 各一次；按钮与表格操作码来自有效具体权限，不再从菜单树或 JWT 解析
- 应用、菜单、权限配置页对齐新字段；新增资源目录与角色数据规则
- 401 / 403 / 503 语义可区分：503 提示稍后重试，不清空成游客

## 范围

### In Scope

- `packages/admin-core`：用户 bootstrap、权限 store、路由守卫、`v-auth`、表格操作过滤、HTTP 403/503
- `plugins/platform`：应用（含 `defaultAccessMode`、资源 Tab）、菜单（`permissionIds` + `permissionMatchMode`）、权限树（仅 `nodeType`）、平台角色 data-rules
- `plugins/org`：租户角色绑权树字段、租户层 data-rules；角色表单去掉旧的单条 `scopeType` / `scopes`
- 相关 models / 枚举 / 现有页面测试

### Out of Scope

- `plugins/member` 会员权限树（独立服务，仍可保留 `AuthorityTypeEnum`）
- 不改登录应用 OAuth2 流程（切组织仍走重新登录，自然触发 bootstrap）
- 不在前端实现行级过滤或 demo 订单页
- 不按 `expiresAt` 做 30 秒轮询
- 不提前更新 `specs/current/`

## 输入来源

- 接口文档：对话给出后端路径，Agent 代为投递为 `API.md`（原文，未重写）
- 需求文档：inbox 未提供；由 Agent 根据接口与现有页面整理 `REQUIREMENTS.md`
- 后端来源：`ingot/specs/changes/active/20260910-pms-rbac-data-authorization/FRONTEND.md`
- 原始文件名：`FRONTEND.md`

## 工件

- [接口](./API.md)
- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

- 一次性切换：后端已删旧字段，前端必须同期上线
- 创建权限接口需返回 ID，菜单快捷新建才能填 `permissionIds`
- 平台 data-rules 禁止写入租户部门 ID；平台入口不提供 CUSTOM 部门选择
- 租户 GET data-rules 不含平台默认层；组织页只维护本租户追加层
- 应用根权限 `{code}:**` 由服务端创建，前端不可删

## 相关链接

- 后端 change：`ingot/specs/changes/active/20260910-pms-rbac-data-authorization/`

## 完成记录

- 完成日期：
- 关联提交或 PR：
- 更新的 current capability：
- 与原设计的差异：
- 取消原因：
