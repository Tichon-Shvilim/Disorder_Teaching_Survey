#!/bin/bash

SERVICE_NAME=$1
TARGET=$2
MODE=${3:-http}  # default to 'http'
TIMEOUT=${4:-30}

echo "Waiting for $SERVICE_NAME ($MODE) at $TARGET (timeout: ${TIMEOUT}s)..."

for i in $(seq 1 $TIMEOUT); do
  if [ "$MODE" = "http" ]; then
    if curl -sf "$TARGET" > /dev/null; then
      echo "$SERVICE_NAME is up!"
      exit 0
    fi
  elif [ "$MODE" = "mongo" ]; then
    if docker run --rm --network="host" mongo mongo --host "$TARGET" --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
      echo "$SERVICE_NAME is up!"
      exit 0
    fi
  fi
  sleep 1
done

echo "Timed out waiting for $SERVICE_NAME"
exit 1
