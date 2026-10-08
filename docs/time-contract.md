# 时间交互与 UTC 规范

时间点描述绝对瞬间；日期、每天几点、Cron 和 Duration 保留各自语义。

## 接口

- JSON、query、form 时间点统一使用带 `Z` 或 `±HH:mm` 的 ISO-8601，后端响应输出 UTC `Z`，保留字段精度。
- 不接受无时区、旧 `yyyy-MM-dd HH:mm:ss`、非法日期或数字形式的普通 API 时间点；错误返回 400，不推测上海时区。
- 新 DTO 时间点优先 `Instant`。已有 `LocalDateTime` 时间点明确表示 UTC，框架边界转换；`Date` 同样输出 UTC。
- `LocalDate` 用 yyyy-MM-dd，`LocalTime` 用 HH:mm:ss，Duration 遵循其契约，不转换成时间点。
- JWT NumericDate、OAuth expires_in、TTL 和已有内部 epoch seconds/millis 遵循协议，不改成 ISO 字符串。

## 前端

- 原始模型保存 API ISO 字符串；`formatDateTime` 按浏览器时区展示，识别失败回退 Asia/Shanghai，可显式指定展示时区。
- 默认展示 yyyy-MM-dd HH:mm:ss，由前端格式化；DatePicker 使用 `parseInstantDate` 和 `toApiInstant` 转换，不直接给本地字面量拼 Z。
- 只在修改时间选择时使用 Date/toISOString，避免把未修改的纳秒 ISO 全部截断为毫秒。
- 不遍历 JSON 字符串隐式转换；日期和 Duration 不调用时间点工具。

## 业务日历与调度

Cron 时区和存储时区分别配置：TSS Spring 的 ingot.tss.spring.time-zone 为 ZoneId，缺省 Asia/Shanghai；XXL-Job Admin 明确使用上海 JVM 时区。无时区 API 时间点不因该默认值而被接受。需要固定业务日历的功能显式声明 ZoneId，不跟请求时区走。


## 使用示例

```ts
import { formatDateTime, parseInstantDate, toApiInstant } from "@ingot/shared";
formatDateTime("2026-10-08T01:00:00Z");
formatDateTime("2026-10-08T01:00:00Z", { timeZone: "Asia/Shanghai" });
const selection = parseInstantDate(record.validUntil);
const submitted = toApiInstant(selection);
```

前后端和相关服务同步发布；本次为全新环境，不兼容旧墙钟 API 或历史缓存迁移。框架能力的 current 基线在完整验收后更新，本指南是已批准实现契约。

## 浏览器验证

`pnpm test:time-browser` 使用 Playwright Chromium 验证 UTC、上海、纽约时区的显示与选择提交，并覆盖纳秒模型保留和夏令时；需要已安装 Chromium。完整结果见 [验收记录](../specs/changes/active/20261008-packages-time-contract/ACCEPTANCE.md)。
