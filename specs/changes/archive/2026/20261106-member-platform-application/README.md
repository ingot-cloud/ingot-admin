# App 用户管理平台应用

> 状态：completed

现有 `member` 插件包含 App 用户、角色、权限三个页面。平台管理台缺少插件装配和 IAM 导航目录。此变更将三页接入同一个独立平台应用，并对齐现有管理台交互规范。

- 协作模式为一人全栈。需求来自用户对话，接口依据现有 Member 服务平台控制器及前端 API 模块。
- IAM 应用目录、增量升级及 Member 服务平台接口的在线授权需要与后端配套实施。后端配套为 ingot 的 `20261106-member-platform-application`。
- 2026-11-06 用户确认应用名称、三个菜单入口、授权与存量升级方案。

## 工件

- [需求与验收](./REQUIREMENTS.md)
- [现有接口契约](./API.md)
- [接入与页面设计](./DESIGN.md)
- [实施任务](./TASKS.md)

## 验证记录

- Member 插件 13 项单测通过，插件和平台宿主类型检查通过，平台生产构建通过。
- Chromium 通过 4 项模拟接口回归，覆盖三页深链及刷新、只读操作、图标、App 用户角色回显与清除、角色权限回显与清除。另以写权限验证两页操作列在 1440px 与 480px 视口内完整显示，权限页「更多」可打开。
- Chrome 通过权限详情的宽屏、窄屏查看态和窄屏编辑态对齐检查。2026-11-06 用户要求归档、提交并推送。

## 完成记录

- 完成日期为 2026-11-06。
- 实现提交为前端 `70fc3e03476288df8cf4fa26f2019e247bd7463d`、后端 `14638bd16c3cca9ba99a4aad3e805cf01972f57c`。
- 系统基线更新见 [平台能力与页面归属](../../../../current/base/platform-capabilities/README.md)。
- 联调修正了角色与权限页的操作列裁切和权限详情的重复内边距。
- [后端配套归档](../../../../../../ingot/specs/changes/archive/2026/20261106-member-platform-application/README.md)
- 目标库与真实平台会话证据交由 [目标环境发布验收](../../../../../../ingot/specs/changes/active/20261106-member-platform-release-acceptance/README.md) 跟踪。
