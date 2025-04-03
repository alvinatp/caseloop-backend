#!/bin/bash

# Create a Python virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv venv
fi

# Activate the virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies without greenlet
echo "Installing Python dependencies..."
pip3 install beautifulsoup4==4.12.2 openai==1.3.0 python-dotenv==1.0.0 httpx==0.25.1

# Install pyee separately (needed for playwright)
pip3 install pyee==11.0.1

# Try installing playwright
echo "Installing Playwright (this may take a while)..."
pip3 install --no-deps playwright==1.39.0

# Install Playwright browsers
echo "Installing Playwright browsers..."
python -m playwright install chromium

echo "Playwright installation complete!"
echo "To run the scraper, use: node run-playwright-scraper.js category zipcode" 