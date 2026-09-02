# 20260902-packages-admin-feature-app-split

> 状态：implementing

## 协作模式

架构重构；需求和设计来自 2026-09-01 至 2026-09-02 的对话确认，不涉及新增后端接口。

## 背景与动机

当前 `apps/admin` 同时承载平台控制面、安全中心、组织管理和会员管理，虽然已经通过
`adminPlugin` 支持构建期组合，但 `target-project` 只能整体依赖 `@ingot/admin-app`，无法按业务需求
选择前端能力。业务页面、API、models、stores 和 Biz 组件还集中在同一个源码根中，并通过
`@base` 互相引用，模块边界不清晰。

本变更把上述能力拆为四个可独立运行、也可作为构建期插件组合的官方 App，同时保留
`apps/admin` 作为全量管理台宿主。

## 目标

- 提供 platform、security、org、member 四个独立官方 App 和插件。
- `target-project` 仅声明所需插件依赖，未选择的业务页面不进入构建产物。
- `security` 可单独选装，不因租户或 OAuth Client 查询能力而依赖整套 platform 页面。
- `apps/admin` 继续提供四类能力齐全的管理台入口。
- create-app 默认选择 org，允许任意选择官方业务插件。
- 新页面键按业务域稳定命名，同时兼容现有动态菜单中的旧页面键。

## 范围

### In Scope

- 新建 `apps/platform`、`apps/security`、`apps/org`、`apps/member`。
- 迁移对应的 pages、api、models、stores 和业务组件。
- 新建无页面共享包 `@ingot/admin-common`，承载跨业务 App 的管理域查询能力。
- 将无业务接口依赖的通用组件收敛到 `@ingot/admin-core`。
- 新增统一页面注册 helper，扩展官方 App 的 Vite 源码解析。
- 保留 `apps/admin` 作为全量组合宿主，更新 `target-project` 和 create-app。
- 删除 `@ingot/admin-app/plugin` 与 `adminPlugin`，仓库内使用方一次性迁移。
- 增加 App 边界检查、插件组合测试和独立构建验证。

### Out of Scope

- 运行时远程加载、Module Federation 或微前端。
- 修改现有业务接口的路径、请求字段或响应字段。
- 修改后端菜单接口的 wire shape。
- 自动在前端隐藏后端错误返回的未安装插件菜单。
- 拆分 `apps/auth` 或改变登录协议。
- 本次顺带重做现有业务页面交互和视觉设计。

## 输入来源

- 接口文档：无；沿用现有接口契约，不新增 `API.md`
- 需求文档：2026-09-01 至 2026-09-02 对话确认的拆分计划
- 后端来源：现有服务；后端需按登录应用/OAuth Client 返回该应用配置的菜单

## 工件

- [需求](./REQUIREMENTS.md)
- [设计](./DESIGN.md)
- [任务](./TASKS.md)
- [分阶段任务](./phases/README.md)

## 风险与依赖

- 菜单接口当前不显式携带插件清单，依赖后端按登录应用返回匹配菜单；配置错误继续由
  “插件未安装”页面诊断。
- `@base` 引用覆盖面较大，必须按完整纵向切片迁移，不能只移动 `pages/`。
- platform、org、member 的用户/角色/权限模型当前混在同一文件中，拆分时要防止循环依赖和类型复制。
- `@ingot/admin-app/plugin` 为明确允许的破坏性升级；外部使用方需迁移到四个新插件。
- 页面 key 改名与后端菜单配置可能不同步，因此本次保留旧页面 key 别名。
- 各独立 App 的登录客户端和菜单配置由部署环境提供，不在本仓库自动创建。

## 相关链接

- [现有 App 插件化规格](../../../current/packages/app-plugins-shared-scaffold/spec.md)
- [项目宪章](../../../CONSTITUTION.md)

## 完成记录

- 完成日期：
- 关联提交或 PR：
- 更新的 current capability：`packages/app-plugins-shared-scaffold`、相关 security capability
- 与原设计的差异：
- 取消原因：
