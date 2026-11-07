# 设计：授权审计游标分页与可读展示

## 技术方案

1. **通用游标分页（admin-core）**
   - `useCursorPaging<T, C>`：维护 `condition` 与 `submitted`、`size`、游标栈 `cursors: (string | undefined)[]` 和当前页序号。
   - 对外提供 `next()`、`prev()`、`search()`、`changeSize()`、`resetSubmitted()`。
   - 数据通过 TanStack Query 获取，查询键包含 `submitted`、`size` 和当前游标，并使用 `keepPreviousData`。
   - “上一页”直接复用栈中已有的游标，不需要后端支持反向查询。
   - `InCursorPager`：包含每页条数选择、上一页、下一页和“第 N 页”文字，不显示总数。
   - `InTable` 不传 `page.total`，它自身的分页条就不会显示；游标分页条通过页面布局放在表格下方，`InTable` 本身不改。
2. **引用与格式化（admin-common）**
   - `references.ts`：`resolveReference(refs, type, id)` 返回 `{ state, name }`；找不到时按 `HIDDEN` 处理。`referenceText(type, ref)` 按状态生成名称、“无权查看的X”、“{名称}（已删除）”或“已删除的X”。
   - `display.ts` 重写：
     - `auditActor(entry, refs)`、`auditTarget(entry, refs)`；
     - `auditChanges(entry, refs)` 返回 `{ field, label, before?, after? }[]`，各值已格式化；
     - `auditSummary` 把各字段拼接为“标签：前 → 后”，用“；”分隔；
     - `auditSummaryLines` 生成悬停提示，每个字段一行。
3. **字段格式化规则**（原始值都是字符串，结构化字段先做 JSON 解析，解析失败显示“无法解析的配置”）

| 字段 | 格式 |
|---|---|
| NAME、REMARK | 原文；空串显示“空”。目标类型是批量任务、且值等于类型编码时，整个字段不进入摘要 |
| STATUS | 按状态码映射为中文：ENABLED 启用、DISABLED 停用、ACTIVE 生效、REVOKED 已撤销、LOCKED 已锁定、REMOVED 已移出 等；未知码显示原文 |
| ROLE | `role:{v}` 引用 |
| ROLE_REVISION | `role-revision:{v}` 引用 |
| OWNER_MEMBER | `member:{v}` 引用 |
| DEPARTMENT_LEADERS | before 是原主负责人的成员 ID；after 是 `{adds, removes, primary}`，格式为“新增：A、B；移除：C；主负责人：A”，省略空项 |
| RECIPIENT_SELECTION | SubjectRef（`{type, id}` 或数组）→ “成员 张三”、“用户组 研发组”；选择方式枚举 → 中文；`created`、`before`、`after` → “接收对象已调整（未记录明细）” |
| SCOPE | 分配范围、委派范围（管理员、可授角色、范围上限、最长期限）和应用人群类型。摘要只写概括（例如“范围：指定部门 研发部 等 3 项”），详情展开为多行；其中的 ID 都通过 references 解析 |
| VALID_FROM、VALID_UNTIL | 使用 `formatDateTime` 显示当地时间 |
| ENTITLEMENT | “已开通 N 个应用” |
| POLICY_VERSION | “第 N 版” |
| FIELD_CAPABILITIES | 摘要显示“字段能力配置（N 项）”，详情按字段逐行展开 |
| 未知字段 | 字段编码 + 原文 |

4. **筛选**
   - 操作者：组织端用 `BizTenantMemberSelect` 单选；平台端用平台成员选择器（复用平台人员选择候选接口，实施时确认具体组件，没有现成组件就基于 `BizIamMemberPickerDialog` 封装）。选中后传 `actorMemberId`。
   - 对象类型：下拉，候选按域给出，标签取自 `AUDIT_RESOURCE_LABELS`。
   - 对象 ID：不再提供输入框；只从路由参数读取，筛选区显示可移除的标签。

## 对接映射

| 接口（见 API.md） | 前端 | 说明 |
|---|---|---|
| GET `/v1/tenant/authorization/audits` | `plugins/org/src/api/iam/authorization-audit.ts` `AuthorizationAuditCursorAPI`；页面 `plugins/org/src/pages/iam/authorization-audit/IndexPage.vue` | 查询选项改为 `createIamCursorQueryOptions` |
| GET `/v1/platform/authorization/audits` | `plugins/platform/src/api/iam/authorization-audit.ts`；对应页面 | 同上 |

## 数据模型

`packages/admin-common/src/models/iam`：

- 新增 `AuditReferenceState`（`VISIBLE`、`HIDDEN`、`DELETED`）、`AuditReference`、`AuditCursorPage<T> { items, nextCursor?, hasMore, references }`。
- `AuthorizationAuditQuery` 不变，新增 `AuditCursorParams { limit, cursor? }`。
- `AUDIT_RESOURCE_LABELS` 补全：`directory-policy` 目录策略、`field-policy` 字段策略、`member-export` 成员导出、`member-workbook` 成员导入、`department-workbook` 部门导入。

## 组件与页面影响

- `packages/admin-core/src/query/cursorPaging.ts`、`components/table/InCursorPager.vue`：新增，并从包入口导出。
- `packages/admin-common/src/api/iam/page-options.ts`：新增 `createIamCursorQueryOptions`。
- `components/authorization-audit/`：`useOps.ts` 改用 `useCursorPaging`，并读取路由参数；`table.ts` 中变更摘要列 `minWidth` 改为 320；`BizIamAuthorizationAudit.vue` 改造筛选、摘要单元格（两行截断 + 多行 `el-tooltip`）；`AuditDetailDrawer.vue` 接收 `references` 并改造各行；新增 `references.ts`、`formatters.ts`。
- 测试：`useOps.test.ts`、两个插件的 `authorization-audit.test.ts`、`apps/admin-platform/e2e/authorization-audit.spec.ts` 同步更新；新增格式化器和游标分页的单元测试。

## 与 CONSTITUTION 符合性

| 原则 | 符合 | 说明 |
|---|---|---|
| 依赖方向 | ✅ | 通用分页放在 admin-core，IAM 展示放在 admin-common，插件只负责 API 和页面入口 |
| 插件互不依赖 | ✅ | 平台与组织各自声明 API，共用 admin-common 组件 |
| 时间契约 | ✅ | 发送使用 `toApiInstant`，展示使用 `formatDateTime` |
| 已选回显 | ✅ | 操作者筛选沿用成员选择器的标签回显 |

## 备选方案

- 前端根据 ID 逐个调用详情接口补名称：会产生 N+1 请求，并且需要逐类判断权限，不采用。
- 后端直接返回中文摘要：会让枚举本地化和交互格式分散在后端，平台端与组织端难以定制，不采用。

## 开放问题

- [ ] 平台端操作者选择器复用哪个现成组件（实施时确认）。
