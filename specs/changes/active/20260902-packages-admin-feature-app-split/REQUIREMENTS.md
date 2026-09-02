# 需求：Admin 业务能力拆分

## 场景与页面

### 场景 1：完整平台管理台

- **角色**：平台管理员
- **入口**：`apps/admin`
- **步骤**：登录后访问平台控制面、安全中心、组织管理、会员管理及 Dashboard。
- **预期结果**：四个官方业务插件在同一 Router/Pinia 管理台内工作，现有页面行为保持不变。

### 场景 2：独立开发业务 App

- **角色**：官方模块开发者
- **入口**：`apps/platform`、`apps/security`、`apps/org` 或 `apps/member`
- **步骤**：分别启动、类型检查或构建任一 App。
- **预期结果**：每个 App 可独立 dev/build，并只注册本业务域页面。

### 场景 3：Target 按需组合

- **角色**：项目开发者
- **入口**：`apps/target-project` 或 create-app 生成的项目
- **步骤**：选择一个或多个官方插件，再添加项目自己的本地插件。
- **预期结果**：只有所选官方插件进入依赖和构建模块图；所有插件共享 admin-core 的 Router、Pinia、网络层和登录态。

### 场景 4：安全中心单独选装

- **角色**：安全运营人员
- **入口**：只安装 `securityPlugin` 的管理台
- **步骤**：进入会话管理并使用租户、OAuth Client 等筛选条件。
- **预期结果**：查询组件可正常工作，且构建产物不包含 platform 控制面页面。

### 场景 5：新建项目默认组织能力

- **角色**：项目开发者
- **入口**：create-app UI 或 CLI
- **步骤**：不修改默认官方插件选择并生成项目。
- **预期结果**：生成物依赖并注册 `orgPlugin`；开发者可以取消默认选择或追加其他插件。

### 场景 6：动态菜单与插件一致

- **角色**：任意管理台用户
- **入口**：后端返回的侧栏菜单
- **步骤**：登录不同的应用客户端并访问其菜单。
- **预期结果**：后端按应用返回已安装插件对应菜单；canonical 和迁移期旧页面 key 均能解析；配置错误才显示插件未安装诊断页。

## 页面归属

| 新 App | 现有页面来源 | 能力 |
|--------|--------------|------|
| platform | `pages/platform/admin` | 平台管理员用户与组织归属 |
| platform | `pages/platform/config` | 应用、菜单、权限、角色、字典配置 |
| platform | `pages/platform/develop` | OAuth Client、社交配置、业务 ID、二维码工具 |
| platform | `pages/platform/org/tenant` | 租户管理 |
| security | `pages/platform/security` | 访问保护、账号保护、凭证策略、会话管理 |
| org | `pages/org` | 通讯录、部门、组织成员、组织角色及授权 |
| member | `pages/platform/member` | 会员用户、会员角色、会员权限 |
| admin host | `pages/dashboard` | 全量宿主 Dashboard |

## 功能需求

### REQ-A001：四个独立官方业务 App

系统 SHALL 提供 platform、security、org、member 四个可独立运行和构建的 App，每个 App 同时导出一个 `InAdminPlugin`。

**验收标准：**

- [ ] 四个 App 均有独立的 `main.ts`、`plugin.ts`、Vite 配置和 package manifest。
- [ ] 四个 App 可分别 type-check、unit test 和 production build。
- [ ] 插件 ID 分别为 `ingot-platform`、`ingot-security`、`ingot-org`、`ingot-member`。
- [ ] 四个业务插件只硬依赖 `ingot-admin-core`，不存在业务 App 之间的插件依赖。

### REQ-A002：完整纵向切片归属

系统 SHALL 将页面及其 API、models、stores、枚举和业务组件迁入所属 App，不保留集中式 `@base` 业务引用。

**验收标准：**

