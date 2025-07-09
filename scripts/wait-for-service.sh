#!/bin/bash

SERVICE_NAME=$1
TARGET=$2
MODE=${3:-http}  # default to 'http'
TIMEOUT=${4:-30}

echo "Waiting for $SERVICE_NAME ($MODE) at $TARGET (timeout: ${TIMEOUT}s)..."

for i in $(seq 1 "$TIMEOUT"); do
  if [ "$MODE" = "http" ]; then
    if curl -sf "$TARGET" > /dev/null; then
      echo "$SERVICE_NAME is up!"
      exit 0
    fi

  elif [ "$MODE" = "mongo" ]; then
    # Try connecting to the MongoDB instance from within the running mongo container
    if docker-compose exec -T "$SERVICE_NAME" mongo --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
      echo "$SERVICE_NAME is up!"
      exit 0
    fi

    # If that fails, try from the host using mongo shell if it's installed (useful in local dev)
    if command -v mongo >/dev/null 2>&1; then
      if mongo --host "$TARGET" --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo "$SERVICE_NAME is up!"
        exit 0
      fi
    fi
  fi

  sleep 1
done

echo "Timed out waiting for $SERVICE_NAME"
exit 1
