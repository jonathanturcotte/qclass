# Q-Clicker-Web
This is the web-application portion of the Q-Clicker project. The web-application provides the professor with a management interface, and handles connections to the student mobile application.

Created as a Queen's University ELEC 498 project.

## Development and Testing
The project is webpacked. Open two shells and navigate to the root of the repo, then run
 `npm start` in one to start the server, and `npm run watch` in the other to
 build the front-end bundle.

Other commands that are available to change the behaviour of webpack are `npm run build`,
 which builds the bundle once without watching for changes, and `npm run release`,
 which runs uglifyjs on the source, and then bundles it once.

## Authors
Jonathan Turcotte,
Omar Sandarusi,
Curtis Demerah.