- [ ] 页面归属符合本文件“页面归属”表。
- [ ] 新业务源码内部使用本 App 的 `@/`，跨 App 复用只通过 workspace package。
- [ ] Store 导出和 Pinia ID 带业务域前缀，不再新增同名 `useDeptStore` / `useRoleStore`。
- [ ] 业务 App 不直接导入其他 `apps/*` 或 `@ingot/*-app`。

### REQ-A003：安全中心独立选装

系统 SHALL 抽取租户和 OAuth Client 的只读查询能力，使 security 不依赖 platform 页面插件。

**验收标准：**

- [ ] `securityPlugin` 不声明或引入 `platformPlugin`。
- [ ] security 的租户和 Client 筛选使用无页面共享能力。
- [ ] security-only 构建不包含 platform 页面模块。
- [ ] 查询权限不足时保留现有允许的手工输入或错误反馈行为，不因缺少 platform 插件崩溃。

### REQ-A004：全量 Admin 宿主

系统 SHALL 保留 `apps/admin` 作为全量管理台宿主，但业务源码归四个独立 App。

**验收标准：**

- [ ] admin 注册 platform、security、org、member 及本地 Dashboard 插件。
- [ ] 原有四类业务页面可从全量管理台访问。
- [ ] admin 不再导出 `adminPlugin`，不再作为 target 的业务插件依赖。

### REQ-A005：稳定页面键和迁移别名

系统 SHALL 为四个域提供 canonical page key，并在菜单迁移期兼容原页面键。

**验收标准：**

- [ ] canonical 前缀为 `ingot.platform.*`、`ingot.security.*`、`ingot.org.*`、`ingot.member.*`。
- [ ] 对同一页面继续注册对应的 `ingot.admin.*`、`ingot.base.*` 和 `@/pages/**` 旧键。
- [ ] canonical 与 legacy key 指向同一异步组件 loader。
- [ ] 不同插件间 page key、组件名和路由名冲突时仍在启动阶段失败。

### REQ-A006：按需脚手架与 Target 示例

系统 SHALL 让 target-project 和 create-app 按插件选择生成依赖及启动代码。

**验收标准：**

- [ ] create-app 展示四个可用官方插件，默认只选择 org。
- [ ] 生成物只在 package.json 和 main.ts 中声明所选插件。
- [ ] 本地 target 插件默认只依赖 `ingot-admin-core`。
- [ ] target-project 示例不再依赖 `@ingot/admin-app/plugin`。

### REQ-A007：菜单由后端按应用裁剪

系统 SHALL 继续消费现有菜单接口，由后端根据登录应用/OAuth Client 返回适配该应用的菜单。

**验收标准：**

- [ ] 前端不把“隐藏缺失插件菜单”作为正常裁剪机制。
- [ ] 已安装插件菜单都能解析到已注册页面。
- [ ] 后端误配未安装插件页面时继续进入 plugin-unavailable 诊断页。

### REQ-A008：自动化边界保护

系统 SHALL 通过自动化检查阻止拆分后的边界重新耦合。

**验收标准：**

- [ ] 边界检查覆盖源码导入和 package dependencies。
- [ ] 组合测试覆盖 org-only、security-only、org+member 和全量四插件。
- [ ] 未选择的插件不出现在对应 target 的构建模块图中。

## 非功能需求

- 新代码遵守 Vue 3、TypeScript strict、UnoCSS 和页面四件套约定。
- 跨 App 复用不得复制实现，必须进入 `packages/`。
- 不改变现有 API 请求路径、鉴权方式和响应包装。
- 插件仍为构建期静态组合，不引入远程运行时加载。
- 独立 App 开发端口固定为 platform 5802、security 5803、org 5804、member 5805。

## 验收标准

- [ ] REQ-A001 至 REQ-A008 全部满足。
- [ ] `pnpm build:packages`、workspace type-check、lint check 和 unit tests 通过。
- [ ] admin 全量构建及四个独立 App 构建通过。
- [ ] 现有业务接口行为和页面核心操作无回归。
