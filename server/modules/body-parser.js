// indlæs body-parser
// så vi kan hente information fra body'en (former) via req.body
const bodyParser = require('body-parser');
module.exports = (app) => {
    // knyt body-parser til applikationen
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));
}