#!/bin/bash
echo "Starting build"
rm -rf ~/Desktop/build
mkdir ~/Desktop/build
cd /media/sf_tmp/_build
unzip firefox_prod.zip -d ~/Desktop/build/firefox_prod
unzip firefox-source-files.zip -d ~/Desktop/build/firefox-source-files
cd ~/Desktop/build/firefox_prod
# use Git to track changes
git init
git add .
git commit -m 'test'
# delete all files
mkdir ../deleteme
mv * ../deleteme
rm -rf ../deleteme

# build files from sources:
cd ../firefox-source-files
npm install
npm run prod
unzip ./dist/firefox_prod.zip -d ../firefox_prod
cd ../firefox_prod
git status
