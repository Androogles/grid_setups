// Referer til Moduler !!!
const mysql = require('../config/mysql.js');

let sql = `SELECT 
            category_id, 
            category_name,
            category_lft,
            category_rgt,
            category_top
        FROM categories `;

module.exports = {  
    // ========================   Henter Alle Kategorier   ========================
    get_all: () => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(sql + `ORDER BY category_lft ASC`, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
            db.end();
        });
    },

    // ========================   Henter første Under Kategori   ========================
    get_first_category_id: () => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(`SELECT category_id FROM categories WHERE category_top <> 1 ORDER BY category_lft ASC LIMIT 1`, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows[0].category_id);
                }
            });
            db.end();
        });
    },

    // ========================   Henter Alle Under Kategorier   ========================
    get_all_subcategories: () => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(sql + `WHERE category_top = 0 ORDER BY category_lft ASC`, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
            db.end();
        });
    },

    // ========================   Henter En Kategori   ========================
    get_one: (category_id) => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(sql + `WHERE category_id = ?`, [category_id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows[0]);
                }
            });
            db.end();
        });
    },

    // ========================   Opretter En Kategori   ========================
    create_one: (category_name, category_lft, category_top = 0) => {
        return new Promise((resolve, reject) => {
            let start = category_lft + 1;
            let end = category_lft + 2;
            let db = mysql.connect();
            db.execute(`UPDATE categories SET category_rgt = category_rgt + 2 WHERE category_rgt >= ?`, [start], (err, rows) => {
                    if (err) {
                        reject(err.message)
                    } else {
                        let db = mysql.connect();
                        db.execute(`UPDATE categories SET category_lft = category_lft + 2 WHERE category_lft >= ?`, [start], (err, rows) => {
                                if (err) {
                                    reject(err.message)
                                } else {
                                    let db = mysql.connect();
                                    db.execute(`INSERT INTO categories 
                                                SET category_name = ?,
                                                category_lft = ?,
                                                category_rgt = ?,
                                                category_top = ?`, [category_name, start, end, category_top], (err, rows) => {
                                            if (err) {
                                                reject(err.message)
                                            } else {
                                                resolve(rows);
                                            }
                                        });
                                    db.end();
                                }
                            });
                        db.end();
                    }
                });
            db.end();
        });
    },
    
    // ========================   Redigere En Kategori   ========================
    edit_one: (category_name, category_id) => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(`UPDATE categories 
                            SET category_name = ? 
                            WHERE category_id = ?`, [category_name, category_id], (err, rows) => {
                    if (err) {
                        reject(err.message)
                    } else {
                        resolve(rows);
                    }
                });
            db.end();
        });
    },

    // ========================   Slet En kategori   ========================
    delete_one: (category_id) => {
        // starter med at "return new promise" som indeholder (resolve, reject)
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute("SELECT category_lft, category_rgt FROM categories WHERE category_id = ?", [category_id], (err, category) => {
                if (err) {
                    console.log(err.message);
                    reject(err.message);
                }
                else {
                    console.log(category);
                    if(category.length > 0) {
                    let calculatedItems = ((category[0].category_rgt+1) - category[0].category_lft) / 2;
                    let db = mysql.connect();
                    db.execute("DELETE FROM categories WHERE category_lft >= ? AND category_rgt <= ?", [category[0].category_lft, category[0].category_rgt], (err, rows) => {
                        if (err) {
                            console.log(err.message);
                            reject(err.message);
                        }
                        else {
                            let db = mysql.connect();
                            db.execute("UPDATE categories SET category_lft = category_lft - ? WHERE category_lft >= ?", [calculatedItems * 2, category[0].category_lft], (err, rows) => {
                                if (err) {
                                    console.log(err.message);
                                    reject(err.message);
                                }
                                else {
                                    let db = mysql.connect();
                                    db.execute("UPDATE categories SET category_rgt = category_rgt - ? WHERE category_rgt >= ?", [calculatedItems * 2, category[0].category_rgt], (err, rows) => {
                                        if (err) {
                                            console.log(err.message);
                                            reject(err.message);
                                        }
                                        else {
                                            resolve(rows);
                                        }
                                    });
                                    db.end();
                                }
                            });
                            db.end();
                        }
                    });
                    db.end();
                }
                }
            });
            db.end();
        })
    },
    
}