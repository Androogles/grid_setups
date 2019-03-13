// indlæser moduler
const fs = require('fs');
const path = require('path');

module.exports = (app) => {
    // indlæs alle filerne i den nuværemde mappe ('config')
    fs.readdirSync(__dirname).forEach(file => {
        // benyt filnavnet i require, for at indlæse hvert modul, undtagen hvis filen er 'index.js'
        // så hvis filnavnet er alt andet end det filnavn vi står på, skal den hente mappe og den 
        // tilhørende fil, og tilknytte (app) 
        if (file !== path.basename(__filename)) {
            require(path.join(__dirname, file))(app);
        }
    });
}