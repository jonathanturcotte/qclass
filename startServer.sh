#!/bin/bash

# Make sure that the project is up to date.
# Update the mysql database
# Install any new dependencies
# Start the node server
# Webpack and uglify the JS

### RUN AS SUDO ###
sudo git checkout demo
sudo git pull origin master demo
mysql -u root -ppassword < SISystem.sql
npm run release
npm start
