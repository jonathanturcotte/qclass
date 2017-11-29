# Q-Clicker-Web
This is the web-application portion of the Q-Clicker project. The web-application provides the professor with a management interface, and handles connections to the student mobile application.

Created as a Queen's University ELEC 498 project.

## Development and Testing
### Webpack
The project is webpacked. Open two shells and navigate to the root of the repo, then run
 `npm start` in one to start the server, and `npm run watch` in the other to
 build the front-end bundle.

Other commands that are available to change the behaviour of webpack are `npm run build`,
 which builds the bundle once without watching for changes, and `npm run release`,
 which runs uglifyjs on the source, and then bundles it once.

### Cookies
Authentication stub - server parses the netID cookie
To set from the client side, just run Cookies.set('netID', '12ozs'); with whatever netID you actually want in place of netID.
Cookies is a global, so either manual setting through the developer console or calling it in client code works

### Running on Linux AWS
#### Location
The project is located on the AWS server under `/opt/Q-Clicker-Web`

#### General
There is an easy start script, `startServer.sh`, that will pull any updates, update the database, webpack and uglify the frontend js, and start the server. It starts in the foreground, TODO is have it start it in the background. To run the script:

```
sudo ./startServer.sh
```

Otherwise just make sure to run every command as sudo, as node can only use ports < 1000 if it's running as root:
```
sudo git pull origin master
sudo npm install
sudo npm start
sudo npm run watch
etc.
```

#### NodeJs Version
By default the version of node was too old (4.7) and needed to be updated:
```
wget -qO- https://deb.nodesource.com/setup_7.x | sudo bash -
sudo apt-get install -y nodejs
```

## Database Test Information
Run SISystem.sql to refresh database

10yfl1 owns zero classes
1pvb69 owns 12 classes

## Authors
Jonathan Turcotte,
Omar Sandarusi,
Curtis Demerah.
