# 接口契约

沿用 [安全中心接口](../20261012-security-page-interactions/API.md)。GET /api/security/platform/security/access/login-failure-policies/{dimension} 仅查询当前维度；更新沿用原 UpdateLoginFailurePolicyAPI 请求、响应与精确 LOGIN_UPDATE 操作。IP、DEVICE、CLIENT、ACCOUNT_IP 枚举值不变。

LoginFailureDimensionPanel 的内部组件实例暴露 dimension、confirming 和 prepareDimensionChange(): Promise<boolean>。这不是后端或框架公共 API。
