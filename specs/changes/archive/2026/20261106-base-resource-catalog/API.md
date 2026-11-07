# 接口契约

接口权威在后端变更 DESIGN.md。资源显示、操作前缀与菜单使用同一目录。诊断、工作台、组的现有业务路径保留。组修改省略 selection 时保留关联。

IAM 和 Member 分别通过 /api/iam/v1/assets/uploads 与 /api/member/v1/assets/uploads 接收 multipart purpose、file 和编辑既有对象时的 targetId。返回 uploadId。业务表单提交 avatarUploadId 或 iconUploadId。
