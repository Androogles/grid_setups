// indlæs express
const express = require('express');

module.exports = (app) => {
    // sæt view-engine op til at benytte ejs
    app.set('view engine', 'ejs'); // definer template engine
    app.set('views', './server/views'); // definerer hvor ejs filerne er placeret
    app.engine('ejs', require('express-ejs-extend')); // tillad extends i ejs templates

    // Bestem hvilken mappe der skal servere statiske filer
    app.use(express.static('public'));
}