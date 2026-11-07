# IAM 历史前端调用清理

> 状态：validating

2026-11-07 用户已确认后端 IAM 历史代码与包结构方案并授权分阶段实施，本目录承接其中关联前端阶段。来源为同一会话及后端 `specs/changes/active/20261107-iam-legacy-cleanup-package-refactor/`，不消费 inbox。

范围：仅退役 PMS 页面、专用 API/模型/组件及未被正式入口使用的公共旧查询；正式 IAM、Member、Security 入口保留。已有生成声明与帮助中心未提交改动保留。历史数据与数据库脚本不在范围。

approved → implementing：同日开始关联清理。

实现与限定自动化完成，进入validating；人工和目标环境验收待办，尚未更新current或归档。

2026-11-07 按用户明确要求提交代码：历史清理提交 `7f4be10`。状态仍为 validating，提交不替代实际环境验收。
