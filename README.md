# QClass
QClass is an educational attendance tool designed to provide professors with the ability to better track student attendance. This web-application is a management interface for professors looking to setup, run, and report on class attendance sessions. It also doubles as the check-in website for students looking to report that they are in attendance.

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
A goal of this project is to integrate it with Queen's Single Sign-On system. Until then, however, authentication has been stubbed using a cookie with a 'netID' field. 

To set the cookie from the client side, just run Cookies.set('netID', 'NETID'); with whatever netID you actually want in place of NETID.
Cookies is a global, so either manual setting through the developer console or calling it in client code works

Currently valid netIDs are:

#### Professor NetIDs
1pvb69,
10yfl1,
15jc3,
10boo3,
12hdm

#### Student NetIDs
12cjd2,
12ozs,
11jlt10

12hdm is an admin for ELEC 498

### Running on the Linux AWS
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
wget -qO- https://deb.nodesource.com/setup_8.x | sudo bash -
sudo apt-get install -y nodejs
```

## Database Test Information
Run SISystem.sql to refresh the database.

## Authors
Jonathan Turcotte,
Omar Sandarusi,
Curtis Demerah.
