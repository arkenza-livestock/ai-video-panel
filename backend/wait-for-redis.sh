#!/bin/bash
# Redis hazır olana kadar bekle
until nc -z redis 6379; do
  echo "Redis bekleniyor..."
  sleep 1
done
echo "Redis hazır!"
exec "$@"
