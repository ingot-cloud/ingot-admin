# 输入来源与对接边界

同步校准日期：2026-10-06。后端来源：同级 ingot/specs/changes/active/20260912-iam-identity-access-management。两端主状态implementing；后端B01–B05已落地，前端部分增量已有代码，完整验收未结束。本轮平台角色分配与委派增量已经实施，证据见 AUTHORIZATION-REFINEMENT-STATUS；真实 HTTP/浏览器验收仍未完成。历史来源保留。

后端API为权威，contracts 与 sources 中标注的后端原文按哈希同步；本地 API/INTERACTIONS 同时含前端增量说明。旧来源清单保留于 [历史记录](./sources/history/SOURCES-20260914.md)，其中旧数字与缺口仅为历史。当前管理面132路径/200操作，包含账号/本人/字典/发号/社交、目录辅助、两域授权候选、上下文/详情/预览与导出状态；完整schemas/examples随目录同步。BFF-LOGIN单列登录契约，B06及四站真实验收未完成；不能据契约文件或B01–B05勾选推断产品已验收。

## 阅读顺序

README → REQUIREMENTS → DESIGN → BFF-LOGIN → API/INTERACTIONS → IMPLEMENTATION-STATUS → IAM-INTEGRATION → ACCEPTANCE/TASKS → sources/BACKEND_TEST_DATA。源文件相对链接原样保留；遇到后端专属相对路径按下表映射，不能误认为前端缺少实现。

## 原文副本 SHA-256

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `API.md` | [sources/BACKEND_API.md](./sources/BACKEND_API.md) | `2938c9fc02587af782c649ab396e3402bc1e4899c456704c7d60ff0a61208db6` |
| `FRONTEND.md` | [sources/BACKEND_FRONTEND.md](./sources/BACKEND_FRONTEND.md) | `0f47f7dc7e30f32526ebf38d76114f38b39d99e6c3bc2563f566cf1f4c2ed4ec` |
| `BFF-LOGIN.md` | [BFF-LOGIN.md](./BFF-LOGIN.md) | `bfae7f4e66100a3e32da56933b82bb6a2244a355698a6c377ca7b75aefec172f` |
| `REQUIREMENTS.md` | [sources/BACKEND_REQUIREMENTS.md](./sources/BACKEND_REQUIREMENTS.md) | `8255cf51362b14fcd9d987d425350a373f9c272e944890df83a1bf4b76513dcd` |
| `DESIGN.md` | [sources/BACKEND_DESIGN.md](./sources/BACKEND_DESIGN.md) | `05c0468ce867f8aa96d1573c5fe909175c22fa857c1aa52d8f2c4a47a2806d91` |
| `MIGRATION.md` | [sources/BACKEND_MIGRATION.md](./sources/BACKEND_MIGRATION.md) | `a72a6afc456c605f42d4d2b148d5a28a43234fc707f2724755d65ecdbc388c6c` |
| `ACCEPTANCE.md` | [sources/BACKEND_ACCEPTANCE.md](./sources/BACKEND_ACCEPTANCE.md) | `71bc2185c1836d044a6c1cabffd730dfb9129c28540014309f5defc990803521` |
| `endpoint-mapping.json` | [sources/endpoint-mapping.json](./sources/endpoint-mapping.json) | `6eff4056434a6f307b62bccf4dd2170c013d089943dd7c8461b8da89846a16ec` |
| `contracts/README.md` | [sources/contracts/README.md](./sources/contracts/README.md) | `61b2e5b8a4067eeb7d242fd0d5ce5dd50c029df486ed3aa431bb3a2a2dfdffe0` |
| `contracts/examples/assignment.json` | [sources/contracts/examples/assignment.json](./sources/contracts/examples/assignment.json) | `0534cb7b5dc00abfa9d9c2bedc978860c7c31e84f2cdf6bde0cbc6470b6c57fa` |
| `contracts/examples/audit.json` | [sources/contracts/examples/audit.json](./sources/contracts/examples/audit.json) | `b12020ba0d27febc71e4a4b64fead0f1a92feb1deae6cb27d0d1f29ad09ad3f1` |
| `contracts/examples/bootstrap.json` | [sources/contracts/examples/bootstrap.json](./sources/contracts/examples/bootstrap.json) | `0cbd924febdbff6dab1f857c241c9593906d6a0dcd9d9ccf9c60f6185aaf6ad4` |
| `contracts/examples/decision-restricted.json` | [sources/contracts/examples/decision-restricted.json](./sources/contracts/examples/decision-restricted.json) | `0b33df4ccb9c3adad9434d2a4cc4f0b4e93ebe36e9b83610b6429a8607867ce9` |
| `contracts/examples/delegation.json` | [sources/contracts/examples/delegation.json](./sources/contracts/examples/delegation.json) | `f1ff9fd992b75c3525226095802b847d87b64226ed2a5cf8120aaa52392b21ae` |
| `contracts/examples/directory-policy.json` | [sources/contracts/examples/directory-policy.json](./sources/contracts/examples/directory-policy.json) | `7cbf037239d1f2e5e1de2805e4effec9150e4e6dcd188644bfbb8b97653bd90c` |
| `contracts/examples/field-policy.json` | [sources/contracts/examples/field-policy.json](./sources/contracts/examples/field-policy.json) | `34741450de8a829ef69acff2b368cca63f2fe738304c14cb9e39711097c019f4` |
| `contracts/examples/field-readonly.json` | [sources/contracts/examples/field-readonly.json](./sources/contracts/examples/field-readonly.json) | `5a1d863e3a989311bec29d36f52e2b4960421844b4e635aab010125bddacf042` |
| `contracts/examples/member-detail.json` | [sources/contracts/examples/member-detail.json](./sources/contracts/examples/member-detail.json) | `4d834165ab6fc03bd8d51648c58ae9768b5fe39ccd61a298aaebbac7b0a02685` |
| `contracts/examples/member-page.json` | [sources/contracts/examples/member-page.json](./sources/contracts/examples/member-page.json) | `6df8ae4f9aa0e49588d6b46b4022f96a7b593f42dae47e81bc92a961265cdf49` |
| `contracts/examples/policy-preview.json` | [sources/contracts/examples/policy-preview.json](./sources/contracts/examples/policy-preview.json) | `95ef6260bc1984d2f3a6aedeb0355fde34cd25f75fcdd8ad8190d8d5c8bb437c` |
| `contracts/examples/preview-invalid.json` | [sources/contracts/examples/preview-invalid.json](./sources/contracts/examples/preview-invalid.json) | `594ce7180a49ab5d478d90ee758e1e40512a166f8ae6e46285c338565cb86d53` |
| `contracts/examples/role-create.json` | [sources/contracts/examples/role-create.json](./sources/contracts/examples/role-create.json) | `e407fa60b63de59abfc98db91af42a9d23df1903a5340d1361630da4cba3c43d` |
| `contracts/examples/role-delta.json` | [sources/contracts/examples/role-delta.json](./sources/contracts/examples/role-delta.json) | `af2f8b4456a4075cd77addebf33db78cdefb38edf633777b6eac5136e9fc7fcf` |
| `contracts/examples/role-publish.json` | [sources/contracts/examples/role-publish.json](./sources/contracts/examples/role-publish.json) | `161f3c178e679952c5f21a320b30f02eb8ba5b432835b686bf8ac7881abfbdae` |
| `contracts/examples/role-shared.json` | [sources/contracts/examples/role-shared.json](./sources/contracts/examples/role-shared.json) | `a6c0f4f037d83d87245fad242f27cf3b69d7fe78beebd60d6058c87cb6326dba` |
| `contracts/examples/role-upgrade.json` | [sources/contracts/examples/role-upgrade.json](./sources/contracts/examples/role-upgrade.json) | `6bbf746c86a3a96e83ea64108c5ee07070723b1f6aa347c4308ca9ab8876844b` |
| `contracts/examples/tenant-create.json` | [sources/contracts/examples/tenant-create.json](./sources/contracts/examples/tenant-create.json) | `bce0ddc96c0131ce8e4beb620a23bb88766456d5796c957651e7217ead46f133` |
| `contracts/examples/upgrade-conflict.json` | [sources/contracts/examples/upgrade-conflict.json](./sources/contracts/examples/upgrade-conflict.json) | `d9a8bb044a0a4ec7f3228dbe253accfd971bfbff5006def695b868fb71751e70` |
| `contracts/openapi.json` | [sources/contracts/openapi.json](./sources/contracts/openapi.json) | `6b920ac17807c9b5782f2cba02fde41c2f225b04750df18eb5040c9482e9037c` |
| `contracts/routes.json` | [sources/contracts/routes.json](./sources/contracts/routes.json) | `4c930b07d33d62a891498feafe0ce7e9109a8a99405bd4317d4bfe259dc4a49e` |
| `contracts/schemas.json` | [sources/contracts/schemas.json](./sources/contracts/schemas.json) | `fd4e6bda498a00b4da0a3a6f0221bc58c126cb74eb93ffb5cc86d869f4c925e6` |

