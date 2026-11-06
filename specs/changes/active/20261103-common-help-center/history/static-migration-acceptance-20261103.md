# 静态方案验收记录

2026-11-03：用户明确将首期改为前端静态说明。本轮调整和定向验证完成，状态validating。历史IAM方案工件保存在history，不作为本轮静态方案通过证据。

## 实现结果

42篇正文和4张原创概念图已迁至前端：common 4篇，租户18篇，平台20篇。租户内容入口组合common+tenant，平台组合common+platform；保留29项业务页面映射。普通Markdown、TypeScript元数据和图片均由既有Vite机制处理，无生成步骤或额外构建依赖。

保留飞书式页面、搜索/分类/章节和配图预览。运行态读取HelpContentProvider，本地检索和分页，无help HTTP请求、Base64传输、Blob URL或409恢复。静态图片按视口/预览需要加载，并根据真实img load/error显示进度、失败和重试。

IAM新增的帮助Java、DTO、控制器、错误码、测试、Gradle任务、Python工具和旧生成资源已移除。后端业务代码与本次帮助变更前一致，仅保留取消归档及索引记录。

## 自动化与构建

环境：Node 22.17.0、pnpm 10.12.4，本机Chrome；后端使用现有Gradle 8.14.5。未创建commit。

| 验证 | 结果 |
| --- | --- |
| help插件 | 6个文件、21项通过：本域引用、本地排序/分类/分页/NFKC高亮、无HTTP读取、身份晚到/改密清理、稳定章节、净化、原图/缩略图加载失败重试和预览交互 |
| 两宿主实际内容 | 每端2项、共4项通过：22/24篇当前域+common、12/17项绑定、所有文章/图片/关联引用可读、另一端专属词不影响结果 |
| 类型与lint | help插件及两宿主type-check通过；新增/调整代码定向ESLint无错误或警告 |
| 分层 | pnpm check:boundaries通过 |
| 前端制品 | 两宿主build-only通过，使用普通前端构建，无preview或内容生成参数 |
| IAM清理 | 普通compileJava、processResources及tasks --all通过；未传helpContentPreview/helpPython，任务列表无两个帮助task，主编译目录无旧help类 |

复核命令（前端仓根目录）：

```sh
pnpm --filter @ingot/help-plugin test:unit
pnpm --filter @ingot/admin-app --filter @ingot/admin-platform-app exec vitest run src/help/__tests__/content.test.ts
pnpm --filter @ingot/help-plugin --filter @ingot/admin-app --filter @ingot/admin-platform-app type-check
pnpm check:boundaries
pnpm --filter @ingot/admin-app --filter @ingot/admin-platform-app build-only
```

后端复核：

```sh
./gradlew :ingot-service:ingot-iam:ingot-iam-provider:compileJava \
  :ingot-service:ingot-iam:ingot-iam-provider:processResources \
  :ingot-service:ingot-iam:ingot-iam-provider:tasks --all --console=plain
```

## 实际产物隔离

[扫描记录](../evidence/static-content-isolation.json)：admin检查376个制品，18篇租户正文与4篇通用正文存在，20篇平台正文缺席；平台反向检查558个制品，20篇平台与4篇通用正文存在，18篇租户正文缺席。检查原文与JS转义形式，未发现另一端原图/缩略图字节或文件。

租户包只有2个租户帮助PNG；平台包只有6个平台帮助PNG，均带hash路径，无交叉资产。旧方案“前端包不含任何帮助正文”的检查已成为历史；当前要求是本域内容随前端发布、另一域内容缺席。

## 浏览器结果

使用真实双端生产制品，在独立loopback端口19081/19082验证。临时夹具只提供演示登录bootstrap，不实现任何help端点；未登录真实系统、未修改真实账号或服务，验证后关闭夹具。

- 两端首页/分类展示各自静态编排，租户“导入”返回2篇并高亮。
- 同一演示账号在平台搜索“OAuth客户端”返回1篇，租户返回0篇；租户直接打开platform-accounts显示“当前端没有此篇说明”，不探测另一端。
- 角色概念图缩略图按需读取，打开预览后原图实际加载成功（naturalWidth=1280），100%→125%缩放正常；Esc关闭并恢复图片按钮焦点。
- 浏览器控制台无本轮错误/警告。[请求记录](../evidence/static-browser-requests.json)中GET API仅为既有bootstrap，help读取请求为0。静态原图地址为当前站点的hash资源，无Base64或Blob。

本轮截图：[租户首页](../evidence/static-tenant-home.jpg)、[平台首页](../evidence/static-platform-home.jpg)、[本地搜索](../evidence/static-tenant-search.jpg)、[静态原图预览](../evidence/static-tenant-image.jpg)、[跨端文章拒绝](../evidence/static-tenant-cross-domain.jpg)、[平台专属词在租户无结果](../evidence/static-tenant-platform-keyword.jpg)。

## 边界与待补

两端保证构建产物与导航/检索隔离；静态文件的可见性由站点部署规则决定，不提供逐篇服务端鉴权。阅读路由继续使用现有登录/身份/改密守卫，不能将该前端门禁当成文件访问控制。

真实账号的业务页说明/授权跳转、逐篇操作与截图核对、完整响应式/主题/键盘签收仍按此前决定待补。新静态方案不再要求IAM/BFF帮助接口或后端内容发布回滚演练；前端随自身制品发布和回滚。未来维护后台另行规格设计，本期不搭建。

当前未更新current，前端change等待用户产品验收；后端旧方案以cancelled归档，未将其未完成项记为通过。
