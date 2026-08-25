# 设计：账号保护 · 账号锁定

接口字段表见 [API.md](./API.md)，此处只写前端怎么做。

## 技术方案

在安全中心下新增单页「账号保护」，用 Tab 承载各能力（对齐凭证策略 / 访问防护）。本期只有「账号锁定」Tab。Tab 内左右两栏各一张表单：左 B 端（`userType=0`）、右 C 端（`userType=1`）。进 Tab 后 `GET` 列表（固定 2 行），按 `userType` 填入两栏；保存时该栏单独 `PUT`。

后续加账号保护功能：在 `AccountProtectionTabEnum` 增加项，并在 `IndexPage` 挂对应 Panel，不新增子菜单。

鉴权：前端不设置 `Authorization`。axios 同源请求带 session cookie，网关换 token 后转发。成功码沿用拦截器 `S0200`，不按文档示例 `"0"` 特判。

不提供新增 / 删除 / 强制刷新。PUT 成功后后端广播失效，前端只提示「账号锁定策略将在数秒内生效」。

菜单由用户在「菜单管理」自行配置；本仓库只提供可被 `viewPath` 动态导入的页面文件。

## 对接映射

| 接口（见 API.md） | 前端 | 说明 |
|-------------------|------|------|
| GET `/platform/security/account/lockout-policies` | `api/platform/security/accountLockoutPolicy.ts`：`GetAccountLockoutPoliciesAPI`；页面 `pages/platform/security/account-protection` 的账号锁定 Tab | 前缀 `/api/security` |
| PUT `/platform/security/account/lockout-policies` | 同模块 `UpdateAccountLockoutPolicyAPI` | 按栏提交，带该栏 `userType` |
| GET `/platform/security/account/lockout-policies/{userType}` | 同模块可封装 `GetAccountLockoutPolicyByUserTypeAPI` | 本期页面不调用，列表接口已够 |

不要请求 `/inner/security/account/lockout-policies`。

## 数据模型

- `models/accountLockout.ts`：`AccountLockoutPolicy`（与接口对象对齐）
- `models/enums/accountProtectionEnums.ts`：`AccountProtectionTabEnum`（本期仅 `LOCKOUT`）
- 用户类型复用既有 `SessionUserTypeEnum`（`"0"` / `"1"`），页面文案用「B 端（管理员）」「C 端（会员）」
- 权限常量放页面 `constants.ts`：
  - `platform:security:account:lockout:query`
  - `platform:security:account:lockout:update`

## 组件与页面影响

```text
pages/platform/security/account-protection/
├── IndexPage.vue                      # Tab 容器（对齐凭证策略 / 访问防护）
├── constants.ts
├── use/
│   └── useLockoutPolicy.ts            # 拉列表、按 userType 保存
└── components/
    ├── LockoutPolicyPanel.vue         # 账号锁定 Tab：两栏布局 + 页头说明
    └── LockoutPolicyColumn.vue        # 单栏表单（B/C 各实例一份）
```

- 本页是策略表单，不是 CRUD 表。不建 `table.ts`，不用 `usePaging`
- Tab 用 `visitedTabs` 懒挂载：未访问的 Tab 不请求接口（后续加 Tab 时沿用）
- `LockoutPolicyPanel` 用 `el-row` / `el-col` 左右两栏（窄屏可叠成上下）；每栏标题区分 B / C
- `LockoutPolicyColumn`：编辑态开关；`v-auth-any` 控制编辑按钮（更新权限或超级管理员）
- B 端展示「永久锁定」开关：勾选后 `lockDurationMinutes = 0` 并禁用分钟输入；取消勾选后恢复可填分钟（默认 30 或上次非 0 值）
- C 端不渲染永久锁定；分钟输入 `min=1`
- 前端校验：`maxAttempts ≥ 1`、`attemptWindowMinutes ≥ 1`、`1 ≤ hintAfterAttempts ≤ maxAttempts`；C 端时长 ≥ 1
- 保存确认文案带端别；成功后退出编辑并刷新列表
- Tab 内提示：策略数秒内生效；已锁定账号不会因策略变更自动解锁

### 菜单建议（前端不落库，用户自行配置）

| 项 | 账号保护 |
|----|----------|
| 名称 | 账号保护 |
| 类型 | 菜单 |
| path | `/platform/security/account-protection` |
| viewPath | `@/pages/platform/security/account-protection/IndexPage.vue` |
| 权限码 | 菜单建议 `platform:security:account:lockout:query`；按钮「更新」挂 `platform:security:account:lockout:update` |

父级挂在既有「安全中心」下。不要再建「账号锁定」子菜单。

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|------|------|------|
| 页面四件套 | ✅ | 单页多 Tab：IndexPage + 各 Tab 的 use / components，与凭证策略、访问防护同类 |
| API 层 XxxAPI + request | ✅ | `import request from "@/net"` |
| 类型安全、无 any | ✅ | 新代码禁止 any |
| UnoCSS、无 scss | ✅ | |
| 输入先行、施工门禁 | ✅ | 结构改为 Tab 后已同步更新 spec |
| 不提前改 current | ✅ | 验收后再归档 |

## 备选方案

- 账号保护为目录、账号锁定为独立子页：未采纳。用户要求单页 Tab，后续加功能只加 Tab。
- 用 Tab 切换 B / C：未采纳。账号锁定 Tab 内两栏同时可见。
- 两栏合并一次保存：未采纳。API 要求分别 PUT。

## 开放问题

- [x] 菜单由用户自行在菜单管理配置。
