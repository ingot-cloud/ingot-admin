# 管理台 UI 体验规格

本文写已上线的跨页面呈现规则。共享组件契约见 [管理台 UI 基础设施](../../packages/admin-ui-foundation/spec.md)。接口声明见归档 [API.md](../../../changes/archive/2026/20260904-common-admin-ui-rollout/API.md)。

## 概述

platform、org、member、security 四个官方插件的业务页映射到 Overview / List / Split List / Settings / Detail / Tool。标准参考通讯录「成员管理」：`InPageFrame` contained + workspace、`InPageHeader` 取菜单名、筛选在 `InSplitLayout` `#top`、`InTable` compact + 字段设置 + `InTableActions`。不改变 API、权限码、路由 path、菜单或 Query 语义。

## 范围

### In Scope

- 25 个官方插件 `IndexPage.vue` 及其私有组件的布局、筛选、表格、双栏、局部 Tab、抽屉与状态反馈
- 页面原型、滚动所有者、操作分层、稳定 `tableId`
- 组织成员列表按账号状态筛选 `enabled`

### Out of Scope

- 修改业务接口、权限码、路由、菜单或 canonical viewPath
- 重写 Query / 分页 / 表单提交业务逻辑
- 为对齐飞书采样新增无接口按钮（邀请成员、批量导入/导出等）

## 用户场景

### 场景 1：查询和操作列表

- **角色**：后台管理员
- **前置条件**：打开任意 List / Split List 页
- **步骤**：筛选、浏览表格、打开详情或主操作
- **预期结果**：页面头、筛选/工具栏、表头和分页固定；只有数据区滚动；权限与查询条件不变

### 场景 2：使用左树右表

- **角色**：组织或权限管理员
- **前置条件**：打开成员、授权、角色、字典等 Split List
- **步骤**：选择左树节点，折叠左栏，在右侧操作
- **预期结果**：左栏默认 260px 可折叠；选择上下文出现在表格 `#title`；窄窗口左栏可覆盖打开

### 场景 3：维护安全策略

- **角色**：安全管理员
- **前置条件**：打开访问防护、账号保护、凭证或会话页
- **步骤**：切换局部 Tab，编辑并保存
- **预期结果**：未访问 Tab 不发请求；独立保存语义不变；呈现使用 Settings 原型

## 页面原型

| 原型 | 框架 | 滚动 | 说明 |
|------|------|------|------|
| Overview | `InPageFrame mode="page"` | PageBody | Dashboard 摘要与快捷入口 |
| List | `contained` + `InSplitLayout`（可不启用左栏） | 表格数据区 | 筛选放 `#top`，不要放 `#header` |
| Split List | `contained` + `left-collapsible` | 左树与右表独立 | `InPageHeader` 在 `InPageFrame` `#header` |
| Settings | `mode="page"`，局部 Tab | PageBody | 安全策略；懒挂载不变 |
| Detail | `mode="page"`，`showBack` | PageBody | 应用详情 |
| Tool | `mode="page"` | PageBody | 二维码等单一任务 |

约定：

- 主标题取 `route.meta.title`，页面不硬编码菜单名
- 表格 `#title` 只保留左树或局部上下文；人数用 `.in-table__count`
- 去掉 `@refresh`、`#toolbar`、`hide-setting`
- emit 使用 kebab-case（`node-click`）
- 宽度用 UnoCSS（如 `w-200px`），不用 `style="width: 200px"`
- `InTableAction.confirm` 后，handler 不再套一层 `Confirm`

## 页面矩阵

| 插件 | 路径 | 原型 | 备注 |
|------|------|------|------|
| platform | `dashboard` | Overview | |
| platform | `admin/user` | List | `tableId` `platform-admin-user`；行内仅详情 |
| platform | `config/app/home` | List | `platform-config-app-home` |
| platform | `config/app/detail` | Detail | 菜单/权限面板表格 `platform-config-app-detail-menu` / `-permission` |
| platform | `config/dict` | Split List | `platform-config-dict`；`node-click` / `node-edit-click` |
| platform | `config/menu` | List | `platform-config-menu` |
| platform | `config/permission` | List | `platform-config-permission` |
| platform | `config/role` | List | `platform-config-role` |
| platform | `develop/client` | List | `platform-develop-client` |
| platform | `develop/id` | List | `platform-develop-id` |
| platform | `develop/qrcode` | Tool | 无装饰蓝条 |
| platform | `develop/social` | List | `platform-develop-social` |
| platform | `org/tenant` | List | |
| org | `contacts/user` | Split List | 标准页；`org-contacts-user`；见 REQ-003 |
| org | `contacts/auth` | Split List | `org-contacts-auth` |
| org | `contacts/role` | Split List | `org-contacts-role` |
| org | `contacts/dept` | List | 无左树；`InSplitLayout` 仅作工作面；`org-contacts-dept`；搜索部门名；工具栏批量删除 / 批量导入导出 / 新建部门；`tree-column="name"`；企业根节点勾选 `off`、无展开箭头；表头全选默认打开 |
| org | `contacts/structure` | List | 组织树浏览，无右表 |
| member | `user` | List | `member-user`；对齐平台用户操作分层 |
| member | `role` | List | `member-role` |
| member | `permission` | List | `member-permission` |
| security | `access-protection` | Settings | 多 Tab 策略表；热更新提示不变 |
| security | `account-protection` | Settings | B/C 两栏独立保存 |
| security | `credential` | Settings | |
| security | `sessions` | Settings | `security-sessions` / `security-sessions-policy` |

