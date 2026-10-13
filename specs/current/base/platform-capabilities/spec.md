# 平台能力与页面归属规格

## 概述

字典归平台治理的系统设置；安全中心独立为 `PLATFORM / platform:security`。两域审计固定自身数据域，成员访问策略由组织插件承载。导航与注册键直接切换至正式入口，接口副本见归档 [API.md](../../../changes/archive/2026/20261012-iam-platform-capability-completion/API.md)。

## 页面入口

| 能力 | 插件及 pages 路径 | 浏览器 URL | canonical viewPath |
| --- | --- | --- | --- |
| 字典 | platform/settings/dictionaries | /platform/settings/dictionaries | platform.settings.dictionaries |
| 凭证策略 | security/credential-policies | /security/credential-policies | security.credential.policies |
| 账号保护 | security/account-protection | /security/account-protection | security.account.protection |
| 访问防护 | security/access-protection | /security/access-protection | security.access.protection |
| 会话管理 | security/sessions | /security/sessions | security.sessions |
| 平台审计 | platform/iam/authorization-audit | /platform/authorization-audit | platform.iam.authorization.audit |
| 组织审计 | org/iam/authorization-audit | /org/authorization-audit | org.iam.authorization.audit |
| 成员访问策略 | org/iam/member-policies | /org/member-policies | org.iam.member.policies |

## 用户场景

### 场景 1：在所属应用进入页面

- **角色**：具有相应菜单与读取权限的平台或租户管理员
- **步骤**：通过侧栏、菜单搜索、应用切换或正式深链接打开页面并刷新
- **预期结果**：页面归属、URL 与注册键一致；租户宿主通过 org 使用成员策略和组织审计；安全中心仅装配在平台宿主

### 场景 2：维护字典

- **角色**：具有字典读取或维护权限的平台管理员
- **步骤**：选择字典类型、查看字典项，按权限新增、修改、启停、排序或删除
- **预期结果**：操作分别检查 read/create/update/delete，排序和启停使用 update；内置字典约束保持。租户与应用选择器单独检查目录读取权限

### 场景 3：查看固定域审计

- **角色**：具有所在域审计 read 权限的管理员
- **步骤**：打开对应审计页、筛选并查看详情
- **预期结果**：平台与组织查询固定自身域，伪造 domain/tenantId 不改变查询作用域；错误、空结果与拒绝有明确反馈

### 场景 4：维护成员访问策略

- **角色**：租户管理员
- **步骤**：打开通讯录可见范围或字段权限 Tab，按权限查看、保存或预览
- **预期结果**：两个 read 独立控制 Tab，保存与预览分别检查自身精确操作；只请求当前激活且有权限的面板

## 功能需求

- 系统 MUST 使用正式 URL 与 canonical viewPath，旧 URL 不再作为功能入口；正式 URL 显式配置
- 安全中心六资源十六操作仅支持 ALL，精确操作码保持 `iam-platform:*`；页面与写处理器检查相应能力，不隐式扩权
- 访问防护、会话管理和成员访问策略入口按相应 read 的 ANY 开放；仅展示授权 Tab，默认首个可访问项；未激活或撤权的面板不请求
- 两域包装页使用 admin-common 无路由审计组件，公共包不依赖业务插件
- 安全接口通过授权 SDK 执行；读取遵守最长 30 秒热窗口，写入 fresh 求值。撤权、到期、停用或依赖故障按服务端授权规则拒绝

## 兼容性与依赖

保留既有业务接口、数据作用域与不可变角色版本；普通角色不会自动补权，需走现有发布和分配流程。八页路由切换与 IAM/Security/前端成套发布，后端升级和回滚要求保留在归档设计与验证记录中。IAM 主变更 `20260913-base-iam-admin` 继续独立维护。

## 验收标准

- [x] 八页深链接、刷新、菜单搜索和应用切换使用正式入口
- [x] 精确权限、活动 Tab 查询、只读与撤权行为符合矩阵
- [x] 两宿主装配、固定域审计、窄屏与明暗主题通过验证
- [x] 2026-10-13 用户确认本前端变更验证完成并归档
