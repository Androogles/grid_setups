// indlæs morgan
const logger = require('morgan');

module.exports = (app) => {
    // knyt morgan til som logger
    app.use(logger('dev'));
}