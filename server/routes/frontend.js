// indlæser moduler
const path = require('path'); /* fortolker stier til alle styresytemer */
const uuidv4 = require('uuid/v4'); // genrere unikke nøgler
const bcrypt = require('bcrypt'); // password hashing
const date = require('date-and-time'); // benyttes til at lægge dage eller måneder til en dato
// const guid = require('guid'); // guid, (global unique identifier), til oprettelse af unikke nøgler
const fs = require('fs'); // fs, (fileSystem) til at slette billeder  
// gm, (graphicsMagick) til billede skalering, og upload.
// imageMagick skal downloades uden for visual studio/node 
const gm = require('gm').subClass({
    imageMagick: true
});
const sendmail = require('sendmail')({
    devPort: 25,
    devHost: "localhost", // Vigtigt
    smtpHost: "localhost",
    smtpPort: 25, // Default: 25
    silent: false
})

// indlæser services, fra module.exports
const user_service = require(path.join(__dirname, '..', 'services', 'users.js'));
const product_service = require(path.join(__dirname, '..', 'services', 'products.js'));
const category_service = require(path.join(__dirname, '..', 'services', 'categories.js'));
const order_service = require(path.join(__dirname, '..', 'services', 'orders.js'));


// opretter en asynkron funktion, til alt det gennemgående data 
async function get_template_data() {
    let data = {};

    data.all_products = [];
    data.all_categories = [];
    data.first_subcategory_id = [];

    data.one_user = {
        "user_id": 0,
        "user_name": "",
        "user_firstname": "",
        "user_lastname": "",
        "user_address": "",
        "user_city": "",
        "user_areacode": "",
        "user_image": "",
        "user_email": "",
        "user_password": "",
        "user_rank": 0
    };

    data.one_product = {
        "product_id": 0,
        "product_name": "",
        "product_model": "",
        "product_price": 0,
        "product_description": "",
        "product_image": "",
        "product_inventory": 0,
        "product_inventoryMin": 0,
        "product_inventoryMax": 0,
        "category_id": 0,
        "category_name": "",
    };

    data.one_category = {
        "category_id": 0,
        "category_name": "",
        "category_lft": 0,
        "category_rgt": 0,
    }

    await product_service.get_all()
        .then(result => {
            data.all_products = result;
    })

    await category_service.get_all()
        .then(result => {
            data.all_categories = result;
    })

    await category_service.get_first_category_id()
        .then(result => {
            data.first_subcategory_id = result;
    }) 

    return data;
}

// funktion til at validere email
function validateEmail(email_check) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email_check);
}

