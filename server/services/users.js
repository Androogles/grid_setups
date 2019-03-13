// indlæser moduler
const mysql = require('../config/mysql.js'); 

let sql = `SELECT user_id, 
                user_name,
                user_firstname,
                user_lastname,
                user_address, 
                user_city,
                user_areacode, 
                user_image,
                user_email, 
                user_rank, 
                user_created, 
                user_verified 
        FROM users `;

// ====================   sletter udløbede uuid'er (verify)  ====================
let delete_u_keys = () => {
    let now = new Date();
    let db = mysql.connect();
    db.execute("DELETE FROM verify_keys WHERE expire_date < ?", [now], (err, rows) => {
        if (err) {
            console.log(err.message);
        } 
    });
    db.end();
};

// ====================   sletter udløbede uuid'er (password)  ====================
let delete_p_keys = () => {
    let now = new Date();
    let db = mysql.connect();
    db.execute("DELETE FROM password_keys WHERE expire_date < ?", [now], (err, rows) => {
        if (err) {
            console.log(err.message);
        }
    });
    db.end();
};

// ====================   sletter uuid (verify)  ====================
let delete_user_key = (key) => {
    return new Promise((resolve, reject) => {
        let db = mysql.connect();
        db.execute("DELETE FROM verify_keys WHERE uuid = ? OR expire_date < NOW()", [key], (err, rows) => {
            if (err) {
                console.log(err.message);
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
        db.end();
    });
};

// ====================   sletter uuid (password)  ====================
let delete_password_key = (key) => {
    return new Promise((resolve, reject) => {
        let db = mysql.connect();
        db.execute("DELETE FROM password_keys WHERE uuid = ? OR expire_date < NOW()", [key], (err, rows) => {
            if (err) {
                console.log(err.message);
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
        db.end();
    });
}

module.exports = {
    // ====================   (Logind)  ====================
    login_hash: (user_email) => {
        // starter med at "return new promise" som indeholder (resolve, reject) de 
        // værdier bliver sendt med i then og catch ovre i routen, som (result, error).
        return new Promise((resolve, reject) => {
            // opretter forbindelse 
            let db = mysql.connect();
            db.execute(`SELECT user_id, user_name, user_email, user_password, user_rank, user_verified
                        FROM users 
                        WHERE user_email = ? OR user_name = ?`, [user_email, user_email], (err, rows) => {
                    if (err) {
                        console.log(err.message);
                        reject(err.message);
                    } else {
                        if (rows.length == 1) {
                            resolve(rows[0]);
                        } else {
                            reject('forkert navn eller kode (service)');
                        }
                    }
                });
            db.end();
        });
    },

    // ====================   Tjekker DB for match (Logind)  ====================
    mail_check: (user_email) => {
        // starter med at "return new promise" som indeholder (resolve, reject) de 
        // værdier bliver sendt med i then og catch ovre i routen, som (result, error).
        return new Promise((resolve, reject) => {
            // opretter forbindelse 
            let db = mysql.connect();
            db.execute(`SELECT user_id, user_name, user_email
                        FROM users 
                        WHERE user_email = ?`, [user_email], (err, rows) => {
                    if (err) {
                        console.log(err.message);
                        reject(err.message);
                    } else {
                        if (rows.length == 1) {
                            resolve(rows[0]);
                        } else {
                            reject('mail findes ikke');
                        }
                    }
                });
            db.end();
        });
    },

    // ====================   Opret Bruger   ====================
    create_user: (user_name, user_firstname, user_lastname, user_address, user_city, user_areacode, user_image, user_email, user_password) => {
        // starter med at "return new promise" som indeholder (resolve, reject) de 
        // værdier bliver sendt med i then og catch ovre i routen, som (result, error).
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(`INSERT INTO users 
                            SET user_name = ?,
                                user_firstname = ?,
                                user_lastname = ?,
                                user_address = ?, 
                                user_city = ?,
                                user_areacode = ?,
                                user_image = ?,
                                user_email = ?,
                                user_password = ?,
                                user_rank = 10, 
                                user_created = NOW(),
                                user_verified = false`, [user_name, user_firstname, user_lastname, user_address, user_city, user_areacode, user_image, user_email, user_password], (err, rows) => {
                    if (err) {
                        reject(err.message)
                    } else {
                        console.log(rows);
                        resolve(rows.insertId);
                    }
                });
            db.end();
        });
    },

    // ====================   Henter uuid (verify)   ====================
    recieve_user_key: (key) => {
        // starter med at "return new promise" som indeholder (resolve, reject) de 
        // værdier bliver sendt med i then og catch ovre i routen, som (result, error).
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(`SELECT fk_user_id
                                FROM verify_keys  
                                WHERE uuid = ? AND expire_date >= NOW()`, [key], (err, rows) => {
                    if (err) {
                        console.log(err.message);
                        reject(err.message);
                    } else {
                        if (rows.length == 1) {
                            resolve(rows[0].fk_user_id);
                        } else {
                            reject(err);
                        }
                    }
                });
            db.end();
        });
    },

    // ====================   Opretter uuid (verify)  ====================
    insert_user_key: (key, expires, user_id) => {
        // starter med at "return new promise" som indeholder (resolve, reject) de 
        // værdier bliver sendt med i then og catch ovre i routen, som (result, error).
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(`INSERT INTO verify_keys 
                                SET uuid = ?, 
                                expire_date = ?,
                                fk_user_id = ?`, [key, expires, user_id], (err, rows) => {
                    if (err) {
                        console.log(err.message);
                        reject(err.message);
                    } else {
                        delete_u_keys();
                        resolve(rows);
                    }
                });
            db.end();
        });
    },

    // ====================   Retter værdi, i user tabel (verify)  ====================
    verify_user: (key, user_id) => {
        // starter med at "return new promise" som indeholder (resolve, reject) de 
        // værdier bliver sendt med i then og catch ovre i routen, som (result, error).
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(`UPDATE users SET user_verified = true WHERE user_id = ?`, [user_id], (err, rows) => {
                if (err) {
                    console.log(err.message);
                    reject(err.message);
                } else {
                    delete_user_key(key)
                        .then(resolve(true))
                        .catch(error => {
                            console.log(error);
                            reject(error);
                        });
                }
            });
            db.end();
        });
    },

    // ====================   Henter uuid (password)   ====================
    recieve_password_key: (key) => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(`SELECT 
                                uuid, 
                                expire_date, 
                                user_id, 
                                user_verified 
                            FROM password_keys 
                            INNER JOIN users ON fk_user_id = user_id 
                            WHERE uuid = ? AND expire_date >= NOW()`, [key], (err, rows) => {
                    if (err) {
                        console.log(err.message);
                        reject(err.message);
                    } else {
                        if (rows.length == 1) {
                            resolve(rows[0]);

                        } else {
                            reject('kunne ikke finde key i db');
                        }
                    }
                });
                db.end();
        });
    },

    // ====================   Opretter uuid (password)  ====================
    create_password_key: (key, expires, user_id) => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(`INSERT INTO 
                                password_keys
                            SET 
                                uuid = ?,  
                                expire_date = ?, 
                                fk_user_id = ?`, [key, expires, user_id], (err, rows) => {
                    if (err) {
                        console.log(err.message);
                        reject(err.message);
                    } else {
                        delete_p_keys();
                        resolve(rows);
                    }
                });
                db.end();
        });
    },

    // ====================   Retter værdi, i user tabel (password)   ====================
    reset_password: (key, user_password, user_id) => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(`UPDATE 
                            users
                        SET 
                            user_password = ?
                        WHERE 
                            user_id = ?`, [user_password, user_id], (err, rows) => {
                    if (err) {
                        reject('sql fejl! ' + err.message);
                    } else {
                        delete_password_key(key)
                        .then()
                        resolve(rows);
                    }
                });
            db.end();
        });
    },


    // ========================================================================================================================================================================


    // ========================   Henter En Bruger   ========================
    get_one: (user_id) => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(sql + `WHERE user_id = ?`, [user_id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows[0]);
                }
            });
            db.end();
        });
    },

    // ========================   Henter Alle Brugere   ========================
    get_all: () => {
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(sql + `ORDER BY user_id ASC`, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
            db.end();
        });
    },

    // ====================   Opret Bruger Admin   ====================
    create_one: (user_name, user_firstname, user_lastname, user_address, user_city, user_areacode, user_image, user_email, user_password, user_rank) => {
        // starter med at "return new promise" som indeholder (resolve, reject)
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute(`INSERT INTO users 
                                SET user_name = ?, 
                                    user_firstname = ?,
                                    user_lastname = ?,
                                    user_address = ?, 
                                    user_city = ?,
                                    user_areacode = ?,
                                    user_image = ?,
                                    user_email = ?, 
                                    user_password = ?,
                                    user_rank = ?, 
                                    user_created = NOW(),
                                    user_verified = true`, [user_name, user_firstname, user_lastname, user_address, user_city, user_areacode, user_image, user_email, user_password, user_rank], (err, rows) => {
                    if (err) {
                        reject(err.message)
                    } else {
                        resolve(rows.insertId);
                    }
                });
            db.end();
        });
    },

    // ====================   Rediger Bruger Admin   ====================
    edit_one: (user_name, user_firstname, user_lastname, user_address, user_city, user_areacode, user_image, user_email, user_password, user_rank, user_id) => {
        // starter med at "return new promise" som indeholder (resolve, reject)
        return new Promise((resolve, reject) => {
            // Grund sql
            let sql_query = `UPDATE users 
                                SET user_name = ?, 
                                    user_firstname = ?,
                                    user_lastname = ?,
                                    user_address = ?, 
                                    user_city = ?,
                                    user_areacode = ?,
                                    user_image = ?,
                                    user_email = ?,
                                    user_rank = ?`;
            let sql_params = [user_name, user_firstname, user_lastname, user_address, user_city, user_areacode, user_image, user_email, user_rank];

            // hvis der er data i kodeord, betyder det at kodeordet også skal rettes, og SQL skal ændres
            if (user_password != '') {
                // dette er den SQL som også opdaterer kodeordet
                sql_query += `,user_password = ?`;
                sql_params.push(user_password);
            }

            // Tilføjer where statement i slutningen
            sql_query += " WHERE user_id = ?";
            sql_params.push(user_id);

            let db = mysql.connect();
            db.execute(sql_query, sql_params, (err, rows) => {
                if (err) {
                    reject(err.message);
                } else {
                    resolve(rows);
                }
            });
            db.end();
        });
    },

    // ========================   Slet En Bruger Admin   ========================
    delete_one: (user_id) => {
        // starter med at "return new promise" som indeholder (resolve, reject)
        return new Promise((resolve, reject) => {
            let db = mysql.connect();
            db.execute("DELETE FROM users WHERE user_id = ?", [user_id], (err, rows) => {
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

    // gør delete user key funktionen "public"
    delete_user_key: delete_user_key,

    // gør delete password key funktionen "public"
    delete_password_key: delete_password_key,
}