## 2026-09-19 新增权威副本

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `TEST-DATA.md` | [sources/BACKEND_TEST_DATA.md](./sources/BACKEND_TEST_DATA.md) | `12be40894bbb7705fbe698c1dc8d036286ffdbb0db638431d3c967d71a8e76a1` |
| `VERIFICATION-GUIDE.md` | [sources/BACKEND_VERIFICATION_GUIDE.md](./sources/BACKEND_VERIFICATION_GUIDE.md) | `8e20f6f5fe67307317753bf5a26eeb0a020997d5eb76c60fbc79c06fa42d4731` |

INTERACTIONS仍是后端FRONTEND的字节副本；前端进展、API消费核对与U任务是本仓库维护的实施工件。后端专属相对链接按上表源文件归属解析；例如INTERACTIONS中的TEST-DATA在前端读取sources/BACKEND_TEST_DATA.md，联调步骤读 BACKEND_VERIFICATION_GUIDE.md。BFF-LOGIN 前端副本保留跨仓库路径措辞，与后端原文不完全逐字节相同，不以本次未改契约内容为由覆盖。本轮 API/OpenAPI/schema/JSON 示例已按平台分配增量更新；BFF-LOGIN 原有措辞例外保持不变。

编号：前端补充验收为 P24–P26；后端 A24–A26 与测试数据 D01–D05、DESIGN D01 的区分见 BACKEND_TEST_DATA / BACKEND_ACCEPTANCE。

## 对接边界

- 平台分配/委派/诊断使用各自专用分页 candidates，按当前身份和依据过滤；其他选择器继续遵守已发布列表及 purpose 白名单。平台选择不展示租户部门。
- 审计导出未发布路径时不提供可操作按钮；成员导出已发布状态接口，必须完整轮询并下载重验。
- 不整体保留旧PMS辅助调用；依据endpoint-mapping逐项核对账号/本人/字典/发号/社交、安全/OSS和Member归属。
- RJson包装中的领域类型及实际HTTP仍须核对；不使用any、假路径或假成功填补缺口。
- 菜单种子/viewPath、BFF新接口、四站点配置与全部权限行为必须真实联调。implemented只表示控制器接入。
- 历史MIGRATION副本只用于保留处置记录；本轮按全新系统启用；已登记测试库只补幂等 SQL010 审计索引，不重复执行 SQL009 的旧库 plan_id 升级。

## 2026-09-28 增量权威来源

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `AUTHORIZATION-REFINEMENT.md` | [sources/BACKEND_AUTHORIZATION_REFINEMENT.md](./sources/BACKEND_AUTHORIZATION_REFINEMENT.md) | `f71d5846863e674fdd09679c9642134d21862c5ee059d13735502ba4e9557c58` |
| `AUTHORIZATION-REFINEMENT-STATUS.md` | [sources/BACKEND_AUTHORIZATION_REFINEMENT_STATUS.md](./sources/BACKEND_AUTHORIZATION_REFINEMENT_STATUS.md) | `9ba413fe167207ed163626f973ac8d50a07e86728a9f2f4ccf25d3e7697bf4c4` |
| `contracts/examples/assignment-context.json` | [sources/contracts/examples/assignment-context.json](./sources/contracts/examples/assignment-context.json) | `f3f8a4690aa00488056b33036b1c7fdaff3a90e93e4ab24de4c1459d40173e24` |
| `contracts/examples/assignment-record.json` | [sources/contracts/examples/assignment-record.json](./sources/contracts/examples/assignment-record.json) | `ceb58e46f3e4bb487961a8241100cc4d92cf21064ced0c8a5653ea3dadf86899` |
| `contracts/examples/authorization-candidates.json` | [sources/contracts/examples/authorization-candidates.json](./sources/contracts/examples/authorization-candidates.json) | `c58b40eefc464fe561a65c00789257dc0d338960172a08854fbb25e1ed6cffc8` |

上表 SHA 为后端权威原文及同步副本；BFF-LOGIN 保留此前说明的跨仓库措辞例外。前端自有 AUTHORIZATION-REFINEMENT-STATUS 增补命令执行目录说明，权威逐字节证据副本为 sources/BACKEND_AUTHORIZATION_REFINEMENT_STATUS.md。


## 2026-09-29 角色单选树来源

API/FRONTEND、后端增量、模型/路由/OpenAPI 和两份轻量树夹具已同步。新 schema 本轮人工按 Java 契约补充，未执行 Java 契约导出或自动化；历史验证不覆盖本轮，待用户手动验收。

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `ROLE-PICKER-REFINEMENT.md` | [sources/BACKEND_ROLE_PICKER_REFINEMENT.md](./sources/BACKEND_ROLE_PICKER_REFINEMENT.md) | `32a59841cc3a01aabaed5e6453afb77e81e76fd62a5ed8159298e0471fb26241` |
| `contracts/examples/authorization-role-candidates.json` | [sources/contracts/examples/authorization-role-candidates.json](./sources/contracts/examples/authorization-role-candidates.json) | `3002bf2b20aa23025e322a0caa0c46688d6c85312b0f448246f33252ffb01421` |
| `contracts/examples/authorization-role-versions.json` | [sources/contracts/examples/authorization-role-versions.json](./sources/contracts/examples/authorization-role-versions.json) | `d43205669c3e8b440249b1779a9db822e756dca02e56d72ebcbe13a5ff5f1802` |

