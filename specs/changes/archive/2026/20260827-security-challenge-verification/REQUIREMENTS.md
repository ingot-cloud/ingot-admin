# 需求：挑战验证

> 管理台在「访问防护」加 Tab；**所有经网关请求**统一处理 412。接口见 [API.md](./API.md)。

## 场景与页面

### 场景 1：查看挑战策略列表

- **角色**：平台管理员（`platform:security:policy:query` 或超级管理员）
- **入口**：安全中心 → 访问防护 →「挑战策略」Tab
- **步骤**：打开 Tab，拉取全部策略
- **预期结果**：按 `priority` 升序；remote 生产能看到种子 `login-always`；停用行仍在列表中

### 场景 2：新增 / 编辑 / 删除挑战策略

- **角色**：平台管理员（create / update / delete 或超级管理员）
- **入口**：Tab 内「新建」或行内「编辑」
- **预期结果**：POST 新增、PUT 带 `id`；成功提示「规则将在数秒内生效」

### 场景 3：表单约束与废弃字段

- **预期结果**：分组与路径二选一；`trigger` / `challengeType` 枚举；`scope`≤64；TTL 与 remaining ≥ 1；路径不得 `/vc`。不展示废弃失败阈值。`challengeFailureLimit` / `blockTtlSec` 可填并注明网关不执行

### 场景 4：任意请求遇到 412

- **角色**：登录用户或未登录用户
- **入口**：登录、管理台业务 API、其它匹配挑战策略的请求
- **步骤**：原请求发出 → 412 `CHALLENGE_REQUIRED` → 全局弹一次滑块 → 按 `data.vcType` 拉码、按 `data.checkPath` 验码（Header `{scopeParam}: {scope}`）→ 用 `data[passTokenParam]` 取值 → 原请求 Header 带 token 与 scope 重试
- **预期结果**：业务 JSON 不变；参数名与 URL 以后端本次 `data` 为准。滑块失败不重试业务请求。403 / 429 不当成验证码

### 场景 5：挑战关闭

- **预期结果**：不弹滑块，请求按原成功/失败处理。不要预发验证码

### 页面结构

```text
安全中心 → 访问防护 → 挑战策略 Tab
全局：axios 412 拦截 + 根组件 ChallengeHost
```

## 验收标准

- [x] 访问防护「挑战策略」Tab CRUD 与校验符合 API.md §2
- [x] 写成功提示「规则将在数秒内生效」
- [x] login 与 admin 的 axios 都拦截 412 + `CHALLENGE_REQUIRED`
- [x] 拉码 URL、验码 URL、Header 名均来自 412 `data`，不写死
- [x] PassToken / scope 只出现在 Header，不写 query；`/vc/**` 不套 412
- [x] 同 scope 共用一次滑块；不同 scope 不混用 token
- [x] 登录页不再单独处理 412
- [x] 不调用 Inner Feign；管理台不传 Bearer Token

## ADDED

### REQ-A001：访问防护 · 挑战策略 Tab

**验收标准：** 源码在 `access-protection/`；权限共用 `platform:security:policy:*`

### REQ-A002：全局 412 拦截

**验收标准：**

- [x] 时序符合 API.md §3.4
- [x] 缺 `data` 字段不当作挑战
- [x] 验码失败 / 用户关闭不重试原请求

## MODIFIED

### REQ-M001：登录不再预弹滑块

**变更说明：** 登录与其它 API 一样先发请求，由全局拦截处理 412。

**验收标准：**

- [x] `LoginAPI` 不传验证码字段
- [x] 关闭挑战时无滑块
