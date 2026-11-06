# 内容提供器契约（前端内部）

帮助资料继续由前端制品提供。原 IAM 内容接口保留在历史目录。平台资源保护计划沿用现有 IAM 身份接口。

HelpContentProvider固定domain，提供catalog()、article(id)、search(q, categoryId, page, pageSize)、image(id)异步方法，返回现有帮助页面模型。未包含的文章/分类/资产统一显示当前端不可用；不查询其他域作为回退。

HelpContentDefinition组合本域分类、文章元数据和Markdown、资产ID到URL映射、首页文章编排及viewPath主说明。contentVersion使用前端内容版本，固定域与引用在装配时验证，无远端pin、409、Base64或服务端错误码。

## 平台资源保护规划

- 阅读层接口及返回模型继续沿用。平台提供器通过同源受保护资源路径读取版本化数据和图片，见 [设计第 8 节](./DESIGN.md#8-平台静态资源访问控制规划)。
- Nginx 内部校验复用现有 `GET /api/iam/v1/me/profile` 对应的 Gateway 路由。鉴权成功后由 Nginx 响应文件内容。无有效会话或不满足资格时拒绝，授权依赖异常时返回服务端错误。
- 资源响应使用实际 JSON 或图片媒体类型。平台读取携带现有设备指纹头，资源响应统一使用 `Cache-Control: private, no-store`。
