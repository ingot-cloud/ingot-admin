# 设计：管理台业务页面 UI 迁移

## 技术方案

以 `20260904-packages-admin-ui-foundation` 的共享组件为唯一基础，通过页面原型逐批迁移。每个插件保持自己的业务纵向切片、API、models、stores 和私有组件，不跨插件复用业务组件；只有被两个及以上插件使用且无业务页面语义的能力才进入 package。

### 迁移原则

1. 先记录页面当前路由、权限、请求触发条件和关键操作，再改模板。
2. 优先替换页面编排与基础样式，不重写已工作的 API/Query/useOps 逻辑。
3. 需要改变业务行为时停止实施，更新本 change 并重新确认。
4. 每批页面完成后独立截图和业务回归，不等 25 个页面全部完成才检查。
5. 试点验收通过前不批量机械迁移。
6. 每个页面必须声明 `InPageFrame` 的 page/contained 模式；禁止通过页面根 `overflow: auto` 恢复旧的整页滚动。
7. 行内与工具栏操作优先使用 `InTableActions`，字段显示设置使用稳定 `tableId`，不得在业务页面复制同义组件。

## 可用组件矩阵

foundation change 冻结后，业务页面只组合下表组件。契约详见 [`packages/admin-core/src/components/README.md`](../../../../packages/admin-core/src/components/README.md)。

| 页面原型   | 页面框架                       | 页面头                    | 主容器                     | 列表与操作                   | 局部 Tab / 浮层          |
| ---------- | ------------------------------ | ------------------------- | -------------------------- | ---------------------------- | ------------------------ |
| Overview   | `InPageFrame mode="page"`      | `InPageHeader`            | `InContainer`              | —                            | 可选 `InBizTabs`         |
| List       | `InPageFrame mode="contained"` | `InPageHeader`            | `InSplitLayout`        | `InTable` + `InTableActions` | `InDrawer` / `InDialog`  |
| Split List | `InPageFrame mode="contained"` | `InPageHeader`            | 可折叠 `InSplitLayout` | `InTable` + `InTableActions` | `InDrawer`               |
| Settings   | `InPageFrame mode="page"`      | `InPageHeader` `#tabs`    | `InContainer`              | 策略表用 `InTable`           | `InBizTabs` / `InDrawer` |
| Detail     | `InPageFrame mode="page"`      | `InPageHeader` `showBack` | `InContainer`              | —                            | `InBizTabs` / `InDrawer` |

不要在插件内复制壳层、Token 或同义基础组件。

## 原型滚动与工作面

- 所有页面由壳层固定全局顶栏和面包屑，`InPageFrame` 固定页面头。
- 所有业务页使用 `InPageHeader`；主标题默认取当前菜单名（`route.meta.title`），页面不硬编码菜单文案。`InTable` `#title` 只保留左树或局部 Tab 的选择上下文。
- Overview、Settings、Detail 和 Tool 使用 page 模式，只滚动 PageBody。
- List 和 Split List 使用 contained 模式；筛选/工具栏固定，表格数据区纵横滚动，分页固定。
- Split List 的 `InPageHeader` 放在 `InPageFrame` `#header`，不放进 `InSplitLayout` `#header`，避免两层内边距和底部分隔叠在一起。
- Split List 左侧默认 260px，可从分隔线折叠；左树和右表独立滚动，小于 1024px 时左侧转覆盖层。
- 列表和双栏使用全高白色工作面，不再为页面根补圆角、边框或卡片阴影；卡片只用于页面内部的信息区块。
- `org/contacts/*` 各页是独立菜单路由，不使用页内路由 Tab；未完成迁移的通讯录页可直接使用 `InSplitLayout`。

## 列表交互映射

- 行内默认展示“详情”；另有领域高频动作时最多再展示一个，例如“添加子部门”；其余操作进入无文字 `…`。
- 工具栏固定主操作始终直出；同一 `overflowGroup` 的批量操作按容器剩余宽度整组展开或整组进入其左侧 `…`，不得逐个收纳。成员试点使用“邀请/添加固定 + 三个批量操作同组”的配置。
- 危险动作继续复用页面 `useOps.ts` 的权限与 mutation，只把呈现和确认入口交给 `InTableActions`。
- 需要字段显示设置的表格必须提供稳定、跨发布不变的 `tableId`；必选列在 `table.ts` 中标记 `required/configurable`。
- 表格列显示偏好不得改变查询字段、接口参数、导出字段或后端权限行为。

## 页面矩阵

