#Imagen oficial de node
#Usa node dentro del contenedor para ejecutar la aplicación, en este caso se usa la versión 22 de node.
FROM node:22

#Carpeta de trabajo dentro del contenedor
#Todo se ejecutara dentro de esta carpeta, es decir, el código de la aplicación se copiará aquí y se ejecutará desde aquí.
WORKDIR /app

#Copiar el package.json y package-lock.json para instalar dependencias
#
COPY package.json pnpm-lock.yaml ./

#Instalar dependencias
#Instala nod_modules
RUN corepack enable
RUN npm config set only-built-dependencies bcrypt
RUN pnpm install

#Copiar el resto del código de la aplicación
COPY . .

#Exponer el puerto en el que la aplicación se ejecutará
#Indica el puerto del backend
EXPOSE 3000

#Comando para iniciar la aplicación
CMD ["pnpm", "start"]
