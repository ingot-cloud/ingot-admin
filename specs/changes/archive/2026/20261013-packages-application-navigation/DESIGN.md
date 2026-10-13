# 设计：顶栏多应用导航

## 调研结论

- `apps/admin-platform/src/header.ts` 已设置 `source: "applications", maxVisibleItems: 2`。
- `useResolvedHeader.ts` 把 IAM 应用解析成 Action，负责现有路由与应用上下文同步。
- `allocateHeaderOverflow.ts` 已按当前应用优先分配直出项；目前导航及小部件共同使用独立更多按钮宽度。
- `InAppBarNav.vue` 已有分组标题、多列网格、hover 延迟关闭及浮层定位；溢出 Action 目前显示为单列更多列表。
- bootstrap 应用摘要已有 id、code、name、icon、sortOrder，没有业务分类字段；用户已确认本次分类通过前端配置维护。

## 技术方案

### 1. 应用配置与解析

扩展 `InAdminHeaderNavigationConfig` 的应用模式配置，新增 `applicationGroups`。分组结构包括 key、title、applicationCodes、可选 columns，列表及标题沿用现有响应式配置约定。公开类型及字段有中文注释。

```ts
navigation: {
  source: "applications",
  maxVisibleItems: 2,
  applicationGroups: [
    {
      key: "management",
      title: "管理应用",
      applicationCodes: ["example-management"],
    },
    {
      key: "tools",
      title: "业务工具",
      applicationCodes: ["example-tools"],
      columns: 2,
    },
  ],
}
```

示例 code 仅说明配置形态，不硬编码飞书分类或把虚构应用加入正式宿主。平台宿主保留数量配置，实际分类可按自身部署应用填入；无分类配置时提供“应用”兜底布局。

应用模式对直出上限归一化：缺省及非正整数回退命名默认常量 2。configured 模式沿用原先数量语义。解析结果携带应用导航模式以及分类数据，渲染组件消费解析后的结构，不直接读取注入配置或业务 store。

分类数据仅从 `navigableApplications` 的结果生成，使用 code 做匹配、id 做稳定渲染和选择 key。重复 key / code 校验遵循现有配置显式校验方式。宽度分配产生 overflowKeys 后，按这些 key 过滤分类并重新计算实际列数；过滤后空组移除。

### 2. 组合入口与测量

应用模式下将最后可见应用包装为组合入口：应用选择按钮和更多箭头按钮是同级元素，共享整体 hover 区域和背景，不嵌套 button。

箭头只在溢出应用存在时显示。整项 hover 展开应用面板，应用选择按钮仍选择自身，箭头点击只开关面板。可见项变化后箭头自动移动到新的最后一项；不改变应用的排序或优先保留规则。

测量区增加应用箭头的真实占用宽度；分配器区分导航更多入口与小部件更多按钮的宽度，并在应用模式下只增加集成箭头的宽度，不额外加入独立按钮间距。configured 导航与旧插槽单独更多仍按原来的占用计算。小部件的更多宽度保持原值。

路由或授权更新时立即按收纳规则分配入口，避免先直出全部应用再收纳而短暂卸载箭头；箭头锚点迁移时保持已有键盘焦点。测量容器裁剪溢出内容，但保留子项的实际测量宽度。关闭的导航和小部件浮层使用 display 隐藏，保留组件实例及插槽状态，同时避免已过期的浮层位置撑宽页面。

### 3. 分类面板复用

提取现有分类网格为共享私有子组件或渲染片段，用于原 Group 面板和新应用面板，避免在大组件内重复分类布局。组标题、边框、间距、图标、灰色 hover 及展开背景使用已有主题 Token。

应用面板使用 `useAppBarOverlay`：锚点为最后组合入口，左对齐，向视口边界钳制，最大宽度沿用分组面板 1080px，窄屏单列。复用实际溢出项的动态折列规则和纵向滚动限制。hover 离开后 160ms 关闭，进入触发区或面板取消关闭计时。

点击或键盘打开与 hover 打开的焦点行为分开；Escape / 外部点击关闭、卸载清理及触发器变化后焦点恢复覆盖新应用面板。面板打开期间应用列表、授权或 overflowKeys 变化立即同步内容，失去全部溢出项时关闭。

