# 同源双入口部署

只构建 `apps/admin-platform`、`apps/admin`。每份产物同时包含 `/login/` 和管理页面；旧 auth/auth-platform App 与 1798/1799 服务退役。没有四域名协议兼容。

## 构建与地址

Node 22.17、pnpm 10.12.4：`pnpm install --frozen-lockfile`，`pnpm build:packages`，`pnpm build:apps`。将两份 dist 分别复制到 `/srv/ingot/admin-platform`、`/srv/ingot/admin`。默认 `/api` 是相对地址，生产不填写 localhost 或跨域登录 URL。

| 模式 | 平台 | 租户 |
|---|---|---|
| 双域名 | https://platform.example.com/login/ | https://admin.example.com/login/ |
| 纯IP双端口 | https://192.168.1.100:8443/login/ | https://192.168.1.100:9443/login/ |
| 本机DEV | http://platform.localhost:5799/login/ | http://tenant.localhost:5798/login/ |

在 Nginx 1.25+ 选择 `nginx-ip.conf` 或 `nginx-domains.conf`，替换实际主机、上游私网地址、文件和证书路径。把 `application.locations.conf` 和 `application.security.conf` 放在 `/etc/nginx/same-origin/`，配置文件放入 `conf.d`，先 `nginx -t` 后 reload。示例是边缘终止 TLS 的单层代理；容器内 proxy.conf 仅可放在受控边缘后方，Gateway/BFF 不直接暴露用户网络。多层代理须逐层保留原 `$http_host`，防火墙限定来源，并在可信边缘覆盖客户端转发头。

Nginx `/api/` 单独代理且不回退 HTML；SPA 深链回落本应用 index.html，HTML 和认证响应 no-store；hash 静态资源长期缓存。CSP 的 OSS HTTPS 通配范围应在部署时收紧为实际上传/图片服务白名单。

## CI 与容器脚本

根 `.gitlab-ci.yml` 只保留两套管理应用的 build / docker / deploy，共六个任务；登录插件随各自管理应用打包。两个 App 的 `build-web.sh` 从任意当前目录均先构建对应 workspace App；手工镜像分别为 `web-admin` 和 `web-platform-admin`，`run-web.sh` 使用独立容器名及 admin/platform 域名，可通过 `VIRTUAL_HOST` 覆盖。镜像构建不执行部署。

上述容器脚本用于域名 TLS 边缘方案，容器 3000 端口不向用户网络发布。边缘必须覆盖客户端转发头；App 的 `proxy.conf` 保留外部 Host（含端口）和经边缘确认的 HTTPS scheme。纯 IP 双端口采用本目录 Nginx 样例托管两份 dist。

## 后端必须同步

Gateway 与 BFF 的 `in-bff-apps.yml` 都注册两个完全相同的 origin（包括端口），生产 require-https=true；Gateway 的 BFF 路由必须 PreserveHostHeader。`in-service-bff.yml` 配置 transaction-ttl=600、completion-recovery-ttl=60、max-active-transactions=5。OAuth 协议回调仍需与 Auth RegisteredClient 精确一致，浏览器不访问该内部回调。

同批发布支持 authenticationExpiresAt 的 Auth、新 BFF/Gateway、两份前端和配置。旧前后端协议不可混跑。同时同步 `in-service-auth.yml`，移除已废弃的独立登录站 `loginFormUrl`。完整步骤与回滚以配套后端 change 的 DEPLOYMENT.md 为准，后端部署目录提供只读 same-origin-inventory.py。

## Cookie 与 TLS

HTTPS 使用 `__Host-IN_PLATFORM_SESSION/BINDING` 和 `__Host-IN_TENANT_SESSION/BINDING`，Secure、HttpOnly、Path=/、SameSite=Lax、无 Domain。纯 IP 的 Cookie 不按端口隔离，两套 Cookie 都可能随请求发送；两个端口必须为同一可信部署，后端只消费本应用名称。平台退出不撤销租户会话。

IP 证书 SAN 必须含实际 IP；优先客户 CA，否则私有 CA 并给客户端安装根信任。示例文件不附私钥。真实证书信任、账号登录、网络策略与发布回滚需在目标环境验收，不能用忽略证书错误替代。

旧 `/oauth2/challenge?tx=...`、`/auth/start`、`/auth/complete?ticket=...` 固定规范化到当前 `/login/` 并清参数，不兑换旧票据。退役独立登录域如保留 DNS，仅配置到对应新入口的固定静态引导。
