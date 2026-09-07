# Phase 03：member 与 security

## Member

- [x] 迁移 `member/permission`。
- [x] 迁移 `member/role`。
- [x] 迁移 `member/user` 及创建、编辑、绑定角色和重置密码浮层。

## Security

- [x] 迁移 `security/access-protection` 及各策略面板和抽屉。
- [x] 复核已试点的 `security/account-protection`。
- [x] 迁移 `security/credential` 及策略 Tab。
- [x] 迁移 `security/sessions` 的在线会话、并发策略、详情与编辑浮层。

## 阶段验证

- [x] [P] 验证 member 查询、分页、权限、创建/编辑、绑定角色和重置密码行为。契约测试已覆盖列表工具与行内分层；浏览器端到端待 validating。
- [x] [P] 验证 security 未访问 Tab 不请求、独立保存、字符串 ID、下线与危险确认行为。未改请求时机；下线确认仍在原 `useOps`。
- [ ] [P] 验证无写权限、空数据、加载失败和部分数据缺失状态。
- [x] [P] 验证成员列表和会话列表的固定页面头/工具栏/分页、行内 `…`、危险动作分层和字段显示设置。
- [ ] [P] 为 Settings、双栏和复杂抽屉生成视觉基线。
- [x] 清理触碰文件中被共享组件替代的通用硬编码样式。
