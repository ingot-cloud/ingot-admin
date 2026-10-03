# 输入来源与对接边界

同步校准日期：2026-10-02。后端来源：同级 ingot/specs/changes/active/20260912-iam-identity-access-management。两端主状态implementing；后端B01–B05已落地，前端部分增量已有代码，完整验收未结束。本轮平台角色分配与委派增量已经实施，证据见 AUTHORIZATION-REFINEMENT-STATUS；真实 HTTP/浏览器验收仍未完成。历史来源保留。

后端API为权威，contracts 与 sources 中标注的后端原文按哈希同步；本地 API/INTERACTIONS 同时含前端增量说明。旧来源清单保留于 [历史记录](./sources/history/SOURCES-20260914.md)，其中旧数字与缺口仅为历史。当前管理面119路径/186操作，包含账号/本人/字典/发号/社交、目录辅助、两域授权候选、上下文/详情/预览与导出状态；完整schemas/examples随目录同步。BFF-LOGIN单列登录契约，B06及四站真实验收未完成；不能据契约文件或B01–B05勾选推断产品已验收。

## 阅读顺序

README → REQUIREMENTS → DESIGN → BFF-LOGIN → API/INTERACTIONS → IMPLEMENTATION-STATUS → IAM-INTEGRATION → ACCEPTANCE/TASKS → sources/BACKEND_TEST_DATA。源文件相对链接原样保留；遇到后端专属相对路径按下表映射，不能误认为前端缺少实现。

## 原文副本 SHA-256

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `API.md` | [sources/BACKEND_API.md](./sources/BACKEND_API.md) | `40b8ba3394104ee57ac719c7a005c0e8454c3a725e0d8cb9459c34b4b646a2f8` |
| `FRONTEND.md` | [sources/BACKEND_FRONTEND.md](./sources/BACKEND_FRONTEND.md) | `3722b0c823cbc26d9590b8af68d114dccc7fc1b9e82fa954927aef99cdadd3a4` |
| `BFF-LOGIN.md` | [BFF-LOGIN.md](./BFF-LOGIN.md) | `bfae7f4e66100a3e32da56933b82bb6a2244a355698a6c377ca7b75aefec172f` |
| `REQUIREMENTS.md` | [sources/BACKEND_REQUIREMENTS.md](./sources/BACKEND_REQUIREMENTS.md) | `6477fd222241d9f08c534bbe9888c4df89e10ade993b5b5e084529fab0b83d1a` |
| `DESIGN.md` | [sources/BACKEND_DESIGN.md](./sources/BACKEND_DESIGN.md) | `ef14f33312a1f1744d04bf7b898556bc7127eafb796552678a1045ac726df9f2` |
| `MIGRATION.md` | [sources/BACKEND_MIGRATION.md](./sources/BACKEND_MIGRATION.md) | `a72a6afc456c605f42d4d2b148d5a28a43234fc707f2724755d65ecdbc388c6c` |
| `ACCEPTANCE.md` | [sources/BACKEND_ACCEPTANCE.md](./sources/BACKEND_ACCEPTANCE.md) | `71bc2185c1836d044a6c1cabffd730dfb9129c28540014309f5defc990803521` |
| `endpoint-mapping.json` | [sources/endpoint-mapping.json](./sources/endpoint-mapping.json) | `6eff4056434a6f307b62bccf4dd2170c013d089943dd7c8461b8da89846a16ec` |
| `contracts/README.md` | [sources/contracts/README.md](./sources/contracts/README.md) | `ba53c4017dc32a3438a98aba62bd4cef602b3edadeed8587ae0454575cc4cd36` |
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
| `contracts/openapi.json` | [sources/contracts/openapi.json](./sources/contracts/openapi.json) | `d28907ebd12f64bffc44f5cdcbbb81d66f148c966b281daf679fe3159aaeb710` |
| `contracts/routes.json` | [sources/contracts/routes.json](./sources/contracts/routes.json) | `8a7c5508c54c225caf66edc89889c402efc122f18813a663cc45a57998c44c0c` |
| `contracts/schemas.json` | [sources/contracts/schemas.json](./sources/contracts/schemas.json) | `55783b392670adeb6d336543991da3ffd3d2922758c3d8d09b77a59e41d92b6f` |

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
| `API.md` | [sources/BACKEND_API.md](./sources/BACKEND_API.md) | `40b8ba3394104ee57ac719c7a005c0e8454c3a725e0d8cb9459c34b4b646a2f8` |
| `FRONTEND.md` | [sources/BACKEND_FRONTEND.md](./sources/BACKEND_FRONTEND.md) | `3722b0c823cbc26d9590b8af68d114dccc7fc1b9e82fa954927aef99cdadd3a4` |
| `ROLE-WORKSPACE-DELEGATION-REFINEMENT.md` | [sources/BACKEND_ROLE_WORKSPACE_DELEGATION_REFINEMENT.md](./sources/BACKEND_ROLE_WORKSPACE_DELEGATION_REFINEMENT.md) | `c262615bcf8f67ea1b670fa9fed280bddc3d86f8a30b91e85e8c337491dda201` |
| `contracts/examples/delegation-unlimited.json` | [sources/contracts/examples/delegation-unlimited.json](./sources/contracts/examples/delegation-unlimited.json) | `b70d04b8138fae40556a8f2d0505b60b451b6839ad4f7ab044d5456ad2b24e14` |
| `contracts/examples/role-subject-page.json` | [sources/contracts/examples/role-subject-page.json](./sources/contracts/examples/role-subject-page.json) | `3c16da306274394837943e410d9d7b24f268b990a1a98a7ac2b75e80cc2091ba` |
