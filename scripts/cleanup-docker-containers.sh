#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load container names from .env or use defaults
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | grep -E '^(POSTGRES_CONTAINER|CHROMA_CONTAINER)=' | xargs)
fi
POSTGRES_CONTAINER_NAME="${POSTGRES_CONTAINER:-sushi-rag-app-postgres}"
CHROMA_CONTAINER_NAME="${CHROMA_CONTAINER:-sushi-rag-app-chromadb}"

echo -e "${YELLOW}🧹 Cleaning up old Docker containers...${NC}"

# Check if container exists (running or stopped)
cleanup_container() {
  local container_name="$1"
  if docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
    echo -e "${YELLOW}   Found old ${container_name} container${NC}"
  
    # Stop it if running
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
      echo -e "${YELLOW}   Stopping container...${NC}"
      docker stop "${container_name}" > /dev/null 2>&1
    fi
  
    # Remove it (volumes are preserved unless you explicitly remove them)
    echo -e "${YELLOW}   Removing container...${NC}"
    docker rm "${container_name}" > /dev/null 2>&1
    echo -e "${GREEN}   ✅ Old container removed${NC}"
  else
    echo -e "${GREEN}   ✅ No cleanup needed for ${container_name}${NC}"
  fi
}

cleanup_container "${POSTGRES_CONTAINER_NAME}"
cleanup_container "${CHROMA_CONTAINER_NAME}"

echo ""

