FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
EXPOSE 3001
CMD ["pnpm", "preview", "--host", "0.0.0.0", "--port", "3001"]
