# 验证记录

2026-11-07：定位到pinned抽屉的InLoading自动最小高度。真实InWizard与租户GrantPicker浏览器夹具中，1440×900窗口展开长树后，原加载容器由729px撑到906px，父容器固定729px并裁剪；树列表clientHeight和scrollHeight同为756px，所以列表自身没有可滚动溢出。修复在InWizard现有加载容器规则补min-height:0，普通抽屉默认行为不变。

## 浏览器验证

使用本机Chrome、真实InWizard/InLoading/InTree以及租户/平台GrantPicker组件，模拟12个资源各9条操作的目录。目录API为模拟数据，无真实账号、数据库或写入请求。创建/编辑两种向导步骤配置，分别在1440×900、1440×600、390×844下验证，共12组通过（/tmp/iam-scroll-browser.log，结构化结果见browser-results.json）。

- 桌面中间列表clientHeight分别579px、279px，展开后scrollHeight为756px，滚轮可滚到最后资源及其最后一条权限。
- 勾选末条权限后已选计数更新；右侧移除后计数与树选择同步。中间滚动不带动左列。
- 窄屏重排单栏，由columns滚动区承接滚动；可滚到已选内容。
- 所有场景头脚保持可见，外层body未被长树撑开，window.scrollY保持0。浏览器无pageerror。
- 截图已检查：/tmp/iam-scroll-tenant-create-1440x900.png、/tmp/iam-scroll-tenant-create-390x844.png。验证针对布局与选择交互，不代替真实角色预览/保存接口验收。

## 工程验证

使用本机已有Node22.17.0/pnpm10.12.4：

- admin-core/org-plugin/platform-plugin类型检查通过（/tmp/iam-scroll-types.log）。
- org-plugin 94项、platform-plugin 153项单测通过（/tmp/iam-scroll-plugin-tests.log）。
- InLoading、InDialog、InDrawer、InDetailDrawer定向测试共18项通过（/tmp/iam-scroll-core-tests.log）。
- admin-core重新构建通过，确认dist/style.css包含该向导min-height:0覆盖（/tmp/iam-scroll-core-build.log）。
- 仓库分层检查和git diff --check通过；生成声明文件与本轮操作前完全一致，已有用户改动未覆盖。

用户实际租户环境复测仍待反馈；不提前归档，不更新current。后端IAM历史清理的验收状态不由此自动完成。
