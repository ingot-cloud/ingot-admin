# 设计

## 框架能力

新增 `packages/admin-core/src/components/form/InFormContent.vue`：外层 width:100%、border-box、可收缩宽度与 Token 内边距；内层 width:100%、max-width:var(--in-form-content-max-width)、margin-inline:auto。默认 Token 为 840px，登记到公开主题 Token 名单。组件仅渲染 default slot，继续由 InPageFrame 或混合页面的当前面板负责滚动，不新增滚动层。

InPageFrame 继续编排全宽 header/tabs 与 page/contained 滚动模式；InForm 继续提供预览/编辑字段语义。新容器通过既有 coreGlobalComponents 显式注册，供插件全局使用，不修改旧组件默认布局。

## 页面接入

- 凭证：IndexPage 在正文中使用 InFormContent，加载、当前策略工具栏和字段均在内层；数字/普通文本两列，特殊字符集与弱密码整行，布尔短选项可三列。
- 账号：IndexPage 使用同一容器；页级 Tab 改为 B/C 两端锁定策略，默认 B 端，每个 Tab 懒挂载独立的 LockoutPolicyPanel 和表单。已访问面板 v-show 保留草稿，隐藏面板 Query 通过 useActiveSecurityRead 门控。复用后端现有 GET /account/lockout-policies/{userType}；Query key 包含用户类型与身份上下文，保存仅失效对应 detail key。保留分组标题、说明及各自操作，保证操作与字段共用正文边界。
- 违规升级：保留 contained 根面板的滚动，将工具栏与字段包在 InFormContent 内。登录失败：嵌套维度 Tab 保持全宽，维度正文使用 InFormContent；普通字段两列，备注整行。
- security 的表格容器只对两类表单根面板取消重复 padding，其他列表不受影响。沿用私有工具栏折行与长文本换行规范。

## 规范与兼容性

新增开发文档并在 AGENTS.md 与插件开发文档中引用。后续整页配置表单显式采用 InFormContent；抽屉、列表和局部表单使用各自容器。宽度 Token 可由主题覆盖，业务页不复制像素限宽。需要分别维护的配置允许用页级 Tab 分隔；同一 Tab 内多个分组仍纵向组织。

无后端或数据升级；浏览器 URL、菜单注册、业务接口、激活请求、草稿隔离与独立保存规则保持。API 与新增组件接口见 API.md。

宪章符合性：只新增 packages 共享抽象，plugins 依赖 packages；Vue script setup/TypeScript、UnoCSS/PostCSS、语义 Token，保留现有层次和接口。
