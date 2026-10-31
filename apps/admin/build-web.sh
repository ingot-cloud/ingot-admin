#!/usr/bin/env bash
set -euo pipefail

app_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
workspace_dir="$(cd -- "${app_dir}/../.." && pwd)"
INNER_VERSION=${INNER_VERSION:-0.1.0}
MODULE_NAME=web-admin
registry=docker-registry.ingotcloud.top
image_name="${registry}/ingot/${MODULE_NAME}:${INNER_VERSION}"

echo "开始打包 ${image_name}（包含 /login/）"
pnpm -C "${workspace_dir}" build:admin
printf '%s' "${JY_DOCKER_REGISTRY_PASSWORD:?请设置仓库密码}" |
    docker login --username "${JY_DOCKER_REGISTRY_USERNAME:?请设置仓库用户名}" --password-stdin "${registry}"
docker buildx build --platform linux/amd64 -t "${image_name}" --load "${app_dir}"
docker push "${image_name}"
echo "打包 ${image_name} 完成"
