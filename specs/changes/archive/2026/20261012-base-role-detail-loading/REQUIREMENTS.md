# 角色详情加载需求与验收

保留三个 tab 和顶部版本分布。可治理平台角色首屏只读取详情、当前授权、分配版本分布；无治理资格/其他角色不读分布。历史和任务按激活 tab 请求，每页默认20。

权威来源：相邻 `ingot/specs/changes/archive/2026/20261012-iam-role-detail-loading/REFINEMENT.md`。当前 `/grants` 的 data 增加可选 `revision: { id, revision, versionName? }`，与 items 属于同一固定版本；无版本时省略。固定版本 grants 保留 items。先部署后端再前端；无数据库、请求参数或权限变化，旧前端可忽略新增字段。

验收标准见 [任务](./TASKS.md)，人工及自动化结果见 [原增量记录](./REFINEMENT.md#验证记录2026-10-12)。
