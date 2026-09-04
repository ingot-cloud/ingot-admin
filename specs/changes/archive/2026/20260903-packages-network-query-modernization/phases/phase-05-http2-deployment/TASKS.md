# Phase 5：HTTP/2、代理与部署验证

仓库内容器 Nginx / Dockerfile / 协议边界文档已完成。
以下外层 TLS、公网 HTTP/2 与容量对比依赖运维环境，本 change 前端无法在仓库内验收，不阻塞代码收尾。

## 外层代理

- [ ] 获取 admin/login 公网域名实际 TLS 终止代理的产品、版本和生效配置
- [ ] 确认 HTTP/2 模块、TLS 1.2/1.3 与 ALPN 支持
- [ ] 在外层 HTTPS listener 启用 HTTP/2，不在应用容器配置证书
- [ ] 保持默认 HTTP/2 并发 Stream 上限，结合 gateway 容量测试后再决定是否调整

## 应用容器

- [x] admin/auth/template proxy.conf 增加 `ingot_gateway` upstream 与 `keepalive 32`
- [x] 保留 `/api/` 的 HTTP/1.1、空 Connection header 和路径改写语义
- [x] admin/auth/template Dockerfile 移除未监听的 `EXPOSE 443`
- [x] Docker 构建或 CI 增加 `nginx -t`
- [x] 更新部署文档，说明 browser-edge 与 container-gateway 协议边界

## 协议与容量验收

- [ ] `curl --http2` 验证 admin/login 的 `/` 与 `/api/` 均返回 HTTP/2
- [ ] 浏览器 DevTools Protocol 列确认静态资源和 API 为 `h2`
- [ ] 以 20 个独立 GET 验证 HTTP/2 Stream 复用和 Query 去重
- [ ] 在 HTTP/1.1 环境验证超过 6 个请求会排队但全部正确完成
- [ ] 对比 gateway 的连接数、P95、5xx 和超时，确认并发未超出下游容量
- [x] 确认无需在全局 net 增加连接数信号量；若存在明确批处理，再为该业务单独立项或实现局部限流