| 插件     | 页面路径                                 | 主要原型   | 迁移重点                                |
| -------- | ---------------------------------------- | ---------- | --------------------------------------- |
| platform | `pages/dashboard/IndexPage.vue`          | Overview   | 摘要、指标、卡片、快捷入口              |
| platform | `pages/admin/user/IndexPage.vue`         | List       | 筛选、表格、创建/编辑抽屉               |
| platform | `pages/config/app/home/IndexPage.vue`    | List       | 应用卡片/列表、创建抽屉                 |
| platform | `pages/config/app/detail/IndexPage.vue`  | Detail     | 返回、摘要、局部 Tab、菜单/权限面板     |
| platform | `pages/config/dict/IndexPage.vue`        | Split List | 字典类型与条目双栏、双抽屉              |
| platform | `pages/config/menu/IndexPage.vue`        | List       | 树形表格、筛选、详情跳转                |
| platform | `pages/config/permission/IndexPage.vue`  | List       | 权限列表与操作区                        |
| platform | `pages/config/role/IndexPage.vue`        | List       | 角色列表、授权弹窗/抽屉                 |
| platform | `pages/develop/client/IndexPage.vue`     | List       | Client 列表、密钥浮层                   |
| platform | `pages/develop/id/IndexPage.vue`         | List       | ID 配置列表与编辑抽屉                   |
| platform | `pages/develop/qrcode/IndexPage.vue`     | Tool       | 单一任务区、结果和说明                  |
| platform | `pages/develop/social/IndexPage.vue`     | List       | 社交配置列表与编辑弹窗                  |
| platform | `pages/org/tenant/IndexPage.vue`         | List       | 组织筛选、表格、创建/详情抽屉           |
| org      | `pages/contacts/auth/IndexPage.vue`      | Split List | 去掉页内路由 Tab；左侧范围、授权列表、添加抽屉 |
| org      | `pages/contacts/dept/IndexPage.vue`      | Split List | 去掉页内路由 Tab；部门上下文、表格、编辑抽屉   |
| org      | `pages/contacts/role/IndexPage.vue`      | Split List | 去掉页内路由 Tab；角色组、成员、部门选择弹窗   |
| org      | `pages/contacts/structure/IndexPage.vue` | Split List | 去掉页内路由 Tab；组织树和结构浏览             |
| org      | `pages/contacts/user/IndexPage.vue`      | Split List | 去掉页内路由 Tab；组织树、用户列表、编辑抽屉   |
| member   | `pages/permission/IndexPage.vue`         | List       | 权限列表和编辑抽屉                      |
| member   | `pages/role/IndexPage.vue`               | List       | 角色列表和授权弹窗                      |
| member   | `pages/user/IndexPage.vue`               | List       | 用户筛选、表格、创建/编辑/绑定/重置浮层 |
| security | `pages/access-protection/IndexPage.vue`  | Settings   | 多 Tab、策略表格、编辑抽屉              |
| security | `pages/account-protection/IndexPage.vue` | Settings   | 局部 Tab、B/C 双栏独立编辑              |
| security | `pages/credential/IndexPage.vue`         | Settings   | 策略 Tab、分组表单                      |
| security | `pages/sessions/IndexPage.vue`           | Settings   | 会话列表、并发策略、详情/编辑抽屉       |

## 试点选择

首批试点选择四个互补页面：

- `platform/dashboard`：验证 Overview 与卡片体系。
- `platform/org/tenant`：验证标准 List、筛选、表格和创建/编辑抽屉。
- `org/contacts/user`：验证 260px 可折叠 Split List、独立滚动、宽表格、字段设置、行内更多菜单，以及“邀请/添加固定 + 批量操作原子组”的工具栏。
- `security/account-protection`：验证 Settings、局部 Tab、双栏与独立编辑。

试点需要用户视觉确认。若试点偏离已批准 foundation Token 或页面原型，应先更新两份 change 的对应设计。

## 对接映射

本 change 无新增接口，见 [API.md](./API.md)。

| 接口（见 API.md） | 前端                          | 说明                                      |
| ----------------- | ----------------------------- | ----------------------------------------- |
| 各域既有接口      | `plugins/platform/src/pages/` | 保留 API、Query、权限和路由，迁移页面呈现 |
| 各域既有接口      | `plugins/org/src/pages/`      | 保留树与选择上下文，迁移双栏呈现          |
| 各域既有接口      | `plugins/member/src/pages/`   | 保留用户/角色/权限操作，迁移列表与浮层    |
| 各域既有接口      | `plugins/security/src/pages/` | 保留懒请求和安全约束，迁移设置与策略呈现  |

