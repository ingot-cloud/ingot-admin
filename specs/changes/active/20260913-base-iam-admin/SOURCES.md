# 输入来源与对接边界

同步校准日期：2026-09-19。后端来源：同级 ingot/specs/changes/active/20260912-iam-identity-access-management。两端主状态implementing；后端B01–B05已落地，前端部分增量已有代码，完整验收未结束。本轮只修订Spec；实现证据见IMPLEMENTATION-STATUS，历史来源保留。

后端API为权威，以下副本逐字节复制；不消费inbox。旧来源清单保留于 [历史记录](./sources/history/SOURCES-20260914.md)，其中旧数字与缺口仅为历史。当前管理面96路径/161操作，包含新增账号/本人/字典/发号/社交与导出状态；完整schemas/examples随目录同步。BFF-LOGIN单列登录契约，B06及四站真实验收未完成；不能据契约文件或B01–B05勾选推断产品已验收。

## 阅读顺序

README → REQUIREMENTS → DESIGN → BFF-LOGIN → API/INTERACTIONS → IMPLEMENTATION-STATUS → IAM-INTEGRATION → ACCEPTANCE/TASKS → sources/BACKEND_TEST_DATA。源文件相对链接原样保留；遇到后端专属相对路径按下表映射，不能误认为前端缺少实现。

## 原文副本 SHA-256

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `API.md` | [API.md](./API.md) | `0699af320fe2a4cc4cfa1d475b989e1dff5147aa9bb153d626b171b00f6f82a9` |
| `FRONTEND.md` | [INTERACTIONS.md](./INTERACTIONS.md) | `3c7b565c407db48ee4d033d178ad717196f904972a585ce7cab461c69fd8e1dc` |
| `BFF-LOGIN.md` | [BFF-LOGIN.md](./BFF-LOGIN.md) | `13ea82307f6e69eb4c92054ce0386fa0be4d9cf5a242d32fbfca125fd6950f9b` |
| `REQUIREMENTS.md` | [sources/BACKEND_REQUIREMENTS.md](./sources/BACKEND_REQUIREMENTS.md) | `b1c8632602faac5b502bb0a540bbeae3ff1c2e7d7b319283fdade0d9599be599` |
| `DESIGN.md` | [sources/BACKEND_DESIGN.md](./sources/BACKEND_DESIGN.md) | `d541108413ee14ff06a174d96828f3333592739bc746e53d3db864c74d1a8d4e` |
| `MIGRATION.md` | [sources/BACKEND_MIGRATION.md](./sources/BACKEND_MIGRATION.md) | `a72a6afc456c605f42d4d2b148d5a28a43234fc707f2724755d65ecdbc388c6c` |
| `ACCEPTANCE.md` | [sources/BACKEND_ACCEPTANCE.md](./sources/BACKEND_ACCEPTANCE.md) | `4043e19084de7490e81c6a4c1b0607595351e81e1d308f89e29f1ff503714e0d` |
| `endpoint-mapping.json` | [sources/endpoint-mapping.json](./sources/endpoint-mapping.json) | `29857e7b2e754af5665126b013433e5cc4ca157889364644d9beffe51317d1da` |
| `contracts/README.md` | [sources/contracts/README.md](./sources/contracts/README.md) | `180a7a297b4132487ea0df9a1d935b2aecf36bf1dc40bd07aeacb3b98a342fe0` |
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
| `contracts/openapi.json` | [sources/contracts/openapi.json](./sources/contracts/openapi.json) | `d9beac2a5392dd6c1ab3f955806b5e75997bb8f58d0ac6c5fa527bbff2d65b0e` |
| `contracts/routes.json` | [sources/contracts/routes.json](./sources/contracts/routes.json) | `072a4a540295fb581f9e05778fd56260b5d42f546268efdaaa793466a58ca0d3` |
| `contracts/schemas.json` | [sources/contracts/schemas.json](./sources/contracts/schemas.json) | `0c8a1351e87065e1157dd7564db08d2e7c7c543277069ee7a0604194139bcd5c` |

## 2026-09-19 新增权威副本

| 后端相对路径 | 本地副本 | SHA-256 |
|---|---|---|
| `TEST-DATA.md` | [sources/BACKEND_TEST_DATA.md](./sources/BACKEND_TEST_DATA.md) | `34fa57118ddb2609be474a20658b11559a2f5ca6d0e0b61b3ec357f760175bbe` |
| `VERIFICATION-GUIDE.md` | [sources/BACKEND_VERIFICATION_GUIDE.md](./sources/BACKEND_VERIFICATION_GUIDE.md) | `ad7f00b154db22a7ee2bbef715bcb93a8bd7fd037216d1ddd80163dee6d54cf7` |

INTERACTIONS仍是后端FRONTEND的字节副本；前端进展、API消费核对与U任务是本仓库维护的实施工件。后端专属相对链接按上表源文件归属解析；例如INTERACTIONS中的TEST-DATA在前端读取sources/BACKEND_TEST_DATA.md，联调步骤读 BACKEND_VERIFICATION_GUIDE.md。BFF-LOGIN 前端副本保留跨仓库路径措辞，与后端原文不完全逐字节相同，不以本次未改契约内容为由覆盖。API/OpenAPI/schema/JSON示例本轮不改契约内容。

编号：前端补充验收为 P24–P26；后端 A24–A26 与测试数据 D01–D05、DESIGN D01 的区分见 BACKEND_TEST_DATA / BACKEND_ACCEPTANCE。

## 对接边界

- 选择器遵守已发布列表及purpose白名单，没有独立/candidates；平台选择不展示租户部门。
- 审计导出未发布路径时不提供可操作按钮；成员导出已发布状态接口，必须完整轮询并下载重验。
- 不整体保留旧PMS辅助调用；依据endpoint-mapping逐项核对账号/本人/字典/发号/社交、安全/OSS和Member归属。
- RJson包装中的领域类型及实际HTTP仍须核对；不使用any、假路径或假成功填补缺口。
- 菜单种子/viewPath、BFF新接口、四站点配置与全部权限行为必须真实联调。implemented只表示控制器接入。
- 历史MIGRATION副本只用于保留处置记录；本轮按全新系统启用，无旧库迁移门禁。
