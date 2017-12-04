#!/bin/bash

# Make sure that the project is up to date.
# Update the mysql database
# Install any new dependencies
# Start the node server
# Webpack and uglify the JS

### RUN AS SUDO ###


git checkout master
git pull origin master
mysql -u root -ppassword < SISystem.sql
npm install
npm run release
npm start
