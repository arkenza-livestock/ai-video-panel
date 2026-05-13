FROM node:18-alpine

WORKDIR /app

# package.json kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Tüm kaynak kodları kopyala
COPY . .

# Build et
RUN npm run build

# Basit bir web sunucusu ile serve et
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
