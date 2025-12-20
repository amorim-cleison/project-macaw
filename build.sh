#!/bin/bash

AppDir='./app/macaw-app/'
echo 'Building app...'
cd "$AppDir" && npm run build