## 2026-10-03 权威来源

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `API.md` | [sources/BACKEND_API.md](./sources/BACKEND_API.md) | `a5c3f2e2a9add99ed9b656cd7f67792e98232d3f6cc17fbdba011e9835639a9c` |
| `FRONTEND.md` | [sources/BACKEND_FRONTEND.md](./sources/BACKEND_FRONTEND.md) | `3722b0c823cbc26d9590b8af68d114dccc7fc1b9e82fa954927aef99cdadd3a4` |
| `ROLE-WORKSPACE-DELEGATION-REFINEMENT.md` | [sources/BACKEND_ROLE_WORKSPACE_DELEGATION_REFINEMENT.md](./sources/BACKEND_ROLE_WORKSPACE_DELEGATION_REFINEMENT.md) | `c262615bcf8f67ea1b670fa9fed280bddc3d86f8a30b91e85e8c337491dda201` |
| `contracts/examples/delegation-unlimited.json` | [sources/contracts/examples/delegation-unlimited.json](./sources/contracts/examples/delegation-unlimited.json) | `b70d04b8138fae40556a8f2d0505b60b451b6839ad4f7ab044d5456ad2b24e14` |
| `contracts/examples/role-subject-page.json` | [sources/contracts/examples/role-subject-page.json](./sources/contracts/examples/role-subject-page.json) | `3c16da306274394837943e410d9d7b24f268b990a1a98a7ac2b75e80cc2091ba` |

## 2026-10-03 平台分配状态筛选权威来源

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `API.md` | [sources/BACKEND_API.md](./sources/BACKEND_API.md) | `a5c3f2e2a9add99ed9b656cd7f67792e98232d3f6cc17fbdba011e9835639a9c` |
| `contracts/routes.json` | [sources/contracts/routes.json](./sources/contracts/routes.json) | `0f6450c2fad8bc88ea966b24ad29e20236165243985a5e9c1ea5e75f3636d6cf` |
| `contracts/openapi.json` | [sources/contracts/openapi.json](./sources/contracts/openapi.json) | `76dfab51cb06e935270d71d8e2080e3f1cc4b9031fb34928d645f1a3d18083e1` |

仅新增平台分配列表的可选计算状态条件，模型及租户查询契约不变；以上为本轮最新来源校验值，人工验收待完成。

## 2026-10-04 平台授权列表默认排序权威来源

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `API.md` | [sources/BACKEND_API.md](./sources/BACKEND_API.md) | `a5c3f2e2a9add99ed9b656cd7f67792e98232d3f6cc17fbdba011e9835639a9c` |

两个平台授权主列表默认按 ID 倒序；请求/响应结构及 OpenAPI 副本不变，沿用上一节契约校验值。人工验收单列。


## 2026-10-05 平台多角色分配权威来源

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `API.md` | [sources/BACKEND_API.md](./sources/BACKEND_API.md) | `a5c3f2e2a9add99ed9b656cd7f67792e98232d3f6cc17fbdba011e9835639a9c` |
| `ASSIGNMENT-MULTI-ROLE-REFINEMENT.md` | [sources/BACKEND_ASSIGNMENT_MULTI_ROLE_REFINEMENT.md](./sources/BACKEND_ASSIGNMENT_MULTI_ROLE_REFINEMENT.md) | `6de9523a10e6447e4b01c51f98a10204891b029d9cb84dc78ec05c15c7a2d358` |
| `contracts/README.md` | [sources/contracts/README.md](./sources/contracts/README.md) | `183e5d1d136df7292b24cf1ccddaf1cca577ba55514fc16da52cf6cc51cf52a4` |
| `contracts/routes.json` | [sources/contracts/routes.json](./sources/contracts/routes.json) | `9472c8980e87ffce826a00ef1a8b67c95c75eb154495e2d70e3cba67f47cc994` |
| `contracts/openapi.json` | [sources/contracts/openapi.json](./sources/contracts/openapi.json) | `aa0b875bbbfc51f597fd703ac8b3f59320ed781215e62d2955581e8da8e62c1f` |
| `contracts/schemas.json` | [sources/contracts/schemas.json](./sources/contracts/schemas.json) | `564289c4bacff5a5987bd036a6b87fac43a10cd792890bf994abea685f2bdb95` |
| `contracts/examples/assignment-multi-role.json` | [sources/contracts/examples/assignment-multi-role.json](./sources/contracts/examples/assignment-multi-role.json) | `4d179982f861974708d6fbe0c34c0b8a522926223bc005636d06d490abe18f0a` |
| `contracts/examples/assignment-selected-candidates.json` | [sources/contracts/examples/assignment-selected-candidates.json](./sources/contracts/examples/assignment-selected-candidates.json) | `cc18ba779fd71bdb03500ea7ca0b6c1734f5247415115da3c7adb57c138a649c` |

以上覆盖相应历史校验值，Java 公共类型已重新导出，接口生成源与前端副本保持一致；当前 124 路径 / 191 操作。开发及定向自动化完成，人工验收 MA05 待执行。

本日范围流程追加已同步上述 API/增量副本与 SHA-256。29 项前端定向测试和两管理台构建通过；新增 SF04 人工验收仍待执行，公共 JSON 契约沿用原快照。


## 2026-10-05 平台对象资源识别权威来源

后端元数据与适配路径已收紧，52项定向回归通过；公开接口结构及前端代码不变，人工验收独立保留。以下原文与后端逐字节同步。

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `API.md` | [sources/BACKEND_API.md](./sources/BACKEND_API.md) | `a5c3f2e2a9add99ed9b656cd7f67792e98232d3f6cc17fbdba011e9835639a9c` |
| `DESIGN.md` | [sources/BACKEND_DESIGN.md](./sources/BACKEND_DESIGN.md) | `db16dc98a59328bff53454ba718556bc695d8489121f376afaa02a30168b5cbe` |
| `REQUIREMENTS.md` | [sources/BACKEND_REQUIREMENTS.md](./sources/BACKEND_REQUIREMENTS.md) | `d353187983f9cb902e9e48851dc5f11ee58352e147bc3af5a7596fc4302b316a` |
| `PLATFORM-OBJECT-RESOLUTION-REFINEMENT.md` | [sources/BACKEND_PLATFORM_OBJECT_RESOLUTION_REFINEMENT.md](./sources/BACKEND_PLATFORM_OBJECT_RESOLUTION_REFINEMENT.md) | `b0db713763a38d76757d8afb24261b6a675cafaa083d642b3666ff6151d8e374` |


## 2026-10-05 通用资源、平台字段与分配升级权威来源

