# 设计

## 页面与契约

- 修改 `plugins/org/src/pages/iam/workbench/IndexPage.vue`；保持既有路由。使用 InPageFrame page，复用宿主外壳。按 2026-10-30 用户验收修正，工作台不渲染独立 InPageHeader 和说明条，组织概况直接位于工作区顶部。
- `useOps.ts` 使用 Vue Query 读取 API.md 的汇总接口，Query key 包含当前域、租户、成员及 contextEpoch/授权版本；不使用跨上下文 placeholderData。只在租户上下文有效时请求，KeepAlive 激活时刷新。
- `api/iam/workbench.ts` / `models/workbench.ts` 承载契约。样式放工作台私有组件，不改全局主题。
- `table.ts` 定义统计标签等页面配置及类型化菜单扁平化 helper；递归继承 applicationId，保留 icon，排除自身/目录/重复 path。不以路径硬编码 icon。
- 2026-10-30 用户要求工作台位于导航首位：由后端 `org.iam.workspace` 根菜单 sort_order=0 控制；前端沿用服务端排序，不另设页面特例。
- `components/WorkbenchStatistics.vue`、`WorkbenchShortcuts.vue`、`WorkbenchTodos.vue` 分别负责三模块。统计错误清空数值并给重试；无 read 指标显示“—”。待办只有诚实空态，不创建 API/列表状态机。

## 样式

- 主网格四列：统计跨三列、待办占一列；入口区跨全宽。统计和待办高度由内容决定，不复制飞书的营销区域固定高度。
- 12px gap 使用 --in-space-3；20px padding 使用 --in-space-5；12px 圆角使用 --in-radius-card-lg；40px 图标底座与 20px 图标。入口至少64px，长标题保持可读。颜色、阴影、动效与文字使用现有 Token。
- 容器不足时首行堆叠，统计变两列，快捷入口按可用宽度自适应。不引入常驻横向滚动；遵守 prefers-reduced-motion。
- 2026-10-30 再次只读测量飞书真实页面：组织概况为白色 20% 透明度底、1px 白色边框，页面右上角背景图透出淡蓝色；内部头像 48px、标题行约 52px、数据区两侧微缩进、标签 14/22px。项目采用局部 CSS 复现：画布与 surface 以 80/20 混合，右侧叠加主题主色 5% 淡色渐变，边框使用 surface；不引入飞书背景图片或硬编码品牌色。概况头像局部圆角、分隔留白与统计层级对齐参考，不改全局 InAvatar。暗色和自定义主题继续跟随既有 Token。

## 宪章符合性

业务页留 org 插件，不写入 apps，不增加插件间依赖；跨模块抽象仍使用公共包；严格 TypeScript、UnoCSS 与现有 Query、InIcon、主题协议。无全局主题修改，无新图标库，生产复用既有离线图标链路。

## 管理台默认配置修正（2026-10-30 用户指定）

- 默认颜色模式为 light，不跟随系统。共享 colorScheme 读取旧 auto、空值或非法值时归一为 light，显式 light/dark 偏好继续保留；主题开关始终保存显式值，不能因与系统当前模式相同而回写 auto。
- 颜色模式由 admin-core 统一处理，保持现有存储键、主题 ID 和明暗 Token 协议；不修改全局 Token。使用 VueUse 的颜色模式与存储能力，存储反序列化统一过滤 auto，返回现有可写布尔主题接口。
- 共享运行时及租户/平台管理台环境默认：面包屑 true、版权 false、搜索 true、水印 true。既有用户显式开关偏好仍由原持久化机制恢复；本次同时通过设置面板将当前浏览器对齐用户指令。
- 验证系统深色时的首次 light、旧 auto 归一、显式 dark 恢复，以及手动切换不会重新进入 auto；运行共享主题目标测试、类型检查与管理台构建。
