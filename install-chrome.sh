cd ../

# Download the latest Google Chrome .deb package
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb

# Install it
sudo apt install -y ./google-chrome-stable_current_amd64.deb

rm google-chrome-stable_current_amd64.deb