// module.exports returnere funktionen (app) til der hvor vi kalder require i vores app.js
module.exports = (app) => {
    // ========================   Index (Henter Siden)   ========================
    app.get('/', (req, res) => {
        (async () => {
            let data = await get_template_data();
            res.render('pages/index', {
                "page": "index",
                "title": "Forside",
                "productNav": "",
                "all_categories": data.all_categories,
                "first_subcategory_id": data.first_subcategory_id,
                "session": req.session
            });
        })();
    });

    // ========================   Logind (Henter Siden)   ========================
    app.get('/logind', (req, res) => {
        (async () => {
            let data = await get_template_data();
            res.render('pages/login', {
                "page": "login",
                "title": "Logind",
                "match_error": "",
                "signature_value": "",
                "productNav": "",
                "all_categories": data.all_categories,
                "first_subcategory_id": data.first_subcategory_id,
                "session": req.session
            });
        })();
    });

    // ====================   Logind   ====================
    app.post('/logind', (req, res) => {
        // automatiseret indsamling af værdier fra formularen (req.body)
        let values = {};
        for (let i = 0; i < Object.keys(req.body).length; i++) {
            Object.keys(req.body).forEach(function (key) {
                values[key.split('_')[1]] = req.body[key]; // 'key.split('_')[1]' for at fjerne 'user_' fra nøglen
            });
        }

        // Opret tomt json objekt til fejlbeskeder
        let error_msg = {};

        // Validering af værdier oprettelse af fejlbeskeds nøgler
        if (values.email == undefined || values.email == "") {
            error_msg.email = "Udfyld signatur (Server Side)";
        }

        if (values.password == undefined || values.password == "") {
            error_msg.password = "Udfyld kodeord (Server Side)";
        }

        // hvis fejlbesked objektet indeholder elementer, betyder det at noget er gået galt,
        // derfor udskrives siden med en fejlbesked
        if (Object.keys(error_msg).length > 0) {
            (async () => {
                let data = await get_template_data();
                console.log(error_msg);
                res.render('pages/login', {
                    "page": "login",
                    "title": "Logind",
                    "match_error": "",
                    "signature_value": values.email,
                    "error_msg": error_msg,
                    "all_categories": data.all_categories,
                    "first_subcategory_id": data.first_subcategory_id,
                    "productNav": ""
                });
            })();
        } else {
            // service der kigger efter email eller brugernavn, der matcher med det i databasen 
            user_service.login_hash(values.email)
                // her bruger vi så .then() og sender result med, som modtager 
                // data fra servicens resolve(rows[0]); [0] fordi vi ved der kun er en.
                .then(result => {
                    // console.log('bruger match');
                    // sammenligner kodeord fra formularen, med den hashede version fra databasen  
                    if (bcrypt.compareSync(values.password, result.user_password)) {
                        // gem session variabeler.
                        req.session.user_id = result.user_id;
                        req.session.user_rank = result.user_rank;
                        req.session.user_verified = result.user_verified;

                        if (result.user_rank == 10 && result.user_verified == 1) {
                            res.redirect('/bruger/profil');
                        } else if (result.user_rank == 100 && result.user_verified == 1) {
                            res.redirect('/admin/forside');
                        } else {
                            (async () => {
                                let data = await get_template_data();
                                // viderstillese mislykkedes kontoen er ikke godkendt
                                res.render('pages/login', {
                                    "page": "login",
                                    "title": "Logind",
                                    "match_error": "kontoen er ikke aktiveret endnu tjek mail",
                                    "signature_value": values.email,
                                    "productNav": "",
                                    "all_categories": data.all_categories,
                                    "first_subcategory_id": data.first_subcategory_id,
                                    "session": req.session
                                });
                            })();
                        }
                    } else {
                        (async () => {
                            let data = await get_template_data();
                            // kodeordet kunne ikke verificeres brugeren er ikke logget på
                            res.render('pages/login', {
                                "page": "login",
                                "title": "Logind",
                                "match_error": "Forkert mail eller kode",
                                "signature_value": values.email,
                                "productNav": "",
                                "all_categories": data.all_categories,
                                "first_subcategory_id": data.first_subcategory_id,
                                "session": req.session
                            });
                        })();
                    }
                })
                // her bruger vi så .catch() og sender error med som modtager 
                // data fra servicens reject(error);
                .catch(error => {
                    (async () => {
                        let data = await get_template_data();
                        // console.log('ingen bruger med det sendte navn');
                        res.render('pages/login', {
                            "page": "login",
                            "title": "Logind",
                            "match_error": "Bruger eller kode eksistere ikke",
                            "signature_value": values.email,
                            "productNav": "",
                            "all_categories": data.all_categories,
                            "first_subcategory_id": data.first_subcategory_id,
                            "session": req.session
                        });
                    })();
                });
        }
    });

    // ====================   Logud   ====================
    app.get('/logud', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.log(err);
            }
            res.redirect('/logind');
        });
    });

    // ========================   Hashing   ========================
    app.get('/hash', (req, res) => {
        let password = "1234";
        let hashed_password = bcrypt.hashSync(password, 10);
        console.log(hashed_password)
    })

    // ========================   Om Os (Henter Siden)   ========================
    app.get('/om_os', (req, res) => {
        (async () => {
            let data = await get_template_data();
            res.render('pages/about', {
                "page": "about",
                "title": "Om os",
                "productNav": "",
                "all_categories": data.all_categories,
                "first_subcategory_id": data.first_subcategory_id,
                "session": req.session
            });
        })();
    });

    // ========================   Produkter Udfra Kategori (Henter Siden)   ======================== 
    app.get('/produkter/kategori/:id', (req, res) => {
        (async () => {
            try {
                let data = await get_template_data();

                // angiver standard sidenummer
                let page = 1;
                if (req.query.page != undefined || !isNaN(req.query.page)) {
                    page = req.query.page; // tager sider fra querystring hvis de findes
                }

                // definere hvor mange elementer der skal vises per side
                let page_limit = 3;

                // holder styr på hvor mange elementer der er i alt
                let product_count = 0;
                await product_service.count_products(req.params.id)
                    .then(result => product_count = result)
                    .catch(error => console.log(error));

                // beregn hvor mange elemter der skal springes over, for at vise siden
                let offset = (page - 1) * page_limit;

                // hvor mange elementer skal der vises på den nuværende side
                let products = [];
                await product_service.get_offset(req.params.id, offset, page_limit)
                    .then(result => products = result)
                    .catch(error => console.log(error));                

                let one_category = {
                    "category_id": 0,
                    "category_name": ""
                }
                    

                products.forEach(product => {
                    product.product_description = product.product_description.substring(0, 65) + ' ...';
                })


                res.render('pages/products', {
                    "title": "Butikken",
                    "page": one_category.category_name,
                    "productNav": "using",
                    "params": req.params.id,
                    "products": products,
                    "product_count": product_count,
                    "page_limit": page_limit,
                    "page_current": page,
                    "all_categories": data.all_categories,
                    "first_subcategory_id": data.first_subcategory_id,
                    "session": req.session
                });
            }
            catch (error) {
                console.log(error);
            }
        })();
    });

    // ========================   Produkt Detaljer (Henter Siden)   ======================== 
    app.get('/produkter/detalje/:id', (req, res) => {
        (async () => {
            try {
                let data = await get_template_data();

                await product_service.get_one(req.params.id)
                    .then(result => {
                        one_product = result;
                    })

                res.render('pages/products_detail', {
                    "title": "Detalje",
                    "page": "products_detail",
                    "one_product": one_product,
                    "params": one_product.category_id,
                    "all_categories": data.all_categories,
                    "first_subcategory_id": data.first_subcategory_id,
                    "productNav": "using",
                    "session": req.session
                });

            }
            catch (error) {
                console.log(error);
            }
        })();
    });

    // ====================  Opret Bruger (Henter Siden)   ====================
    app.get('/opret', (req, res) => {
        (async () => {
            let data = await get_template_data();
            res.render('pages/register', {
                "page": "register",
                "title": "Opret Bruger",
                "match_error": "",
                "one_user": data.one_user,
                "productNav": "",
                "all_categories": data.all_categories,
                "first_subcategory_id": data.first_subcategory_id,
                "session": req.session
            });
        })();
    });

    // ====================   Opret Bruger   ====================
    app.post('/opret', (req, res) => {
        // console.log(bcrypt.hashSync('1234', 10));
        // automatiseret indsamling af værdier fra formularen (req.body)
        let values = {};
        for (let i = 0; i < Object.keys(req.body).length; i++) {
            Object.keys(req.body).forEach(function (key) {
                values[key.split('_')[1]] = req.body[key]; // 'key.split('_')[1]' for at fjerne 'user_' fra nøglen
            });
        }
        // console.log(req.body);
        // Opret tomt json objekt til fejlbeskeder
        let error_msg = {};

        // Validering af værdier oprettelse af fejlbeskeds nøgler
        if (values.name == undefined || values.name == "") {
            error_msg.name = "Udfyld Brugernavn (Server Side)";
        }

        if (values.firstname == undefined || values.firstname == "") {
            error_msg.firstname = "Udfyld Fornavn (Server Side)";
        }

        if (values.lastname == undefined || values.lastname == "") {
            error_msg.lastname = "Udfyld Efternavn (Server Side)";
        }
        
        if (values.address == undefined || values.address == "") {
            error_msg.address = "Udfyld Adresse (Server Side)";
        }  
        
        if (values.city == undefined || values.city == "") {
            error_msg.city = "Udfyld By (Server Side)";
        }
        
        if (isNaN(values.areacode) || values.areacode == undefined || values.areacode == '') {
            error_msg.areacode = "Udfyld Postnummer (Server Side)";
        }     

        if (values.email == undefined || values.email == "") {
            error_msg.email = "Udfyld email (Server Side)";
        } else if (!validateEmail(values.email)) {
            error_msg.email = "ikke en gyldig email (Server Side)";
        }

        if (values.password == undefined || values.password == "") {
            error_msg.password = "Udfyld Kodeord (Server Side)";
        }

        if (values.repeatPassword == undefined || values.repeatPassword == "") {
            error_msg.repeatPassword = "Gentag Kodeord (Server Side)";
        }

        if (values.repeatPassword != '' && values.password !== values.repeatPassword) {
            error_msg.repeatPassword = "Kodeord Matcher ikke (Server Side)";
        }

        // Hvis fejlbesked objektet indeholder elementer, betyder det at noget er gået galt,
        // Derfor returneres fejlbesked objektet så klienten kan se besked i konsol
        if (Object.keys(error_msg).length > 0) {
            (async () => {
                let data = await get_template_data();
                console.log(error_msg);
                // dummy data, som overskrives af data fra service 
                let one_user = {
                    "user_id": 0,
                    "user_name": values.name,
                    "user_firstname": values.firstname,
                    "user_lastname": values.lastname,
                    "user_address": values.address,
                    "user_city": values.city,
                    "user_areacode": values.areacode,
                    "user_email": values.email,
                    "user_rank": 0,
                    "user_created": "",
                    "user_verified": ""
                };

                res.render('pages/register', {
                    "page": "register",
                    "title": "Opret Bruger",
                    "one_user": one_user,
                    "error_msg": error_msg,
                    "step": "",
                    "match_error": "",
                    "productNav": "",
                    "all_categories": data.all_categories,
                    "first_subcategory_id": data.first_subcategory_id,
                    "session": req.session
                });
            })();
        } else {
            (async () => {
                let data = await get_template_data();
                // opretter variabel til billede navn, og en variabel der indholder værdien af det valgte billede   
                let image_name = '';
                let user_upload = req.files.user_image;

                if (user_upload != undefined) {
                    // angiver værdi til variablen image_name, efter de gamle billeder er slettet, som generer unikke nøgler istedet for
                    // billedets originale navn, og sammensætter den nye unikke string, med billedets originale filtype  
                    image_name = uuidv4() + path.extname(user_upload.name);

                    // variabel som indehodler stien til der hvor det nye billede skal indsættes
                    let upload_location = path.join(__dirname, '..', '..', 'public', 'images', 'users', image_name);
                    user_upload.mv(upload_location, (err) => {
                        if (err) {
                            console.log(err);
                        }

                        // variabel som indeholder stien til der hvor det nye resizede billede skal placeres
                        let resized_location = path.join(__dirname, '..', '..', 'public', 'images', 'users', 'resized', image_name);
                        // skalere billede  
                        gm(upload_location).resize(170).write(resized_location, (err) => {
                            if (err) {
                                console.log(err.message);
                            }
                        })
                    });
                } else if (user_upload == undefined) {
                    image_name = "no-image.png";
                }
                
                // Hasher user password 
                bcrypt.hash(values.password, 10, (err, hashed_password) => {
                    if (err) {
                        console.log(err);
                    } else {
                        // opretter bruger i db, med den hashedede version af deres personlige kodeord.
                        user_service.create_user(values.name, values.firstname, values.lastname, values.address, values.city, values.areacode, image_name, values.email, hashed_password)
                            // her bruger vi så .then() og sender user id med som indeholder 
                            // data fra servicens resolve(insertId); som også giver mulighed for at
                            // kalde id'et her.
                            .then(user_id => {
                                // opretter variabler til UUID(unik nøgle), dato og udløbsdato til aktivering af bruger, 
                                let key = uuidv4();
                                let now = new Date();
                                let expires = date.addMonths(now, 1);

                                user_service.insert_user_key(key, expires, user_id, 'godkend')
                                    // her bruger vi så .then() og sender result med som indeholder 
                                    // data fra servicens resolve(rows);
                                    .then(result => {
                                        let sender = 'no-reply@some-domain.com';
                                        let verify_url = `http://localhost:3000/godkend/${key}`;
                                        let message = `
                                        <h1>Hej ${values.name}</h1>
                                        <p>Klik på det følgende link, eller kopier adressen, og indsæt den i URL'en, For at bekræfte din konto</p>
                                        <p><a href="${verify_url}" target="_blank">${verify_url}</a></p>
                                        <p></p>`;
                                        sendmail({
                                            from: sender,
                                            to: values.email,
                                            subject: 'Bekræft konto',
                                            text: message,
                                            html: message
                                        }), (err, reply => {
                                            if (err) {
                                                console.log(err && err.stack);
                                            }
                                        });

                                        res.redirect('/godkend');
                                    })
                                    // her bruger vi så .catch() og sender err med som indeholder 
                                    // data fra insert_user_key servicens, reject(err);
                                    .catch(err => {
                                            console.log(err);
                                            res.render('pages/verify', {
                                                "page": "verify",
                                                "title": "Bekræft Konto",
                                                "message": "",
                                                "step": "step_error",
                                                "success": true,
                                                "productNav": "",
                                                "all_categories": data.all_categories,
                                                "first_subcategory_id": data.first_subcategory_id,
                                                "session": req.session
                                            });
                                    });
                            })
                            // her bruger vi så .catch() og sender error med som indeholder 
                            // data fra create_user servicens, reject(error);
                            .catch(error => {
                                    console.log(error);

                                    // dummy data, som overskrives af data fra service 
                                    let one_user = {
                                        "user_id": 0,
                                        "user_name": values.name,
                                        "user_firstname": values.firstname,
                                        "user_lastname": values.lastname,
                                        "user_address": values.address,
                                        "user_city": values.city,
                                        "user_areacode": values.areacode,
                                        "user_email": values.email,
                                        "user_rank": 0,
                                        "user_created": "",
                                        "user_verified": 0
                                    };

                                    res.render('pages/register', {
                                        "page": "register",
                                        "title": "Opret Bruger",
                                        "one_user": one_user,
                                        "match_error": 'Brugernavn eller email eksistere allerede',
                                        "step": "",
                                        "productNav": "",
                                        "all_categories": data.all_categories,
                                        "first_subcategory_id": data.first_subcategory_id,
                                        "session": req.session
                                    });
                                
                            });
                    }
                });
            })();
        }
    });

    // ========================   Bekræft Konto (Henter Siden)   ========================
    app.get('/godkend', (req, res) => {
        (async () => {
            let data = await get_template_data();
            res.render('pages/verify', {
                "page": "verify",
                "title": "Bekræft Konto",
                "message": "",
                "step": "step1",
                "success": true,
                "productNav": "",
                "all_categories": data.all_categories,
                "first_subcategory_id": data.first_subcategory_id,
                "session": req.session
            });
        })();
    });

    // ====================   Bekræft Konto (verified)   ====================
    app.get('/godkend/:key', (req, res) => {
        let key = req.params.key;
        if (key == undefined || key == '' || key.length != 36) {
            (async () => {
                let data = await get_template_data();
                res.render('pages/verify', {
                    "page": "verify",
                    "title": "Fejl i nøgle",
                    'message': 'Ugyldig nøgle',
                    "step": "step_error",
                    "productNav": "",
                    "all_categories": data.all_categories,
                    "first_subcategory_id": data.first_subcategory_id,
                    "session": req.session
                });
            })();
        } else {
            (async () => {
                let data = await get_template_data();
                user_service.recieve_user_key(key, 'verify')
                    .then(user_id => {
                        user_service.verify_user(key, user_id)
                            .then(result => {
                                if (req.session.user_verified != undefined) {
                                    req.session.user_verified = 1;
                                }
                                res.render('pages/verify', {
                                    "page": "verify",
                                    "title": "Bekræftet",
                                    'message': 'Success kontoen er aktiveret',
                                    "step": "step2",
                                    'success': true,
                                    "productNav": "",
                                    "all_categories": data.all_categories,
                                    "first_subcategory_id": data.first_subcategory_id,
                                    "session": req.session
                                });
                            })
                            .catch(error => {
                                console.log(error);
                                res.render('pages/verify', {
                                    "page": "verify",
                                    "title": "Bekræft Konto",
                                    "step": "step_error",
                                    'message': 'Kontoen er ikke aktiv',
                                    "productNav": "",
                                    "all_categories": data.all_categories,
                                    "first_subcategory_id": data.first_subcategory_id,
                                    "session": req.session
                                });
                            });
                    })
                    .catch(error => {
                        console.log(error);
                        res.render('pages/verify', {
                            "page": "verify",
                            "title": "Fejl i nøgle",
                            "step": "step_error",
                            'message': 'Ugyldig nøgle',
                            "productNav": "",
                            "all_categories": data.all_categories,
                            "first_subcategory_id": data.first_subcategory_id,
                            "session": req.session
                        });
                    });
            })();
        }
    })
    
    // ========================   Glemt Kodeord (Henter Siden)   ========================
    app.get('/glemt_kodeord', (req, res) => {
        (async () => {
            let data = await get_template_data();
            res.render('pages/forgot', {
                "page": "forgot",
                "title": "Glemt Kodeord",
                "resetpass": "",
                "match_error": "",
                "productNav": "",
                "all_categories": data.all_categories,
                "first_subcategory_id": data.first_subcategory_id,
                "session": req.session
            });
        })();
    });

    // ========================   Glemt Kodeord   ========================
    app.post('/glemt_kodeord', (req, res) => {
        let user_email = req.body.user_email;

        // console.log(req.body);
        // Opret tomt json objekt til fejlbeskeder
        let error_msg = {};

        if (user_email == undefined || user_email == "") {
            error_msg.email = "Udfyld email (Server Side)";
        } else if (!validateEmail(user_email)) {
            error_msg.email = "ikke en gyldig email (Server Side)";
        }

        if (Object.keys(error_msg).length > 0) {
            (async () => {
                let data = await get_template_data();
                console.log(error_msg);
                res.render('pages/forgot', {
                    "page": "forgot",
                    "title": "Glemt Kodeord",
                    "resetpass": "",
                    "match_error": "",
                    "error_msg": error_msg,
                    "productNav": "",
                    "all_categories": data.all_categories,
                    "first_subcategory_id": data.first_subcategory_id,
                    "session": req.session
                });
            })();
        } else {
            (async () => {
                let data = await get_template_data();
                user_service.mail_check(user_email)
                    .then(user => {
                        let key = uuidv4();
                        let now = new Date();
                        let expires = date.addDays(now, 1);

                        user_service.create_password_key(key, expires, user.user_id)
                            .then(rows => {
                                let reset_url = `http://localhost:3000/nulstil/${key}`;
                                let message = `
                            <h1>Hej ${user.user_name}</h1>
                            <p>Klik på det følgende link, for at nulstille dit kodeord</p>
                            <p><a href="${reset_url}" target="_blank">${reset_url}</a></p>
                            <p></p>`;
                                sendmail({
                                    from: 'no-reply@some-domain.com',
                                    to: user.user_email,
                                    subject: 'Nulstil Kodeord',
                                    text: message,
                                    html: message
                                }, (err, reply) => {
                                    if (err) {
                                        console.log(err && err.stack);
                                    }
                                });

                                res.render('pages/forgot', {
                                    "page": "forgot",
                                    "title": "Success!",
                                    "resetpass": "success",
                                    "message": "En mail er afsendt til" + " " + user.user_email,
                                    "productNav": "",
                                    "all_categories": data.all_categories,
                                    "first_subcategory_id": data.first_subcategory_id,
                                    "session": req.session

                                });
                            })
                    })
                    .catch(error => {
                        res.render('pages/forgot', {
                            "page": "forgot",
                            "title": "Ugyldig mail!",
                            "resetpass": "error",
                            "match_error": "E-mailen kunne ikke findes i systemet",
                            "productNav": "",
                            "all_categories": data.all_categories,
                            "first_subcategory_id": data.first_subcategory_id,
                            "session": req.session
                        });
                    })
                    .catch(error => {
                        res.render('pages/forgot', {
                            "page": "forgot",
                            "title": "Fejl",
                            "resetpass": "",
                            "match_error": "",
                            "productNav": "",
                            "all_categories": data.all_categories,
                            "first_subcategory_id": data.first_subcategory_id,
                            "session": req.session
                        });
                    })
            })();
        }
    });

    // ========================   Nyt kodeord (Henter siden)   ========================
    app.get('/nulstil/:key', (req, res) => {
        (async () => {
            let data = await get_template_data();
            user_service.recieve_password_key(req.params.key)
                .then(result => {
                    res.render('pages/reset', {
                        "title": "Vælg nyt kodeord", 
                        "page": "reset", 
                        "newpass": "",
                        "productNav": "",
                        "all_categories": data.all_categories,
                        "first_subcategory_id": data.first_subcategory_id,
                        "session": req.session
                    });
                })
                .catch(err => {
                    res.render('pages/reset', {
                        "page": "reset",
                        "title": "Ugyldig nøgle", 
                        "newpass": "error",
                        "productNav": "",
                        "all_categories": data.all_categories,
                        "first_subcategory_id": data.first_subcategory_id,
                        "session": req.session
                    });
                })
        })();
    });

    // ========================   Nyt kodeord   ========================
    app.post('/nulstil/:key', (req, res) => {
        let error_msg = {};

        let user_password = req.body.user_password;
        if (user_password == undefined || user_password == '') {
            error_msg.password = 'Udfyld kodeord (Server Side)';
        }

        let user_repeatPassword = req.body.user_repeatPassword;
        if (user_repeatPassword == undefined || user_repeatPassword == '') {
            error_msg.repeatPassword = 'Gentag kodeord (Server Side)';
        }

        if (user_password !== user_repeatPassword) {
            error_msg.passwordRepeat = 'Kodeord matcher ikke (Server Side)';
        }

        if (Object.keys(error_msg).length > 0) {
            (async () => {
                let data = await get_template_data();
                res.render('pages/reset', {
                    "page": "reset",
                    "title": "Vælg nyt kodeord",
                    "newpass": "",
                    "productNav": "",
                    "all_categories": data.all_categories,
                    "first_subcategory_id": data.first_subcategory_id,
                    "session": req.session
                });
            })();
        } else {
            (async () => {
                let data = await get_template_data();
                user_service.recieve_password_key(req.params.key)
                    .then(result => {
                        let hashed_password = bcrypt.hashSync(user_password, 10);

                        user_service.reset_password(req.params.key, hashed_password, result.user_id)
                            .then(result => {
                                res.render('pages/reset', {
                                    "page": "reset",
                                    "title": "Success!",
                                    "newpass": "success",
                                    "productNav": "",
                                    "all_categories": data.all_categories,
                                    "first_subcategory_id": data.first_subcategory_id,
                                    "session": req.session
                                });
                                
                            })
                            .catch(error => {
                                console.log(error)
                            })
                    })
                    .catch(error => {
                        res.render('pages/reset', {
                            "page": "reset",
                            "title": "Fejl!",
                            "newpass": "error",
                            "productNav": "",
                            "all_categories": data.all_categories,
                            "first_subcategory_id": data.first_subcategory_id,
                            "session": req.session
                        })
                    });
            })();
        };
    });
 
    // ========================   Kassen (Henter siden)   ========================
    app.get('/kassen', (req, res) => {
        (async () => {
            try {
                let data = await get_template_data();

                res.render('pages/cart', {
                    "title": "Kassen",
                    "page": "cart",
                    "productNav": "",
                    "all_categories": data.all_categories,
                    "first_subcategory_id": data.first_subcategory_id,
                    "session": req.session
                });
            }
            catch (error) {
                console.log(error);
            }
        })();
    });  
    
}





















