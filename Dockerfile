FROM node:18-alpine AS base

# ==========================================
# 阶段 1：在 Linux 环境下安装依赖 (获取 Linux 版 sqlite)
# ==========================================
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
# 复制 package 文件
COPY package.json yarn.lock* package-lock.json* ./
# 使用淘宝镜像加速安装
RUN npm config set registry 'https://registry.npmmirror.com/'
RUN npm install

# ==========================================
# 阶段 2：在 Linux 环境下执行代码打包
# ==========================================
FROM base AS builder
WORKDIR /app
# 把上一阶段装好的 linux 版依赖复制过来
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 禁用遥测并打包
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# ==========================================
# 阶段 3：最终运行环境 (轻量级)
# ==========================================
FROM base AS runner
WORKDIR /app

# 安装你需要的代理工具
RUN apk add --no-cache proxychains-ng docker-cli bash python3

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 这里可以留空，运行时通过 docker run -e 传参
ENV PROXY_URL=""
ENV OPENAI_API_KEY=""
ENV GOOGLE_API_KEY=""
ENV CODE=""

# 复制刚才在 Linux 环境下编译好的产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# 完美保留你的原生启动脚本
CMD if [ -n "$PROXY_URL" ]; then \
    export HOSTNAME="0.0.0.0"; \
    protocol=$(echo $PROXY_URL | cut -d: -f1); \
    host=$(echo $PROXY_URL | cut -d/ -f3 | cut -d: -f1); \
    port=$(echo $PROXY_URL | cut -d: -f3); \
    conf=/etc/proxychains.conf; \
    echo "strict_chain" > $conf; \
    echo "proxy_dns" >> $conf; \
    echo "remote_dns_subnet 224" >> $conf; \
    echo "tcp_read_time_out 15000" >> $conf; \
    echo "tcp_connect_time_out 8000" >> $conf; \
    echo "localnet 127.0.0.0/255.0.0.0" >> $conf; \
    echo "localnet ::1/128" >> $conf; \
    echo "[ProxyList]" >> $conf; \
    echo "$protocol $host $port" >> $conf; \
    cat /etc/proxychains.conf; \
    proxychains -f $conf node server.js; \
    else \
    node server.js; \
    fi