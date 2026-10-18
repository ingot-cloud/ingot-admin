# 实施与验收记录

日期：2026-10-14。状态：validating，等待用户产品验收。已实施两个获批准的change，未提交代码、未更新current、未发布或访问实际业务库。

## 交付结果

- 组织角色使用共享/私有两类：共享由平台维护，组织只读；私有直接创建和维护完整权限。租户角色、分配及委派不再选择版本、发布、升级或定制共享。
- 当前权限编辑、预览保存、成员/组分配、本人委派来源与资源上限由admin-common独立组件承载；使用服务器分页候选和名称回显，范围不足只提示受影响资源。技术锁仅用于409并发处理。
- 组织设置和成员详情展示服务器确认的拥有者，转交资格取真实身份。拥有者不作为可分配角色。
- 保存后刷新当前会话；租户与平台都不按 expiresAt 轮询，隐藏不拉 capabilities、恢复可见且已过期才核对，503 标不可用但不自动重试、切身份清理且拒绝迟到响应。
- 平台共享角色接入当前保存；平台自有角色固定版本、字段权限、批量任务及平台刷新路径保留原有实现。

## 自动化、类型与构建

| 范围 | 结果 | 证据 |
|---|---|---|
| admin-common | 139通过 | [domain-tests.log](./evidence/domain-tests.log)；新增共享只读、409保留草稿、迟到响应、稳定参数清理、委派来源切换/roleId提交 |
| org插件 | 35通过 | 同上 |
| platform插件 | 179通过 | 同上；原平台版本/字段/任务定向测试 |
| admin-core | 466通过、1既有失败 | [core-summary.txt](./evidence/core-summary.txt) |
| auth store定向 | 待重跑 | 拥有者、两端均不轮询、过期后可见核对、503 不自动重试、切身份 |
| org/platform类型检查 | 通过 | [types.log](./evidence/types.log) |
| 改动文件ESLint / 分层边界 | 通过，0错误/0警告 | [lint.log](./evidence/lint.log)、[boundaries.log](./evidence/boundaries.log) |
| admin-core/admin-common构建 | 通过 | [packages-build.log](./evidence/packages-build.log) |
| admin/admin-platform构建 | 通过 | [apps-build.log](./evidence/apps-build.log)；保留原有构建警告 |

核心库唯一失败为 `src/components/__fixtures__/visual-contract.test.ts:379`，期待InAppBar中不存在的margin；该Vue源文件与HEAD内容摘要一致。本次未更改该视觉文件，也未为消除断言调整既有平台样式。

## 真实接口与浏览器

[后端完整报告](../../../../../ingot/specs/changes/active/20261014-iam-tenant-live-authorization/VALIDATION.md) 提供两个Tomcat节点、隔离MySQL、消费SDK、故障及性能证据；角色保存、分配、委派、能力刷新和内部授权均使用生产控制器与服务。

`scripts/verify-tenant-live-browser.mjs` 加载正式构建组件与样式，通过真实接口完成平台共享创建/当前权限预览保存、租户共享只读、拥有者标识、两组织普通成员下一请求撤权。目录适配器和根页面是测试夹具；不冒充完整产品浏览器验收。截图见 [browser-owner.png](./evidence/browser-owner.png)。

后端实际HTTP覆盖仅委派管理员无需全量读取权限的候选与分配、范围收缩、新资源关闭、撤销、共享伪造写拒绝、旧字段400/旧路由410、消费字段FULL/脱敏及平台上限、基础设施503。前端组件覆盖源切换清理和409/迟到响应；这些证据与浏览器证据分别记录。

## 接口来源与迁移回滚

[SOURCES](./SOURCES.md) 中API与后端迁移原文逐字节一致，Java/OpenAPI/schema/routes同步。021/022升级结构、只读预检与显式冲突处置、正逆幂等、来源变化阻断、P09完整备份恢复、P10保留新角色/分配/委派/拥有者转交均已在隔离MySQL验证。前端制品切换/回滚顺序见 [MIGRATION](./MIGRATION.md)；实际部署须保留新旧后端/SDK/双管理台制品，不能只退前端。

## 用户验收重点

1. 组织设置：创建时指定拥有者；开通应用/新增操作后无需分配即有权限；转交后旧拥有者只保留普通角色，新拥有者立即取得动态权限。检查完整字段、只读字段及平台强制上限。
2. 组织授权：共享只读；直接创建私有并保存权限；成员/组分配无版本；缺范围提示后用普通编辑补齐。两个组织在线观察共享增删权与可见页自动刷新。
3. 委派：按资源设上限；仅委派管理员完成候选/分配；同资源新操作跟随，新资源待补齐；自授权/借用/超期限/再委派拒绝，撤销后入口和派生权限失效。
4. 平台：共享当前权限保存；自有角色历史、字段及批量任务正常；平台成员、委派、会话及Member行为保持。核对宽窄工作区、空/停用/错误状态。

上述完整产品人工路径尚未逐项执行，F10–F12及U矩阵保留待确认，不将关键组件夹具当作全部人工通过。实际来源预检、维护窗口和旧制品联合恢复确认由发布负责人执行。

## 复跑

使用仓库要求的Node22.17/pnpm10.12.4；先构建公共包，避免项目引用声明未生成引起TS6305。

```sh
pnpm --filter @ingot/admin-core --filter @ingot/admin-common build
pnpm --filter @ingot/admin-common --filter @ingot/org-plugin --filter @ingot/platform-plugin test
pnpm --filter @ingot/admin-core test
pnpm --filter @ingot/org-plugin --filter @ingot/platform-plugin type-check
pnpm --filter @ingot/admin-app --filter @ingot/admin-platform-app build
```

真实浏览器由后端 `TenantLiveMySqlHttpTest` 在隔离HTTP存活时启动；运行入口和环境说明见后端VALIDATION。不能独立向实际数据库或服务执行测试夹具。

## 未上线测试的数据库入口

021已执行且022失败时，可直接运行后端 `databases/iam/dev/prepare_tenant_live_test.sql`，无须另走数据保留迁移步骤。脚本自动准备当前角色并安装022，平台事实和共享最新范围保留，旧租户授权停用；旧私有角色当前权限为空，使用新页面配置。隔离MySQL3项验收通过；执行步骤见 [后端开发准备](../../../../../ingot/specs/changes/active/20261014-iam-tenant-live-authorization/DEV-TEST-PREPARATION.md)。
