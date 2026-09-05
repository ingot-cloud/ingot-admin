# Phase 07：全局左侧导航补强

> 本阶段由 2026-09-05 飞书管理后台实测新增。用户已确认开工；change 延续 `implementing`，视觉确认前不得改为 `validating`。

## 准备

- [x] 用户明确确认 Phase 07 可以开工；本次“先增加 spec”不视为施工授权。
- [x] 只读取本 change 的 `API.md`、`REQUIREMENTS.md` 与 `DESIGN.md`，不得依据已清空 inbox 重新扩展范围。
- [x] 记录 `layout.main`、`InMenu`、`InSubmenu`、`InMenuToggle`、`useShellLayout` 和侧栏偏好状态的现有公开契约与调用点。
- [x] 建立飞书实测基线：236/52px 面板、244/60px 外层占位、40px 菜单行、44px 固定控制、8px 底部间距。

## 结构与滚动所有权

- [x] 将 `InMenu` 明确拆为 `MenuScrollViewport` 与 `NavigationControl` 两个 DOM 兄弟区域。
- [x] 仅由 `MenuScrollViewport` 承担纵向滚动；禁止把底部控制放入 `ElScrollbar` 或依赖 sticky 偶然固定。
- [x] 设置 12px 菜单内容顶部、18px 底部清空区、44px 控制区和 8px 底部间距，确保最后一个菜单项不被覆盖。
- [x] 保证侧栏全高链路 `height: 100%; min-height: 0; overflow: hidden`，不产生框架级横向滚动。
- [x] 在至少 600px 菜单内容和 374px 菜单视口下滚动至 200px 以上，断言控制区坐标与焦点位置保持不变。

## 视觉与层级

- [x] 对齐 8px 左画布沟槽、236px / 52px 面板和 244px / 60px 主内容偏移；侧栏与画布同色且无常驻右边框。
- [x] 对齐 40px 行高、2px 垂直间隔、8px 圆角、20px 一级图标、44px / 72px 两级文字起点。
- [x] 对齐默认、hover、active 的文字和背景 Token：`#646a73`、`.06` hover、`.05` active、`#1f2329`/500 active 文字。
- [x] 收缩态只保留一级图标和一级活动底色，隐藏并禁止聚焦标签、徽标、箭头和子级节点。
- [x] 将桌面控制文案统一为“收起导航/展开导航”，图标 20px、文案 14/20px；控制区上方保留 1px 分隔线，线与收起按钮间隔 8px；菜单文案不可选中复制。
- [x] 对齐控制 hover 的 `.08` 中性背景和 6px 圆角，并补齐 pressed、disabled、focus-visible、暗色主题状态。

## 收缩与响应式交互

- [x] 使用同一 300ms `cubic-bezier(0.25, 0.1, 0.05, 1)` Token 同步动画外层占位、导航面板和主内容；减少动效模式近乎即时。
- [x] 桌面收缩态禁用 Element Plus 默认 collapse popper；带子级分组图标不临时展开侧栏，一级叶子仍保持原路由语义。
- [x] 复用现有桌面展开偏好并验证刷新、路由切换和 keep-alive 后保持，不新增重复状态源。
- [x] 保持小于 1024px 的 overlay 为独立模式：始终 236px，按钮文案“关闭导航”，支持 Escape、遮罩和按钮关闭，且不覆盖桌面偏好。
- [x] 清理桌面重复导航开关；`InMenuToggle` 如仍保留，只服务 overlay，并与底部控制共用状态和可访问文案。

## 自动化与视觉验收

- [x] [P] 为菜单区/固定控制区 DOM 结构、滚动所有权和底部坐标不变补充单元或组件测试。
- [x] [P] 为 236/52px、244/60px、菜单行、层级缩进、hover/active 和控制区 Token 补充契约测试。
- [x] [P] 为持久化、收缩态焦点裁剪、一级叶子导航、分组无 popper 和减少动效补充交互测试。
- [x] [P] 为 desktop / overlay 状态隔离、Escape、遮罩关闭和重复开关清理补充回归测试。
- [x] 新增长菜单 fixture，覆盖多级、徽标、超长文案、活动子项和短视口滚动。
- [x] 更新组件 README、Token 文档、fixture 和迁移说明，不修改业务路由或菜单数据。
- [x] 运行 admin-core type-check/test、packages build、admin app build、lint 和 boundaries 检查。
- [ ] 在 1440×900、1280×720、1280×500、1024×768 和小于 1024px overlay 完成视觉与键盘检查。
- [ ] 取得用户对全局左侧导航的视觉确认后，才允许 foundation 进入 `validating`，并解锁关联 rollout。
