# 首期静态帮助中心

首期直接维护前端文档，不依赖IAM帮助接口、Python、专门的Gradle任务或后台编辑系统。

- 通用说明：plugins/help/src/content/common/。
- 租户专属：apps/admin/src/help/。
- 平台专属：apps/admin-platform/src/help/。

修改Markdown正文和content.ts元数据，配图放对应assets目录，通过现有Vite导入并随该前端发布。章节使用稳定 `{#id}`，文内帮助链接使用 `help:article-id#heading`，配图使用 `help-asset:id` 并维护原图/缩略图、alt、图注和尺寸。元数据、关系和图片表均为普通源码，无生成步骤。

两宿主固定装配自己的loadContent；共享插件不导入任何端专属内容。禁止把两套资料放进共享public后在浏览器按角色过滤。前端构建检查应确认另一端正文和图片不进入当前产物。

业务页通过admin-common的BizHelpLink传canonical viewPath，动作教程可传article-id。基础注入契约在admin-core，由admin-common再导出；“前往功能”只使用当前授权菜单，不增加业务资格。

阅读入口继续走现有登录/身份/改密守卫。静态文件可见性随站点部署控制，本期不提供逐篇服务端鉴权，因此只存普通产品说明及演示图。真实操作截图按用户要求后补，不阻断普通构建。

保留HelpContentProvider供阅读层使用。未来维护后台另行设计，替换来源实现即可；当前不预建CRUD、数据库或未来HTTP接口。

当前包含42篇说明和16张辅助示意图：通用4篇、租户18篇、平台20篇。新增/纠正图提供1280×720原图及960×540缩略图，图内、图注和正文明确非页面截图。租户角色与组织共享角色使用当前权限自动生效；平台自定义角色使用固定版本，正文、标题和关键词保持一致。逐篇依据见[内容核对记录](../specs/changes/active/20261103-common-help-center/CONTENT-REVIEW.md)。
