# 设计：Admin 业务能力拆分

## 技术方案

### 目标拓扑

```text
@ingot/shared
      ↑
@ingot/admin-core          @ingot/admin-common（无页面）
      ↑                              ↑
      └──────────────┬───────────────┘
                     │
     ┌───────────────┼───────────────┬───────────────┐
     │               │               │               │
platformPlugin  securityPlugin   orgPlugin      memberPlugin
     └───────────────┴───────┬───────┴───────────────┘
                             │
                   apps/admin（全量宿主）

target-project → 仅静态导入实际选择的业务插件 + 本地插件
```

`@ingot/admin-core` 继续拥有应用壳、Router、Pinia、登录态、网络层、插件注册表和通用设计组件。
`@ingot/admin-common` 只提供多个管理域都会消费、但不应让业务插件互相依赖的无页面能力。

### App 与 package

| 目录 | package name | 插件导出 | plugin id | 独立端口 |
|------|--------------|----------|-----------|----------|
| `apps/platform` | `@ingot/platform-app` | `platformPlugin` | `ingot-platform` | 5802 |
| `apps/security` | `@ingot/security-app` | `securityPlugin` | `ingot-security` | 5803 |
| `apps/org` | `@ingot/org-app` | `orgPlugin` | `ingot-org` | 5804 |
| `apps/member` | `@ingot/member-app` | `memberPlugin` | `ingot-member` | 5805 |
| `apps/admin` | `@ingot/admin-app` | 不对外导出业务插件 | 本地 `admin-host` | 5798 |

四个业务 App 的 package exports 均提供 `.`、`./plugin` 和 `./package.json`；`.` 与 `./plugin`
解析到源码 `src/plugin.ts`，沿用当前官方 App 的构建期源码组合模式。

### 源码迁移

```text
apps/platform/src/
├── api/platform/{admin,config,dev,org}
├── models/
├── pages/{admin,config,develop,org/tenant}
├── stores/
├── components/
├── plugin.ts
└── main.ts

apps/security/src/
├── api/security/
├── models/
├── pages/{access-protection,account-protection,credential,sessions}
├── plugin.ts
└── main.ts

apps/org/src/
├── api/org/
├── models/
├── pages/contacts/
├── stores/
├── components/
├── plugin.ts
└── main.ts

apps/member/src/
├── api/member/
├── models/
├── pages/{permission,role,user}
├── plugin.ts
└── main.ts
```

迁移时以使用方为准拆开当前混合 models：platform、org、member 各自拥有本域用户、角色、权限 DTO；
只有两个及以上 App 实际共同消费的只读契约进入 `admin-common`。禁止为了维持旧 barrel 而把所有业务模型再次集中到一个 package。

### 共享能力归属

`@ingot/admin-common` 首期包含：

- 租户只读分页查询、租户 option 模型和 `TenantSelect`。
- OAuth Client 只读分页查询、Client option 模型和 `ClientSelect`。
- 多个业务 App 共同消费的组织类型、角色类型、数据范围、Token 鉴权方式等契约/枚举。
- package 依赖 `@ingot/admin-core`，不导出页面或 `InAdminPlugin`。

platform 保留租户、Client 的创建/修改/删除等控制面 API；公共包只拥有选择器所需的只读查询。
选择器在使用页面局部 import，不加入多个插件的全局 components，避免注册表名称冲突。

以下无业务 API 依赖组件迁入 `admin-core` 的全局组件表：

- `InInputTag`、`InStatusButton`、`InTag`、`InTagEnum`
- `CommonStatusButton`、`CommonStatusTag`
- 参数化注入 API 的 `AccountStatusEditButton`、`AccountStatusView`

`BizDeptSelect` 归 org；`TenantOptions`、`BizSearchUserByPhone` 归 platform。其他组件按实际单域使用方迁移。

### 页面注册

在 `@ingot/admin-core` 新增公共 helper：

```ts
definePluginPages({
  modules,
  sourceRoot,
  canonicalPrefix,
  legacySemanticPrefix,
  legacyFilePrefix,
}): Record<PageKey, AsyncComponentLoader>
```

- `modules` 必须由调用 App 使用字面量 `import.meta.glob("./pages/**/*.vue")` 生成。
- 仅 `IndexPage.vue` 生成 semantic key；所有 Vue 页面继续生成需要的文件路径兼容 key。
- canonical 示例：
  - platform：`ingot.platform.config.app.home`
  - security：`ingot.security.sessions`
  - org：`ingot.org.contacts.user`
  - member：`ingot.member.user`
- 旧 semantic key 根据原物理路径继续生成，例如 security sessions 对应
  `ingot.admin.platform.security.sessions` 与 `ingot.base.platform.security.sessions`。
- 旧文件 key 继续使用原值，例如
  `@/pages/platform/security/sessions/IndexPage.vue`。

各插件通过相同 helper 生成 pages，并声明 `dependsOn: ["ingot-admin-core"]`。业务 App 专属全局组件可以在
本插件注册；跨 App 组件必须由 core 注册或由页面局部 import。

### 宿主与选择性组合

`apps/admin/src/main.ts` 静态导入四个官方插件和本地 `adminHostPlugin`。Dashboard 留在 admin 宿主，
由 `adminHostPlugin` 注册 `ingot.admin.dashboard` 及现有兼容 key。

删除 `apps/admin` 的公开 `adminPlugin` export。`target-project` 改为依赖示例所需的独立官方 App；
默认示例使用 `orgPlugin + targetPlugin`，其他组合由测试 fixture 覆盖。

