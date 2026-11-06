# 实施与验收记录

日期：2026-11-03。状态：validating。前后端程序已实现，真实操作截图及账号联调按用户要求后补，未声明完整产品验收通过。

## 本次实现

两宿主固定装配help插件，接通顶栏帮助和正式业务页说明入口。提供独立阅读布局、飞书式搜索首页、分类树、服务端检索结果、图文文章、章节目录、相关/前后篇、按已授权菜单生成的功能跳转和返回管理台。

浅蓝渐变、圆角搜索、入门卡片、蓝色树选中、三栏阅读及图文节奏遵循UX；使用Ingot品牌和现有主题Token。图片经统一认证JSON接口转换Blob，缩略图懒加载、原图按需、50～400手动缩放、适应窗口、1:1、拖动和多图方向键均已实现。退出/换身份/换版本会取消请求并撤销URL，不把正文/索引/图片写进前端包或持久存储。

内容为42篇正文及4张原创概念图，产品版本2026.11-help-preview；两域SHA-256及后端实现证据见[后端验收记录](../../../../../../../ingot/specs/changes/archive/2026/20261103-iam-help-center/ACCEPTANCE.md)。概念图不是伪造的操作界面。

## 自动化与构建

环境：Node 22.17.0、pnpm 10.12.4，本机Chrome。使用既有依赖及锁文件，未创建commit。

| 检查 | 结果 |
| --- | --- |
| help插件测试 | 4个文件、14项通过：净化/受限链接、身份域/旧响应、409上限、图片验证及URL撤销、改密、返回路径、首渲染章节定位、多图选择/缩放/原图失败重试 |
| admin-core定向测试 | 4个文件、14项通过：有效无菜单帮助访问、首次动态菜单装配保留query/hash、强制改密守卫、菜单转换与下载中心既有行为 |
| 类型 | admin-core/admin-common强制声明构建，help/org/platform/security及两宿主type-check均通过 |
| ESLint / 分层 | 新插件与受影响核心代码定向检查通过；pnpm check:boundaries通过 |
| 制品 | pnpm build:packages通过；两宿主type-check与build-only分别通过。使用core默认主题，无独立主题包需构建 |
| 静态内容隔离 | admin 370个、admin-platform 547个制品扫描无帮助正文段落、8个PNG原图/缩略图及其Base64；无source map；[扫描记录](./static-artifact-check.json) |
| 双仓副本 | API.md、CONTENT.md逐字一致 |

复核命令（在前端根目录，需使用上述Node/pnpm版本）：

```sh
pnpm --filter @ingot/help-plugin test:unit
pnpm --filter @ingot/admin-core exec vitest run \
  src/router/guard/dynamicGuard.help.test.ts \
  src/router/guard/userGuard.test.ts src/router/helper/route.spec.ts \
  src/pages/common/downloads/downloads.test.ts
pnpm build:packages
pnpm exec vue-tsc --build packages/admin-core/tsconfig.json packages/admin-common/tsconfig.json --force
pnpm --filter @ingot/help-plugin --filter @ingot/org-plugin \
  --filter @ingot/platform-plugin --filter @ingot/security-plugin \
  --filter @ingot/admin-app --filter @ingot/admin-platform-app type-check
pnpm check:boundaries
pnpm --filter @ingot/admin-app --filter @ingot/admin-platform-app build-only
```

两宿主将type-check和build-only分别执行，以避开本机run-p取消子进程时的权限错误；不能把失败的并行包装命令记成通过。

## 受控浏览器验证

真实生产前端制品运行在127.0.0.1:19081/19082，深色主题为独立19083/19084；脚本位于后端tools/help/preview_server.py，只绑定loopback。它使用真实预览内容、演示身份和BFF响应；检索夹具只用于UI，Java检索/隔离结论来自后端测试。未使用现有tenant.localhost/platform.localhost真实账号，未改变真实管理台偏好。

