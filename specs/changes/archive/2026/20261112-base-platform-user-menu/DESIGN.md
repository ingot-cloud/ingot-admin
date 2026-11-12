# 设计：平台头像菜单移除切换组织

## 实现

从 `apps/admin-platform/src/header.ts` 的 `user.menu` 显式列表删除 `InAdminHeaderBuiltinUserMenuName.SwitchOrg`。现有解析器以显式列表完整替换默认菜单，因此无需改共享组件或增加平台判断。

保留 Profile、FixPwd、Logout 三项以及对应处理逻辑。租户端 `apps/admin/src/header.ts` 和共享默认菜单不变。无 API 对接或模型变更。

## 兼容与回退

仅减少平台入口，无持久化、权限或登录协议变化。需要回退时恢复该菜单配置项。

## 验证

执行现有 `resolveHeaderConfig` 与 `InUserDropdown` 定向回归、平台应用类型检查和改动文件格式 / lint 检查；核对平台三项、租户四项菜单配置。此改动为单项声明删除，不新增复述配置的测试。

## 与 CONSTITUTION 符合性

菜单差异由 App composition root 配置，保持 apps → packages 分层；复用已有枚举和组件；无新页面、依赖或例外。

## 决策

需求为用户明确指定的平台入口移除，采用现有配置能力即可完成，无待决策项。
