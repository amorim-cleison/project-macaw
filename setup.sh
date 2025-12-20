#!/bin/bash

AppDir='./app/macaw-app/'

echo "Installing dependencies..."
cd "$AppDir" || exit 1

# Try npm ci first (clean install), fall back to npm install if it fails
npm ci || npm install