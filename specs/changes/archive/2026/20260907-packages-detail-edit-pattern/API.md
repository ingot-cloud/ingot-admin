# 接口：详情查看/编辑标准

## 来源

本 change 不新增或修改后端接口。成员试点复用组织用户已有 CRUD。

- 原始文件：无
- 后端仓库：无

## 服务与约定

- **服务**：组织权限（既有）
- **Base Path**：`/api/pms/v1/org/user`
- **鉴权**：沿用现有管理台鉴权
- **响应包装**：统一 `R<T>`（`code` / `message` / `data`），`code = "0"` 为成功

## 权限码

沿用现有组织用户接口权限，本 change 不新增权限码。

## 接口列表

前端继续调用：

| 方法 | 路径 | 前端函数 | 说明 |
|------|------|----------|------|
| GET | `/api/pms/v1/org/user/detail/{id}` | `UserProfileAPI` | 详情资料 |
| POST | `/api/pms/v1/org/user` | `CreateUserAPI` | 添加成员 |
| PUT | `/api/pms/v1/org/user` | `UpdateUserAPI` | 保存基本信息 / 暂停恢复 |
| DELETE | `/api/pms/v1/org/user/{id}` | `RemoveUserAPI` | 删除成员 |
| GET | 部门树既有接口 | `OrgDeptTreeQueryOptions` | 查看态解析部门名称 |

请求/响应字段以已归档组织用户契约为准，本 change 不改参数或返回结构。

## 前端注意

- `OrgUserProfileVO` 无 `avatar`；详情身份区头像以列表行数据为准，编辑态仍可上传并随 `UpdateUserAPI` 提交。
- 暂停/恢复继续只传 `{ id, enabled }`，不改变现有写操作语义。