## 数据模型

- 不新增或修改业务 API model。
- 页面原型、密度和共享组件类型来自 `@ingot/admin-core`。
- 页面私有展示类型留在本页面 `types.ts`、`table.ts` 或 `useOps.ts`，不得使用 `any`。
- 不因 UI 迁移改变 bigint 字符串、枚举和时间字段类型。

## 组件与页面影响

### 页面结构

- 保持 `IndexPage.vue + table.ts + useOps.ts + components/` 四件套。
- 迁移中若 `IndexPage.vue` 超过 300 行，优先拆分页面私有子组件或 composable。
- 操作编排继续留在页面或 `useOps.ts`；共享组件不感知业务 API。
- 页面或 `useOps.ts` 将权限、禁用原因、确认文案和 handler 映射为 `InTableAction`；不得把 Query/mutation 放入共享组件。
- 插件私有组件保持 `Biz*` 或明确业务命名，设计系统组件只使用 `In*`。

### 样式策略

- 使用 foundation 的 `--in-*` Token 和 UnoCSS 原子类。
- 删除被共享组件取代的通用边框、标题、表头、阴影、圆角和固定间距。
- 删除列表页为恢复整页滚动而增加的高度、`overflow` 和 sticky 补丁。
- 页面可保留业务专属布局，但必须说明为何无法由原型覆盖。
- 不使用页面级深层选择器覆盖全局 Element Plus 组件，除非是有测试覆盖的局部业务需求。

### 行为保护

- 每页建立迁移前行为清单：入口、权限、初始请求、查询条件、操作、确认、成功提示、刷新范围。
- 修改页面时复用原 Query options、`useServerPaging` 和 mutation，不重写接口层。
- 对 current 已记录的安全域约束增加或保留自动化测试。

## 与 CONSTITUTION 符合性

| 原则                           | 符合 | 说明                                                      |
| ------------------------------ | ---- | --------------------------------------------------------- |
| apps / plugins / packages 三层 | ✅   | 业务页面继续位于各自插件，共享设计能力来自 `admin-core`。 |
| 官方插件不得互相依赖           | ✅   | 迁移不新增跨插件 import。                                 |
| 页面四件套                     | ✅   | 保持并在触碰复杂页面时补齐 `useOps.ts` / components。     |
| Vue 3 + TypeScript strict      | ✅   | 新代码禁止 `any`，事件和属性使用类型签名。                |
| UnoCSS 与 Token                | ✅   | 通用布局用 UnoCSS，颜色和外观使用 `--in-*`。              |
| 响应式                         | ✅   | 页面矩阵覆盖桌面、窄桌面和窄窗口降级。                    |
| 施工门禁                       | ✅   | 用户于 2026-09-05 确认开工，状态为 `implementing`。       |
| current 真相单一               | ✅   | 实施期间不修改 current，验收后再合并页面行为。            |

## 备选方案

### 一次性机械替换所有页面

未采纳。页面类型和业务约束差异较大，会把滚动、请求时机和危险操作回归推迟到最后暴露。

### 只迁移高频页面

未采纳。共享基础与遗留局部样式长期并存会造成明显风格割裂；改为分阶段全量迁移，但允许按阶段独立验收和发布。

### 在 App 宿主覆盖所有插件样式

未采纳。`apps/admin` 是 composition root，不应通过全局深层 CSS 猜测插件 DOM；页面应显式使用共享组件。

## 开放问题

- [x] 四个试点页面的最终验收顺序保持 Dashboard → 租户 → 组织用户 → 账号保护。
- [x] 本 change 不提供“紧凑表格”用户偏好；默认数据行使用 foundation 的 48px，业务确需差异时单独更新 spec。
- [x] 允许按阶段独立验收和发布；Phase 01 须先通过用户视觉确认，再进入批量迁移。

## 试点已知偏差

- `org/contacts/user` 现有业务只有「添加成员」、行内详情/启停/删除，没有邀请成员、批量导入/导出、批量变更部门或批量操作离职接口。试点只把已有「添加成员」映射为 `overflow: never` 的固定主操作，不为对齐飞书采样新增无接口按钮。
- 通讯录五个页面不再使用页内路由 Tab；各页均使用 `InPageFrame` + `InPageHeader`（菜单名）+ `InSplitLayout`。表格 title 仅保留部门/角色等选择上下文。
