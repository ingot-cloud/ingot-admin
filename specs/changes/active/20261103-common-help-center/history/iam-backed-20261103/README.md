> 历史快照：2026-11-03用户已将IAM方案替代为首期前端静态。本目录只用于追溯，当前要求见上层README/DESIGN。

# 20261103-common-help-center：飞书式内置帮助中心

> 状态：validating

## 协作模式与元数据

- 一人全栈，前后端成套规格；创建日期：2026-11-03；需求与验收负责人：jy。
- 研发维护文档与演示截图，随功能版本发布；前端只提供阅读、检索与导航。
- 后端变更：[20261103-iam-help-center](../../../../../../../ingot/specs/changes/archive/2026/20261103-iam-help-center/README.md)。
- 2026-11-03用户确认按两份Spec开始前后端实施，并验证两端隔离、飞书式交互及配图；已获得实施授权。

## 背景与目标

租户与平台顶栏已有“帮助中心”示例按钮，缺少实际使用说明。将其接入完整帮助首页、分类、搜索与图文文章，覆盖目标发布版本全部实际可用功能。布局和交互参考飞书，保留项目品牌、主题、响应式与既有身份安全边界。

租户端只阅读租户及通用内容，平台端只阅读平台及通用内容；相同账号两端登录也不跨当前身份访问。正文、搜索索引与配图由受保护服务端接口提供，不把平台资料打入浏览器静态产物。

## 范围

包含：独立帮助插件、两宿主装配、顶栏入口、业务页使用说明、搜索首页、分类树与文章列表、全文检索结果、文章大纲及定位、配图懒加载与预览、列表返回恢复、授权业务跳转、身份/版本清理、错误与空态，以及配套内容/配图联调。

不包含：在线编辑、评论反馈/统计、AI问答、匿名文档站、多语言、租户自建文档、历史版本浏览、工作台新增帮助卡片或顶栏原功能搜索融合。现有业务页仅接入说明入口，不调整业务操作流程和其他active变更状态。

## 输入来源

- 2026-11-03 本对话已确认的方案及用户提供的飞书管理后台截图；本次未消费或清空inbox。
- 本目录 [API.md](./API.md)、[CONTENT.md](./CONTENT.md) 从后端同名权威工件复制，不独立演进；本地实现阶段只读本change，不依赖inbox。
- [飞书帮助中心](https://www.feishu.cn/hc/zh-CN/)、[使用飞书帮助中心](https://www.feishu.cn/hc/zh-CN/articles/360049067685)、[管理员快速上手](https://www.feishu.cn/hc/zh-CN/articles/360044088133)：2026-11-03参考首页、左分类树、图文文章与阅读交互，不构成复制品牌/正文的要求。

## 工件

- [需求与验收](./REQUIREMENTS.md)
- [前端设计](./DESIGN.md)
- [飞书风格、交互与图文验收](./UX.md)
- [接口副本](./API.md)
- [内容与配图规范副本](./CONTENT.md)
- [任务与决策](./TASKS.md)
- [实施与验收记录](./ACCEPTANCE.md)

## 依赖与并行变更

- [项目宪章](../../../CONSTITUTION.md)、[顶栏基线](../../../current/packages/app-header/spec.md)、[同源登录](../../../current/ingot-login/password-login/spec.md)、[平台能力](../../../current/base/platform-capabilities/spec.md)、[我的下载](../../../current/packages/download-center/spec.md)、[成员与部门](../../../current/org/members-departments/spec.md)。
- [IAM主变更](../20260913-base-iam-admin/README.md)、[租户工作台](../20261030-org-tenant-workbench/README.md)、[字段策略](../20261027-org-field-policy/README.md)、[移除通讯录浏览](../20261024-org-remove-directory-browse/README.md)、[授权审计](../20261024-base-authorization-audit-readable/README.md)。正文/截图按目标发布实际核实，不能把待验收状态改成已交付。
- 顶栏入口延续既有小部件收纳；不修改原“搜索功能导航”的用途。

## 完成记录

- 完成日期、提交或PR、实际差异：未发生
- 预期current：`common/help-center`，仅验收后更新
- 取消原因：无

## 当前验证状态

2026-11-03程序实现及定向自动化、双端构建和受控浏览器验证完成，进入validating。用户已明确真实操作截图后补；真实账号Gateway/BFF联调、逐篇实操、必要截图及目标环境发布/回滚仍未验收。正式内容发布门禁保持启用，未更新current、未归档、未创建commit。
