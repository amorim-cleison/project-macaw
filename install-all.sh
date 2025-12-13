#!/bin/bash

# Find all package.json files and install dependencies
find . -maxdepth 5 -name package.json | while read -r package_file; do
    location=$(dirname "$package_file")
    name=$(basename "$location")
    
    echo "Installing '$name'..."
    (cd "$location" && npm install)
done
