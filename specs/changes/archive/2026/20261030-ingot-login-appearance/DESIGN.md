# 设计

## 公共品牌与样式

新增无页面、无运行时依赖的静态资源包 `packages/appearance`（`@ingot/appearance`）。将 admin-core 当前的浅/深 Token、Element Plus 单向映射、带框明暗 Logo 与明暗加载 SVG 原样迁入，作为共享资源源头。admin-core 的旧 CSS 路径保留 import 转发，公开主题协议、默认 Token 值、管理台布局和自定义主题覆盖规则保持。既有读取 CSS 的校验调整到真实共享源。

admin-core、auth-plugin、两个 auth App 显式声明 workspace 依赖；Logo/加载通过包导出的资源子路径引用，Vite 打包进产物。包只含 CSS/SVG，直接交付源资源，无需构建 JS。

auth-plugin 统一导入基础 Token、深色覆盖和 Element Plus 映射。两 auth App 停止导入旧反向变量映射与旧深色覆盖，保留 App 原有局部样式。插件提供 `useAuthAppearance`，两根组件注入应用配色配置并更新 favicon；`AuthSession` 保留 `logoUrl`，增加可选 `logoDarkUrl`。

2026-10-30 用户批准配色策略增量：两个登录 App 的 `.env` 增加 `VITE_APP_LOGIN_COLOR_SCHEME=light`，支持 `auto` / `dark` / `light`。`AuthColorScheme` 联合类型作为配置契约；`useAuthAppearance` 接收该配置并对空值/运行时非法值回退 light。VueUse `useDark` 使用 `storageKey: null` 禁用旧本地偏好干预，`initialValue` 取解析后的策略；auto 由 VueUse 响应系统明暗变化。默认直接浅色，不依赖系统或历史 storage。两端 README 说明配置位置、优先级及开发重启/生产重建要求。

## 页面与组件

- `plugins/auth/src/components/AuthPageShell.vue`：共用品牌区、CSS 几何装饰、主内容、版权，默认网格两栏；1024px 以下单栏。使用 min-height:100svh 与正常文档流，避免固定高卡片及绝对定位正文。
- `AuthBrandLogo.vue`：消费宿主提供的明暗 Logo，CSS 依据 html.dark 选择；默认加载资源来自共享包。
- `AuthPageLoading.vue`：显示同款动态 SVG 与语义遮罩，不改变请求状态。
- challenge `IndexPage.vue`：保留事务及 READY/SELECT_TENANT 分支，仅以共享 Shell 包裹表单。
- `PasswordView.vue`：语义 form、可见 label、自动填充属性、独立忘记密码按钮；loading 时禁重复提交，登录处理仍调用原 usePasswordLogin。
- `LoginInput.vue`：统一控件颜色、48px 高度、6px 圆角和焦点框，不再屏蔽错误/焦点颜色。
- `SelectTenant.vue` / `TenantItem.vue`：原有候选与选择调用保持，返回与候选使用原生 button，标题/列表使用弹性布局及限高滚动。
- errors `IndexPage.vue`：使用共享 Shell、品牌图标及 ElButton，错误说明可换行自然滚动；保留原错误文案和 startUrl 返回。
- `plugins/auth/src/styles/`：登录专用尺寸/装饰变量、基础样式与局部挑战浮层外观覆盖；验证图片、滑块计算和安全逻辑仍由原组件承担。

登录标题及描述继续消费宿主环境配置。旧 loginBanner/errorImage 配置与 AuthAppearance 字段保持兼容；新默认外观使用 CSS 品牌背景及品牌错误图标，不依赖旧图/外部错误图。静态二维码入口继续隐藏。

## 兼容与交付

不改路由、API、Cookie、事务参数或 BFF/认证状态机；部署仍为四站。外观回退可回退本 change 的前端资源版本，无数据迁移。仅处理此次视觉范围，不触碰现有工作台未提交改动。

本次不新增业务自动化测试。资源迁移涉及已有校验的读取位置一并修正；执行必要静态/构建检查。用户负责页面与登录流程测试，未获验收前不声明 completed。

## 宪章符合性

页面留在 auth 插件；跨 App 静态抽象位于 packages，不引入具体主题包或插件间依赖。沿用 Vue3、严格 TypeScript、Element Plus、UnoCSS，组件私有外观用 PostCSS，公共颜色与尺寸消费 Token。登录页面没有表格，不创建空 table.ts。
