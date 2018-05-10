# QClass
QClass is an educational attendance tool designed to provide professors with the ability to better track student attendance. This web-application is a management interface for professors looking to setup, run, and report on class attendance sessions. It also doubles as the check-in website for students looking to report that they are in attendance.

QClass works on any modern browser that supports JavaScript ES5 and common HTML5 features. Supported browsers include Firefox, Chrome, IE11, Edge, and Safari. The student check-in site works with small screen sizes and most mobile browsers.

Created as a Queen's University ELEC 498 project.

<img src="https://user-images.githubusercontent.com/6924367/39879652-6c83db34-5449-11e8-831b-bb83870c0ae6.png" height="325"/> <img src="https://user-images.githubusercontent.com/6924367/39879813-d4c847de-5449-11e8-8e9d-9aa11e405d1f.png" height="325"/>

## Development and Testing
### Webpack
The project is webpacked. Open two shells and navigate to the root of the repo, then run
 `npm start` in one to start the server, and `npm run watch` in the other to
 build the front-end bundle.

Other commands that are available to change the behaviour of webpack are `npm run build`,
 which builds the bundle once without watching for changes, and `npm run release`,
 which runs uglifyjs on the source, and then bundles it once.

### Integration with Queen's SSO
This project was designed to be integrated with the Queen's Single Sign-On system for authentication.

#### Bypassing SSO for Local Development
SSO is automatically bypassed if the configuration can't detect the qclass SSL certificate. 
To change which test user is when this happens change the values for testUser found in `config.js`.

#### Stubbing SSO for Remote Development
The current implementation has been integrated with the test SSO system, which does not return all of the required
fields of data about a user. Most importantly, it does not return whether the user is a student or professor. As a
result, the NetID and isProf values need to be stubbed in `sso\auth.js`.

### Testing NetIDs
Several testing users have been added to the database.

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
The project is located on the AWS server under `/opt/qclass`

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
