# Phase 02：platform 与 org

## Platform

- [ ] 迁移 `platform/admin/user`。
- [ ] 迁移 `platform/config/app/home` 与 `platform/config/app/detail`。
- [ ] 迁移 `platform/config/dict`、`menu`、`permission` 与 `role`。
- [ ] 迁移 `platform/develop/client`、`id`、`qrcode` 与 `social`。
- [ ] 复核已试点的 `platform/dashboard` 与 `platform/org/tenant`。

## Org

- [ ] 迁移 `org/contacts/auth`。
- [ ] 迁移 `org/contacts/dept`。
- [ ] 迁移 `org/contacts/role`。
- [ ] 迁移 `org/contacts/structure`。
- [ ] 复核已试点的 `org/contacts/user`。

## 阶段验证

- [ ] [P] 执行 platform 页面权限、查询、分页、创建/编辑和详情回归。
- [ ] [P] 执行 org 树选择、双栏滚动、用户/角色/部门操作回归。
- [ ] [P] 验证所有 List/Split List 使用 contained 模式、260px 可折叠左栏、`InTableActions` 和稳定 `tableId`。
- [ ] [P] 为代表性 List、Detail、Split List、Tool 页面生成视觉基线。
- [ ] 清理触碰文件中被共享组件替代的通用硬编码样式。
