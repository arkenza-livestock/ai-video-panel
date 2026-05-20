FROM docker.io/library/node:18-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --quiet

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY frontend/ ./
RUN npm run build

FROM docker.io/mwader/static-ffmpeg:6.1.1 AS ffmpeg-source

FROM docker.io/library/python:3.10-slim-bookworm
WORKDIR /app

RUN apt-get clean && apt-get update && apt-get install -y --no-install-recommends \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libglib2.0-0 \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ffmpeg-source /ffmpeg /usr/bin/ffmpeg
COPY --from=ffmpeg-source /ffprobe /usr/bin/ffprobe
RUN chmod +x /usr/bin/ffmpeg && chmod +x /usr/bin/ffprobe

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist
COPY --from=frontend-builder /app/frontend/build /app/frontend/build

RUN mkdir -p /app/backend/frontend
RUN cp -r /app/frontend/dist /app/backend/frontend/dist 2>/dev/null || true
RUN cp -r /app/frontend/build /app/backend/frontend/build 2>/dev/null || true

RUN chmod -R 777 /app

WORKDIR /app/backend
EXPOSE 3012

CMD ["python", "main.py"]
