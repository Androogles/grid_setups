const mysql = require('../config/mysql.js');

let sql = `SELECT 
              order_line_id, 
              order_line_amount, 
              order_line_price, 
              order_id, 
              order_date,
              product_id, 
              product_name,
              product_model,
              product_price,
              product_image,
              product_inventory,
              product_inventory_min,
              product_inventory_max
        FROM order_lines
        INNER JOIN orders ON order_id = fk_order_id
        INNER JOIN products ON product_id = fk_product_id `;


module.exports = { 
      get_all_order_lines: () => {
            return new Promise((resolve, reject) => {
                let db = mysql.connect();
                db.execute(sql + `ORDER BY product_inventory DESC`, [], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
                db.end();
            });
        },
    
        get_all_order_lines_from_one_order: (order_id) => {
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
}