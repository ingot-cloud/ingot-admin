# 验证记录

2026-11-07：platform/org/admin-common单测153/94/185项全部通过；admin-core/admin-common/platform/org类型检查通过；公共包、主题和admin/admin-platform宿主构建通过；仓库分层检查、git diff --check通过。使用已有Node22.17.0与pnpm10.12.4。

原有8个生成声明文件的用户差异保留；自动生成引入的其他变化恢复，移除明确指向150个已删除专用文件的声明。无生产源码继续发出`/api/pms`请求。现行IAM及Member/Security能力保留。

admin-core全量542项中540通过、2项既有源码文本断言失败：顶栏margin及InTable背景定位；相关源码和测试与HEAD字节相同，证据见unchanged-ui-failures.json。未修改该UI行为或删除断言。

后端最终正常回归、隔离MySQL/HTTP和契约兼容记录见ingot仓库对应change/VALIDATION.md。前端目标环境与人工验收仍待完成，不提前更新current或归档。

2026-11-07 用户反馈已重启服务，平台端/租户端登录及部分接口通过；仅登记已反馈范围，未扩展为全部页面与业务功能验收。状态保持validating。
