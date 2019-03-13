// Opret variabel til mysql2 modulet
const mysql = require('mysql2');

// Module.exports er den kode der muliggører `require()` 
// Vi får det tilbage som modulet eksporterer
// i dette modul er det en funktion kaldet `connect`
module.exports = {
    connect: () => {
        // Connect returnerer den aktive forbindelse som kommer ud af `createConnection`
        return mysql.createConnection({
            'host': 'localhost',
            'user': 'root',
            'password': '', // Hvis SQL server kræver det
            'database': 'grid_setups'
        });
    }
};