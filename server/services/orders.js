// Referer til Moduler !!!
const mysql = require('../config/mysql.js');

let sql =  `SELECT 
                order_id, 
                order_date, 
                order_status_id, 
                order_status_name, 
                user_id, 
                user_name, 
                user_firstname, 
                user_lastname, 
                user_address, 
                user_city, 
                user_areacode, 
                user_image, 
                user_email
            FROM orders
            INNER JOIN order_statuses ON order_status_id = fk_order_status_id
            INNER JOIN users ON user_id = fk_user_id `;

module.exports = {  
    // ========================   Hent Alle Ordre   ========================
    get_all_orders: () => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(sql + `ORDER BY order_date DESC`, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
            db.end();
        });
    },

    // ========================   Hent En Ordre   ======================== 
    get_one: (order_id) => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(sql + `WHERE order_id = ?`, [order_id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows[0]);
                }
            });
            db.end();
        });
    },

    // ========================   Hent Alle ordre udfra ordre status    ======================== 
    get_all_orders_from_one_status: () => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(sql + `WHERE order_id = ?`, [order_id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
            db.end();
        });
    },

    // ========================   Opret En Ordre   ========================
    create_one: (user_id) => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            let status = 'modtaget';
            db.execute(`INSERT INTO orders SET order_date = NOW(), fk_order_status_id = 1, fk_user_id = ?`, [user_id], (err, rows) => {
                if (err) {
                    console.log(err.message);
                    reject(err.message);
                } else {
                    // her returneres den nyoprettede id
                    resolve(rows.insertId);
                }
            });
            db.end();
        })
    },

    // ========================   Slet En Ordre   ========================
    delete_one: (order_id) => {
        // starter med at "return new promise" som indeholder (resolve, reject)
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute("DELETE FROM orders WHERE order_id = ?", [order_id], (err, rows) => {
                if (err) {
                    console.log(err.message);
                    reject(err.message);
                }
                else {
                    resolve(rows);
                }
            });
            db.end();
        })
    },

    // ========================   Opretter Produkt Linje   ========================
    create_product_line: (orderid, product_id, order_line_price, order_line_amount) => {
        // console.log(orderid, product_id, order_line_price, order_line_amount);
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(`INSERT INTO order_lines 
                        SET fk_order_id = ?, 
                            fk_product_id = ?, 
                            order_line_price = ?, 
                            order_line_amount = ?`, [orderid, product_id, order_line_price, order_line_amount], (err, rows) => {
                if (err) {
                    console.log(err.message);
                    reject(err.message);
                } else {
                    // her returneres den nyoprettede id
                    resolve(rows);
                }
            });
            db.end();
        })
    },
}