#!/usr/bin/env bash
set -euo pipefail

version=${INNER_VERSION:-0.1.0}
service_name=ingot-platform-admin-${version}
image_name=docker-registry.ingotcloud.top/ingot/web-platform-admin:${version}
VIRTUAL_HOST=${VIRTUAL_HOST:-platform.ingotcloud.top}
VIRTUAL_PORT=3000

# 容器仅接入受控边缘所在网络，不发布明文端口；纯 IP 部署使用 deploy/same-origin 样例。
docker pull "${image_name}"
if docker container inspect "${service_name}" >/dev/null 2>&1; then
    docker rm -f "${service_name}"
fi
docker run -d --name "${service_name}" --restart always \
    --network ingot-net \
    -e "VIRTUAL_HOST=${VIRTUAL_HOST}" \
    -e "VIRTUAL_PORT=${VIRTUAL_PORT}" \
    -e "LETSENCRYPT_HOST=${VIRTUAL_HOST}" \
    "${image_name}"