以下为本增量最新校验值，覆盖相同文件的历史快照；公开133路径/201操作，内部2操作另列。开发验证完成，部署及人工验收单列，不代表当前线上基线。

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `API.md` | [sources/BACKEND_API.md](./sources/BACKEND_API.md) | `0f34332538cb09317d0b9ef88682db2581d680a4c9b3a009a8b8dbadfe5b18bc` |
| `DESIGN.md` | [sources/BACKEND_DESIGN.md](./sources/BACKEND_DESIGN.md) | `56f3e7422de8ad696cd166c31140f12c639a8959a34c3354cc07b105489d6355` |
| `REQUIREMENTS.md` | [sources/BACKEND_REQUIREMENTS.md](./sources/BACKEND_REQUIREMENTS.md) | `489516717db9405c002f85736ec9379a5806abe1056a5f9cf2cabcd8eee6d9bb` |
| `RESOURCE-EXTENSION-REFINEMENT.md` | [sources/BACKEND_RESOURCE_EXTENSION_REFINEMENT.md](./sources/BACKEND_RESOURCE_EXTENSION_REFINEMENT.md) | `534d0bbc5d348995162784d5a45086f690bb8dea3fc549fac40c7d0c0dd2c508` |
| `RESOURCE-EXTENSION-VERIFICATION.md` | [sources/BACKEND_RESOURCE_EXTENSION_VERIFICATION.md](./sources/BACKEND_RESOURCE_EXTENSION_VERIFICATION.md) | `08d5e50518699a97a532feacae2ac9c50cacc12ce41a88bcd812bcc96ab33360` |
| `contracts/README.md` | [sources/contracts/README.md](./sources/contracts/README.md) | `ea8a62b58f498deed0e0434f1237827d60d74f397dd6a4809698ad4444f1a10f` |
| `contracts/routes.json` | [sources/contracts/routes.json](./sources/contracts/routes.json) | `b4e0816cd8f2a20d3ab5fc246629933f1c25191c2717a97229107297a96ab80b` |
| `contracts/openapi.json` | [sources/contracts/openapi.json](./sources/contracts/openapi.json) | `abe379fcf57f66e45a2eaf9d3995f4a489fc9efde2608af1bea9f5438dba99db` |
| `contracts/schemas.json` | [sources/contracts/schemas.json](./sources/contracts/schemas.json) | `5f245e6b10d281715657ec208d616e54430e40ebc4df6fde1f0f90e2ad36b848` |
| `contracts/internal-openapi.json` | [sources/contracts/internal-openapi.json](./sources/contracts/internal-openapi.json) | `e7dca99bdf2615c176ceabcea9433f73755d6977a2a4330d9cd7c3d4bbddecc0` |
| `contracts/examples/assignment-upgrade.json` | [sources/contracts/examples/assignment-upgrade.json](./sources/contracts/examples/assignment-upgrade.json) | `692ded7fdad3fd63b6fb22c80e58e4f806ba47d2a0e2572ad7b5185076dfff35` |
| `contracts/examples/authorization-v2-request.json` | [sources/contracts/examples/authorization-v2-request.json](./sources/contracts/examples/authorization-v2-request.json) | `167abd84380f4a801ad942b36ec762577b52a61636e3b896cdea8746f1296af1` |

## 2026-10-05 IAM 初始化脚本整理来源

以下为SQL整理后的最新副本校验值，覆盖相同文件历史SHA。新建库改用后端生成的 databases/ingot_iam.sql；001–006为权威来源，已有库补丁迁入migrations，真实环境导入未执行。仅同步说明及来源路径，本轮前端业务契约和页面行为不变。

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `DESIGN.md` | [sources/BACKEND_DESIGN.md](./sources/BACKEND_DESIGN.md) | `b7c32b72972a5f85daa49660086e0fba826a08a2b2c12bbcd5d52b0db59acade` |
| `REQUIREMENTS.md` | [sources/BACKEND_REQUIREMENTS.md](./sources/BACKEND_REQUIREMENTS.md) | `74335b0bd3429ff58841a9ea45d4b42ae7d9520f940cddb6ed76079aa6fdc088` |
| `ROLE-WORKSPACE-DELEGATION-REFINEMENT.md` | [sources/BACKEND_ROLE_WORKSPACE_DELEGATION_REFINEMENT.md](./sources/BACKEND_ROLE_WORKSPACE_DELEGATION_REFINEMENT.md) | `c438bf6c2cab8aa9075a10c59f858469ab0be70ac9eaea783389788fc4298c5e` |
| `RESOURCE-EXTENSION-REFINEMENT.md` | [sources/BACKEND_RESOURCE_EXTENSION_REFINEMENT.md](./sources/BACKEND_RESOURCE_EXTENSION_REFINEMENT.md) | `4ecfedeb216cdafe313c276851cebbe330bb17b2022f20e2c9bc771c61838bea` |
| `RESOURCE-EXTENSION-VERIFICATION.md` | [sources/BACKEND_RESOURCE_EXTENSION_VERIFICATION.md](./sources/BACKEND_RESOURCE_EXTENSION_VERIFICATION.md) | `77d539c5d9b0b4715ef075412d7360d857f95941b7bdf512533c8123add41005` |
| `VERIFICATION-GUIDE.md` | [sources/BACKEND_VERIFICATION_GUIDE.md](./sources/BACKEND_VERIFICATION_GUIDE.md) | `668b82bb9cc0dd5e039d0b5aff75fee358a3c65814b5b8151b7fc20cc2890c25` |
| `DATABASE-SCRIPT-REFINEMENT.md` | [sources/BACKEND_DATABASE_SCRIPT_REFINEMENT.md](./sources/BACKEND_DATABASE_SCRIPT_REFINEMENT.md) | `478db30f3c7307c6df2d03c672cbc24328794e1bb99ea2da45ce5dbbe3b3d76e` |


## 2026-10-05 平台角色字段权限最新权威来源

