# 设计

## 组件组合

- InTag 是通用入口，内部保留 ElTag，value 提供文字与类型；补充默认内容及可选 icon 插槽。ElTag 属性和监听器继续通过单根组件透传。
- InTagEnum 只负责枚举映射，内部使用 InTag，并转交插槽与属性。
- StatusTag 内部使用 InTag，info 映射为通用 primary；既有状态 class、文字和 SVG 图标保持，消费原 status Token 作为局部通用 Token 覆盖。业务状态包装不改。

## 统一样式与主题

- 新建全局 tag.css，通过 :root:root 提高优先级，避免按需引入的 ElTag CSS 覆盖。只消费 --in-*；统一 tag 几何、排版、五类型与效果变量。
- 默认高 24px、圆角 4px、字号 14px、字重 500；small 高 20px/字号 12px，large 高 32px。light 无可见边框、20% 类型色浅底；plain 为工作面背景与类型色描边；dark 为实色背景与白字。round/hit 保留显式作用。
- 标签内部内容与可选图标使用共同的 flex/gap 规则；关闭按钮仍由 ElTag 管理，保留焦点与事件隔离。
- 通用 Token 同步 tokens.css、tokens.ts、defaultTokens.ts，暗色颜色采用现有语义色。旧 status Token 保留为通用 Token 的兼容别名，局部覆盖保持既有主题定制；通用主题定制与暗色颜色同步作用于状态组件。
- 补齐已存在的 permission-panel-bg 在主题注册和明暗默认映射中的遗漏，不改变 CSS 的现有值。

## 影响与兼容

- 修改限于 admin-core 组件/全局样式/主题、开发门户标签示例及本变更工件。
- 业务页面中的直接 ElTag 自动继承视觉；ElInputTag 的内部布局不改。
- 门户标签示例引入真实标签主题样式，展示五类型、尺寸、效果、状态和关闭交互。
- 无接口、数据模型、路由或依赖变更；旧组件调用方式不迁移。

## 宪章符合性

共享逻辑只在 packages/admin-core；Vue 组合式 API、严格 TypeScript、PostCSS 与主题 Token；不复制到业务插件，不引入 SCSS 或品牌硬编码。未决设计项：无。
