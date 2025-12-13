#!/bin/bash

# Find all package.json files and install dependencies
# find ./**/*macaw-* -maxdepth 1 -name 'package.json' | while read -r package_file; do
#     location=$(dirname "$package_file")
#     name=$(basename "$location")
    
#     echo "Installing '$name'..."
#     npm install $location
# done

echo "Installing dependencies..."
npm ci './app/macaw-app/'   # clean install