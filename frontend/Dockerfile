cat > /home/claude/Atmosfer-Pro-Complete/frontend/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY public ./public
COPY src ./src

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

ENV REACT_APP_API_URL=http://backend:8000
ENV CI=false

CMD ["npm", "start"]
EOF
