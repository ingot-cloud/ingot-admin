# 验证证据

## 自动化

- Node 22.17.0 / pnpm 10.12.4，使用仓库要求的运行环境。
- admin-core 全量：111 个文件、440 项测试通过；最终兼容别名调整后，标签/业务状态/主题默认值/变量循环/视觉契约定向 36 项再次通过。
- admin-common 全量：28 个文件、123 项测试通过。
- admin-core 类型检查及完整构建通过；admin-common 强制重新生成声明通过；dev-portal 类型检查通过。
- 本次 Vue/TypeScript 文件限定 ESLint、git diff --check 通过。
- 基线中 permission-panel-bg 缺少主题注册导致默认主题测试失败，本次补齐；CSS 既有权限面板背景值未改变。
- 共享包声明重新生成后，auth/member/org/platform/security 五个插件类型检查全部通过。

## 浏览器

- 使用仓库独立标签演示服务 `127.0.0.1:5802/#in-tag` 检查五类型、light/plain/dark、20/24/32px 尺寸及 round。
- 浅色默认：24px / 4px 圆角 / 14px 字号 / 500 字重；light 无可见边框，plain 类型色描边，dark 白字实色背景。
- 普通 info 为中性色；状态正常为蓝色成功图标，暂停与锁定保留原图标。深色普通/状态标签均跟随相同语义颜色，旧状态 Token 别名未产生循环或失效。
- 点击已选标签后计数为 1；关闭后标签消失、计数仍为 1；恢复按钮可重新显示标签。
- 最终构建后，真实平台应用成员资源的显示名字段编辑弹窗：后端接入标题、标签、说明垂直中心均为 y=664.296875；接入标签为统一 success、小尺寸 20px、12px 字号、500 字重。
- 验证结束关闭弹窗并恢复原组织应用目录页，没有保存业务配置。

## 截图

- [浅色标签示例](/private/tmp/ingot-unified-tags/light.jpg)
- [深色标签示例](/private/tmp/ingot-unified-tags/dark.jpg)
- [实际字段编辑弹窗](/private/tmp/ingot-unified-tags/field-dialog.jpg)

截图是本机临时证据，不作为系统基线。2026-10-10 根据用户提交要求，相关代码已提交为 `9a1262e`；本独立 change 的用户验收与 current 更新尚未执行，保持 validating。
