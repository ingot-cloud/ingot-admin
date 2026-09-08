# 设计：可扩展管理台主题

## 1. 架构与目录

- 主题是无业务页面的公共扩展，不作为 InAdminPlugin 注册，不拥有业务菜单、路由、权限或服务。
- 在 `packages/admin-core/src/theme/` 集中实现协议、解析、上下文、默认主题和主题宿主相关能力，公开接口从 admin-core 导出。
- 默认主题独立组织在上述目录中，导出 `defaultAdminTheme`；核心仍可为旧应用提供默认回退，避免核心与独立默认主题包互相依赖。
- 自定义主题可以是 `packages/` 中的公共包或外部 npm 包，只依赖 admin-core 公开接口；不引入新的顶层目录类别。
- `examples/admin-theme/` 提供自定义主题包示例，包含编译入口、类型与 CSS 导出，演示配色、顶栏替换及布局重排。
- 不新增业务页面、API 模块或后端接口；前端公开接口以本文为准。

## 2. 前端公开协议

新增 `InAdminTheme`、`defineAdminTheme`、`defaultAdminTheme`；`InAdminAppOptions` 增加可选 `theme: InAdminTheme`。每个应用一次启动选择一套主题，不提供运行时主题切换接口。

| 字段 | 约定 |
| --- | --- |
| id | 必填，唯一的小写 kebab-case 标识，用于诊断与 CSS 作用域 |
| apiVersion | 必填，首版固定为 1；不匹配时挂载前报错 |
| name | 必填，主题中文或品牌展示名，不据此创建主题选择 UI |
| tokens | 可选，包含 light、dark 两组部分覆盖，键来自公开的 InThemeTokens |
| shell | 可选，Vue 布局编排组件；未提供时使用默认 Shell |
| parts | 可选，header、navigation、tabs、breadcrumb、footer 展示组件替换表 |

`InThemeTokens` 从现有 Token 集整理，覆盖基础、语义和组件层变量，值为 CSS 字符串；保留现有变量名及别名。`defineAdminTheme` 提供类型约束和基础格式校验，不开放任意 install 钩子。主题私有变量通过附加 CSS 声明并使用自身前缀，不占用公共 Token 键。

```ts
import { bootstrapAdminApp } from "@ingot/admin-core";
import "@ingot/admin-core/style.css";
import { projectTheme } from "@company/admin-theme";
import "@company/admin-theme/style.css";
import "uno.css";

// 与现有应用参数合并；appOptions 代表原有配置。
await bootstrapAdminApp({ ...appOptions, theme: projectTheme });
```

主题包必须交付编译后 JS、类型声明、CSS 和资源，声明 CSS sideEffects；Vue 和 admin-core 使用 peerDependencies，避免打包第二份运行时。消费端不扫描主题源码生成 UnoCSS，不允许依赖 admin-core 内部别名或深层路径。

## 3. Token 与明暗模式

- 保留现有 CSS 入口及默认变量，核心样式负责通用结构和 Element Plus 映射，默认主题负责视觉基线。
- 解析时以默认主题的完整浅色/深色结果为基线，分别合并自定义 light/dark 覆盖；不把自定义浅色覆盖隐式复制给深色。缺少某模式覆盖即沿用该模式默认值。
- 在挂载前校验并解析主题，在 html 写入 `data-in-theme`，通过单一受控样式节点输出浅色与 `html.dark` 覆盖。选择器应高于默认根变量，避免 CSS 导入顺序改变主题结果。
- 附加 CSS 用 `html[data-in-theme="主题ID"]` 限定作用域。主题 Token 通过协议覆盖；附加 CSS 用于主题部件与视觉细节，不重定义公共 Token 或反向覆盖 Element Plus 映射，不以核心私有 DOM 结构作为稳定接口。
- body 内 Teleport 弹层继承根 Token；继续使用单向 `--in-* → --el-*` 映射及旧变量别名。
- 统一现有 useDark 消费者，通过公开 `useAdminTheme` 返回主题标识、明暗状态及切换操作。保留现有存储键和跟随系统/显式偏好语义，初始化不依赖开关组件先挂载。
- InSwitchDark、Logo、编辑器及全局加载反馈统一接入模式来源；现有未配置主题应用仍表现为默认主题。

## 4. 路由布局与主题外壳

### 两个扩展入口