本表覆盖同文件历史哈希；公开129路径/196操作，内部2操作。用户确认框架未投产，平台角色字段为唯一模型：旧独立策略及迁移开关、能力标志、顶层兼容字段、012/013脚本全部删除。租户字段策略与通讯录保持原行为。开发及自动化完成，人工与实际库重建待用户；当前部署按最新完整SQL初始化，不按历史迁移说明操作。

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `API.md` | [sources/BACKEND_API.md](./sources/BACKEND_API.md) | `3a956a159b657c5ebca8e2566e53f8c9d1c86f7664b00a9b02aaa2865d197a3b` |
| `DESIGN.md` | [sources/BACKEND_DESIGN.md](./sources/BACKEND_DESIGN.md) | `edba77702096170106b82a077b908efff7c5c10b213ff705ae2bb25fbea3f125` |
| `REQUIREMENTS.md` | [sources/BACKEND_REQUIREMENTS.md](./sources/BACKEND_REQUIREMENTS.md) | `6e8e2fb74b6d7a617a89b233cde4e576b0cf8271e0125bde4b44f3f81934e7b2` |
| `FRONTEND.md` | [sources/BACKEND_FRONTEND.md](./sources/BACKEND_FRONTEND.md) | `3722b0c823cbc26d9590b8af68d114dccc7fc1b9e82fa954927aef99cdadd3a4` |
| `TASKS.md` | [sources/BACKEND_TASKS.md](./sources/BACKEND_TASKS.md) | `c227a2321998a733560afee91282c77115c6cf2095137d70132bd82b29760ef5` |
| `RESOURCE-EXTENSION-REFINEMENT.md` | [sources/BACKEND_RESOURCE_EXTENSION_REFINEMENT.md](./sources/BACKEND_RESOURCE_EXTENSION_REFINEMENT.md) | `d3c4d9cf71b33850a81f50ca58712cf6e99fb466a265e311bd60b51a306d6075` |
| `RESOURCE-EXTENSION-VERIFICATION.md` | [sources/BACKEND_RESOURCE_EXTENSION_VERIFICATION.md](./sources/BACKEND_RESOURCE_EXTENSION_VERIFICATION.md) | `c59912a9c90eea8274459c3a510b289b4a24beb1eea991ab3cbf5c69246ee338` |
| `ROLE-FIELD-AUTHORIZATION-REFINEMENT.md` | [sources/BACKEND_ROLE_FIELD_AUTHORIZATION_REFINEMENT.md](./sources/BACKEND_ROLE_FIELD_AUTHORIZATION_REFINEMENT.md) | `ef10de1f160370a6db1c68812dac691ec03f13e0bed93526007fc15796d48180` |
| `contracts/internal-openapi.json` | [sources/contracts/internal-openapi.json](./sources/contracts/internal-openapi.json) | `de75c0bddc10da76343389bf9e5aa93c5978395edba5d8566696c2d0be6f06c9` |
| `contracts/schemas.json` | [sources/contracts/schemas.json](./sources/contracts/schemas.json) | `5f0c5c9779b85d527e92df01bf54603911b5b1c22004b2eb01ed1599fcaaf99e` |
| `contracts/openapi.json` | [sources/contracts/openapi.json](./sources/contracts/openapi.json) | `da6e83bfd40295163bff70c6f8cc5f0632c5da3633d17c78d701892a0d2fe75d` |
| `contracts/routes.json` | [sources/contracts/routes.json](./sources/contracts/routes.json) | `8c838a198f6953a33006662f4699e9d6d495b87ce877e820d3d81ccdc5c1c24e` |
| `contracts/README.md` | [sources/contracts/README.md](./sources/contracts/README.md) | `6c7e03c8a312db5f2f4ff68e30835f5b4b2ad4d7647e93d4bbffdb0c52432f89` |
| `contracts/examples/authorization-candidates.json` | [sources/contracts/examples/authorization-candidates.json](./sources/contracts/examples/authorization-candidates.json) | `c58b40eefc464fe561a65c00789257dc0d338960172a08854fbb25e1ed6cffc8` |
| `contracts/examples/decision-restricted.json` | [sources/contracts/examples/decision-restricted.json](./sources/contracts/examples/decision-restricted.json) | `0b33df4ccb9c3adad9434d2a4cc4f0b4e93ebe36e9b83610b6429a8607867ce9` |
| `contracts/examples/field-policy.json` | [sources/contracts/examples/field-policy.json](./sources/contracts/examples/field-policy.json) | `34741450de8a829ef69acff2b368cca63f2fe738304c14cb9e39711097c019f4` |
| `contracts/examples/member-detail.json` | [sources/contracts/examples/member-detail.json](./sources/contracts/examples/member-detail.json) | `4d834165ab6fc03bd8d51648c58ae9768b5fe39ccd61a298aaebbac7b0a02685` |
| `contracts/examples/audit.json` | [sources/contracts/examples/audit.json](./sources/contracts/examples/audit.json) | `b12020ba0d27febc71e4a4b64fead0f1a92feb1deae6cb27d0d1f29ad09ad3f1` |
| `contracts/examples/assignment-multi-role.json` | [sources/contracts/examples/assignment-multi-role.json](./sources/contracts/examples/assignment-multi-role.json) | `4d179982f861974708d6fbe0c34c0b8a522926223bc005636d06d490abe18f0a` |
| `contracts/examples/assignment-context.json` | [sources/contracts/examples/assignment-context.json](./sources/contracts/examples/assignment-context.json) | `f3f8a4690aa00488056b33036b1c7fdaff3a90e93e4ab24de4c1459d40173e24` |
| `contracts/examples/role-publish.json` | [sources/contracts/examples/role-publish.json](./sources/contracts/examples/role-publish.json) | `161f3c178e679952c5f21a320b30f02eb8ba5b432835b686bf8ac7881abfbdae` |
| `contracts/examples/role-subject-page.json` | [sources/contracts/examples/role-subject-page.json](./sources/contracts/examples/role-subject-page.json) | `3c16da306274394837943e410d9d7b24f268b990a1a98a7ac2b75e80cc2091ba` |
| `contracts/examples/assignment-record.json` | [sources/contracts/examples/assignment-record.json](./sources/contracts/examples/assignment-record.json) | `ceb58e46f3e4bb487961a8241100cc4d92cf21064ced0c8a5653ea3dadf86899` |
| `contracts/examples/policy-preview.json` | [sources/contracts/examples/policy-preview.json](./sources/contracts/examples/policy-preview.json) | `95ef6260bc1984d2f3a6aedeb0355fde34cd25f75fcdd8ad8190d8d5c8bb437c` |
| `contracts/examples/delegation.json` | [sources/contracts/examples/delegation.json](./sources/contracts/examples/delegation.json) | `f1ff9fd992b75c3525226095802b847d87b64226ed2a5cf8120aaa52392b21ae` |
| `contracts/examples/assignment.json` | [sources/contracts/examples/assignment.json](./sources/contracts/examples/assignment.json) | `0534cb7b5dc00abfa9d9c2bedc978860c7c31e84f2cdf6bde0cbc6470b6c57fa` |
| `contracts/examples/authorization-role-versions.json` | [sources/contracts/examples/authorization-role-versions.json](./sources/contracts/examples/authorization-role-versions.json) | `d43205669c3e8b440249b1779a9db822e756dca02e56d72ebcbe13a5ff5f1802` |
| `contracts/examples/tenant-create.json` | [sources/contracts/examples/tenant-create.json](./sources/contracts/examples/tenant-create.json) | `bce0ddc96c0131ce8e4beb620a23bb88766456d5796c957651e7217ead46f133` |
| `contracts/examples/role-shared.json` | [sources/contracts/examples/role-shared.json](./sources/contracts/examples/role-shared.json) | `a6c0f4f037d83d87245fad242f27cf3b69d7fe78beebd60d6058c87cb6326dba` |
| `contracts/examples/authorization-v2-request.json` | [sources/contracts/examples/authorization-v2-request.json](./sources/contracts/examples/authorization-v2-request.json) | `167abd84380f4a801ad942b36ec762577b52a61636e3b896cdea8746f1296af1` |
| `contracts/examples/upgrade-conflict.json` | [sources/contracts/examples/upgrade-conflict.json](./sources/contracts/examples/upgrade-conflict.json) | `d9a8bb044a0a4ec7f3228dbe253accfd971bfbff5006def695b868fb71751e70` |
| `contracts/examples/role-create.json` | [sources/contracts/examples/role-create.json](./sources/contracts/examples/role-create.json) | `e407fa60b63de59abfc98db91af42a9d23df1903a5340d1361630da4cba3c43d` |
| `contracts/examples/field-readonly.json` | [sources/contracts/examples/field-readonly.json](./sources/contracts/examples/field-readonly.json) | `5a1d863e3a989311bec29d36f52e2b4960421844b4e635aab010125bddacf042` |
| `contracts/examples/role-delta.json` | [sources/contracts/examples/role-delta.json](./sources/contracts/examples/role-delta.json) | `af2f8b4456a4075cd77addebf33db78cdefb38edf633777b6eac5136e9fc7fcf` |
| `contracts/examples/authorization-role-candidates.json` | [sources/contracts/examples/authorization-role-candidates.json](./sources/contracts/examples/authorization-role-candidates.json) | `3002bf2b20aa23025e322a0caa0c46688d6c85312b0f448246f33252ffb01421` |
| `contracts/examples/role-platform-fields.json` | [sources/contracts/examples/role-platform-fields.json](./sources/contracts/examples/role-platform-fields.json) | `619daf5e8049c832585d08a730fcc7d499adfa550cd89f9f683be47799be708b` |
| `contracts/examples/delegation-unlimited.json` | [sources/contracts/examples/delegation-unlimited.json](./sources/contracts/examples/delegation-unlimited.json) | `b70d04b8138fae40556a8f2d0505b60b451b6839ad4f7ab044d5456ad2b24e14` |
| `contracts/examples/member-page.json` | [sources/contracts/examples/member-page.json](./sources/contracts/examples/member-page.json) | `6df8ae4f9aa0e49588d6b46b4022f96a7b593f42dae47e81bc92a961265cdf49` |
| `contracts/examples/role-upgrade.json` | [sources/contracts/examples/role-upgrade.json](./sources/contracts/examples/role-upgrade.json) | `6bbf746c86a3a96e83ea64108c5ee07070723b1f6aa347c4308ca9ab8876844b` |
| `contracts/examples/directory-policy.json` | [sources/contracts/examples/directory-policy.json](./sources/contracts/examples/directory-policy.json) | `7cbf037239d1f2e5e1de2805e4effec9150e4e6dcd188644bfbb8b97653bd90c` |
| `contracts/examples/assignment-upgrade.json` | [sources/contracts/examples/assignment-upgrade.json](./sources/contracts/examples/assignment-upgrade.json) | `692ded7fdad3fd63b6fb22c80e58e4f806ba47d2a0e2572ad7b5185076dfff35` |
| `contracts/examples/preview-invalid.json` | [sources/contracts/examples/preview-invalid.json](./sources/contracts/examples/preview-invalid.json) | `594ce7180a49ab5d478d90ee758e1e40512a166f8ae6e46285c338565cb86d53` |
| `contracts/examples/bootstrap.json` | [sources/contracts/examples/bootstrap.json](./sources/contracts/examples/bootstrap.json) | `0cbd924febdbff6dab1f857c241c9593906d6a0dcd9d9ccf9c60f6185aaf6ad4` |
| `contracts/examples/assignment-selected-candidates.json` | [sources/contracts/examples/assignment-selected-candidates.json](./sources/contracts/examples/assignment-selected-candidates.json) | `cc18ba779fd71bdb03500ea7ca0b6c1734f5247415115da3c7adb57c138a649c` |


