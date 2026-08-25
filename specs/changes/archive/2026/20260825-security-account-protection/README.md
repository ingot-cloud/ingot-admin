# 20260825-security-account-protection

> 状态：completed

## 协作模式

前后端分离

## 背景与动机

安全中心需要独立维护「账号锁定」策略：登录失败达到阈值后自动锁定 B 端管理员 / C 端会员账号。后端已提供 Platform API（固定两行种子，按 `userType` upsert），管理台需新增菜单入口与配置页。

前端鉴权走 session，不传 Bearer Token；网关用 session 换 token 后再转发到 `ingot-service-security`。

## 目标

- 在安全中心下新增菜单「账号保护」（单页多 Tab，对齐凭证策略 / 访问防护）
- 本期仅落地「账号锁定」Tab：左右两栏分别维护 B 端（`userType=0`）与 C 端（`userType=1`）策略，各自独立保存
- 不提供新增 / 删除；C 端禁止永久锁定

## 范围

### In Scope

- 新页面 `pages/platform/security/account-protection`（Tab 容器；本期仅账号锁定）
- 账号锁定策略的 api / models
- 文档中给出菜单 path、viewPath、权限码建议（菜单由用户在菜单管理配置）

### Out of Scope

- 账号保护的其它 Tab（后续加功能只加 Tab，不新增子菜单）
- 手动解锁已锁定账号、查看锁定中账号列表
- 调用 Inner Feign `/inner/security/account/lockout-policies`
- 强制刷新 / 广播失效按钮（PUT 成功后后端自行广播）
- 在前端请求头加 `Authorization: Bearer`

## 输入来源

- 接口文档：inbox `API.md`（原文移入，未重写）
- 需求文档：无；由 Agent 根据接口与对话整理 `REQUIREMENTS.md`
- 后端来源：`ingot-service-security` Platform API（账号锁定策略）
- 对话补充：菜单为「安全中心 → 账号保护」单页；账号锁定为页内 Tab；B / C 两栏；后续账号保护能力继续加 Tab

## 工件

- [接口](./API.md)
- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)

## 风险与依赖

- 菜单与权限码需后端种子或运营在「菜单管理」配置后，前端页面才会出现在侧栏
- C 端 `lockDurationMinutes` 禁止为 `0`，需前端校验，避免提交后才报「C端账号禁止永久自动锁定」
- `hintAfterAttempts` 必须落在 `[1, maxAttempts]`；`maxAttempts` 变化时需同步校验
- 策略变更不会自动解锁已锁定账号，页面需提示，避免运营误解

## 相关链接

-

## 完成记录

- 完成日期：2026-08-25
- 关联提交或 PR：
- 更新的 current capability：`security/account-protection`
- 与原设计的差异：施工中按用户确认，将「账号保护目录 + 账号锁定子页」改为「账号保护单页多 Tab」
- 取消原因：
