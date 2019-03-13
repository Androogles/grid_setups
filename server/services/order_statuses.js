// Referer til Moduler !!!
const mysql = require('../config/mysql.js');

let sql = `SELECT 
            order_status_id, 
            order_status_name
            FROM order_statuses `;

module.exports = { 
    get_all_statuses: () => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(sql + `ORDER BY order_status_id ASC`, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
            db.end();
        });
    },

    set_order_status: (order_id, order_status_id) => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(`UPDATE orders SET fk_order_status_id = ? WHERE order_id = ?`, [order_status_id, order_id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
            db.end();
        });
    },    
}