通讯录各页是独立菜单路由，不使用页内路由 Tab。

## 功能需求

### REQ-001：原型与滚动一致性

系统 SHALL 为每个范围内页面指定唯一主要原型，并显式选择 `InPageFrame` page/contained，不得用页面根 `overflow: auto` 恢复整页滚动。

**验收标准：**

- [x] 25 个入口均使用共享组件组织，不复制顶栏/侧栏
- [x] List / Split List 使用 contained + workspace
- [x] 固定页面头；主标题来自菜单名

### REQ-002：列表操作分层与字段偏好

系统 SHALL 用 `InTableActions` 与 `InTableColumnSetting` 承接列表操作和列显示，不在业务页复制同义实现。

**验收标准：**

- [x] 工具栏主操作 `kind: "quick"` + `icon: "ep:plus"` + `overflow: "never"`
- [x] 行内默认「详情」`kind: "detail"`；最多再一个高频 `quick`；其余进 `…`
- [x] 需要字段设置的表格有稳定 `tableId`；必选列不可隐藏
- [x] 列偏好不改变查询、导出、权限或缓存失效
- [x] 权限、禁用原因、确认文案和 handler 留在页面 / `useOps.ts`
- [x] 无选择时批量操作 `disabled` 并给出原因；只读/托管由 `disabled` + `disabledReason` 表达，不只靠隐藏

### REQ-003：通讯录成员管理（标准页）

通讯录「成员管理」SHALL 作为 List / Split List 的迁移标准。

**验收标准：**

- [x] `InPageFrame contained` + `surface="workspace"`；左栏可折叠，`persistence-key` 稳定
- [x] 姓名列 `InAvatar`；账号状态 `InAccountStatusTag`
- [x] `#tools-start`：账号状态 `InPicker`（全部 / 正常 / 已暂停）+ 字段设置；切换后立即按当前部门重查
- [x] 不传 `enabled` 表示全部，`true` 正常，`false` 已暂停；`filterParams` 保留布尔 `false`
- [x] 工具栏仅「添加成员」直出；不为对齐飞书新增无接口的邀请/批量按钮
- [x] 行内只出详情；暂停/恢复与删除进入更多；暂停/恢复只更新 `enabled`
- [x] 「共 N 人」在 `#title` 右侧 `.in-table__count`

### REQ-004：用户类列表对齐成员页

平台管理员用户与会员用户 SHALL 对齐成员页的状态展示与操作分层。

**验收标准：**

- [x] 姓名列 `InAvatar`；状态列 `InAccountStatusTag`
- [x] 行内只出详情；暂停/恢复、锁定/解锁、重置密码进入更多
- [x] 暂停/恢复走 Enable/Disable API，文案为「暂停账号 / 恢复账号」
- [x] 锁定原因表单为页面私有对话框（`lock-api` / `unlock-api`），不再使用行内 `AccountStatusEditButton`

### REQ-005：设置页与安全约束

安全域页面 SHALL 迁到 Settings 视觉，同时保留既有请求时机与写语义。

**验收标准：**

- [x] 未访问 Tab 不发请求
- [x] 访问防护：路径/分组互斥、字符串 ID、`/vc` 校验、热更新提示不变
- [x] 账号保护：B/C 两栏不合并提交；永久锁定仅 B 端；无权限只读
- [x] 会话：未满足 clientId/userId 时不请求；下线绑定 `sid`；GLOBAL 不可删除；`maxSessions=0` 显示「不限制」
- [x] 会话下线与 GLOBAL 删除的确认仍在原 `useOps`，避免 `InTableAction.confirm` 双重确认

### REQ-006：业务行为零回归

系统 SHALL 把本能力视为呈现层迁移，除 REQ-003 的 `enabled` 筛选外不改变业务行为。

**验收标准：**

- [x] 25 个页面入口、路由 path、canonical viewPath 和菜单权限不变
- [x] 分页、枚举、缓存失效和写操作参数不变
- [x] 应用删除的强制删除二次确认仍在 handler `catch`，不写入 `InTableAction.confirm`

## 非功能需求

- 颜色与间距走 `--in-*` Token 与 UnoCSS
- 图标操作具备 Tooltip 或可访问名称
- 小于 1024px 时筛选、树栏和表格可降级，关键操作仍可达

## 依赖与约束

- 共享组件来自 [管理台 UI 基础设施](../../packages/admin-ui-foundation/spec.md)
- 成员详情查看/编辑见 [详情查看/编辑标准](../../packages/detail-edit-pattern/spec.md)；通讯录部门详情同样接入该标准，头像固定且不可更换
- 访问防护 / 账号保护 / 会话管理的业务规则仍以各自 capability 为准

## 验收标准

- [x] 范围内页面按原型接入，成员管理为列表标准
- [x] 操作分层与 `tableId` 字段设置一致
- [x] 安全域懒请求与独立保存不变
- [x] 路由、权限和接口零回归
