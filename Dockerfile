# The site's image: the static build (dist/, from `pnpm build`) behind an unprivileged Nginx.
# CI builds dist/ once, then this image for amd64 and arm64 (.github/workflows/release.yml).
FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/ /usr/share/nginx/html/
EXPOSE 8080
