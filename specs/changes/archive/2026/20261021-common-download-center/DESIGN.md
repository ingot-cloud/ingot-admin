# Design

接口见 [API.md](./API.md)。

## 方案摘要

「我的下载」属于跨 App 的公共能力，放在 `packages/admin-core`：内置顶栏小部件 + 公共路由 + 页面 + API/模型。业务插件只负责提交导出，不感知下载中心的列表与下载。

## 落点

| 内容 | 路径 |
|---|---|
| 模型 | `packages/admin-core/src/models/download.ts`：`DownloadTaskStatus` 枚举与标签表、`DownloadTask`、`DownloadLink`、`DownloadTaskPage`、`DOWNLOAD_CENTER_PATH`、`DOWNLOAD_CENTER_TITLE`（经 admin-core 入口导出） |
| API | `packages/admin-core/src/api/common/download.ts`：`DownloadTaskPageAPI`、`DownloadTaskAPI`、`DownloadLinkAPI` |
| 路由 | `packages/admin-core/src/router/routes/common.ts` 新增 `/downloads`，`LAYOUT_MAIN` 包裹，`hideMenu: true`，需登录（非 `permitAuth`） |
| 页面 | `packages/admin-core/src/pages/common/downloads/IndexPage.vue`（及同目录 `downloadQuery.ts`、`table.ts`、`useOps.ts`、测试） |
| 小部件 | `InAdminHeaderBuiltinUtilityName.Downloads`，默认 label「我的下载」、icon `ep:download`，点击 `router.push("/downloads")` |
| 接入 | `apps/admin/src/header.ts` 的 `utilities` 加入 `defineHeaderBuiltinUtility(Downloads)`，放在通知前；`apps/admin-platform` 本期不加 |
| 成员导出 | `plugins/org/src/pages/iam/members/workbook/IndexPage.vue`：`privateExport` 改为只提交 + 提示 |

## 页面实现要点

- 列表用现有表格/分页组件与 `InLoading`；时间用共享时间工具按当地时区格式化
- 状态标签用框架统一 tag，状态到文案/类型的映射集中在模型旁的常量表
- 列表走 `useServerPaging` + TanStack Query，Query Key 带当前身份上下文（epoch、域、租户、成员），切换身份不复用缓存
- 轮询：查询的 `refetchInterval` 在当前页存在 `PENDING`/`RUNNING` 时返回 3 秒，否则停止；后台刷新不显示整页 loading，页面卸载随 Query 自动停止
- 下载：调用 `DownloadLinkAPI` 后创建临时 `<a href download>` 触发；按行记录 loading
- 文件大小格式化抽成纯函数并单测

## 成员导出改造

- 删除导出对 `pollWorkbookTask` 与 `WORKBOOK` 产物下载的调用；导入路径不变
- 提交成功后关闭范围对话框，弹出 `Confirm.success` 提示「导出任务已提交」，确认按钮「前往我的下载」（`router.push("/downloads")`），取消按钮「知道了」。`Message` 只接受纯文本，无法放链接
- 同步修订 `20261020-org-member-batch/DESIGN.md` 导出段落

## 测试

- 模型/工具：状态映射、文件大小格式化
- 页面：存在进行中任务才轮询、仅可下载行显示下载按钮、`/downloads` 路由解析
- 顶栏：内置 Downloads 小部件解析默认文案
- 成员导出：提交后不轮询、提示含跳转
