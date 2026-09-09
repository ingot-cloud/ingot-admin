# 任务：主题 workspace 分类

## 准备

- [x] 用户确认本 change（包含四类目录的架构修订与脚手架不在本期范围），将 README 改为 approved；开工时改为 implementing。
- [x] 阅读 REQUIREMENTS.md、DESIGN.md、宪章与 in-coding-standards；本 change 无后端接口，不需要 API.md。

## 实现

- [x] 增加 themes workspace 匹配与 themes/README.md，记录包命名、最小结构、公开导出和未来脚手架输出位置。
- [x] 增加主题 build/type-check/test/clean 命令，接入根 build、build:admin、check、type-check、test:unit；验证空目录行为。
- [x] 确保 lint 覆盖主题源码、文档检查覆盖 themes；采用主题包内 TypeScript 配置，保留独立 examples 检查。
- [x] 动态发现主题及其它工作区包，扩展边界检查与导入识别；保留已有插件规则。
- [x] 增加临时仓库边界正反例测试，并接入根测试流程。
- [x] 增加隔离临时 workspace 的主题构建及消费验证，覆盖产物、peer external、未选主题不进入模块图；接入根 check。

## 验证

- [x] 执行新增测试，确认空目录、多个新增主题、合法依赖和各类非法引用均符合 REQUIREMENTS。
- [x] 执行 `pnpm build:admin`、`pnpm check:examples`、`pnpm check`，记录结果及环境限制。
- [x] 确认 admin 仍使用 defaultAdminTheme，未新增主题切换 UI，现有主题回归测试通过。
- [x] 状态改为 validating，按 REQUIREMENTS 完成验收；若偏离设计，先更新规格并确认。

## 收尾

- [x] 验收通过后在 packages/admin-theme current 中补充主题安装来源与目录约定，保留现有页面行为。
- [x] 更新 current README 变更记录，链接本次归档 DESIGN.md（无 API.md）。
- [x] README 记录完成与验证结果，状态改为 completed，将 change 移至 archive/2026。
- [x] 按已批准修订更新宪章，同步 AGENTS.md、开发模式、主题开发、根 README、示例和 coding skill 的目录规则，并再次运行文档检查；以上收尾在同一交付中完成。