InAppBar 统一协调面板互斥，应用面板与搜索、小部件互斥。原 configured Group 和旧插槽逻辑继续可用。

### 4. 选择链路

应用面板选择 payload 仍为 `{ entryKey: applicationId }`，不伪造 Group 的 itemKey。保留 `useResolvedHeader` 的 `navigableApplicationPath` 跳转及路由驱动的 activeApplicationId，同步侧栏并保留所有已授权路由。

当前应用优先的收纳算法维持不变，选择溢出应用成功后自动晋升为直出项。hover / 打开面板不修改应用 store。

## 组件与模块影响

| 位置                                                                          | 职责                                         |
| ----------------------------------------------------------------------------- | -------------------------------------------- |
| `packages/admin-core/src/plugin/header.ts` 及公共导出                         | 应用分类配置、注释                           |
| `header/resolveHeaderConfig.ts`、`header/useResolvedHeader.ts` 及应用辅助函数 | 模式、默认数量、授权应用分类解析             |
| `header/allocateHeaderOverflow.ts`、`InAppBar.vue`                            | 集成箭头宽度、参数传递及面板互斥             |
| `header/InAppBarNav.vue` 及私有分类子组件                                     | 组合入口、分类面板、hover / click / 键盘交互 |
| `apps/admin-platform/src/header.ts`                                           | 保留集中数量配置，必要时增加分类配置说明     |
| `docs/app-header.md`                                                          | 数量默认值、分类 code 示例及交互说明         |

不新增业务路由、API 模块或持久化 store；后端 `IamApplicationSummary` 契约保持不变。

## 兼容性与回滚

- 新分类配置可选；没有配置时自动形成一个应用分组，不阻塞既有应用部署。
- 应用模式缺省上限变为 2；平台宿主已有显式 2，行为兼容。其他宿主使用 applications 时可以显式调整。
- configured 模式公共配置、原分组事件和旧插槽行为保持不变；新增解析字段为增量，并在公开类型注释与文档中说明。
- 不改 `theme.parts.header` 的替换协议，自定义主题仍可读取解析配置。
- 强制改密继续走受限解析和导航不挂载逻辑。
- 回滚本 change 的前端代码与工程文档即可，无数据迁移或后端部署顺序依赖。

## 测试与验收

1. 解析及分配单测：应用缺省上限、配置覆盖及无效值、分类匹配、授权过滤、空组、重复配置、兜底、动态变化、实际溢出后折列及集成箭头的宽度边界。
2. 组件交互回归：0/1/2/多应用、最后入口箭头、hover 跨间隙与延迟、箭头不选择、应用选择 payload、Escape、外部关闭、焦点恢复与面板互斥。
3. 集成回归：切换溢出应用后晋升、侧栏/深链接/搜索同步、configured 导航与旧插槽、强制改密。
4. 运行受影响 admin-core 测试、类型检查、只读 ESLint、Prettier check、公共包及平台管理台构建。
5. 浏览器验证桌面 1440/1920 与窄屏 390 视口：2/3/多应用、两类以上分类、长名称及图标失败，检查面板位置、视觉和测量收纳。真实环境人工验收单独记录；未通过前不更新 current。

## 与 CONSTITUTION 符合性

| 原则                    | 符合 | 说明                                                      |
| ----------------------- | ---- | --------------------------------------------------------- |
| 共享逻辑位于 packages   | 是   | 配置、分配、分类及组件放 admin-core                       |
| 宿主为 composition root | 是   | 数量和分类由宿主 header 配置                              |
| 类型安全和组件约定      | 是   | TypeScript strict、script setup、带类型的事件；不新增 any |
| 样式和响应式            | 是   | UnoCSS / PostCSS 与现有 Token，支持窄屏                   |
| 施工门禁                | 是   | 2026-10-13 用户已确认完整设计，按 approved 门禁开工       |
| current 单一事实        | 是   | 人工验收前不更新基线                                      |

## 开放问题

无未决实现分支。用户已确认分类配置来源，并于 2026-10-13 批准完整方案。