## 2026-10-06 目录布局与可重复初始化最新来源

以下校验值覆盖相同文件历史哈希。目录菜单默认使用 `layout.main`；完整SQL会先删除manifest内56张表，仅删除阶段关闭外键，建表/种子阶段开启并恢复原会话设置。重复执行清空目标表，重建后须重新导入测试身份；006单独执行仍只补缺。前端业务代码和公开接口不变，本轮未操作实际数据库，人工菜单/登录验收待用户。

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `DATABASE-SCRIPT-REFINEMENT.md` | [sources/BACKEND_DATABASE_SCRIPT_REFINEMENT.md](./sources/BACKEND_DATABASE_SCRIPT_REFINEMENT.md) | `3bdb9ed91203414f422a9b41c7b6d29e4ef097e0897e4f2735e95ade351dcb97` |
| `DESIGN.md` | [sources/BACKEND_DESIGN.md](./sources/BACKEND_DESIGN.md) | `92f5775282f4a58dbc99edaad3346c7335cfdc653a50345938eeeb999cd29a05` |
| `REQUIREMENTS.md` | [sources/BACKEND_REQUIREMENTS.md](./sources/BACKEND_REQUIREMENTS.md) | `c0beaea88e43796bdcc0ca47f9292fa215f30902e9f3dd65b3ece1ce67b8d119` |
| `TASKS.md` | [sources/BACKEND_TASKS.md](./sources/BACKEND_TASKS.md) | `5caec126f19dac3badb26e8c8a33666ad5c92e8952a50945a33eb09ac5faaea5` |
| `RESOURCE-EXTENSION-VERIFICATION.md` | [sources/BACKEND_RESOURCE_EXTENSION_VERIFICATION.md](./sources/BACKEND_RESOURCE_EXTENSION_VERIFICATION.md) | `f5099ec570d4dbb3922ddb1c5100cd59971dadc8d71a4afe960474bb2c5c9086` |
| `ACCEPTANCE.md` | [sources/BACKEND_ACCEPTANCE.md](./sources/BACKEND_ACCEPTANCE.md) | `f09113806361ec83c5ea4eb7883e134e77c89dfade09970728a6a41fd6f5a5a5` |
| `VERIFICATION-GUIDE.md` | [sources/BACKEND_VERIFICATION_GUIDE.md](./sources/BACKEND_VERIFICATION_GUIDE.md) | `8d62388df9bc868671fa58250b927c16d35e92d42d978634159c4c2b8394cfe1` |


## 2026-10-06 全局账号与独立开发者平台最新来源

以下校验值覆盖相同文件历史哈希。全局账号加入平台治理的“平台管理”，独立 `platform:develop` 应用包含生成二维码、客户端管理、社交管理和业务ID管理，页面注册键和原接口精确权限码保留。正式目录为3应用/36资源/138操作/30菜单/54菜单关联，新平台SYSTEM版本覆盖两个平台应用，租户SYSTEM仍只覆盖租户域。完整初始化会清空清单表，单独006不改写已有固定版本；实际库与页面人工验收未执行，前端业务代码不变。

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `DATABASE-SCRIPT-REFINEMENT.md` | [sources/BACKEND_DATABASE_SCRIPT_REFINEMENT.md](./sources/BACKEND_DATABASE_SCRIPT_REFINEMENT.md) | `b4ff8a84d5def1937b7ac965fa22b36d6db34f31c4bed1da0017c11d161c10c7` |
| `DESIGN.md` | [sources/BACKEND_DESIGN.md](./sources/BACKEND_DESIGN.md) | `0b2b60420de6865e5d4ad541152cba77f76b9c66efd047ec6342ade2586b53bd` |
| `REQUIREMENTS.md` | [sources/BACKEND_REQUIREMENTS.md](./sources/BACKEND_REQUIREMENTS.md) | `0b70440099a9000f844a02336a75f6fbd80ba8af2029417d4c856bba35003d79` |
| `TASKS.md` | [sources/BACKEND_TASKS.md](./sources/BACKEND_TASKS.md) | `024e03f1dd17481b661b38e6f4a193c96f31ab945981a2f3d0360580e911a0aa` |
| `FRONTEND.md` | [sources/BACKEND_FRONTEND.md](./sources/BACKEND_FRONTEND.md) | `22d0c0c893eb94e68e11c6fc77a50e28aab4ab7ed489401d841891667f0e8092` |
| `RESOURCE-EXTENSION-VERIFICATION.md` | [sources/BACKEND_RESOURCE_EXTENSION_VERIFICATION.md](./sources/BACKEND_RESOURCE_EXTENSION_VERIFICATION.md) | `dba95f558ddb8472b3f2a1a310b5642981933262277b5cb473f317fe10667d2c` |
| `VERIFICATION-GUIDE.md` | [sources/BACKEND_VERIFICATION_GUIDE.md](./sources/BACKEND_VERIFICATION_GUIDE.md) | `13ddacc98d5464464016c1c8ec07b5b085fcf8cca5b79dbfaed38273f88a1ac8` |


## 2026-10-06 平台成员联系资料最新来源

