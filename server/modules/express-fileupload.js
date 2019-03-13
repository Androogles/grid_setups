// indlæser express-fileupload
// så vi kan hente information fra via req.files
const fileupload = require('express-fileupload');
module.exports = (app) => {
    // knyt fileupload til applikaitonen
    app.use(fileupload({
        // konfigurer express-fileupload
        limits: {
            fileSize: 10 * 1024 * 1024
        } // 10mb
    }));
}