# 验证记录：顶栏多应用导航

验证日期：2026-10-13。自动化及隔离浏览器验证通过；同日用户确认验收成功。current 已更新，本 change 状态为 `completed`，整体归档。

## 实现结果

- applications 模式默认直出上限 2，正整数配置可覆盖，无效值回退 2；configured 模式沿用原有语义。
- 最后快捷应用连接独立箭头，整项 hover 展开；面板按配置分类，沿用标题分隔线、多列图标与名称布局，仅展示实际溢出应用。
- 分类按授权且可导航的应用 code 匹配；空组移除、未匹配项兜底，重复 key / code 显式报错。
- 保留应用路由和侧栏同步、当前应用优先、图标回退、旧插槽及强制改密限制。
- 键盘开关、Escape / 外部关闭、焦点恢复、搜索和小部件互斥已覆盖。选择溢出应用时，箭头迁移后焦点仍保持。
- 浏览器检查发现并修复隐藏测量区和关闭浮层撑宽窄屏页面的问题；关闭浮层保留组件实例，不影响插槽状态。

## 自动化检查

在仓库根目录使用 Node 22.17.0 和 pnpm 10.12.4 执行。

| 检查           | 命令或范围                                                                                                                                                                     | 结果                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| 定向回归       | `pnpm --filter @ingot/admin-core exec vitest run src/layouts/widgets/header src/layouts/widgets/InAppBar.test.ts src/layouts/widgets/search src/layouts/widgets/user-dropdown` | 19 个测试文件，85 项通过               |
| 核心类型检查   | `pnpm --filter @ingot/admin-core type-check`；最终 `pnpm build:admin-core` 再次执行 `vue-tsc --build`                                                                          | 通过                                   |
| 只读 ESLint    | `pnpm exec eslint <受影响的 17 个源码及测试文件>`，不使用 `--fix`；自动生成的 components.d.ts 沿用工程忽略规则                                                                 | 通过                                   |
| 格式检查       | `pnpm exec prettier --check <受影响的源码、测试、工程文档和本 change 文档>`；不改写生成声明及已有规格总索引格式                                                                | 通过                                   |
| 工程边界       | `pnpm check:boundaries`                                                                                                                                                        | 通过                                   |
| 文档检查       | `pnpm check:docs`                                                                                                                                                              | 通过                                   |
| 公共包构建     | `pnpm build:packages`                                                                                                                                                          | 6 个公共包通过；最终核心包再次构建通过 |
| 主题构建入口   | `pnpm build:themes`                                                                                                                                                            | 无匹配的正式 theme，按工程脚本跳过     |
| 平台管理台构建 | `pnpm --filter @ingot/admin-platform-app build`                                                                                                                                | 类型检查及生产构建通过                 |

构建仍报告既有的 UnoCSS 图标扫描、浏览器 crypto external 和无效动态导入提示，不影响构建退出结果。没有执行全仓库无关测试；本次检查覆盖受影响的顶栏、搜索、用户菜单及公共包集成路径。

## 浏览器与视觉验证

使用现有 Chromium / Playwright，在临时 Vite 预览中挂载真实 `InAppBar`、Pinia、Router 和主题样式。预览使用 16 个隔离应用及授权菜单，配置办公应用（2 列）、人事管理、业务工具分类，并覆盖“其他应用”兜底。预览没有连接真实后端，也不改变宿主正式应用配置。

临时验证脚本位于 `/private/tmp/ingot-application-navigation/`，通过 `node verify.mjs` 执行，结果为 passed。预览服务器验证后已关闭。测试夹具添加的离线图标记录已恢复，未混入正式应用资产。

通过项目：

- 1440px / 1920px 桌面、390px 窄屏；实际溢出后的多分类、多列与窄屏单列滚动。
- 默认 2 个、配置 1 / 3 个及无效 0 回退；0 / 1 / 2 个边界另由组件回归覆盖。
- hover 整项、跨越触发器与面板之间的间隙、离开关闭；箭头显示方向和展开背景。
- Enter / Space 打开、Tab / Enter 选择、Escape 关闭和焦点恢复。
- 选择知识库后，平台治理 / 知识库直出，开发者平台进入兜底分类，路由及侧栏同步。
- 搜索、应用、小部件面板互斥；长应用名无重叠、图片图标失败回退、深色顶栏与强制改密限制。
- 浏览器未发生 pageerror；1920px 和 390px 的页面 scrollWidth 分别等于 1920 和 390，无横向滚动。

| 证据                                                    | 内容                                                   |
| ------------------------------------------------------- | ------------------------------------------------------ |
| [desktop-1440.png](./evidence/desktop-1440.png)         | 默认两项直出，最后入口箭头向上，三个分类与组内两列     |
| [desktop-1920.png](./evidence/desktop-1920.png)         | 切换溢出应用后晋升为快捷入口，未匹配应用进入“其他应用” |
| [mobile-390.png](./evidence/mobile-390.png)             | 当前应用优先、单列面板、视口内定位与纵向滚动           |
| [dark-mobile-390.png](./evidence/dark-mobile-390.png)   | 深色顶栏与分类面板                                     |
| [browser-results.json](./evidence/browser-results.json) | passed、无 pageerror、视口和面板测量结果               |

截图使用的是隔离预览页面。正文和侧栏为测试夹具；深色模式只验收实际顶栏和浮层。为独立检查导航宽度，夹具关闭既有水印；正式水印行为未修改。

## 用户验收与归档

2026-10-13，用户明确确认“验收成功，归档spec，然后提交代码”。[REQUIREMENTS 验收清单](./REQUIREMENTS.md#验收清单) 据此勾选，AN-V06 人工验收完成。验收结论来自用户确认；上面的自动化及隔离夹具证据保留各自的验证范围。

AN-F01 / AN-F02 已完成：更新 current/packages/app-header 的页面行为及关联记录，将本 change 归档至 changes/archive/2026。关联 IAM 总体 change 的其他任务和验收状态继续独立维护。实现和规格归档按仓库要求分开提交，代码提交见 README。
