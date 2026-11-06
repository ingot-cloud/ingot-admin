# 平台与租户管理台同源登录

> 状态：completed
> 创建日期：2026-10-31
> 2026-10-31 用户确认平台/租户登录、退出、切换组织和多标签页本地验收通过，要求归档与提交。

## 协作模式与目标

一人全栈、后端契约先行。两个管理台宿主各自挂载 /login/，支持双域名与纯 IP HTTPS 双端口。直接访问、收藏及长期停留无需有效 tx；点击登录才准备，login/select直接建立本域会话。
用户已明确取消四域名范围。不实现跨域准备、ticket/complete 交接或独立登录域。

## 输入来源

- 本对话：流程梳理、安全讨论、完整双入口方案以及 2026-10-31“先写 Spec，等确认后实施”。
- 参考讨论：「部署」生产内网环境部署与Cookie隔离；先前四域兼容建议已被最新双入口范围替代。
- 后端 change：[20261031-security-same-origin-login](../../../../../../ingot/specs/changes/archive/2026/20261031-security-same-origin-login/README.md)。
- API.md 为后端权威契约逐字副本；用户直接授权跨仓 Spec，未消费、移动或清空 inbox。
- 副本来源、SHA-256 及同步规则见 [SOURCES.md](./SOURCES.md)。

## 工件

- [接口副本](./API.md)
- [需求与用户验收](./REQUIREMENTS.md)
- [宿主、路由、网络与恢复设计](./DESIGN.md)
- [任务和实施决策](./TASKS.md)
- [后端设计副本](./sources/BACKEND-DESIGN.md)
- [部署与切换副本](./sources/BACKEND-DEPLOYMENT.md)
- [联合验收副本](./sources/BACKEND-ACCEPTANCE.md)

## 基线、依赖与交接

- [当前密码登录行为](../../../../current/ingot-login/password-login/spec.md)：保留“先提交、412 全局挑战”，改变宿主、事务准备和成功状态。
- [IAM 主变更](../../../active/20260913-base-iam-admin/README.md)：现有四站 BFF 历史与其他 IAM 任务保持，不将新目标冒充已实施事实；本 change 完成后接管其登录部署条款。
- [登录外观变更](../20261030-ingot-login-appearance/README.md)：复用其 Logo、表单、主题配置、响应式与挑战反馈，不撤销已有视觉成果；该 change 的剩余用户验收不自动完成。
- apps/admin 与 apps/admin-platform 仍是 composition root，auth-plugin 不复制业务到宿主，不与其他业务插件互相依赖。

## 范围与限制

包含 auth-core、auth-plugin、admin-core 认证适配、两个管理宿主、旧页面兼容引导和部署/构建说明。
独立 apps/auth、apps/auth-platform 在本次完成后退出工作区运行/发布链路；其仍被使用的验证码组件、网络和资源先迁入允许的共享层，再删除被替代实现，不能复制到两个管理 App。
对外 OAuth2/OIDC/SSO、四域并行支持、业务页面与RBAC重构不在范围。

## 本轮状态

两个管理宿主同源登录已完成本地功能验收，见 [验证记录](./VALIDATION.md)。current 已更新，用户本轮授权归档与本地提交。
前端既有两份 components.d.ts 用户改动保留且不纳入本次提交。后端接口/副本同步；目标 CA/真实休眠/生产回滚等剩余环境证据移交后端发布验收 change，不以 Mock 代替。


## 实施批准（2026-10-31）

用户明确确认这两份 Spec 并授权前后端共同实施、按验收场景验证，暂不提交代码。需求、设计、接口、安全、部署、任务与异常恢复细化一并获批。

2026-10-31：批准门禁与两侧任务决策已核对，进入 implementing。current 保持既有基线；实施、验证证据逐项记录。

2026-10-31：进入 validating。前后端实现及本地验证完成，部署联调/用户验收未完成，暂不更新 current 或归档。

## 完成与范围交接（2026-10-31）

用户按本地清单复测并明确确认两端登录、退出、切换组织、多标签页均正常，授权更新 Spec/current、归档和提交。当前行为归 ingot-login/password-login，公共挑战与网络身份约束同步到相关 current。

- 关联实现提交：后端 `afb352cf72c0e09f0099c19c009b45f5d86ab0fd`、前端 `48700ff3f83d135e9296663261492c03acc2b13e`；文档提交由本 README 所在提交追溯。
- 目标环境剩余项跟随后端同源登录发布验收 change；本轮不宣称生产上线。
- 独立登录外观 change 的320px/矮屏、三种配色等未明确确认细项仍保留 active；IAM 主 change 的其他业务不归档。
- 原 API、部署兼容性与安全约束没有因收尾而放宽；最终修正与121项定向/22类浏览器证据见 VALIDATION.md。
