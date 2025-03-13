# Usar uma imagem base do Node.js
FROM node:20-alpine

# Definir o diretório de trabalho no contêiner
WORKDIR /app

# Copiar o arquivo de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o código do backend para o contêiner
COPY . .

# Expor a porta do backend (5000 por exemplo)
EXPOSE 3333

# Comando para iniciar o servidor
CMD ["npm", "start"]

