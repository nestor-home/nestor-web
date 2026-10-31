FROM node:26-bookworm-slim@sha256:bc0a2afd3b74ce12222fc8bab99271e66257f021078f5f4a5d687a77d280c1d9 AS build
ENV NODE_OPTIONS=--max-old-space-size=768
WORKDIR /app
RUN npm install --global pnpm@12.14.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm lint && pnpm typecheck && pnpm test && pnpm build

FROM build AS browser-tests
RUN pnpm exec playwright install --with-deps chromium
CMD ["pnpm", "e2e", "--workers=1"]

FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03 AS production
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
