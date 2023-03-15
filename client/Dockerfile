FROM node:18 as base

WORKDIR /app

COPY package* pnpm-lock.yaml ./
COPY . .

RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm@7
RUN pnpm install --frozen-lockfile

FROM base as dev

ENV NODE_ENV=development

EXPOSE 3000

CMD ["pnpm", "run", "dev"]

FROM base as prod-builder

ENV NODE_ENV=production

RUN pnpm run build

FROM nginx:stable-alpine as prod

COPY --from=prod-builder /app/dist /usr/share/nginx/html
COPY --from=prod-builder /app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]