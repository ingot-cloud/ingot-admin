# 接口与组件契约

业务接口沿用 [安全中心交互接口](../20261012-security-page-interactions/API.md)，没有新增或修改后端 API。账号页改用已存在的 `GET /api/security/platform/security/account/lockout-policies/{userType}`，`0` 为 B 端管理员、`1` 为 C 端会员；`data: null` 显示原有空态。保存仍为原 `PUT /api/security/platform/security/account/lockout-policies`，按当前 Tab 的 userType 提交，沿用精确 lockout-policy read/update 权限。

- `InFormContent`：core 全局组件，default slot 承载正文及其操作区；继承 class/ARIA 等普通 HTML 属性；不引入业务 props、emit 或数据加载。
- `--in-form-content-max-width`：公开主题 Token，默认 `840px`。主题可覆盖；实际宽度仍受可用容器宽度限制。
- InPageFrame、InForm、InLoading 的既有契约保持兼容。

账号页内部 `useLockoutPolicy(userType, tab)` 提供当前端的 `config` 与 `savePolicy`；新增单项 Query options，保留既有列表 API 与 options，避免扩大重构范围。
