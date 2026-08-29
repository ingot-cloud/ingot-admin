# 密码登录规格

本文写已上线的页面行为；412 契约见归档 [API.md](../../../changes/archive/2026/20260827-security-challenge-verification/API.md) §3。

## 概述

用户在登录页输入账号密码后直接提交。`LoginAPI` 只传 `username` / `password`（信封加密 whole），不带验证码字段。挑战由全局拦截与 `ChallengeHost` 完成。

## 范围

### In Scope

- 密码登录页提交账号密码
- 根组件挂载 `ChallengeHost`，不在登录页本地处理 412

### Out of Scope

- 其它预授权方式（短信等）的挑战交互细节
- 租户选择、session 预授权页面布局

## 用户场景

### 场景 1：密码登录

- **角色**：未登录用户
- **前置条件**：打开 OAuth2 密码挑战页
- **步骤**：填写账号密码 → 登录
- **预期结果**：先发登录请求；若 412 则全局弹滑块，通过后重试；关闭挑战策略时无滑块、无预发验证码

## 功能需求

### REQ-001：登录不预弹滑块

系统 SHALL 在登录页只提交账号密码，不随请求带 `_vc_code` / `captchaVerification`，也不在点击登录前拉验证码。

**验收标准：**

- [x] `LoginAPI` 不传验证码字段
- [x] 关闭挑战时无滑块

## 非功能需求

- 412 行为与管理台相同，见 [网关挑战](../../common/gateway-challenge/spec.md)

## 依赖与约束

- 全局拦截实现见 `apps/ingot-login/src/net/` 与 `@ingot/utils`

## 验收标准

- [x] 登录页不再单独处理 412
- [x] 关闭挑战时无滑块
