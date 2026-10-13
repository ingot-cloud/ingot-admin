# 设计

五个列表根容器统一使用 security-access-list-panel，局部选择器取消 security-settings__tables 原有 padding，移除组件 p-10px。列表工具栏在窄容器局部折行，避免筛选和新建按钮相互挤占。InTable 根的 Token 默认留白保持；th/td 改为无横向 padding，由内部 .cell 使用 --in-space-3 提供唯一横向留白。按最长已定义枚举标签调整 Key 类型、名单类型、触发等列的宽度，正文自由文本仍允许省略，标签不换行。

四个 table.ts 的行操作添加精确 POLICY_DELETE 权限、danger、确认描述和 onDelete；由 InTableActions 处理权限与一次确认。确认 Promise 取消或关闭时直接终止，不调用操作回调，也不向 Vue 异常处理器报告；确认未成功始终不执行危险动作。列表 handler 再检查当前权限与 ID，调用原 Delete API，成功提示并失效当前 Query 列表，失败由请求层反馈并保持列表。详情抽屉删除按钮、handler 与相关 import 一并移除。封禁审计无操作变更。

兼容性：无路由、数据、后端协议或权限码变更；InTable 共享变化仅消除重复单元格横向留白，不修改其根容器 padding。InTableActions 的取消处理落实原有确认语义，不修改已确认动作的回调执行。现有 Token 复用，无新公开 API。

宪章符合性：Vue script setup/TypeScript、UnoCSS/PostCSS、共享修复在 packages、业务在 security 插件；不新增跨插件依赖。
