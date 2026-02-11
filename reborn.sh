#!/bin/bash

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${PURPLE}=================================================${NC}"
echo -e "${PURPLE}      🧪  RUNE-LAB: DEEP REBORN  🧪      ${NC}"
echo -e "${PURPLE}=================================================${NC}"

# 1. Kill root node_modules
if [ -d "node_modules" ]; then
    echo -e "${RED}󱂿 Removing:${NC} ./node_modules"
    rm -rf node_modules
else
    echo -e "${YELLOW} Skipping:${NC} ./node_modules (not found)"
fi

# 2. Recursive cleanup for apps
echo -e "${BLUE}󰃢 Scanning apps for build artifacts...${NC}"

# Find and delete .svelte-kit and vite directories inside the apps folder
# Using -prune for efficiency and to avoid searching inside folders we are deleting
find apps -type d \( -name ".svelte-kit" -o -name ".vite" \) -prune -exec echo -e "${RED}󰚃 Removing:${NC} {}" \; -exec rm -rf {} +

echo -e "${CYAN}-------------------------------------------------${NC}"

# 3. Deno Install
echo -e "${BLUE} Starting Deno Install...${NC}"
deno install

if [ $? -eq 0 ]; then
    echo -e "${PURPLE}=================================================${NC}"
    echo -e "${GREEN}✨ SUCCESS: Project is clean and dependencies reinstalled!${NC}"
    echo -e "${PURPLE}=================================================${NC}"
else
    echo -e "${RED}❌ ERROR: Deno install failed.${NC}"
    exit 1
fi
