# 需求：RBAC / 菜单 / 数据权限前端对接

接口字段与路径见 [API.md](./API.md)。此处只写页面行为与验收。

当前 `specs/current/` 尚无对应 capability，按从零对接已有页面填写场景。

## 场景与页面

### 场景 1：登录后拿到可用按钮，而不是空权限

- **角色**：任意已登录用户
- **入口**：进入 `apps/admin` 后的首次路由
- **步骤**：并行请求用户资料、可见菜单、有效权限各一次；侧栏只渲染服务端已过滤的菜单树；页内按钮 / 表格操作按有效权限码显示
- **预期结果**：`info` 不含 `authorities`；菜单无 Button 节点、无旧 `permissionId` / `permissionCode`；按钮码来自 `permissions` 展开后的具体码。后续路由切换不再重复打这三个接口

### 场景 2：撤权后界面可暂时不准，请求仍被拦住

- **角色**：已被撤权但仍开着页面的用户
- **入口**：任意已登录业务接口
- **步骤**：不按 `expiresAt` 定时轮询。窗口重新可见且本地已过 `expiresAt` 时可再拉一次权限；业务接口 403 后再拉一次以藏掉按钮；503 `AuthorizationSnapshot.Unavailable` 提示稍后重试并再拉一次，不清空权限、不登出
- **预期结果**：真正拦请求的是业务 API；按钮晚消失、点了 403 属预期

### 场景 3：配置应用与资源

- **角色**：持有应用配置权限的平台管理员
- **入口**：`/platform/config/app`
- **步骤**：创建应用时选择默认访问策略（开放 / 申请制）；详情新增「资源」Tab，维护资源目录；权限节点可绑定 `resourceId`；不要手动创建或删除应用根权限
- **预期结果**：列表 / 详情 / 创建 / 更新都能读写 `defaultAccessMode`；资源 CRUD 可用；仍被引用的资源删除失败并展示后端中文 `message`

### 场景 4：配置菜单可见性，而不是按钮树

- **角色**：平台应用管理员
- **入口**：应用详情「菜单」Tab
- **步骤**：菜单类型只有目录 / 菜单，不再提供按钮。受保护页面多选同应用 ACTION 权限，并选择 ANY / ALL；目录和开放页禁止关联权限。可先快捷新建权限再勾选，取消菜单时已建权限保留
- **预期结果**：保存不传 `permissionId` / `permissionCode` / `menuType=9`；删除菜单不删除权限

### 场景 5：配置权限树

- **角色**：平台应用管理员
- **入口**：应用详情「权限」Tab；只读全量树 `/platform/config/permission`
- **步骤**：创建只选 GROUP / ACTION，不传 `type`。GROUP 编码以 `:**` 结尾。去掉托管 / 只读标记，节点均可按权限码管理。更新不能改编码、节点类型、资源绑定
- **预期结果**：树节点只有 `nodeType`，没有 `type` / `managed` / `readOnly`。全量树「类型」列改为节点类型

### 场景 6：角色绑定功能权限与数据范围

- **角色**：平台角色管理员 / 租户通讯录角色管理员
- **入口**：平台角色页；组织「角色」「权限」页
- **步骤**：绑权树用 `id` + `nodeType` + `code` 勾选，body 仍为 `setIds`。平台角色增加数据规则编辑（当前来源层整体替换）。组织角色表单不再用单条「数据权限」代表全部资源；改为编辑本租户追加层。平台默认规则在租户入口只读提示，不能删改
- **预期结果**：空 `items` 清空当前层；平台 CUSTOM 不出现租户部门选择；组织页不把平台层与租户层混成一份可编辑列表

## 页面结构

| 页面 | 变化 |
|------|------|
| 登录后壳层 | bootstrap 三接口；侧栏仍用菜单树；按钮用权限码 |
| 应用列表 / 创建 / 基本信息 | 增加默认访问策略 |
| 应用详情 | 新增「资源」Tab；菜单 / 权限 Tab 改字段 |
| 平台权限只读树 | `type` 列改为 `nodeType` |
| 平台角色 | 行操作增加「数据范围」 |
| 组织角色 | 去掉表单级 `scopeType` / `scopes`；角色操作增加「数据范围」；保留「部门角色」`filterDept` |
| 组织权限绑定 | 树展示改 `nodeType`；`platformRoleBind` / `defaultFlag` 仍只读 |

## 验收标准

- [ ] 登录后只并行打 `info` / `menus` / `permissions` 各一次；路由 `beforeEach` 不重复拉取
- [ ] 按钮与 `InTableActions` 使用有效具体权限码；不用角色编码作为默认放行；不用菜单 `permissionCode`
- [ ] 菜单配置无 Button；受保护页 `permissionIds` 非空且为 ACTION；开放 / 目录页 `permissionIds` 为空
- [ ] 权限创建必传 `nodeType`，不传 `type`；GROUP 使用 `:**`；去掉托管 / 只读 UI
- [ ] 应用可配 `defaultAccessMode`；资源目录可 CRUD
- [ ] 平台 / 组织角色可维护各自来源层的 data-rules
- [ ] HTTP 403 明确无权限；503 快照不可用提示重试且不登出、不清空权限
- [ ] `plugins/member` 行为不变

## ADDED

### REQ-A001：有效权限独立接口

**验收标准：**

- [ ] `GET /api/pms/v1/auth/user/permissions` 结果写入权限 store
- [ ] store 保存 `permissions` / `version` / `generatedAt` / `expiresAt`，不按 `expiresAt` 做 interval

### REQ-A002：应用资源目录

**验收标准：**

- [ ] 应用详情有资源 Tab，可查询 / 创建 / 更新 / 删除
- [ ] 权限表单可选 `resourceId`；更新权限不可改 `resourceId`

### REQ-A003：角色数据规则

**验收标准：**

- [ ] 平台入口写平台默认层；租户入口只写租户追加层
- [ ] `scopeType` 按数字枚举提交；CUSTOM 仅组织入口可选部门

## MODIFIED

### REQ-M001：菜单可见性改为权限 ID 列表

**变更说明：** 单权限码改为 `permissionIds` + `permissionMatchMode`。

**验收标准：**

- [ ] 菜单表格展示关联权限数量或名称，不再展示单个 `permissionCode`
- [ ] 保存契约与 [API.md](./API.md) 第 3.2 节一致

### REQ-M002：权限节点形态只认 `nodeType`

**变更说明：** 删除权限 `type`、`managed`、`readOnly`、`sourceType`。

**验收标准：**

- [ ] 应用权限树与全量树均按 GROUP / ACTION 展示
- [ ] 创建缺 `nodeType` 时展示后端「节点类型不能为空」

## REMOVED

### REQ-R001：菜单 Button 节点与从菜单刮权限

**移除原因：** 后端不再返回 `menuType=9`；页内按钮改用有效权限码。

### REQ-R002：组织角色表单上的全局数据权限

**移除原因：** 数据范围改为按 `(permissionId, resourceId)` 配置，角色级单条 `scopeType` 不再驱动授权；角色模型删除这两列，避免误配。
