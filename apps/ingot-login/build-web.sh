#!/usr/bin/env bash

INNER_VERSION=0.1.0
MODULE_NAME=web-login

echo "开始打包${MODULE_NAME}:${INNER_VERSION}"

pnpm build

docker login -u ${JY_DOCKER_REGISTRY_USERNAME} -p ${JY_DOCKER_REGISTRY_PASSWORD} docker-registry.ingotcloud.top

docker buildx build --platform linux/amd64 -t docker-registry.ingotcloud.top/ingot/${MODULE_NAME}:${INNER_VERSION} .

docker push docker-registry.ingotcloud.top/ingot/${MODULE_NAME}:${INNER_VERSION}

echo "打包${MODULE_NAME}:${INNER_VERSION}完成"