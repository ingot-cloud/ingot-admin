# F12 历史失败：标准 OAuth RT 撤销（F13已修复）

当前结论：用户已授权F13，修复及最终包复验完成，见[F13报告](LEDGER-F13-OAUTH-REVOCATION.md)。下述为原F12发现时的评审和待确认建议；原JSON失败证据不改写为通过。

2026-11-15，最终F11制品、两Auth/BFF、三成员MySQL GR及六Redis、三台独立VM内核实测。此问题与独立性能门禁分别阻断发布；A13及相关RT撤销验收不得标通过。当前只记录事实和建议，不修改产品代码/配置/DDL，也不将以下建议视为approved。

## 实测

使用本轮独占机密OAuth客户端，从Auth0或Auth1以真实账号密码登录，在另一Auth提交标准`POST /oauth2/revoke`，Basic客户端认证、当前有效RT、`token_type_hint=refresh_token`。两个方向均得到400 `invalid_grant`；随后同一RT在登录节点仍刷新200，原AT访问真实Gateway/IAM资料接口仍200。未发生任何成功注销确认，不能描述成“成功撤销后复活”，但现有标准撤销兼容性和安全预期不成立。明细见[脱敏结果](LEDGER-F12-OAUTH-REVOCATION.json)。

最初连续3次真实RT轮换后也出现相同400；为排除自然AT过期/旧RT因素，已用新鲜独立会话双向单独复现。BFF DELETE注销与内部持久撤销另行验证，不能以其通过覆盖此失败。

## 原因分析

本机实际依赖Spring Authorization Server 1.5.3的`OAuth2TokenRevocationAuthenticationProvider`调用`OAuth2Authorization.from(...).invalidate(refreshToken)`后交给`OAuth2AuthorizationService.save`。该版本builder会同时失效RT、AT及授权码。账本`LedgerAuthorizations.save`仍走签发/刷新保存路径，其中`expiry`只接受active token；全部失效时抛出invalid_grant并回滚。此为根据当前源码及实际依赖源码推定的直接原因，未在本轮修改或断点注入产品代码。

## 建议修复与复验（待确认）

将标准撤销与派生签发保存分开，撤销须在同一权威事务持久关闭指定sid/当前root及其RT族，采用固定锁序、版本/所有权核对和幂等撤销，不依赖仍有active token或旧凭据代次；不能放宽原save准入、接受任意旧快照覆盖当前身份，不能因撤销旧sid关闭替换后的新root。未知token保持既有标准幂等成功，其他客户端不能撤销不属于自己的身份；依赖故障503，未持久确认不返回200。标准AT-only撤销遵循既有接口语义单独明确，不擅自扩大到账号范围。

补充真实MySQL定向测试及两Auth真实HTTP验证：新鲜/已刷新/自然AT过期RT；撤销后旧RT400且旧AT拒绝；重复、未知token与错误客户端；RT消费/注销/切换和新登录竞态；跨租户改密后旧凭据证明不阻碍撤销但不能派生；原截止、单结果及旧root不复活；节点重启/依赖故障。需更新并确认设计后实施，再产生新制品重跑受影响回归与多节点场景，不能继续沿用F11摘要宣称最终修复包。

按两仓SDD“实现偏离已批准设计时，先更新Spec并重新确认”，本轮不实施此新修复。A01–A13矩阵明确保留A13失败、相关RT撤销子项失败，主change保持validating，不更新current、不归档、不提交。
