# 自动化验收证据

执行日期：2026-10-10。用户批准全栈实施；未提交、部署或执行目标业务库初始化。以下为实施阶段的自动化记录；当时状态为 validating，P5-B/P6 尚未完成。最终验收与归档结论见本文末尾。

## 后端

| 检查 | 结果 |
| --- | --- |
| commons 契约与公共模型测试 | 64 项通过 |
| ingot-access-control 测试 | 30 项通过 |
| IAM provider 全套测试 | 403 项；普通运行通过387项，16项环境门控测试单独启用后全部通过 |
| 隔离 MySQL / 实际 Spring MVC HTTP | 16 项通过，无跳过；覆盖启动注解清单、字段投影、角色范围来源和成员事务 |
| 隔离 MySQL DDL、完整初始化、种子与约束 | 40 项通过 |
| iam-ops | compileJava 通过 |
| 公共模型/业务 routes/OpenAPI/内部契约 | Java 导出后重新生成；135 paths、203 管理操作、5 内部操作，一致性检查通过 |
| 初始化生成一致性 | generate_database.py --check 通过 |

后端命令：`./gradlew :ingot-framework:ingot-commons:test :ingot-framework:ingot-access-control:test :ingot-service:ingot-iam:ingot-iam-provider:test :examples:iam-ops:compileJava`。全套 IAM 测试采用本机临时 init script 将 Test heap 设为2g、单 fork；默认测试 heap 在本机全套运行时不足，未更改仓库构建配置。

HTTP 门控使用 `IAM_MYSQL_HTTP_TEST=true ./gradlew :ingot-service:ingot-iam:ingot-iam-provider:test --tests '*RoleWorkspaceMySqlHttpTest'`。数据库检查使用 `python3 -m unittest discover -s databases/iam -p 'test_*.py'`，仅运行自动清理的隔离 mysql:8.4 容器，不连接业务库。

新增边界证据：别名、多 DTO、嵌套输出与单对象输入、隐藏 JSON 属性实际缺失、原对象不变、非文本/原始类型冲突启动拒绝、Unicode 脱敏、SELF FULL 来源不能扩大为另一角色的 ALL 查询、事务内撤权回滚、显式 null 只清空提交联系方式、来源绝对期限不会被派生决策延长、错误签名/用途/服务拒绝。1/20/100对象每批关系查询均为1次；投影与逐行匹配阶段无追加 SQL。

工具额外检查：契约7项、生成器4项、初始化来源4项通过；迁移工具16项、独立测试数据工具20项通过。`tools/iam` 整目录21项中19项通过，另2项既有 ServiceNamingTest 因 HEAD 与工作区均缺少 `.gitlab-ci.yml` 而 FileNotFoundError，属于缺失 CI 工件的验证限制，未新增 CI 配置或更改检查来掩盖问题。

## 前端

使用仓库要求的 Node22.17.0 / pnpm10.12.4。

| 检查 | 结果 |
| --- | --- |
| admin-common 单元测试 | 99 项通过 |
| platform-plugin 单元测试 | 162 项通过 |
| org-plugin 单元测试 | 34 项通过 |
| security-plugin 单元测试 | 24 项通过 |
| 四个相关包类型检查 | 全部通过 |
| 资源配置最后变更回归 | 17文件33项通过，platform 类型检查通过 |
| packages / themes 构建 | 通过 |
| 组织管理台 / 平台管理台 | 两者 type-check 和生产构建通过；最后的资源配置界面变更再次完成平台构建 |
| 分层依赖边界 | check:boundaries 通过 |

前端主命令：`pnpm --filter @ingot/admin-common --filter @ingot/platform-plugin --filter @ingot/org-plugin --filter @ingot/security-plugin exec vitest run`；对应四包 `type-check`；`pnpm build:packages`、`pnpm build:themes`、两管理台 `build`。

