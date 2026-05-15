FROM node:22

WORKDIR /app

COPY package.json  pnpm-lock.yaml ./
RUN corepack enable
RUN pnpm install

COPY . .

EXPOSE 5173

CMD ["pnpm", "dev", "--host"]