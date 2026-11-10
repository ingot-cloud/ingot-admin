# IAM 登录后接口提速与场景提示

> 状态：completed
> 归档日期：2026-11-10

用户于 2026-11-09 批准实施。

- [需求与验收](REQUIREMENTS.md)
- [接口契约](API.md)
- [设计](DESIGN.md)
- [任务](TASKS.md)
- [后端归档与联合验收记录](../../../../../../ingot/specs/changes/archive/2026/20261109-iam-post-login-read-performance/VALIDATION.md)

## 隔离浏览器复测

启动两端生产构建预览，设置 `IAM_GROUP_PLATFORM_URL`、`IAM_GROUP_TENANT_URL`。后端设置 `IAM_TENANT_LIVE_MYSQL_HTTP_TEST=true`、`IAM_GROUP_BROWSER_SCRIPT` 指向 [浏览器脚本](../../../../../scripts/verify-iam-group-workspace-browser.mjs)，依次执行 `TenantLiveMySqlHttpTest.groupSummaryRetainsPageAndPermissionsWithoutLoadingBindings` 和 `TenantLiveMySqlHttpTest.groupWorkspaceBrowserAgainstMySql`。脚本使用 Playwright Chromium，可通过 `PLAYWRIGHT_CHROMIUM_EXECUTABLE` 指定已安装的 Chromium。

## 完成记录

- 2026-11-10 按用户要求归档已完成实现。两端用户组摘要、成员独立分页和详情编辑在隔离浏览器联测中通过。写入错误保留对象与原因，只提示一次并保留草稿。共享 HTTP 客户端补齐通用内部错误的中文回退及诊断信息过滤。
- [组织用户组](../../../../current/org/group-workspace/README.md)、[平台能力](../../../../current/base/platform-capabilities/README.md) 和 [管理台 UI](../../../../current/common/admin-ui-experience/README.md) 已同步实现及现场验收后的运行规格。
- 实现提交为前端 `9682655`、后端 `d40d3dff`。
- 真实 BFF 会话、页面耗时和缓存命中率见已完成的[联合现场与发布验收](../../../../../../ingot/specs/changes/archive/2026/20261110-iam-post-login-release-acceptance/README.md)。
