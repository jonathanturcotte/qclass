#!/bin/bash

# Make sure that the project is up to date.
# Update the mysql database
# Start the node server
# Webpack and uglify the JS

### RUN AS SUDO ###


git checkout master
git pull origin master
mysql -u root -ppassword < SISystem.sql
npm run release
npm start
