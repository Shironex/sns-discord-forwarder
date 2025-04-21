#!/bin/bash

# Colors for better readability
GREEN="\e[32m"
RED="\e[31m"
RESET="\e[0m"

log() {
    echo -e "${GREEN}[INFO]${RESET} $1"
}

error() {
    echo -e "${RED}[ERROR]${RESET} $1"
}

# Install unattended-upgrades
sudo apt install -y unattended-upgrades

