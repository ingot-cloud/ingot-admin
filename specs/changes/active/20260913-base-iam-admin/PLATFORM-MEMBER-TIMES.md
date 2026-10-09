# 平台成员详情只读时间（2026-10-08）

> 状态：validating（开发及定向自动化完成；真实页面/身份验收待执行）
> 批准：用户确认前一轮分析并明确要求实施。沿用已批准 IAM change。

## 需求、设计与兼容

人员详情“其他”在用户组后依次显示加入平台时间、账号最后登录时间、成员更新时间，纯文本只读；最后登录说明“包含平台及组织身份登录”，空值“暂无登录记录”，其他空值“-”。MemberRecord 可选 joinedAt/lastLoginAt/updatedAt 保留 API ISO，使用 @ingot/shared.formatDateTime 本地展示到秒；没有录入控件、不填编辑草稿、不提交时间、不新增账号请求。

后端只在平台详情/编辑成功响应填写，按成员 read 与对象范围执行；时间是固定只读元数据。账号登录是平台/组织共用的账号事实，加入时间是平台成员创建时间，更新时间是成员记录变更。列表和租户响应保持，未知写入字段拒绝，无新增 DDL。权威后端设计与接口副本放 sources。

## 宪章符合性

沿用人员模块、InDetailField/InForm/InBizTabPanel 和共享时间工具；跨模块类型进入 admin-common，无插件互相依赖，无样式或组件复制。

## 任务与验收

- [x] MT01 同步可选响应类型与后端权威来源。
- [x] MT02 其他分组只读展示和格式化。
- [x] MT03 相关组件回归、类型、只读 lint、平台构建、依赖边界和文档检查。
- [ ] MT04 人工：真实详情/未登录/保存刷新/暂停恢复/范围/两时区展示。验收前不更新 current 或归档。

## 自动化证据（2026-10-08）

- 后端 provider 30 项定向测试通过：PlatformMemberContactsTest 10、FieldAccessEvaluatorTest 8、PlatformMemberFieldContextTest 3、PlatformMemberUpdateAccessTest 3、MemberQueryRepositoryTest 6。验证真实 MyBatis/H2 时间来源、UTC Z 输出、空记录/账号删除、范围拒绝、只读时间显式 null 写入拒绝、资料/角色事务及隐藏脱敏投影。
- Java IamAuthorizationContractTest 17 项通过，新增三项字段的 string/date-time、readOnly 与非必填断言；OpenAPI 生成及 --check 为 132 路径/200 操作；Python 契约 7 项通过。
- 前端 MemberFieldUi/MemberDrawers/memberFieldAccess 共 14 项通过；补充保存后更新时间刷新断言后 MemberFieldUi 6 项再次通过，覆盖上海/纽约、空时间文案、只读分组和保存不携带时间。admin-common/platform 两包类型检查、3个源文件只读 ESLint及平台管理台构建通过。
- 运行使用已有 Gradle 缓存、Node 22.17.0 与 pnpm 10.12.4。构建存在既有图标扫描、重复 UnoCSS、crypto 外置及动态导入提示，无新增构建错误。没有运行或替换真实业务服务，没有数据库迁移或提交。
- 两端 diff 检查、前端依赖边界及文档检查通过。
- MT04 真实页面、登录/暂停恢复与身份范围验收保留待办；本轮不更新 current，不归档主 change。