现有 InAdminPlugin.layouts 和 App 本地 layouts 扫描继续注册独立路由布局。相同布局键仍报错，主题不参与 registry 同名覆盖。

```text
layout.main → 核心布局宿主 → 已选主题 Shell → 插槽区域与页面内容
项目自定义 layout → 自己的结构，或主动组合公开主题布局宿主
```

将现有主布局入口改为薄封装，渲染公开 `InAdminThemeLayout`。该宿主内部使用主题 shell 和 parts。项目自定义 layout 可以组合此宿主，使用所在路由层级的页面出口；不组合时只继承全局 Token。

simple、iframe、external 不增加替换字段，保留功能语义；主题不影响 registry 的页面列表和后端 view_path。

### 布局编排协议

Shell 接收 header、navigation、tabs、breadcrumb、content、footer 命名插槽。核心按设置决定提供的区域内容，Shell 负责排列与容器样式，不自行重建 RouterView 或权限菜单。

- 核心内容组件拥有 RouterView、KeepAlive、滚动恢复及标准页面容器适配。Shell 必须渲染 content 恰好一次，为其提供有界且可收缩的空间；内容组件负责内部滚动。
- 核心提供公开 `useAdminShell`：只读导航模式、展开状态、可见性设置、已授权菜单和品牌信息，以及切换/关闭导航操作。复用现有 Router、Pinia 和菜单派生逻辑，不为主题创建第二套数据源。
- 默认导航、用户操作等可复用展示能力提供公开组件入口。主题替换展示部件时使用公开上下文和组件，不引用私有 store 文件。
- Shell 可以把导航改放顶部或重排区域；它仍需消费核心窄屏状态，提供可用的收起/展开入口，并按协议处理遮罩、Escape 和键盘访问。默认阈值沿用现有实现。
- parts 未配置项使用默认组件；已配置项在核心相同上下文中渲染。App 的 header-start/header-end 作为顶栏部件插槽传入，sidebar-top/sidebar-bottom 作为导航部件插槽传入；自定义部件必须转交或渲染这些扩展点，未配置 App 插槽则为空。
- 自定义主题不得绕过设置开关重新显示被隐藏区域；改变位置不改变菜单权限、页面缓存或应用设置含义。

## 5. 迁移与交付

- 抽取现有主布局和样式形成默认实现，避免默认视觉变化；固定值回归测试归入默认主题测试，新增独立的协议测试。
- admin 显式传入 defaultAdminTheme；同步 CLI/Web create-app 共用的生成逻辑，不新增脚手架选主题 UI。
- 补充主题开发指南、公开 Token 说明、Shell/部件接口与样例，说明独立布局的 opt-in 行为、CSS 作用域、明暗覆盖和发布流程。
- 独立主题包消费验证需要实际使用打包产物，确认未依赖源码扫描、私有路径或重复 Vue 实例；将示例纳入适当的类型、文档和依赖边界检查。
- 不需要后端、数据或菜单迁移。回退到 defaultAdminTheme 并移除自定义主题导入即可恢复默认配置。

## 6. 验证策略

- 单元测试：Token 合并、模式隔离、缺省值、非法 ID/协议版本、根样式应用和明暗初始化。
- 组件/集成测试：宿主与 parts 组合、shellSlots 转交、设置开关、路由缓存与滚动恢复、窄屏导航、独立 layout 不受结构替换影响。
- 视觉检查：默认与示例主题的浅深色、桌面与窄屏；覆盖列表、详情/双栏、表单抽屉、下拉、Toast 和全局加载。
- 工程检查：相关单测、类型检查、只读 lint、边界和文档检查、包构建、admin 构建、脚手架生成测试及独立打包消费测试。

## 7. 宪章符合性

| 原则 | 符合 | 说明 |
| --- | --- | --- |
| 三层架构 | 是 | App 选择主题；主题为无页面公共包，依赖方向无环 |
| 业务隔离 | 是 | 不增加业务菜单、API 或插件间依赖 |
| 类型与 Vue 规范 | 是 | strict TS、组合式 API、公开类型，不新增 any |
| 样式 | 是 | UnoCSS 优先，必要 CSS 使用 PostCSS，不新增 scss/less |
| 变更门禁 | 是 | 当前为 draft，仅生成文档；批准后施工 |
| current 真相 | 是 | 验收后更新，实施前不修改 |

无宪章例外，无待用户决策项。
