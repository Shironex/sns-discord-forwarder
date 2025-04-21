#!/bin/bash

# Update system
apt update && apt upgrade -y

# Clean up unnecessary packages
apt autoremove -y
apt autoclean