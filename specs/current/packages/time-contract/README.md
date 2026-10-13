# 统一时间契约

## 概述

前端模型保留带时区的 ISO-8601 时间点，共享工具负责当地展示与 DatePicker 转换。接口响应使用 UTC `Z`，日期、日内时间、时长和协议数字时间各自保留语义。

## 相关源码

- [共享时间工具](../../../../packages/shared/src/time.ts)
- [时间规范](../../../../docs/time-contract.md)
- [浏览器验证](../../../../scripts/verify-time-contract-browser.mjs)

## 对接接口

- [20261008-packages-time-contract API](../../../changes/archive/2026/20261008-packages-time-contract/API.md)
- [验收记录](../../../changes/archive/2026/20261008-packages-time-contract/ACCEPTANCE.md)

接口事实来源为后端。本能力只记录前端收发、展示和选择行为。

## 变更记录

| 日期 | 变更 ID | 说明 |
| --- | --- | --- |
| 2026-10-13 | [20261008-packages-time-contract](../../../changes/archive/2026/20261008-packages-time-contract/) | 用户确认验证完成；固化 ISO 模型、当地展示与 UTC 提交并归档 |
