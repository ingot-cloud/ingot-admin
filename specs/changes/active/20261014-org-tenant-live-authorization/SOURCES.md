# Sources

## 权威与授权

来源日期：2026-10-14（Asia/Shanghai）。用户在同一聊天确认目标模型、只读Plan方案与四项细化决定，先要求创建前后端active change供评审，随后明确评审通过并批准实施前后端；暂不提交代码。本轮没有消费、移动或清空其他inbox，也没有修改已归档/current接口说明。

后端权威变更：[20261014-iam-tenant-live-authorization](../../../../../ingot/specs/changes/active/20261014-iam-tenant-live-authorization/README.md)。前端API字段不得独立修改；后端变更后复制原文、重算摘要，再进行两端工件评审。

## 按字节复制清单

| 后端源文件（相对后端 change） | 本地副本 | SHA-256 |
|---|---|---|
| API.md | [API.md](./API.md) | `9dd748b3150363909352e27e9b6413e912f2709fe55ab6485656c6a78450ec31` |
| MIGRATION.md | [sources/BACKEND_MIGRATION.md](./sources/BACKEND_MIGRATION.md) | `2ec884c6628ec2b9e43b549c3829164ea90b2121848cc26a6fb3734a94959ce3` |

源文件和副本必须逐字节相等。这里是目标设计契约副本，已生成Java/OpenAPI/schema/routes产物；接口和验证证据见VALIDATION.md。没有复制其他change旧契约来充当本次新接口。

## 前端独立工件

REQUIREMENTS/DESIGN/TASKS/ACCEPTANCE负责页面交互、架构、实现映射和验证；MIGRATION负责前端制品切换与联合回滚，不重新定义数据库转换。README记录状态与跨仓库归属。

工件已获用户批准并进入实施，当前准备验收。旧基础IAM change和角色版本基线只增加关联索引，历史和current保持；已授权实施，未授权提交；没有创建commit。

## 验证记录

交付前检查本目录必需工件、相对链接、API及迁移副本摘要、JSON示例、任务/验收ID引用、退出字段和状态约束。组件/业务测试、构建、真实HTTP、关键浏览器及隔离数据库迁移已执行，证据见 [VALIDATION](./VALIDATION.md)。完整产品人工与实际部署仍待确认；文档检查不能代替U/B产品验收。