| 操作 | 实际观察 |
| --- | --- |
| 双端首页与分类 | 当前端标识始终可见；租户为组织/成员/权限等主题，平台为租户治理/应用配置/平台管理/安全中心/开发者等主题，无跨端切换 |
| 分类树与收展 | 文章自动展开祖先并选中；分类可进入分类页，三角独立展开；收起/展开侧栏正常，搜索无分类时清除旧选中 |
| 章节 | 点击大纲更新hash并定位操作步骤；实际滚动更新活动章节，未不断改写历史；首渲染深链在真实正文DOM出现后才观察/定位，有回归测试 |
| 搜索 | 租户“导入”显示2篇，文本高亮；“当前”共22篇，第二页2篇；打开文章后浏览器后退保留q及page=2；清空返回首页 |
| 分类筛选 | 平台“账号”24篇，选安全中心后page=1/categoryId=platform-security，显示4篇并展开对应分类 |
| 无结果 | 租户搜平台专属OAuth返回0和明确空态；该UI结论仅对应受控同域数据，真实服务隔离由HTTP测试验证 |
| 原图 | 租户角色和平台应用概念图缩略图加载后可打开原图；放大比例变化，适应窗口/1:1可用，Esc关闭并恢复图片触发按钮焦点；原图不按dark滤镜反转 |
| 无业务菜单 | 有效演示身份的bootstrap菜单为空，仍可直接进入已注册帮助路由；不能据此宣称已完成真实低权限成员验收 |
| 响应式 | 1440/1280三栏，768使用内联折叠大纲，375目录抽屉及单栏；DOM检查375页宽=375、主阅读滚动宽370，768/1280页宽也未超视口 |
| 深色 | 首页/分类/检索/文章/原图均检查；另检查375深色筛选结果，文字/边框/选中和提示块可辨，无主页面横向滚动 |

浏览器发现并修复：首次正文仍在骨架阶段建立章节观察器；搜索页保留上一篇树选中；搜索焦点重复边框。代码审查同时修复动态菜单首次装配可能丢失hash，增加定向回归。

代表性证据（图片名标宽度时与实际截图一致；desktop为默认桌面宽度）：

- [租户首页1280](../../evidence/tenant-home-1280.jpg)、[租户搜索](../../evidence/tenant-search.jpg)、[图文原图预览](../../evidence/tenant-image-preview.jpg)。
- [375首页](../../evidence/tenant-home-375.jpg)、[375文章](../../evidence/tenant-article-375.jpg)、[768文章](../../evidence/tenant-article-768.jpg)。
- [平台桌面首页](../../evidence/platform-home-desktop.jpg)、[深色首页](../../evidence/platform-home-dark.jpg)、[1280深色文章](../../evidence/platform-article-dark-1280.jpg)。
- [深色分类](../../evidence/platform-category-dark.jpg)、[深色搜索](../../evidence/platform-search-dark.jpg)、[375深色搜索](../../evidence/platform-search-dark-375.jpg)、[深色原图](../../evidence/platform-image-dark.jpg)。

截图是代表性断点/页面证据，尚未完成UX中每一页面×断点×主题的全组合签收。多图功能通过组件测试验证；当前概念图每篇一张，真实多步骤图片浏览待补图后复核。

## 保留待验收

1. 真实账号Gateway/BFF、Cookie/设备头、低权限/强制改密/暂停身份、退出/换组织/撤销和旧响应晚到的完整浏览器链路。
2. 全部教程逐篇真实操作核对及必需截图/缩略图，147项人工证据；目前4张概念图不能满足正式截图门禁。
3. 有真实菜单时业务页说明入口、“前往功能”、返回管理台及深链刷新签收，键盘全流程、触控拖图和完整视觉组合矩阵。
4. 目标环境旧后端/503/缺包/409混版与发布回滚演练。自动化恢复测试不能替代真实部署证据。
5. 用户产品验收通过后更新current并归档。当前只进入validating，不提前修改线上事实。
