#!/usr/bin/env bash
# One-time setup on a fresh Ubuntu 22.04 Huawei Cloud ECS, then start FloodWay.
#   ssh root@<EIP>
#   git clone https://github.com/LuqmanNurhakimRosli/floodway-huawei.git && cd floodway-huawei/deploy/ecs
#   bash setup.sh
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi

EIP=$(curl -fsS https://api.ipify.org)
if [ ! -f .env ]; then
  echo "DOMAIN=${EIP}.sslip.io" > .env
  echo "Wrote .env with DOMAIN=${EIP}.sslip.io (edit it if you have your own domain)."
fi

if [ ! -f ../../backend/.env ]; then
  cp ../../backend/.env.example ../../backend/.env
  echo "Created backend/.env from the example. Fill in the keys (nano ../../backend/.env), then run this script again."
  exit 1
fi

docker compose up -d --build
. ./.env
echo "FloodWay is starting. Open https://${DOMAIN} (API: https://api.${DOMAIN}/docs). First HTTPS certificate can take a minute."
