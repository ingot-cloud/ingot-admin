# 接口与后端来源记录

> 同步日期：2026-10-31；状态：completed。接口与本地功能已验收；目标环境发布证据另行记录，副本一致性不代替实测。

## 来源

用户在本对话先要求生成前后端 Spec，2026-10-31 明确确认后共同实施；没有消费 inbox。后端权威 change 为同级 ingot 仓库的 specs/changes/archive/2026/20261031-security-same-origin-login/。
API.md、后端设计、部署与联合验收副本按字节复制，frontend DESIGN 不重复定义 DTO。

| 后端原文件 | 本 change 副本 | SHA-256 |
|---|---|---|
| API.md | [API.md](./API.md) | 2c32a5d4ca99e3b3881f21319fd40c9957de0129059988dbf610649e6e215f8d |
| DESIGN.md | [sources/BACKEND-DESIGN.md](./sources/BACKEND-DESIGN.md) | 46c7dcaf9101ae1beef24583e1cd2d6335eda59f11bdaae762a7066e8a9b9861 |
| DEPLOYMENT.md | [sources/BACKEND-DEPLOYMENT.md](./sources/BACKEND-DEPLOYMENT.md) | 317a8c708cb217bf3e08de1584c1705307c013f20b565cdd4c25bb3787d41f81 |
| ACCEPTANCE.md | [sources/BACKEND-ACCEPTANCE.md](./sources/BACKEND-ACCEPTANCE.md) | 1539888783bcd71242b264fca22afeaa2fd60d6546fd231482fd917859f2bc54 |

## 同步与批准规则

- 后端接口为唯一事实来源，任何字段、状态、错误、恢复、Cookie或部署边界调整先更新后端，再重新复制上述文件和计算摘要。
- 同步不能自动改变任一 README 的 draft 状态。只有用户确认完整 Spec，才可将两侧批准记录对齐。
- 实施阶段从本 change 及 sources 读取；不将已清空 inbox 或旧 IAM 契约当新协议使用。
- 与 IAM 主change、登录外观change只关联，不抹去历史状态和未完成验收。两侧 current 已按用户本地验收更新；其他change的范围与未验任务保持。
- SHA 一致仅证明副本一致，不证明后端/前端实现或真实登录验收通过。
