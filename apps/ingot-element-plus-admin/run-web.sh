#!/usr/bin/env bash

version=0.1.0
serviceName=ingot-admin-${version}
imageName=docker-registry.ingotcloud.top/ingot/web-admin:${version}

VIRTUAL_HOST=admin.ingotcloud.top
VIRTUAL_PORT=3000

# 停止运行当前容器
docker ps -q --filter name="${serviceName}" | xargs -r docker rm -f
# 删除当前镜像
docker images -q --filter reference="${imageName}" | xargs -r docker rmi -f
# 拉取最新镜像
docker pull ${imageName}
# run
docker run -d --name ${serviceName} --restart always \
    --network ingot-net \
    -e VIRTUAL_HOST=${VIRTUAL_HOST} \
    -e VIRTUAL_PORT=${VIRTUAL_PORT} \
    -e LETSENCRYPT_HOST=${VIRTUAL_HOST} \
    ${imageName}