关键组件验证覆盖脱敏只读显示、MASKED 可编辑时空草稿、未触碰不提交、实际输入仅提交变更字段、对象不可更新时不提交、角色差量预览失败不保存、字段/操作定义与角色摘要新结构。前端自动生成文件中任务开始后出现的其他 auto-import 声明变化予以保留，未作为本任务功能修改。

## 实施阶段的人工验收与发布安排

### 资源字段配置体验验收修正（2026-10-10）

截图后续反馈：接入标签已通过共用 ResourceFieldBinding 统一替换为 InTag；后端接入行增加控件最小高度及垂直居中。platform-plugin 类型检查、两处限定 ESLint、既有 ResourceEditDrawer 7 项回归通过。真实页面显示名字段实测：标题/标签/说明的垂直中心均为 y=664.296875；没有提交资源配置。

- admin-common 完整回归：28 文件、123 项通过；platform-plugin 完整回归：65 文件、168 项通过，共 291 项。新用例覆盖五种脱敏、Unicode、短值/异常格式、自然编号与 API 区间转换、非法参数、切换预设清理参数；字段新增/取消/确认、深拷贝、重复键、未持久化键修改、统一提交/expectedVersion、搜索定位和迟到清单响应。
- `pnpm --filter @ingot/admin-common build`（含类型检查）、`pnpm --filter @ingot/platform-plugin type-check`、限定文件 ESLint、`pnpm check:boundaries` 均通过。
- 最终 `pnpm --filter @ingot/admin-platform-app build`（含类型检查）通过，日志 `/tmp/ingot-resource-field-ui-build.log`。仍出现既有 UnoCSS 扫描伪图标、重复 uno.css、浏览器 crypto externalized 及动态导入分包提示；无阻塞错误，本轮组件未新增图标名或依赖。
- 在用户已登录的 `platform.localhost:5799` 页面，核对平台治理 → 资源与操作 → 成员的摘要、7 个字段的接入标记、搜索、只读逻辑键、手机号预览及短值全遮盖、自定义区间显示第 2～3 个字符、时间字段禁用 MASKED。
- 长列表实测：字段列表 `scrollTop=869` 时，添加按钮仍位于视口 y=355～387，外层抽屉 `scrollTop=0`；列表独立滚动，工具区/保存页脚固定。标签、输入和说明使用统一起点；弹窗只有中间内容滚动。
- 页面测试未点击资源保存，新增/修改草稿均取消；未执行业务库写入、部署或提交。此处只覆盖本轮 UI 核对，不能替代下列完整发布验收。

P5-B 负责人 jy：使用真实平台/组织身份验证新字段配置、角色发布、MASKED 编辑、禁止筛选及撤权；部署 iam-ops 与 IAM 验证服务发现、专用清单密钥及 Redis 跨节点失效；窄屏、主题、错误态和生产近似数据的吞吐/延迟/SQL 计数。批次查询次数测试与本地隔离 HTTP 不能替代这些验收。

P6：同批发布 IAM、SDK 消费服务和前端，按环境备份后执行正式初始化/迁移安排；验收且上线后更新 current 并归档。此轮没有更新 current，也没有替其他 IAM active change 勾选未完成事项。

## 最终人工验收与归档

2026-10-10，负责人 jy 在本会话明确确认“我已经人工验收完成”，并要求归档后端字段控制 Spec、提交代码。依此确认完成本变更及对应前端变更的人工验收项，更新 current 并归档；未把原自动化结果改写成 Agent 执行的真实环境验收。

归档前重新核对：权威初始化、135条paths/203项管理操作及5项内部操作生成一致性通过；契约7项和初始化来源4项测试通过；既有后端测试报告无失败。两端 git diff --check 通过。代码未在归档阶段改动，原前后端测试、构建、迁移和浏览器证据继续保留。

关联提交在 README 记录。本次未执行目标数据库迁移、生产部署或远端推送；旧 IAM active 及独立标签 change 的未完成项仍各自维护。
