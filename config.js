module.exports = {
    ssl: {
        key       : '/etc/letsencrypt/live/qclass.ca/privkey.pem',
        cert      : '/etc/letsencrypt/live/qclass.ca/cert.pem',
        fullchain : '/etc/letsencrypt/live/qclass.ca/fullchain.pem'
    },
    sso: {
        loginURL       : 'https://idptest.queensu.ca/idp/profile/SAML2/Redirect/SSO',
        loginCallback  : 'https://qclass.ca/login/callback',
        logoutURL      : 'https://idptest.queensu.ca/idp/profile/Logout',
        logoutCallback : 'https://qclass.ca/logout/callback',
        issuer         : 'https://qclass.ca',
        idpCert        : 'sso/idp.crt',
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