以下校验值覆盖相同文件历史哈希。平台成员联系手机号/邮箱独立存储，创建一次复制账号初值，后续编辑或清空不修改登录资料；接口结构和租户逻辑保持。一次性014迁移及权威初始化DDL已补齐，开发与自动化完成，目标库升级和真实身份人工验收待执行。

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `API.md` | [sources/BACKEND_API.md](./sources/BACKEND_API.md) | `efdd4197f3e8f69a8942465abb89dc8ce25df9765537df245dc1420a53d54cfa` |
| `TASKS.md` | [sources/BACKEND_TASKS.md](./sources/BACKEND_TASKS.md) | `96ab89bd2f806bcd9ad6be51dde99230a5d1d684d11a94db209080b0732a48cc` |
| `PLATFORM-MEMBER-CONTACTS-REFINEMENT.md` | [sources/BACKEND_PLATFORM_MEMBER_CONTACTS_REFINEMENT.md](./sources/BACKEND_PLATFORM_MEMBER_CONTACTS_REFINEMENT.md) | `51a10b0c2bc92c7684569602f738f7b31a2651cfb9d6c1d538129b40b48482e7` |
| `contracts/README.md` | [sources/contracts/README.md](./sources/contracts/README.md) | `f209da4c53cf5f3090521e169a0b8b4f592843478cde8ed7c85319a24c21e707` |
| `contracts/schemas.json` | [sources/contracts/schemas.json](./sources/contracts/schemas.json) | `2d3f4fe666057bd269eebe438b5a6d13dc53a2d86b0d8d6c237bf5f39913ee2a` |
| `contracts/openapi.json` | [sources/contracts/openapi.json](./sources/contracts/openapi.json) | `a7a5fac546c4e6b8652218579b16b8426c01480dafa5b80853f2da52005228dc` |

## 2026-10-06 平台系统超管与应用导航最新来源

以下哈希覆盖同文件历史来源。平台SYSTEM超级管理员使用Java保留编码，动态覆盖启用的平台应用/操作、ALL和注册业务字段FULL；普通角色/租户流程不变。公开OpenAPI仍129/196，内部快照新增独立服务器超管事实，3个端点。开发及相关自动化完成，全量既有失败单列，目标库和实际身份人工验收未执行。

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `API.md` | [sources/BACKEND_API.md](./sources/BACKEND_API.md) | `e414288cb2f9f95dba89c31d34b993d610dd18d4d147076d366f2bc7ac7af2e6` |
| `DESIGN.md` | [sources/BACKEND_DESIGN.md](./sources/BACKEND_DESIGN.md) | `2e6142cf622a59b06344e2206806b44fd2349fd38379665db1411ef03abefdd5` |
| `REQUIREMENTS.md` | [sources/BACKEND_REQUIREMENTS.md](./sources/BACKEND_REQUIREMENTS.md) | `13d2531c023b5406f79f922f48214bccfcc31b3198336befa69dfa1acc2a0d5d` |
| `TASKS.md` | [sources/BACKEND_TASKS.md](./sources/BACKEND_TASKS.md) | `f83b0cb36739a711de3b422b4dc50c4a469bf710b4a6cdc43f00dd441a30234a` |
| `RESOURCE-EXTENSION-VERIFICATION.md` | [sources/BACKEND_RESOURCE_EXTENSION_VERIFICATION.md](./sources/BACKEND_RESOURCE_EXTENSION_VERIFICATION.md) | `8b306e0a2c6985eb6fe3a9ad3447d165da3ab47c246e2f9a9b1291054dfea2cb` |
| `PLATFORM-SUPER-ADMIN-APPLICATION-NAVIGATION.md` | [sources/BACKEND_PLATFORM_SUPER_ADMIN_APPLICATION_NAVIGATION.md](./sources/BACKEND_PLATFORM_SUPER_ADMIN_APPLICATION_NAVIGATION.md) | `a05ea7e73cb5fd84bad1e76e496794bbcc1ece52d6623dedaca2b8e79161a5ab` |
| `contracts/README.md` | [sources/contracts/README.md](./sources/contracts/README.md) | `471429a735302b777f3c483a3af9e33e119bf3d3313e592f6123c9eba02a4769` |
| `contracts/internal-openapi.json` | [sources/contracts/internal-openapi.json](./sources/contracts/internal-openapi.json) | `96d3a23289bdbe0f9d44468e34b11529a01544939f69d8056ad0921f8cd89094` |
| `contracts/examples/authorization-snapshot.json` | [sources/contracts/examples/authorization-snapshot.json](./sources/contracts/examples/authorization-snapshot.json) | `4921931f10dd6a64ba74a6bad545a4de6526f5991bd08bf2ac841de3440883d8` |


## 2026-10-06 平台成员字段展示与编辑最新来源

本表覆盖相同文件历史哈希；公开130路径/197操作。成员context只提供布局/创建字段与原值搜索资格，列表和提交仍按真实目标鉴权；隐藏字段不显示标签/控件，脱敏值不回填草稿，默认邮箱与指定对象编辑入口已完成。相关服务、SDK、Java契约、隔离MySQL/真实HTTP、前端组件与两管理台构建通过；MF04实际身份/页面人工验收未执行。本次无新增DDL，无需因本增量重建库。

sources/BACKEND_FRONTEND.md 是最新权威字节副本；本地 INTERACTIONS.md 保留历次前端增量，已不是完整字节副本，不覆盖这些本地说明。人工步骤读取 BACKEND_RESOURCE_EXTENSION_VERIFICATION.md 的 MF04 节，后端专属相对链接仍按本表源文件归属解析。

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `API.md` | [sources/BACKEND_API.md](./sources/BACKEND_API.md) | `eb4e5218b4e85040d99e5eb541e15dccfd0c45cccb11b418d4f621918584cc6c` |
| `DESIGN.md` | [sources/BACKEND_DESIGN.md](./sources/BACKEND_DESIGN.md) | `c77d3b9c415f69187b9d9895a028cc5f68562ff117f39d99efd4bc7fca06fa9d` |
| `REQUIREMENTS.md` | [sources/BACKEND_REQUIREMENTS.md](./sources/BACKEND_REQUIREMENTS.md) | `d00cc7696239fd67c03095d7853c803975f0e6112a608a2952df5666b82efa20` |
| `TASKS.md` | [sources/BACKEND_TASKS.md](./sources/BACKEND_TASKS.md) | `673c06a37a0aafbdbd29e2afa060b03e4b20a913c1954991f5ad4616f626fe1d` |
| `FRONTEND.md` | [sources/BACKEND_FRONTEND.md](./sources/BACKEND_FRONTEND.md) | `2beddb03039a2c9a4046d1aa6d2754356b5e1c424698ac18cfcbd677e4cf8e65` |
| `RESOURCE-EXTENSION-VERIFICATION.md` | [sources/BACKEND_RESOURCE_EXTENSION_VERIFICATION.md](./sources/BACKEND_RESOURCE_EXTENSION_VERIFICATION.md) | `24f354ed13729dc14f1f285cf7b661c8d9d4c87f12f960eb1344137f58886e47` |
| `PLATFORM-MEMBER-FIELD-UI-REFINEMENT.md` | [sources/BACKEND_PLATFORM_MEMBER_FIELD_UI_REFINEMENT.md](./sources/BACKEND_PLATFORM_MEMBER_FIELD_UI_REFINEMENT.md) | `639b90611ddac33467a617225902987736836f7211c3db970c395b94593839dc` |
| `contracts/README.md` | [sources/contracts/README.md](./sources/contracts/README.md) | `76985e35fc044eada34417e34962aabd920ab18e96cac4551dfb4af40d5ca359` |
| `contracts/routes.json` | [sources/contracts/routes.json](./sources/contracts/routes.json) | `6aed54b86a6b32412050e7a370fc4e57a85529e1a82c9f265148deb275c9d950` |
| `contracts/openapi.json` | [sources/contracts/openapi.json](./sources/contracts/openapi.json) | `9d9f7442f118e1e7ec2ad45af62caa8dc5534bdb4de97f0d5ebe30a2f89d98d0` |
| `contracts/schemas.json` | [sources/contracts/schemas.json](./sources/contracts/schemas.json) | `9cc89d0192abf503014358f8c7453fdea002166fa0cfb153a65e96d012a85511` |
| `contracts/examples/platform-member-context.json` | [sources/contracts/examples/platform-member-context.json](./sources/contracts/examples/platform-member-context.json) | `4926fe1833c7ce3290f94bfa6e4a79c1dafde4a0ee4c5b727999af7f84cc0bb3` |


