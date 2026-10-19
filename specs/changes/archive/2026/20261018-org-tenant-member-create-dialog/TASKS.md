# 任务：租户添加成员对话框

> `[P]` 表示可与其他 `[P]` 任务并行执行。

## 准备

- [x] 确认本 change README 状态为 `approved`（开工后改为 `implementing`）
- [x] 阅读本 change 的 [API.md](./API.md) 与 [REQUIREMENTS.md](./REQUIREMENTS.md)

## 实现

- [x] T1：SecretDialog 下沉为 BizIamAccountSecretDialog
- [x] T2：新增 TenantMemberCreate 类型并改 API
- [x] T3：实现 MemberCreateDialog 并改 MemberTab

## 验证

- [x] 满足 REQUIREMENTS.md 验收标准
- [x] vitest / eslint 通过

## 收尾

- [x] 验收后再更新 current 并归档
