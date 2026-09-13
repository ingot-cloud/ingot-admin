# 输入来源与对接边界

读取日期：2026-09-13。后端源状态 review，前端 change 状态 draft。原文按字节复制，接口真相归后端；不消费 inbox。

源目录：/Users/jy/Repositories/Github/ingot-cloud/ingot/specs/changes/active/20260912-iam-identity-access-management

| 后端原名 | 本地副本 | SHA-256 |
|---|---|---|
| API.md | [API.md](./API.md) | f75cee1aceb778d7a84be6776ee97de879b8078762d28b1f12227a8e582eb056 |
| FRONTEND.md | [INTERACTIONS.md](./INTERACTIONS.md) | a475c5229deacd6684290d357625a9d73aecbfbcf86772b5b4b22eef3dc9198f |
| REQUIREMENTS.md | [sources/BACKEND_REQUIREMENTS.md](./sources/BACKEND_REQUIREMENTS.md) | a3cd9d93ede14d18e1a8e82c467bfa3bcfd28c5f8d4ce770af43cbdb0fe24eef |
| DESIGN.md | [sources/BACKEND_DESIGN.md](./sources/BACKEND_DESIGN.md) | c61820e2eb0caea8bf6c0f40a8b2d9dc09b49056c4e836d1cfe66e43f1d03c64 |
| MIGRATION.md | [sources/BACKEND_MIGRATION.md](./sources/BACKEND_MIGRATION.md) | 473b960f8aff4a017de4be4744637c8134216b6efa974448b1c8886653135749 |
| ACCEPTANCE.md | [sources/BACKEND_ACCEPTANCE.md](./sources/BACKEND_ACCEPTANCE.md) | 910d5412560387d090570a1711a53a56214650ced4980a6a47c13d208d9f88fb |

阅读：README → REQUIREMENTS → API → INTERACTIONS → DESIGN → ACCEPTANCE → TASKS。领域细节见 sources/BACKEND_DESIGN，后端迁移边界见 sources/BACKEND_MIGRATION。所有实现需要的输入已复制到本 change。

副本中的原始相对链接沿用后端目录语境；按本表映射阅读。它们是原文证据，不是前端另一套事实源。更新副本时需记录新 SHA 与接口差异，不单方面改变权限语义。

接口仍缺完整操作 code、OpenAPI schemas、部分命令与选择器精确结构，详见 DESIGN §6；这些阻止依赖接口的集成，不阻止批准后以夹具实现视觉组件。不标记接口已上线，不由前端猜测填补。
