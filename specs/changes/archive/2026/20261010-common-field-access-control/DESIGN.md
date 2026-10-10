# 设计

## 公共模型及职责

执行逻辑位于 ingot-access-control；无执行依赖的模型和绑定注解位于 ingot-commons，避免 commons DTO 反向依赖执行模块。FieldBinding 支持逻辑键及资源显式声明或继承可信执行上下文；PublicField 标明固定公开属性，FieldControl 声明资源和精确操作。受控 DTO 未分类属性与冲突绑定启动失败。ResourceKey 不能只用 resourceCode。

FieldCapability 保留 key/label/visibilities/editable/filterable，新增 MaskSpec，删除 sortable。角色资源定义以 visibility 与 operations 两部分冻结，执行结果保持行级 FieldAccess(visibility,editable) 并增加全局 FieldOperations。缺少已发布字段为 HIDDEN/操作 false。实现清单按精确操作分别记录响应、写入、筛选绑定；目录与清单取交集，未绑定可以保存但不能发布有效能力。

FieldPolicyProvider 隔离 IAM 本地/远程求值；FieldTargetProvider 批量提供可信对象属性；FieldWriteExecutor 在事务内加载/锁定对象之后重新 fresh 求值；公共投影支持 immutable record、分页/嵌套及集合，Jackson 属性写出前省略/替换，无实体修改。直接投影 API 给导出/RPC/任务复用；异步显式携带不可变上下文。

## 脱敏

MaskKind 为 PHONE/EMAIL/ALL/KEEP_EDGES/RANGE，统一枚举契约；MaskSpec 保存类型和参数，配置保存校验。Unicode 按 code point 处理；保留长度不能覆盖短值，异常格式使用全遮盖；null 保留原空值语义。规则属于资源当前版本，保存审计并失效；请求内同版本。时间等非文本只 HIDDEN/FULL。

## 平台和租户

平台可见性 FULL > MASKED > HIDDEN 正向合并；操作按精确 action 合并，来源独立保留范围；界面预览不导致 fresh 写求值，最终写必须与对应字段来源范围匹配。tenant 保留可见性 restriction 合并，操作规则从目标规则拆出，按 resource/scenario/viewer/action 判断；匹配规则覆盖默认后按平台上限、多匹配取交集；业务更新范围仍检查。FieldAccess.editable 是全局编辑结论、实际目标范围和非 HIDDEN 可见性的交集，MASKED 不再排除编辑。

## HTTP、PATCH 与查询

已有平台 context 泛化；新增 tenant members/context、directory/context、ops incidents/context。输出 fieldOperations 按操作和字段索引。实际属性名和 @JsonProperty 与逻辑键映射，支持 aphone -> phone。请求绑定收集 supplied keys，显式 null 为清空（仅业务允许 nullable）；缺键不改；未知字段400、权限403、版本409、依赖不可用503。写时实际提交键必须匹配 WRITE 绑定，不能因反序列化忽略而跳过。查询 GET/DTO 按 FILTER 绑定收集实际条件，在 SQL/count 前校验 filterable 和整个查询范围 FULL，不能忽略禁止条件。

首轮筛选仅现有平台显示名、tenant/directory 手机号邮箱、示例标题。排序 SQL 保留既有固定实现。加入三个只读时间字段但不增加列表/tenant 时间载荷。create 验证新目标归属；导出生成与下载重验，文件仅安全投影。

## 清单及缓存

本地注解注册表启动编译不可变；跨服务新固定内部 manifest 接口使用服务身份、受控发现名和专用签名，不伪造用户身份，不接受用户 URL，不含业务原值。策略/字段配置使用 LayeredCacheBuilder，按 current layered-cache SPEC 装配，不手写 L1/L2。派生索引用 VersionedDerivedCache(source,version)。读授权 TTL <=30秒并检查绝对到期；关闭 resilience/local floor。写事务 fresh 当前分配、资源上限及 tenant 策略；不可变固定版本可复用索引。配置/分配/身份关系提交后清本地再广播。

一次请求批量读角色版本、selector 关系、对象部门等属性；序列化阶段 SQL/RPC 为零；数据量1/20/100时授权读取次数不随行数增长。启动默认预热本节点注册资源与公共默认策略，不全量用户/tenant。本地冲突启动失败；远端预热失败记录并保持受控请求503，后续读取可重试，无旧权限降级。

## 发布与回退

同批部署 IAM/SDK服务/前端，内部授权 v2 路径不变但字段结构同步更新；新缓存契约版本隔离旧结果。更新权威DDL/种子/生成器及完整初始化，不自动执行目标库。回退整批对应版本及测试库快照，不采用单节点旧字段协议。仅验收并上线后更新 current、归档；旧 IAM active 的其他未完成任务不代勾。

## 资源字段配置验收修正（2026-10-10）

用户确认字段配置交互分析并要求「开始实施，修改一下这些内容」。本轮修正现有 P4 的配置体验，不修改 API、权限执行或保存边界；继续处于 validating。

- `ResourceEditDrawer` 使用只读摘要列表，复用权限面板背景 Token；展示名、逻辑键、支持的可见性/编辑/筛选与后端接入状态分开展示。能力目录不冒充实际授权。
- 添加入口固定在标题右侧；字段新增/编辑由私有 `ResourceFieldDialog` 完成。字段草稿深拷贝，取消无副作用；确认只改资源本地草稿，资源保存统一提交并保留 expectedVersion。已持久化字段键只读；本次新增字段及应用创建向导的未持久化字段可修改键。
- 支持本地按展示名/逻辑键搜索；新增/编辑确认后清空搜索并定位字段。未绑定字段仍可保存，绑定加载中、失败、未绑定、部分接入和已接入清晰区分。
- 共享 `BizIamMaskEditor` 为全部预设和自定义规则提供示例原文与即时脱敏结果，规则切换清理旧参数。预览按后端 Unicode code point、短值、异常格式和区间截断语义实现，仅用于配置说明。
- 区间录入以「第几个字符」和含末尾的自然编号表达，转换为 API 的 start（0 起点）/end（不含末尾）；全部表单标题、控件、说明按同一列对齐，页脚固定，长内容独立滚动。

宪章符合性：共享脱敏说明进入 admin-common，平台私有配置组件留在 platform；使用现有 InDialog/InForm 和语义 Token，不新增依赖、接口或路由。

用户截图反馈修正：后端接入行使用控件高度作为最小高度，标签与内容垂直居中；接入状态统一使用框架 `InTag` 的 value（text/tag）契约，弹窗和摘要共用组件同步替换。保持原接入状态和业务行为。
