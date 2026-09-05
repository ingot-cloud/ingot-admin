# 接口：管理台 UI 基础设施

## 来源

- 原始文件：无；本 change 来源于用户对话和只读 UI 调研。
- 后端仓库：无。

## 服务与约定

- **服务**：不涉及后端服务。
- **Base Path**：不变。
- **鉴权**：不变，继续使用现有 session 与权限指令。
- **响应包装**：不变，继续使用统一 `R<T>`。

## 权限码

本 change 不新增、修改或移除权限码。

## 接口列表

本 change 不新增、修改或删除后端接口。已有菜单、用户、组织和各业务域请求必须保持原有路径、参数、缓存和错误处理行为。

## 前端注意

- 视觉重构不得通过额外接口调用获得布局数据。
- 字段显示设置使用 `user + tableId` 的前端持久化，不新增用户偏好后端接口；无用户标识时只允许降级到当前浏览器作用域。
- `InTableActions` 只根据配置、优先级、`overflowGroup` 和可用宽度编排固定按钮、原子折叠组与更多菜单，不直接调用业务 API，也不改变权限码、Query Key 或缓存失效范围。
- tools 插槽中的自定义组件由页面自行导入和管理；共享表格不得解析、复制或移动任意业务 VNode。
- `bootstrapAdminApp` 的 `branding`、`settings.showMenu`、`settings.showBreadcrumb`、`settings.showTabs`、`settings.showSearch` 等配置保持兼容。
- 组件公开契约见 [DESIGN.md](./DESIGN.md)，不在本接口文档维护后端字段。
