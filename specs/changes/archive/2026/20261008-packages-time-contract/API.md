# 统一时间契约

- 时间点请求为带 Z 或偏移量的 ISO-8601，响应为 UTC Z，保留字段精度；JSON、query、form 相同，无时区/旧格式/非法值返回 400。
- 后端判断和存储为 UTC。新 DTO 优先 Instant；已有 LocalDateTime 时间点明确为 UTC，不整体替换数据库类型。
- LocalDate、LocalTime、Duration 保留语义；Cron 明确业务时区。JWT NumericDate、expires_in、TTL、内部秒/毫秒时间戳保留协议。
- 前端显示浏览器当地时间，识别失败回退 Asia/Shanghai，默认 yyyy-MM-dd HH:mm:ss；工具支持显式展示时区，不增加设置页面。模型保留 ISO，选择结果提交 ISO，不隐式扫描 JSON 字符串。
- 全新环境同步切换，不兼容旧 API 格式，不迁移历史数据库、Redis、队列数据。回退配套前后端版本和配置。

BFF TransactionView.expiresAt: string/date-time；普通业务时间点全部 string/date-time。
