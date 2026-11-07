# 平台能力与页面归属规格

## 概述

字典归平台治理的系统设置，安全中心独立为 `PLATFORM / platform-security`。两域审计固定自身数据域，字段策略由组织插件承载。菜单、路由和按钮使用同一 IAM 目录及精确操作资格。

## 页面入口

| 能力 | 插件及 pages 路径 | 浏览器 URL | canonical viewPath |
| --- | --- | --- | --- |
| 字典 | platform/settings/dictionaries | /platform/settings/dictionaries | platform.settings.dictionaries |
| 凭证策略 | security/credential-policies | /security/credential-policies | security.credential.policies |
| 账号保护 | security/account-protection | /security/account-protection | security.account.protection |
| 访问防护 | security/access-protection | /security/access-protection | security.access.protection |
| 会话管理 | security/sessions | /security/sessions | security.sessions |
| 平台成员与用户组 | platform/iam/personnel | /platform/iam/personnel | platform.iam.personnel |
| 平台审计 | platform/iam/authorization-audit | /platform/authorization-audit | platform.iam.authorization.audit |
| 组织审计 | org/iam/authorization-audit | /org/authorization-audit | org.iam.authorization.audit |
| 字段策略 | org/iam/field-policies | /org/field-policies | org.iam.field.policies |
| App 用户管理 | member/user | /member/users | member.user |
| App 角色管理 | member/role | /member/roles | member.role |
| App 权限管理 | member/permission | /member/permissions | member.permission |

## 用户场景

### 场景 1：在所属应用进入页面

- **角色**：具有相应菜单与读取权限的平台或租户管理员
- **步骤**：通过侧栏、菜单搜索、应用切换或正式深链接打开页面并刷新
- **预期结果**：页面归属、URL 与注册键一致；租户宿主通过 org 使用字段策略和组织审计；安全中心仅装配在平台宿主

### 场景 2：维护字典

- **角色**：具有字典读取或维护权限的平台管理员
- **步骤**：选择字典类型、查看字典项，按权限新增、修改、启停、排序或删除
- **预期结果**：操作分别检查 read/create/update/delete，排序和启停使用 update；内置字典约束保持。租户与应用选择器单独检查目录读取权限

### 场景 3：查看固定域审计

- **角色**：具有所在域审计 read 权限的管理员
- **步骤**：打开对应审计页，选择操作者、对象类型、变更类型或时间范围，使用上一页、下一页并查看详情
- **预期结果**：每页可选 20、50、100 条，筛选变化或切换身份后重置游标。分页条按游标判断可翻页状态。列表和详情按可见性展示名称及完整差异，历史占位值显示兼容提示，审计 ID 和追踪 ID 可复制。错误、空结果和拒绝分别反馈

### 场景 4：维护字段策略

具备字段策略读取资格的租户管理员可在安全与合规中选择已接入资源并查看规则，具备更新资格时可保存。普通通讯录与可见范围策略入口已退出。页面行为见 [组织资源字段策略](../../org/field-policy/spec.md)。

## 功能需求

- 系统 MUST 使用正式 URL 与 canonical viewPath，旧 URL 不再作为功能入口；正式 URL 显式配置
- 安全中心使用 `platform-security:*` 精确操作。刷新策略、读取封禁记录、并发策略创建与删除分别授权
- 访问防护和会话管理入口按相应 read 的 ANY 开放，仅展示授权 Tab，默认首个可访问项。未激活或撤权的面板停止请求
- 两域包装页使用 admin-common 无路由审计组件，公共包不依赖业务插件
- 安全接口通过授权 SDK 执行；读取遵守最长 30 秒热窗口，写入 fresh 求值。撤权、到期、停用或依赖故障按服务端授权规则拒绝

## App 用户管理

平台宿主装配 Member 插件，通过 IAM bootstrap 显示 `platform-member` 应用与三个页面。每页按对应的读取操作显示，按钮按精确操作权限显示。应用切换器、侧栏、功能搜索和深链使用同一组菜单。

用户页支持姓名和手机号搜索、分页、账号状态管理及角色配置。角色页与权限页支持按名称查询树和维护子项，右侧操作列单行显示「详情」「添加子角色」或「添加子权限」。权限页的启停动作位于「更多」菜单，详情抽屉中的字段与顶部权限名称左对齐。

用户角色和角色权限在选择对话框中回显，保存时提交完整选择。内置用户角色只读，权限树保留父子授权语义。

## 人员、诊断与图片表单

平台人员页按人员和组的读取资格分别显示 Tab，首次打开选择第一个可读 Tab，仅查询当前授权面板。组成员按成员读取及范围显示，组资料编辑可单独保存，编辑关联时由服务端校验可维护成员。

两域角色与授权工作区提供独立的权限诊断 Tab，默认诊断本人。成员和业务对象选择器根据当前读取资格和对象范围提供候选。页面可由授权行带入目标，诊断结果只读。

头像和 Logo 在选取时本地预览，提交时按用途上传并取得短时凭证。表单提交对应的头像或图标凭证，并按字段及对象权限处理失败与重试。

## 平台创建流程的全局账号选择

创建组织第二步的所有者字段和添加平台成员第一步的全局账号字段使用同一个单选弹窗。左栏浏览候选，右栏核对已选项。确认后表单回显登录名，取消保留原已确认值。具备全局账号读取资格时默认打开每页 20 条的列表，清空查询条件回到第一页。具备精确查找资格时也可使用完整登录名查询。

添加平台成员的候选和总数排除已有平台成员资格的账号，包括暂停和已移出。创建组织可选这些账号作为所有者。选中时服务端按实际用途校验，成员资料继续按创建字段权限展示。

## 兼容性与依赖

普通角色按授权配置获得入口资格。相关 IAM/Security 接口、增量迁移与回滚要求见各能力规格及归档记录。IAM 主变更 `20260913-base-iam-admin` 继续独立维护。

## 验收标准

- [x] 八页深链接、刷新、菜单搜索和应用切换使用正式入口
- [x] 精确权限、活动 Tab 查询、只读与撤权行为符合矩阵
- [x] 两宿主装配、固定域审计、窄屏与明暗主题通过验证
- [x] 2026-10-13 用户确认本前端变更验证完成并归档
