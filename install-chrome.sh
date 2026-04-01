#!/bin/bash
# Move to a temporary folder to avoid cluttering the project
cd /tmp

echo "📥 Downloading Chrome..."
wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb

echo "🛠️ Installing Chrome..."
# Using 'apt install' handles local .deb dependencies automatically
sudo apt install -y ./google-chrome-stable_current_amd64.deb

# Cleanup
rm google-chrome-stable_current_amd64.deb
echo "✨ Chrome installation complete."