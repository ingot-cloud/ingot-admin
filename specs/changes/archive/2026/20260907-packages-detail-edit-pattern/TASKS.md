# 任务：详情查看/编辑标准

> `[P]` 表示可与其他 `[P]` 任务并行执行。

## 准备

- [x] 确认本 change README 状态为 `approved`（开工后改为 `implementing`）
- [x] 阅读本 change 的 [API.md](./API.md) 与 [REQUIREMENTS.md](./REQUIREMENTS.md)
- [x] 阅读 [CONSTITUTION.md](../../../CONSTITUTION.md) 与 [ingot-coding-standards](../../../../.agents/skills/ingot-coding-standards/SKILL.md)
- [x] 确认 DESIGN.md 的页面路径与对接映射

## 实现

- [x] 新增详情相关 Token（Tab 墨条、大号头像、详情抽屉宽度）
- [x] [P] 升级 `InBizTabs` 墨条与 `before-change`
- [x] [P] 新增 `InDescriptionList` / `InDetailIdentity`，`InAvatar` 支持 `size`
- [x] `InDrawer` 增加 `layout="pinned"`；新增 `InDetailDrawer` 与 `useDetailEditSession`
- [x] 成员页拆分 `CreateDrawer` / `DetailDrawer` 并接入壳层
- [x] 注册全局组件、导出 hook、更新组件 README
- [x] 公共确认框：`openConfirmDialog` / `Confirm` 统一样式；`InDialog` 支持 `#icon`、`showClose`、全屏居中
- [x] 下拉菜单统一为无箭头、无分割线、6px 圆角与 overlay 阴影

## 验证

- [x] 满足 REQUIREMENTS.md 验收标准
- [x] 对接行为与 API.md 一致
- [x] 相关单元测试通过
- [x] 手动或浏览器验证成员详情主路径（本轮以组件测试覆盖，未连后端实机登录）

## 收尾

- [x] 验收通过后再更新 `current/` 并归档
