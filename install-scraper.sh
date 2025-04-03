#!/bin/bash

echo "Installing Python dependencies for the scraper..."
pip3 install -r requirements.txt

echo "Dependencies installed. Ready to run the scraper."
echo "To run the scraper, use: node run-scraper.js [category] [zipcode]"
echo "Example: node run-scraper.js food 94103" 