## 2026-10-06 平台成员角色配置最新来源

以下校验值覆盖同文件历史值。MR01–MR03开发和自动化完成，MR04人工待执行；无新增DDL。角色参数按已保存assignment独立回显、差量更新，平台编辑与租户资料输入分离。INTERACTIONS保留前端增量，BACKEND_FRONTEND为字节副本。

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `API.md` | [sources/BACKEND_API.md](./sources/BACKEND_API.md) | `ca553b4378ad2406256f58a3eda790cbd876363ab8956636e2cf55efaacfdde7` |
| `DESIGN.md` | [sources/BACKEND_DESIGN.md](./sources/BACKEND_DESIGN.md) | `afb53ac681113f5b4537c28d5d6db220fabac2b4d7619e24ac00462c25a6c7f0` |
| `REQUIREMENTS.md` | [sources/BACKEND_REQUIREMENTS.md](./sources/BACKEND_REQUIREMENTS.md) | `ded5c542f5d22a1dba70b7d4c7203b2e46dd421ebb1aa9977afc1bce9ec755d2` |
| `TASKS.md` | [sources/BACKEND_TASKS.md](./sources/BACKEND_TASKS.md) | `6f00590c9067986eded8bb28979750b11774e40732cfdca836079168847c7d09` |
| `FRONTEND.md` | [sources/BACKEND_FRONTEND.md](./sources/BACKEND_FRONTEND.md) | `d562243cc1c8056158cbe9a10fa93b9846f8de968b21686eba222008fa3759ea` |
| `RESOURCE-EXTENSION-VERIFICATION.md` | [sources/BACKEND_RESOURCE_EXTENSION_VERIFICATION.md](./sources/BACKEND_RESOURCE_EXTENSION_VERIFICATION.md) | `677ae78f3f16163fd6b9b938910c3b8f8e9d5feb4c9759de53900279a6b45ee7` |
| `PLATFORM-MEMBER-ROLE-EDITOR.md` | [sources/BACKEND_PLATFORM_MEMBER_ROLE_EDITOR.md](./sources/BACKEND_PLATFORM_MEMBER_ROLE_EDITOR.md) | `298b916ab2a9be6a3079fb8b92071fa7a61e8cfc8f4eec2b35f923bd17559931` |
| `contracts/README.md` | [sources/contracts/README.md](./sources/contracts/README.md) | `5520170a5469d5717243a421f42dc6c7d67ee48f08e84dbc2307ed0380f6edaf` |
| `contracts/routes.json` | [sources/contracts/routes.json](./sources/contracts/routes.json) | `ee1ef96cb5e5f1d3fe22b897d720b5a7634b519d21134f77c9c23137f905ddaa` |
| `contracts/openapi.json` | [sources/contracts/openapi.json](./sources/contracts/openapi.json) | `95b922065e1dcdf79ad2b2de11e893f945016f46fbac889fc741538dcb35ea5d` |
| `contracts/schemas.json` | [sources/contracts/schemas.json](./sources/contracts/schemas.json) | `f6158b933cd494d7c3abfa00461014fa682678c974ecc9324112cbca8214a8bd` |
| `contracts/examples/member-role-edit.json` | [sources/contracts/examples/member-role-edit.json](./sources/contracts/examples/member-role-edit.json) | `d360063c8189b334b666178eb9d2f49c5a7bec7dd8921efb8dae527443cf986b` |
| `contracts/examples/member-bound-roles.json` | [sources/contracts/examples/member-bound-roles.json](./sources/contracts/examples/member-bound-roles.json) | `f13756efb9b4551c676a61cfc07f565b5bcbd6b2cf91bdc8397e52e80f230711` |

## 2026-10-06 强制改密权威来源

以下哈希与最新原文副本一致，覆盖同文件历史值；历史表保留当时记录。FP01–FP04 开发及限定自动化完成，FP05 人工待执行。

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `API.md` | [sources/BACKEND_API.md](./sources/BACKEND_API.md) | `2938c9fc02587af782c649ab396e3402bc1e4899c456704c7d60ff0a61208db6` |
| `FRONTEND.md` | [sources/BACKEND_FRONTEND.md](./sources/BACKEND_FRONTEND.md) | `0f47f7dc7e30f32526ebf38d76114f38b39d99e6c3bc2563f566cf1f4c2ed4ec` |
| `REQUIREMENTS.md` | [sources/BACKEND_REQUIREMENTS.md](./sources/BACKEND_REQUIREMENTS.md) | `8255cf51362b14fcd9d987d425350a373f9c272e944890df83a1bf4b76513dcd` |
| `DESIGN.md` | [sources/BACKEND_DESIGN.md](./sources/BACKEND_DESIGN.md) | `05c0468ce867f8aa96d1573c5fe909175c22fa857c1aa52d8f2c4a47a2806d91` |
| `TASKS.md` | [sources/BACKEND_TASKS.md](./sources/BACKEND_TASKS.md) | `53937db3d4a3cc68479b87c76bc656bf93fe2ec8e80f33a4b2658a27abd875a6` |
| `RESOURCE-EXTENSION-VERIFICATION.md` | [sources/BACKEND_RESOURCE_EXTENSION_VERIFICATION.md](./sources/BACKEND_RESOURCE_EXTENSION_VERIFICATION.md) | `0002fdc47a75885a691e67d9b823ab18599a84a75013028be77a1278628545a2` |
| `FORCED-PASSWORD-CHANGE.md` | [sources/BACKEND_FORCED_PASSWORD_CHANGE.md](./sources/BACKEND_FORCED_PASSWORD_CHANGE.md) | `0d8b6dd0b8648ffdf7eb5adef9786ec80168325aba48add7e8114bcd91033401` |
| `contracts/README.md` | [sources/contracts/README.md](./sources/contracts/README.md) | `61b2e5b8a4067eeb7d242fd0d5ce5dd50c029df486ed3aa431bb3a2a2dfdffe0` |
| `contracts/routes.json` | [sources/contracts/routes.json](./sources/contracts/routes.json) | `4c930b07d33d62a891498feafe0ce7e9109a8a99405bd4317d4bfe259dc4a49e` |
| `contracts/openapi.json` | [sources/contracts/openapi.json](./sources/contracts/openapi.json) | `6b920ac17807c9b5782f2cba02fde41c2f225b04750df18eb5040c9482e9037c` |
| `contracts/schemas.json` | [sources/contracts/schemas.json](./sources/contracts/schemas.json) | `fd4e6bda498a00b4da0a3a6f0221bc58c126cb74eb93ffb5cc86d869f4c925e6` |
| `contracts/internal-openapi.json` | [sources/contracts/internal-openapi.json](./sources/contracts/internal-openapi.json) | `29d4fc22afc03a1e943d562ecf46e9877d809f25afd5b9690338e93ece204454` |
| `contracts/examples/password-change-state.json` | [sources/contracts/examples/password-change-state.json](./sources/contracts/examples/password-change-state.json) | `077f2c128c3afb0a78bc63d03da8c115b3281d4e195d99d5f984e09071ae5377` |
