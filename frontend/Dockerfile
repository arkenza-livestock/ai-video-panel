FROM node:18-alpine as build

WORKDIR /app

# package.json kopyala
COPY package*.json ./
RUN npm ci --only=production

# Kaynak kodları kopyala
COPY . .

# Build et
RUN npm run build

# Production stage
FROM nginx:alpine

# Nginx konfigürasyonu
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Build edilmiş dosyaları kopyala
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
