# Phase 02：platform 与 org

## Platform

- [x] 迁移 `platform/admin/user`。
- [x] 迁移 `platform/config/app/home` 与 `platform/config/app/detail`。
- [x] 迁移 `platform/config/dict`、`menu`、`permission` 与 `role`。
- [x] 迁移 `platform/develop/client`、`id`、`qrcode` 与 `social`。
- [x] 复核已试点的 `platform/dashboard` 与 `platform/org/tenant`。

## Org

- [x] 迁移 `org/contacts/auth`。
- [x] 迁移 `org/contacts/dept`。
- [x] 迁移 `org/contacts/role`。
- [x] 迁移 `org/contacts/structure`。
- [x] 复核已试点的 `org/contacts/user`。

## 阶段验证

- [x] [P] 执行 platform 页面权限、查询、分页、创建/编辑和详情回归。契约测试已覆盖 contained / `InTableActions` / `tableId` / 无 `@refresh`；浏览器端到端待 validating。
- [x] [P] 执行 org 树选择、双栏滚动、用户/角色/部门操作回归。契约测试已覆盖 kebab-case `node-click`、可折叠左栏和行内动作。
- [x] [P] 验证所有 List/Split List 使用 contained 模式、260px 可折叠左栏、`InTableActions` 和稳定 `tableId`。
- [ ] [P] 为代表性 List、Detail、Split List、Tool 页面生成视觉基线。
- [x] 清理触碰文件中被共享组件替代的通用硬编码样式。
