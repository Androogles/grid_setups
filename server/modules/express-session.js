// indlæs express-session
// så vi kan gemme brugerens session informationer
const session = require('express-session');

module.exports = (app) => {
    // knyt express-session til applikationen
    app.use(session({
        // konfigurer session information (nøgle, levetid) i et js objekt
        secret: '16516f1651d651gdkjbhjnf5414sj514j5641fk',
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 1000 * 60 * 30,
            secure: false
        }
    }));
}