# 构建参数（注：FROM 指令之前的 ARG，只能用于 FROM 指令中）
ARG NODE_IMAGE="node:22.20.0-alpine"

# 01. 基础镜像
FROM $NODE_IMAGE AS base 
# 镜像构建参数
ARG SOURCE_CODE_DIR="/code"
ARG REGISTRY_MIRROR="https://registry.npmmirror.com"
ARG YARN_VERSION="latest"
ARG PNPM_VERSION="latest-10"
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_NPM_REGISTRY=$REGISTRY_MIRROR
## 准备 yarn, pnpm 包管理器
RUN npm config set registry $REGISTRY_MIRROR \
    && corepack prepare pnpm@$PNPM_VERSION --activate \
    && corepack prepare yarn@ --activate \
    && corepack enable yarn pnpm
## 安装必要的工具 make, jq
RUN echo https://mirrors.aliyun.com/alpine/latest-stable/main/ > /etc/apk/repositories \
    && echo https://mirrors.aliyun.com/alpine/latest-stable/community/ >> /etc/apk/repositories \
    && apk update \
    && apk upgrade  \
    && apk add make jq --purge --no-cache
WORKDIR $SOURCE_CODE_DIR

# 02. 依赖缓冲层
FROM base AS deps
# pnpm fetch 只需要锁文件
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
# 如果你修补了任何包，在运行 pnpm fetch 前包含补丁
#COPY patches patches
# 安装依赖
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch --frozen-lockfile

# 03. 构建层
FROM deps AS build
ADD . ./
## 安装依赖
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install -r --offline --force --frozen-lockfile
## 构建应用
RUN pnpm -F ./apps/server run build \
    && pnpm -F ./apps/web run generate

# 04. 生产层
FROM base AS production
WORKDIR /code
COPY --from=build /code/.node_modules ./
COPY --from=build /code/apps/server/dist ./apps/server/dist
COPY --from=build /code/apps/server/data ./apps/server/data
COPY --from=build /code/apps/web/.output/public/ ./public/web

ENV NODE_ENV=production \
    TZ=Asia/Shanghai \
    SERVER_PORT=4090 \
    QUICK_START_MODE=false \
    DB_USERNAME=langchain \
    DB_PASSWORD=langchain \
    DB_DATABASE=postgres \
    DB_SCHEMA=fastbuildai \
    DB_HOST=10.1.150.105 \
    DB_PORT=7000 \
    REDIS_HOST=10.1.150.105 \
    REDIS_PORT=32768

## 测试镜像命令
EXPOSE 4090

# 测试镜像命令
WORKDIR apps/server
#CMD [ "node", "dist/main.js" ]
CMD [ "sleep", "infinity" ]