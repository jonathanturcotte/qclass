var fs     = require('fs'),
    sslDir = '/etc/letsencrypt/live/qclass.ca/';

module.exports = {
    ssl: {
        key       : fs.readFileSync(fs.existsSync(sslDir + 'privkey.pem')   ? sslDir + 'privkey.pem'   : 'app.key', 'utf8'),
        cert      : fs.readFileSync(fs.existsSync(sslDir + 'cert.pem')      ? sslDir + 'cert.pem'      : 'app.crt', 'utf8'),
        fullchain : fs.readFileSync(fs.existsSync(sslDir + 'fullchain.pem') ? sslDir + 'fullchain.pem' : 'app.crt', 'utf8')
    },
    sso: {
        loginURL       : 'https://idptest.queensu.ca/idp/profile/SAML2/Redirect/SSO',
        loginCallback  : 'https://qclass.ca/login/callback',
        logoutURL      : 'https://idptest.queensu.ca/idp/profile/Logout',
        logoutCallback : 'https://qclass.ca/logout/callback',
        issuer         : 'https://qclass.ca',
        idpCert        : fs.readFileSync('sso/idp.crt', 'utf8')
    },
    dev: {
        localDev : !fs.existsSync(sslDir + 'privkey.pem'),
        testUser : {
            // Test user to use for local testing
            netID        : '1pvb69',          // NetID
            studentNum   : '11111111',        // Student number
            fName        : 'Test',            // First name
            lName        : 'User',            // Last name
            email        : 'test@queensu.ca', // Email
            isProf       : true               // isProfessor
        }
    },
    helmet: {
        referrerPolicy: { policy: 'no-referrer' },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'",
                    'data:',
                    'https://code.jquery.com',              // jQuery
                    'https://cdnjs.cloudflare.com',         // Popper (Bootstrap), Toastr, Underscore
                    'https://maxcdn.bootstrapcdn.com',      // Bootstrap
                    'https://use.fontawesome.com'],         // Font Awesome
                styleSrc: ["'self'",
                    "'unsafe-inline'",
                    'https://maxcdn.bootstrapcdn.com',      // Bootstrap
                    'https://cdnjs.cloudflare.com'],        // Toastr
                imgSrc: ["'self'", 'data:']
            }
        }
    }
};
