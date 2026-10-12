# 设计

保留四个 `src/pages/{credential-policies,account-protection,access-protection,sessions}/IndexPage.vue` 的注册与 URL。凭证后端只有列表读取接口，共享一次列表查询并仅懒挂载当前类型表单，不调用前端历史遗留但后端未实现的 GetPolicyConfig。登录失败维度使用现有单项读取接口，Query key 包含维度与 `securityQueryContext`，enabled 同时检查页面读取权限及当前 Tab。写入只失效相应数据，移除失效后重复手工 refetch。其他面板继续使用 `useSecurityTabs` 的懒挂载与 `useActiveSecurityRead` 门控。

内联配置采用 `InForm :editing` 与 `InDetailField :value`；公共的页面私有编辑状态处理负责草稿快照、取消和权限变更。访问防护四个策略抽屉与并发策略抽屉沿用 `InDrawer` 的固定页脚及关闭保护，默认详情模式，编辑后显示取消与保存，删除仍检查精确权限。输入控件仅在编辑态需要时挂载，避免目录选择器预览时请求。公共路径预览组件展示方法与路径，不复用可变的路径编辑器。

页面私有样式在 security 插件内统一，采用 Token 间距、min-width/min-height:0、响应式网格、可折行操作区。访问防护/会话混合表单与列表的页面使用 contained 容器：当前表单拥有滚动区域，表格面板填充剩余高度；不修改全局设计系统。

单项读取接口见 [API.md](./API.md)。兼容性：仅调整交互及取数粒度，不修改请求/响应、业务约束、路由或授权关联。