create-app 的官方插件清单改为四项，默认 ID 为 `ingot-org`。生成逻辑根据选择同步生成 import、
`plugins` 数组和 package dependencies。本地插件默认 `dependsOn: ["ingot-admin-core"]`，只有确实使用
某插件资源时才由项目开发者添加业务依赖。

### Vite 解析

`@ingot/vite-config` 的官方 App 清单扩展为四个业务包。`resolveOfficialApps` 根据当前 package 自身和
直接依赖解析源码根；admin 全量宿主的四个 direct dependencies 会全部加入，target 只加入所选依赖。

`createOfficialAppVitePlugin` 继续按 importer 所属 App 把 `@/` 指回正确源码根，并统一处理：

- Vue、Router、Pinia、Element Plus 去重。
- 官方 App 排除 optimizeDeps 预构建。
- `server.fs.allow` 放行已选择的官方 App 根目录。
- 移除 `@base` 兼容别名；迁移后业务源码不得再依赖它。

### 菜单契约

前端继续调用 `GET /api/pms/v1/auth/user/menus`，不增加插件参数。部署侧根据登录应用/OAuth Client
配置返回该 App 安装插件所对应的菜单。前端保留 plugin-unavailable 页面处理配置错误，不自动把缺失
插件的菜单当作正常情况隐藏。

## 对接映射

本变更不增加或修改后端接口字段，因此无 `API.md`。现有业务 API 按下表迁移所有权：

| 现有前端 API | 新归属 | 说明 |
|--------------|--------|------|
| `api/platform/admin/**` | platform | 路径和函数行为不变 |
| `api/platform/config/**` | platform | 路径和函数行为不变 |
| `api/platform/dev/**` | platform | Client 只读分页查询抽到 admin-common，其余留 platform |
| `api/platform/org/tenant` | platform + admin-common | 租户只读分页查询抽到 common，写操作留 platform |
| `api/platform/security/**` | security | 路径和函数行为不变 |
| `api/org/**` | org | 路径和函数行为不变 |
| `api/platform/member/**` | member | 路径和函数行为不变 |
| `admin-core/api/common/user` 菜单接口 | admin-core | wire shape 不变，后端按登录应用裁剪 |

迁移中触碰的 API 函数统一 `XxxAPI` 命名、显式 `Promise<R<T>>`，网络单例使用
`import request from "@/net"` 或对应 package 的公开 request；不得引入新的 `any`。

## 数据模型

- core：通用 `R<T>`、Page、Menu、CommonStatus、树和通用 UI 类型。
- admin-common：跨 App 的只读租户/Client option 与确实多域共用的管理枚举。
- platform：PlatformApp、PlatformRole、PlatformPermission、SysUser、租户写模型、Client 写模型、字典和开发工具模型。
- security：访问保护、锁定策略、凭证策略、会话及安全枚举。
- org：组织成员、部门、组织角色、组织授权模型。
- member：MemberUser、MemberRole、MemberPermission 及对应 DTO/VO。

各 App 提供本域 `models/index.ts`，禁止重新引入覆盖全部业务域的总 barrel。

## 组件与页面影响

- 业务页面目录内部结构保持现有 `IndexPage.vue + table.ts + useOps.ts + components/`；本次不借迁移合并页面。
- 不符合四件套的既有页面只在本次实际拆分所需范围内整理，行为不得改变。
- 自动导入仍由每个 App 的 Vite 配置扫描其自身源码；跨 App 组件不依赖自动扫描。
- `admin-core` 全局组件继续由 corePlugin 注册；业务插件只注册本域独占组件。
- Store 重命名为 `usePlatformDeptStore`、`usePlatformRoleStore`、`usePlatformTenantStore`、
  `useOrgDeptStore`、`useOrgRoleStore` 等，并同步 Pinia ID 的域前缀。

## 自动化边界检查

新增只读验证脚本检查：

- 业务 App 源码不得通过相对路径或 package name 导入其他业务 App。
- 业务 App package dependencies 不得声明其他 `@ingot/*-app`。
- `@base` 不得出现在迁移后的业务源码。
- package manifest 中选择的官方插件与 main.ts import/plugin 清单一致。

组合构建测试读取 Vite 构建模块信息或等价 manifest，断言未选择插件的页面源码不在模块图中；不使用
仅检查最终压缩字符串的脆弱方案。

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| Monorepo 边界 | ✅ | 跨 App 复用进入 admin-core/admin-common，不复制业务实现 |
| 页面结构 | ✅ | 保持并逐步对齐页面四件套 |
| API 层 | ✅ | API 随业务域迁移，接口行为不变并修正触碰的命名规范 |
| 类型安全 | ✅ | models 按域拆分，不新增 any/as any |
| 组件约定 | ✅ | 通用组件进 core，业务组件归所属 App |
| 样式 | ✅ | 不改变 UnoCSS/PostCSS 原则 |
| 施工门禁 | ✅ | change 保持 draft，approved 后才修改业务代码 |
| 真相单一 | ✅ | 实施完成后才更新 current 并归档 |
| 构建依赖 | ✅ | pnpm workspace 依赖和构建期静态插件组合 |

## 备选方案

### 继续保留单一 adminPlugin

未采纳。它会让 target 继续整体引入全部业务页面，不能实现选择性构建。

### securityPlugin 依赖 platformPlugin

未采纳。安全中心会被动带入平台控制面页面，不符合 security 可独立选装的已确认目标。

### 前端自动隐藏未安装插件菜单

未采纳。菜单授权和应用能力应由后端应用配置决定，前端静默隐藏会掩盖配置错误。

### 运行时微前端

未采纳。当前构建期插件已经满足选择性打包，不需要增加远程加载和多运行时复杂度。

## 开放问题

无。实施偏离本设计时必须先更新 change 并重新确认。
