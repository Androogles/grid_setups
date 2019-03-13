// Referer til Moduler !!!
const mysql = require('../config/mysql.js');

let sql = `SELECT product_id,
                product_name,
                product_model,
                product_price,
                product_description, 
                product_image, 
                product_created,  
                product_inventory,
                product_inventory_min,
                product_inventory_max,
                category_id, 
                category_name,
                category_lft,
                category_rgt
        FROM products
        INNER JOIN categories ON category_id = fk_category_id `;

module.exports = { 
    // ========================   Henter Et Produkt   ========================
    get_one: (product_id) => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(sql + `WHERE product_id = ?`, [product_id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows[0]);
                }
            });
            db.end();
        });
    },

    // ========================   Henter Alle Produkter   ========================
    get_all: () => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(sql + `ORDER BY product_id ASC`, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
            db.end();
        });
    },

    // ========================   Henter Alle Produkter Udfra En Produkt Kategori   ========================
    get_all_from_category: (category_id) => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(sql + `WHERE category_id = ?`, [category_id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
            db.end();
        });
    },
    
    // ========================   Opretter Et Produkt   ========================
    create_one: (product_name, product_model, product_price, product_description, product_image, product_inventory, product_inventory_min, product_inventory_max, category_id) => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(`INSERT INTO products 
                        SET product_name = ?,
                            product_model = ?,
                            product_price = ?,
                            product_description = ?,
                            product_image = ?,
                            product_created = NOW(),
                            product_inventory = ?,
                            product_inventory_min = ?,
                            product_inventory_max = ?,
                            fk_category_id = ?
                            `, [product_name, product_model, product_price, product_description, product_image, product_inventory, product_inventory_min, product_inventory_max, category_id], (err, rows) => {
                    if (err) {
                        reject(err.message)
                    } else {
                        resolve(rows);
                    }
                });
            db.end();
        });
    },

    // ========================   Redigere Et Produkt   ========================
    edit_one: (product_name, product_model, product_price, product_description, product_image, product_inventory, product_inventory_min, product_inventory_max, category_id, product_id) => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(`UPDATE products 
                            SET product_name = ?,  
                                product_model = ?,
                                product_price = ?,
                                product_description = ?,
                                product_image = ?,
                                product_inventory = ?,
                                product_inventory_min = ?,
                                product_inventory_max = ?,
                                fk_category_id = ?
                            WHERE product_id = ? `, [product_name, product_model, product_price, product_description, product_image, product_inventory, product_inventory_min, product_inventory_max, category_id, product_id], (err, rows) => {
                    if (err) {
                        reject(err.message)
                    } else {
                        resolve(rows);
                    }
                });
            db.end();
        });
    },

    // ========================   Slet Et Produkt   ========================
    delete_one: (product_id) => {
        // starter med at "return new promise" som indeholder (resolve, reject)
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute("DELETE FROM products WHERE product_id = ?", [product_id], (err, rows) => {
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
    
    // ========================   Tæller Produkter   ========================
    count_products: (category_id) => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(`SELECT COUNT(product_id) AS value from products WHERE fk_category_id = ?`, [category_id], (err, rows) => {
                if (err) {
                    reject(err.message);
                } else {
                    resolve(rows[0].value);
                }
            });
            db.end();
        });
    },

    // ========================   Henter Offset   ========================
    get_offset: (category_id, offset, limit) => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            // hvor mange skal den springe over / hvor mange skal den tage (`?, ?`)
            db.execute(sql + `WHERE category_id = ? ORDER BY product_id ASC LIMIT ?, ?`, [category_id, offset, limit], (err, rows) => {
                if (err) {
                    reject(err.message);
                } else {
                    resolve(rows);
                }
            });
            db.end();
        });
    },
}