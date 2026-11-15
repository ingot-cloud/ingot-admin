# F14 组织恢复与AT-only名额修复验收

2026-11-15。双仓Spec/任务先approved后实施；最终审查P1组织恢复与P2 AT-only/REJECT名额问题已修复。57项定向包含于八模块418项回归，全部通过、零失败/零跳过；最终三VM实际HTTP/Chrome验收40组通过。A13/V02重新收口仅限本地/三VM功能安全范围。**性能仍未通过，独立Spec继续阻断发布；目标环境验收另留。** 不提交、不归档、不更新current。

[脱敏明细与制品](LEDGER-F14-RECOVERY-AT-ONLY.json) · [验收矩阵](ACCEPTANCE-A01-A13.md) · [F13原验收](LEDGER-F13-OAUTH-REVOCATION.md) · [独立性能Spec](../../../active/20261115-security-session-ledger-performance/README.md)

## 修复与兼容

- R01：组织resume改用既有RECOVER_SESSION；IAM只读账号检查在行锁外执行后，Auth最终事务重查凭据代次、scope和固定结果。普通READ_SESSION和业务AT保持原租户撤销范围；不再以通用verify冒充恢复。BFF仍校验绑定/指纹并只写同一Cookie，错误无Cookie。
- R02：AT撤销同时核对固定sid全部已登记AT/RT（包含历史AT），保留未过期ACTIVE/PENDING凭据；耗尽时退休原sid、仅关闭仍指向原sid的root，释放并发名额。既有retire/outbox保证撤销持久化，不改变期限、凭据栅栏和并发新登录；RT固定族撤销不放宽。

只有Auth/BFF各一个业务类及三个测试文件变化，前端产品未变；无DDL、迁移、新接口、grant、配置或序列化变更。四jar/两端静态摘要及六JVM实际部署见JSON。Auth/BFF协调部署，不将旧BFF混跑视为修复完成；回滚不能选择已知恢复/撤销缺陷版本，不复活已撤销身份。新增AT固定sid扫描的性能影响归独立专项，未宣称容量通过。

## 新边界真实复验

两个方向各一组组织恢复：真实A登录、切B提交后实际丢弃成功回包（浏览器500、无Cookie），跨节点resume恢复同一结果；随后在严格恢复的IAM成功回包处暂停，在A真实改密并等凭据栅栏ACTIVE，再放行恢复。恢复401且无Set-Cookie；两节点重试均拒绝，B普通me/profile保持200、原Cookie/token/截止不变，固定操作只有一个结果，新密码重新登录成功。均在60秒恢复窗内完成，不以过窗代替凭据拒绝。

AT-only专用真实客户端不签RT；最后阶段将两Auth私有策略配置为local、overflow=REJECT，由UNIQUE客户端约束单会话，并分别重启确认生效。两个方向各两组：先证明第二次密码登录400 concurrent_session_limit；撤销唯一AT 200后旧AT401、原sid/root终态、截止不变，新登录200。暂停迟到的旧AT重复撤销，让新登录先完成，再释放，两个Auth及Gateway均保留新身份与期限；实际撤销/新登录竞争按合法先后次序拒绝或成功，ACK后显式测试重试成功，不保留空凭据名额。该显式重试属于验收夹具，不新增产品自动重放。

## 回归与证据范围

57定向中新增8用例；418相关回归包含57及3项强GR，真实Redis主体序列化/部门不可变、MySQL与JWT/OAuth UTC/数字时间显式执行。GR计划内换主后同3项再次通过，总6次执行/3唯一，不叠加418计数。

40组为RT18、AT4、BFF安全9、A→B→A1、平台2、新组织恢复2、新AT-only/REJECT4。真实RT族/旧AT、错位绑定注销/并发新登录、Auth/BFF重启、计划内GR换主和原截止均补验。前端658及历史焦点/双标签/首菜单、candidate10长期RT/灾难恢复等按原版本复用，不冒称本轮重跑全部历史批次；未执行独立性能和无关可选IAM测试。

首轮定向筛选仅作用于最后BFF任务，使Auth附带GR在专用库初始化前失败；保存失败并修正临时编排，57及418整组重跑通过。首次JVM就绪检查遇临时/dev/shm默认磁盘健康阈值，真实账号验收前按F13私有夹具恢复128MB并重启；数据库/Redis/账本门禁未放宽。回归组件库在启动六JVM之前清理，完整应用GR历史保留。原审查两个MySQL反例对应旧调用链；R01本轮验证替换后的严格恢复入口，不宣称原通用verify断言转绿。反例及上述夹具记录见JSON，均未计通过。丢切换成功回包的首轮夹具预期502，而Gateway实际返回500，已按实际传输行为校正后重跑，不修改产品处理或安全断言。

停六JVM后，三GR成员ONLINE、同视图/同REQUIRED实例，BEFORE_AND_AFTER、flush1/sync1/ABORT_SERVER、零BLOCKED/未决IAM变更、九Auth表加IAM结果表十表校验和一致。临时资源和凭据已清理，三VM恢复原Stopped及3/2/2GiB；共享资源保留。三VM同一物理宿主，不证明物理容灾或性能。

客户CA、真实休眠/隔天、目标部署/监控及首次恢复仍由[目标发布验收](../../../../../../ingot/specs/changes/active/20261031-security-same-origin-release-acceptance/README.md)承接。主change保持validating，性能独立draft/发布阻断不变。

最终静态复核：双仓90份JSON、282处相对链接、13组同步工件/批准章节一致；JWT及新增公开原始凭据字段零匹配，私密文件剩余0。四jar/双端manifest匹配F14，历史F12失败与F13证据未改，双仓diff检查通过、暂存区为空。三VM已只读复核Stopped及3.0/2.0/2.0GiB。
