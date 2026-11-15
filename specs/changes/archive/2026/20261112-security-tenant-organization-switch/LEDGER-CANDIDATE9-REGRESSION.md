# candidate9 后端回归

九个相关模块共1903项：1897通过、6项独立条件跳过、零失败。真实Redis/MySQL/GR及IAM两组MySQL HTTP功能测试已启用。

| 模块 | 测试 | 跳过 | 失败 |
| --- | ---: | ---: | ---: |
| Auth | 112 | 0 | 0 |
| BFF | 34 | 0 | 0 |
| Gateway | 46 | 0 | 0 |
| IAM | 1525 | 6 | 0 |
| commons | 17 | 0 | 0 |
| Feign | 12 | 0 | 0 |
| security-common | 71 | 0 | 0 |
| authorization-server | 60 | 0 | 0 |
| account-core | 26 | 0 | 0 |

IAM原先43项条件跳过降为6项，37项MySQL HTTP功能用例实际通过：RoleWorkspace23、TenantLive14。剩余为两个独立浏览器脚本、三个规模/性能基准和一个MinIO实存储用例；名称列于同名JSON，未计为通过。第一次启用时IAM测试JVM默认堆耗尽；仅通过临时Gradle init脚本将IAM测试堆调至2GB后重跑，产品配置未改。测试自建容器由其生命周期清理，未遗留前次OOM容器。

新真实HTTP回归先复现：Feign/JDK对401未交出正文，通用错误解码器空指针，BFF误作503。账本和组织客户端已使用专用适配：缺正文401为TOKEN_INVALID；其余空正文/畸形响应保持AUTH_UNAVAILABLE，响应正文不进入异常；完整R错误保持原码，仍禁止自动重试。实际HTTP401/409/503各只发送一次，另有空正文/畸形响应边界回归。

四个服务模块已构建并协调部署到六个隔离JVM。最终候选包竞争、R1/R2、固定root RT、C02、性能、灾备/回滚及最终环境恢复仍未全部完成。此工件只证明所列回归，不解除发布阻断，不更新current，未提交。
