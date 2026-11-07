# 设计

删除范围见 `removed-files.json`，逐文件记录原哈希。platform 删除 config、admin/user、org/tenant 旧子图，org 删除 contacts 旧子图与专用 API；当前页面位于各插件 iam 目录。移除空的旧全局组件注册。admin-common 未使用的 TenantSelect/PMS 查询退出，Client 选择器回归继续保留。admin-core 未被 bootstrap/鉴权流程调用的旧 PMS 用户 API 退出，现用 store 模型保留。

只删除声明文件中明确引用已删除文件/导出的行，保留用户已有差异；不执行全局生成覆盖。

## 宪章符合性

保持 apps/plugins/themes/packages 依赖方向；不新增公共业务入口；正式菜单、URL、权限码和时间处理不变。清理依据是现行 IAM 基线与代码消费者，历史归档文档不全局替换。
