FROM node:22

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && corepack prepare pnpm@latest --activate

# Instala dependencias sin ejecutar scripts de build
RUN pnpm install --ignore-scripts

# Compila bcrypt manualmente
RUN cd node_modules/bcrypt && npm rebuild

COPY . .

EXPOSE 3000

CMD ["pnpm", "start"]