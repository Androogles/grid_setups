// modatager moduler 
const bcrypt = require('bcrypt'); // password hashing
const datetime = require('date-and-time'); // benyttes til at lægge dage eller måneder til en dato
const path = require('path'); // path, til formatering af stier (/ ? \) 
const uuidv4 = require('uuid/v4'); // genrere unikke nøgler
// const guid = require('guid'); // guid, (global unique identifier), til oprettelse af unikke nøgler
const fs = require('fs'); // fs, (fileSystem) til at slette billeder  
// gm, (graphicsMagick) til billede skalering, og upload.
// imageMagick skal downloades uden for visual studio/node 
const gm = require('gm').subClass({
    imageMagick: true
});

// indlæser services
const user_service = require(path.join(__dirname, '..', 'services', 'users.js'));
const product_service = require(path.join(__dirname, '..', 'services', 'products.js'));
const category_service = require(path.join(__dirname, '..', 'services', 'categories.js'));
const order_service = require(path.join(__dirname, '..', 'services', 'orders.js'));
const status_service = require(path.join(__dirname, '..', 'services', 'order_statuses.js'));
const order_line_service = require(path.join(__dirname, '..', 'services', 'order_lines.js'));

// opretter en asynkron funktion, til alt det gennemgående data
async function get_template_data() {
    let data = {};

    data.all_users = [];
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

    await user_service.get_all()
        .then(result => {
            data.all_users = result;
        })

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

module.exports = (app) => {
    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ADMIN <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

    // ========================   Forside (Henter Siden) Admin   ========================
    app.get('/admin/forside', (req, res) => {
        (async () => {
            let data = await get_template_data();

            res.render('pages/admin_index', {
                "page": "admin_index",
                "title": "Forsiden",
                "session": req.session
            });
        })();
    });

    // ========================   Brugere (Henter Siden) Admin   ========================
    app.get('/admin/brugere', (req, res) => {
        (async () => {
            let data = await get_template_data();

            data.all_users.forEach(user => {
                user.user_created = datetime.format(user.user_created, "DD/MM-YYYY")
            })

            res.render('pages/admin_users', {
                "page": "admin_users",
                "title": "Opret Bruger",
                "all_users": data.all_users,
                "formtype": "opret",
                "one_user": data.one_user,
                "match_error": "",
                "session": req.session
            });
        })();
    });

    // ========================   Opret Bruger Admin   ========================
    app.post('/admin/brugere', (req, res) => {
        // console.log(bcrypt.hashSync('1234', 10));
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
            error_msg.email = "Ikke en gyldig email (Server Side)";
        }

        if (values.password == undefined || values.password == "") {
            error_msg.password = "Udfyld kodeord (Server Side)";
        }

        if (values.repeatPassword == undefined || values.repeatPassword == "") {
            error_msg.repeatPassword = "Gentag Kodeord (Server Side)";
        }

        if (values.repeatPassword != '' && values.password !== values.repeatPassword) {
            error_msg.repeatPassword = "Kodeord matcher ikke (Server Side)";
        }

        if (values.rank == undefined || isNaN(values.rank) || values.rank == 0) {
            error_msg.rank = "Vælg rolle niveau (Server Side)";
        }

        // Hvis fejlbesked objektet indeholder elementer, betyder det at noget er gået galt,
        // Derfor returneres fejlbesked objektet så klienten kan se besked i konsol
        if (Object.keys(error_msg).length > 0) {
            (async () => {
                console.log(error_msg);

                let data = await get_template_data();

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
                    "user_rank": values.rank,
                    "user_created": "",
                    "user_verified": ""
                };

                res.render('pages/admin_users', {
                    "page": "admin_users",
                    "title": "Opret Bruger",
                    "one_user": one_user,
                    "error_msg": error_msg,
                    "all_users": data.all_users,
                    "formtype": "opret",
                    "match_error": "",
                    "session": req.session,
                });
            })();
        } else {
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

            let hashed_password = bcrypt.hashSync(values.password, 10);

            // opretter bruger i db, med den hashedede version af deres personlige kodeord.
            user_service.create_one(values.name, values.firstname, values.lastname, values.address, values.city, values.areacode, image_name, values.email, hashed_password, values.rank)
                // user_service.check_existing_mail(user_id)
                // Check DB for matching Mails!?
                .then(result => {
                    res.redirect('/admin/brugere');
                })
                .catch(error => {
                    (async () => {
                        console.log(error);
                        let data = await get_template_data();
                        let one_user = {
                            "user_id": 0,
                            "user_name": values.name,
                            "user_firstname": values.firstname,
                            "user_lastname": values.lastname,
                            "user_address": values.address,
                            "user_city": values.city,
                            "user_areacode": values.areacode,
                            "user_email": values.email,
                            "user_rank": values.rank,
                            "user_created": "",
                            "user_verified": ""
                        };

                        res.render('pages/admin_users', {
                            "page": "admin_users",
                            "title": "Opret Bruger",
                            "one_user": one_user,
                            "error_msg": error_msg,
                            "all_users": data.all_users,
                            "formtype": "opret",
                            "match_error": "Brugernavn eller email eksistere allerede",
                            "session": req.session,
                        });
                    })();
                });
        }
    });

    // ========================   Forudfyld Formular Admin   ========================
    app.get('/admin/bruger/ret/:id', (req, res) => {
        if (isNaN(req.params.id)) {
            res.redirect("/admin/brugere"); // BAD REQUEST
        } else {
            (async () => {
                try {
                    let data = await get_template_data();

                    data.all_users.forEach(user => {
                        user.user_created = datetime.format(user.user_created, "DD/MM-YYYY")
                    })

                    await user_service.get_one(req.params.id)
                        .then(result => {
                            data.one_user = result;
                        })

                    res.render('pages/admin_users', {
                        "title": "Rediger Bruger",
                        "page": "admin_users",
                        "error_msg": "",
                        "formtype": "rediger",
                        "all_users": data.all_users,
                        "one_user": data.one_user,
                        "match_error": "",
                        "session": req.session
                    });

                } catch (error) {
                    console.log(error);
                }
            })();
        }
    });

    // ========================   Redigere Bruger Admin   ========================
    app.post('/admin/bruger/ret/:id', (req, res) => {
        if (isNaN(req.params.id)) {
            res.redirect("/admin/brugere"); // BAD REQUEST
        } else {
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

            if (values.areacode == undefined || isNaN(values.areacode) || values.areacode == '') {
                error_msg.areacode = "Udfyld Postnummer (Server Side)";
            }

            if (values.email == undefined || values.email == "") {
                error_msg.email = "Udfyld email (Server Side)";
            } else if (!validateEmail(values.email)) {
                error_msg.email = "Ikke en gyldig email (Server Side)";
            }

            if (values.rank == undefined || isNaN(values.rank) || values.rank == 0) {
                error_msg.rank = "Vælg rolle niveau (Server Side)";
            }

            if (values.password != '' && values.password != values.repeatPassword) {
                error_msg.repeatPassword = "Kodeord matcher ikke (Server Side)";
            }

            // Hvis fejlbesked arrayet indeholder elementer, betyder det at noget er gået galt,
            // Derfor returneres fejlbesked arrayet så klienten kan se besked i konsol
            if (Object.keys(error_msg).length > 0) {
                (async () => {
                    try {
                        console.log(error_msg);
                        let data = await get_template_data();

                        data.all_users.forEach(user => {
                            user.user_created = datetime.format(user.user_created, "DD/MM-YYYY")
                        })

                        await user_service.get_one(req.params.id)
                            .then(result => {
                                data.one_user = result;
                            })

                        res.render('pages/admin_users', {
                            "title": "Rediger Bruger",
                            "page": "admin_users",
                            "error_msg": error_msg,
                            "formtype": "rediger",
                            "all_users": data.all_users,
                            "one_user": data.one_user,
                            "match_error": "",
                            "session": req.session,
                        });

                    } catch (error) {
                        console.log(error);
                    }
                })();
            } else {
                // opretter variabel til billede navn, og en variabel der indholder værdien af det valgte billede   
                let image_name = '';
                let user_upload = req.files.user_image;

                if (user_upload != undefined) {
                    // opretter variabel der indholder værdien af det gamle billede 
                    let old_image = req.body.user_old_img;

                    if (old_image != "no-image.png") {
                        // variabel som indeholder stien til slet lokationen for det gamle billede 
                        // bruger path.join så stien kan forstås på andre styresystemer (/\) 
                        let delete_location = path.join(__dirname, '..', '..', 'public', 'images', 'users', old_image);

                        // variabel som indeholder stien til slet lokationen for det gamle resizede billede
                        let delete_location_resized = path.join(__dirname, '..', '..', 'public', 'images', 'users', 'resized', old_image);

                        // bruger modulet fs (fileSystem) unlink funtion til at slette det gamle billede
                        fs.unlink(delete_location, (err) => {
                            if (err) {
                                console.log(err);
                            }
                        })

                        // sletter det gamle resizede billede
                        fs.unlink(delete_location_resized, (err) => {
                            if (err) {
                                console.log(err);
                            }
                        })
                    }
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
                    image_name = req.body.user_old_img;
                }

                if (values.password != '') {
                    let hashed_password = bcrypt.hashSync(values.password, 10);
                    user_service.edit_one(values.name, values.firstname, values.lastname, values.address, values.city, values.areacode, image_name, values.email, hashed_password, values.rank, req.params.id)
                        .then(result => {
                            res.redirect('/admin/brugere');
                        })
                        .catch(err => {
                            (async () => {
                                console.log(err);
                                let data = await get_template_data();

                                // data.all_users.forEach(user => {
                                //     user.user_created = datetime.format(user.user_created, "DD/MM-YYYY")
                                // })

                                let one_user = {
                                    "user_id": 0,
                                    "user_name": values.name,
                                    "user_firstname": values.firstname,
                                    "user_lastname": values.lastname,
                                    "user_address": values.address,
                                    "user_city": values.city,
                                    "user_areacode": values.areacode,
                                    "user_email": values.email,
                                    "user_rank": values.rank,
                                    "user_created": "",
                                    "user_verified": ""
                                };
        
                                res.render('pages/admin_users', {
                                    "page": "admin_users",
                                    "title": "Opret Bruger",
                                    "one_user": one_user,
                                    "error_msg": error_msg,
                                    "all_users": data.all_users,
                                    "formtype": "opret",
                                    "match_error": "Brugernavn eller email eksistere allerede",
                                    "session": req.session,
                                });
                            })();
                        });
                } else {
                    user_service.edit_one(values.name, values.firstname, values.lastname, values.address, values.city, values.areacode, image_name, values.email, "", values.rank, req.params.id)
                        .then(result => {
                            res.redirect('/admin/brugere');
                        })
                        .catch(err => {
                            (async () => {
                                console.log(err);
                                let data = await get_template_data();
                                
                                // data.all_users.forEach(user => {
                                //     user.user_created = datetime.format(user.user_created, "DD/MM-YYYY")
                                // })

                                let one_user = {
                                    "user_id": 0,
                                    "user_name": values.name,
                                    "user_firstname": values.firstname,
                                    "user_lastname": values.lastname,
                                    "user_address": values.address,
                                    "user_city": values.city,
                                    "user_areacode": values.areacode,
                                    "user_email": values.email,
                                    "user_rank": values.rank,
                                    "user_created": "",
                                    "user_verified": ""
                                };
        
                                res.render('pages/admin_users', {
                                    "page": "admin_users",
                                    "title": "Opret Bruger",
                                    "one_user": one_user,
                                    "error_msg": error_msg,
                                    "all_users": data.all_users,
                                    "formtype": "opret",
                                    "match_error": "Brugernavn eller email eksistere allerede",
                                    "session": req.session,
                                });
                            })();
                        });
                }
            }
        }
    });

    // ========================   Sletter Bruger Admin   ========================
    app.get('/admin/bruger/slet/:id', (req, res) => {
        if (isNaN(req.params.id)) {
            res.redirect("/admin/brugere"); // BAD REQUEST
        } else {
            (async () => {
                try {
                    one_user = {
                        "user_id": 0,
                        "user_image": "",
                    };

                    await user_service.get_one(req.params.id)
                        .then(result => {
                            one_user = result;
                        })

                    if (one_user.user_image != "no-image.png") {
                        // variabel som indeholder stien til slet lokationen for det gamle billede 
                        // bruger path.join så stien kan forstås på andre styresystemer (/\) 
                        let delete_location = path.join(__dirname, '..', '..', 'public', 'images', 'users', one_user.user_image);

                        // variabel som indeholder stien til slet lokationen for det gamle resizede billede
                        let delete_location_resized = path.join(__dirname, '..', '..', 'public', 'images', 'users', 'resized', one_user.user_image);

                        // bruger modulet fs (fileSystem) unlink funtion til at slette det gamle billede
                        fs.unlink(delete_location, (err) => {
                            if (err) {
                                console.log(err);
                            }
                        })

                        // sletter det gamle resizede billede
                        fs.unlink(delete_location_resized, (err) => {
                            if (err) {
                                console.log(err);
                            }
                        })
                    }
                    user_service.delete_one(req.params.id)
                        .then(result => {
                            res.redirect('/admin/brugere');
                        })
                        .catch(error => {
                            console.log(error)
                            res.redirect('/admin/brugere');
                        })
                } catch (error) {
                    console.log(error);
                }
            })();
        }
    });


    // ==========================================================================================================================================================================


    // ========================   Produkter (Henter Siden)   ========================
    app.get('/admin/produkter', (req, res) => {
        (async () => {
            try {
                let data = await get_template_data();

                data.all_products.forEach(product => {
                    product.product_created = datetime.format(product.product_created, "DD/MM-YYYY")
                })

                res.render('pages/admin_products', {
                    "title": "Produkter",
                    "page": "admin_products",
                    "error_msg": "",
                    "formtype": "opret",
                    "session": req.session,
                    "all_products": data.all_products,
                    "all_categories": data.all_categories,
                    "one_product": data.one_product
                });
            } catch (error) {
                console.log(error);
            }
        })();
    });

    // ========================   Opret Produkt   ========================
    app.post('/admin/produkter', (req, res) => {
        // automatiseret indsamling af værdier fra formularen (req.body)
        let values = {};
        for (let i = 0; i < Object.keys(req.body).length; i++) {
            Object.keys(req.body).forEach(function (key) {
                values[key.split('_')[1]] = req.body[key]; // 'key.split('_')[1]' for at fjerne 'product_' fra nøglen
            });
        }
        // Opret tomt json objekt til fejlbeskeder
        let error_msg = {};

        // Validering af værdier oprettelse af fejlbeskeder
        if (values.name == undefined || values.name == "") {
            error_msg.name = "Udfyld Navn (Server Side)";
        }

        if (values.model == undefined || values.model == "") {
            error_msg.model = "Udfyld Model (Server Side)";
        }

        if (values.price == undefined || isNaN(values.price) || values.price == "") {
            error_msg.price = "Udfyld pris (Server Side)";
        }

        if (values.description == undefined || values.description == "") {
            error_msg.description = "Udfyld Beskrivelse (Server Side)";
        }

        if (values.inventory == undefined || isNaN(values.inventory) || values.inventory == "") {
            error_msg.inventory = "Udfyld Beholdning (Server Side)";
        }

        if (values.inventoryMin == undefined || isNaN(values.inventoryMin) || values.inventoryMin == "") {
            error_msg.inventoryMin = "Udfyld min Beholdning (Server Side)";
        }

        if (values.inventoryMax == undefined || isNaN(values.inventoryMax) || values.inventoryMax == "") {
            error_msg.inventoryMax = "Udfyld max Beholdning (Server Side)";
        }

        if (values.category == undefined || values.category == 0) {
            error_msg.category = "Vælg Katgeori (Server Side)";
        }

        // Hvis fejlbesked objektet indeholder elementer, betyder det at noget er gået galt,
        // Derfor returneres fejlbesked objektet så klienten kan se besked i konsol
        if (Object.keys(error_msg).length > 0) {
            (async () => {
                try {
                    console.log(error_msg);
                    let data = await get_template_data();

                    res.render('pages/admin_products', {
                        "title": "Produkter",
                        "page": "admin_products",
                        "error_msg": error_msg,
                        "formtype": "opret",
                        "one_product": data.one_product,
                        "all_products": data.all_products,
                        "all_categories": data.all_categories,
                        "session": req.session
                    });

                } catch (error) {
                    console.log(error);
                }
            })();
        } else {
            // opretter variabel til billede navn, og en variabel der indholder værdien af det valgte billede   
            let image_name = '';
            let user_upload = req.files.product_image;

            if (user_upload != undefined) {
                // angiver værdi til variablen image_name, efter de gamle billeder er slettet, som generer unikke nøgler istedet for
                // billedets originale navn, og sammensætter den nye unikke string, med billedets originale filtype  
                image_name = uuidv4() + path.extname(user_upload.name);

                // variabel som indehodler stien til der hvor det nye billede skal indsættes
                let upload_location = path.join(__dirname, '..', '..', 'public', 'images', 'products', image_name);
                user_upload.mv(upload_location, (err) => {
                    if (err) {
                        console.log(err);
                    }

                    // variabel som indeholder stien til der hvor det nye resizede billede skal placeres
                    let resized_location = path.join(__dirname, '..', '..', 'public', 'images', 'products', 'resized', image_name);
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

            product_service.create_one(values.name, values.model, values.price, values.description, image_name, values.inventory, values.inventoryMin, values.inventoryMax, values.category)
                .then(result => {
                    res.redirect('/admin/produkter');
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/admin/produkter');
                });

        }
    });

    // ========================   Forudfyld Formular Med Et Produkt   ========================
    app.get('/admin/produkter/ret/:id', (req, res) => {
        if (isNaN(req.params.id)) {
            res.redirect("/admin/produkter"); // BAD REQUEST
        } else {
            (async () => {
                try {
                    let data = await get_template_data();

                    data.all_products.forEach(product => {
                        product.product_created = datetime.format(product.product_created, "DD/MM-YYYY")
                    })

                    await product_service.get_one(req.params.id)
                        .then(result => {
                            data.one_product = result;
                        })

                    res.render('pages/admin_products', {
                        "title": "Produkter",
                        "page": "admin_products",
                        "error_msg": "",
                        "formtype": "rediger",
                        "all_products": data.all_products,
                        "all_categories": data.all_categories,
                        "one_product": data.one_product,
                        "session": req.session
                    });

                } catch (error) {
                    console.log(error);
                }
            })();
        }
    })

    // ========================   Redigere Produkt   ========================
    app.post('/admin/produkter/ret/:id', (req, res) => {
        if (isNaN(req.params.id)) {
            res.redirect("/admin/produkter"); // BAD REQUEST
        } else {
            // automatiseret indsamling af værdier fra formularen (req.body)
            let values = {};
            for (let i = 0; i < Object.keys(req.body).length; i++) {
                Object.keys(req.body).forEach(function (key) {
                    values[key.split('_')[1]] = req.body[key]; // 'key.split('_')[1]' for at fjerne 'product_' fra nøglen
                });
            }
            // Opret tomt json objekt til fejlbeskeder
            let error_msg = {};

            // Validering af værdier oprettelse af fejlbeskeder
            if (values.name == undefined || values.name == "") {
                error_msg.name = "Udfyld Navn (Server Side)";
            }

            if (values.model == undefined || values.model == "") {
                error_msg.model = "Udfyld Model (Server Side)";
            }

            if (values.price == undefined || isNaN(values.price) || values.price == "") {
                error_msg.price = "Udfyld pris (Server Side)";
            }

            if (values.description == undefined || values.description == "") {
                error_msg.description = "Udfyld Beskrivelse (Server Side)";
            }

            if (values.inventory == undefined || isNaN(values.inventory) || values.inventory == "") {
                error_msg.inventory = "Udfyld Beholdning (Server Side)";
            }

            if (values.inventoryMin == undefined || isNaN(values.inventoryMin) || values.inventoryMin == "") {
                error_msg.inventoryMin = "Udfyld min Beholdning (Server Side)";
            }

            if (values.inventoryMax == undefined || isNaN(values.inventoryMax) || values.inventoryMax == "") {
                error_msg.inventoryMax = "Udfyld max Beholdning (Server Side)";
            }

            if (values.category == undefined || values.category == 0) {
                error_msg.category = "Vælg Katgeori (Server Side)";
            }

            // Hvis fejlbesked arrayet indeholder elementer, betyder det at noget er gået galt,
            // Derfor returneres fejlbesked arrayet så klienten kan se besked i konsol
            if (Object.keys(error_msg).length > 0) {
                (async () => {
                    try {
                        console.log(error_msg);
                        let data = await get_template_data();

                        await product_service.get_one(req.params.id)
                            .then(result => {
                                data.one_product = result;
                            })

                        res.render('pages/admin_products', {
                            "title": "produkter",
                            "page": "admin_products",
                            "error_msg": error_msg,
                            "formtype": "rediger",
                            "session": req.session,
                            "all_products": data.all_products,
                            "all_categories": data.all_categories,
                            "one_product": data.one_product
                        });

                    } catch (error) {
                        console.log(error);
                    }
                })();
            } else {
                // opretter variabel til billede navn, og en variabel der indholder værdien af det valgte billede   
                let image_name = '';
                let product_upload = req.files.product_image;

                if (product_upload != undefined) {
                    // opretter variabel der indholder værdien af det gamle billede 
                    let old_image = req.body.product_old_img;

                    if (old_image != "no-image.png") {
                        // variabel som indeholder stien til slet lokationen for det gamle billede 
                        // bruger path.join så stien kan forstås på andre styresystemer (/\) 
                        let delete_location = path.join(__dirname, '..', '..', 'public', 'images', 'products', old_image);

                        // variabel som indeholder stien til slet lokationen for det gamle resizede billede
                        let delete_location_resized = path.join(__dirname, '..', '..', 'public', 'images', 'products', 'resized', old_image);

                        // bruger modulet fs (fileSystem) unlink funtion til at slette det gamle billede
                        fs.unlink(delete_location, (err) => {
                            if (err) {
                                console.log(err);
                            }
                        })

                        // sletter det gamle resizede billede
                        fs.unlink(delete_location_resized, (err) => {
                            if (err) {
                                console.log(err);
                            }
                        })
                    }
                    // angiver værdi til variablen image_name, efter de gamle billeder er slettet, som generer unikke nøgler istedet for
                    // billedets originale navn, og sammensætter den nye unikke string, med billedets originale filtype  
                    image_name = uuidv4() + path.extname(product_upload.name);

                    // variabel som indehodler stien til der hvor det nye billede skal indsættes
                    let upload_location = path.join(__dirname, '..', '..', 'public', 'images', 'products', image_name);
                    product_upload.mv(upload_location, (err) => {
                        if (err) {
                            console.log(err);
                        }

                        // variabel som indeholder stien til der hvor det nye resizede billede skal placeres
                        let resized_location = path.join(__dirname, '..', '..', 'public', 'images', 'products', 'resized', image_name);
                        // skalere billede  
                        gm(upload_location).resize(170).write(resized_location, (err) => {
                            if (err) {
                                console.log(err.message);
                            }
                        })
                    });
                } else if (product_upload == undefined) {
                    image_name = req.body.product_old_img;
                }

                product_service.edit_one(values.name, values.model, values.price, values.description, image_name, values.inventory, values.inventoryMin, values.inventoryMax, values.category, req.params.id)
                    .then(result => {
                        res.redirect('/admin/produkter');
                    })
                    .catch(err => {
                        console.log(err);
                        res.redirect('/admin/produkter');
                    });

            }
        }
    });

    // ========================   Sletter Produkt   ========================
    app.get('/admin/produkter/slet/:id', (req, res) => {
        if (isNaN(req.params.id)) {
            res.redirect("/admin/produkter"); // BAD REQUEST
        } else {
            (async () => {
                try {
                    one_product = {
                        "product_id": 0,
                        "product_image": "",
                    };

                    await product_service.get_one(req.params.id)
                        .then(result => {
                            one_product = result;
                        })

                    if (one_product.product_image != "no-image.png") {
                        // variabel som indeholder stien til slet lokationen for det gamle billede 
                        // bruger path.join så stien kan forstås på andre styresystemer (/\) 
                        let delete_location = path.join(__dirname, '..', '..', 'public', 'images', 'products', one_product.product_image);

                        // variabel som indeholder stien til slet lokationen for det gamle resizede billede
                        let delete_location_resized = path.join(__dirname, '..', '..', 'public', 'images', 'products', 'resized', one_product.product_image);

                        // bruger modulet fs (fileSystem) unlink funtion til at slette det gamle billede
                        fs.unlink(delete_location, (err) => {
                            if (err) {
                                console.log(err);
                            }
                        })

                        // sletter det gamle resizede billede
                        fs.unlink(delete_location_resized, (err) => {
                            if (err) {
                                console.log(err);
                            }
                        })
                    }
                    product_service.delete_one(req.params.id)
                        .then(result => {
                            res.redirect('/admin/produkter');
                        })
                        .catch(error => {
                            console.log(error)
                            res.redirect('/admin/produkter');
                        })
                } catch (error) {
                    console.log(error);
                }
            })();
        }
    })


    // ==========================================================================================================================================================================


    // ========================   Kategorier (Henter Siden)   ========================
    app.get('/admin/kategorier', (req, res) => {
        (async () => {
            try {
                let data = await get_template_data();

                res.render('pages/admin_categories', {
                    "title": "Kategorier",
                    "page": "admin_categories",
                    "error_msg": "",
                    "formtype": 'opret',
                    "delete_error": "",
                    "all_categories": data.all_categories,
                    "one_category": data.one_category,
                    "session": req.session,
                });
            } catch (error) {
                console.log(error);
            }
        })();
    });

    // ========================   Opret Kategori   ========================
    app.post('/admin/kategorier', (req, res) => {
        // automatiseret indsamling af værdier fra formularen (req.body)
        let values = {};
        for (let i = 0; i < Object.keys(req.body).length; i++) {
            Object.keys(req.body).forEach(function (key) {
                values[key.split('_')[1]] = req.body[key]; // 'key.split('_')[1]' for at fjerne 'category_' fra nøglen
            });
        }
        // Opret tomt json objekt til fejlbeskeder
        let error_msg = {};

        // Validering af værdier oprettelse af fejlbeskeder
        if (values.name == undefined || values.name == "") {
            error_msg.name = "Udfyld Navn (Server Side)";
        }

        if (values.category == undefined || values.category == '') {
            error_msg.category = "Vælg Kategori (Server Side)";
        }

        // Hvis fejlbesked objektet indeholder elementer, betyder det at noget er gået galt,
        // Derfor returneres fejlbesked objektet så klienten kan se besked i konsol
        if (Object.keys(error_msg).length > 0) {
            (async () => {
                try {
                    console.log(error_msg);
                    let data = await get_template_data();

                    res.render('pages/admin_categories', {
                        "title": "Katgorier",
                        "page": "admin_categories",
                        "error_msg": error_msg,
                        "all_categories": data.all_categories,
                        "one_category": data.one_category,
                        "delete_error": "",
                        "formtype": 'opret',
                        "session": req.session,
                    });

                } catch (error) {
                    console.log(error);
                }
            })();
        } else {
            category_service.create_one(values.name, parseInt(values.category), (req.body.compareCategories == values.category))
                .then(result => {
                    res.redirect('/admin/kategorier');
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/admin/kategorier');
                });

        }
    });

    // ========================   Forudfyld Formular Med En Kategori   ========================
    app.get('/admin/kategorier/ret/:id', (req, res) => {
        if (isNaN(req.params.id)) {
            res.redirect("/admin/kategorier"); // BAD REQUEST
        } else {
            (async () => {
                try {
                    let data = await get_template_data();

                    await category_service.get_one(req.params.id)
                        .then(result => {
                            data.one_category = result;
                        })

                    res.render('pages/admin_categories', {
                        "title": "Kategorier",
                        "page": "admin_categories",
                        "error_msg": "",
                        "all_categories": data.all_categories,
                        "one_category": data.one_category,
                        "formtype": 'rediger',
                        "delete_error": "",
                        "session": req.session
                    });

                } catch (error) {
                    console.log(error);
                }
            })();
        }
    })

    // ========================   Redigere Kategori   ========================
    app.post('/admin/kategorier/ret/:id', (req, res) => {
        if (isNaN(req.params.id)) {
            res.redirect("/admin/kategorier"); // BAD REQUEST
        } else {
            // automatiseret indsamling af værdier fra formularen (req.body)
            let values = {};
            for (let i = 0; i < Object.keys(req.body).length; i++) {
                Object.keys(req.body).forEach(function (key) {
                    values[key.split('_')[1]] = req.body[key]; // 'key.split('_')[1]' for at fjerne 'category_' fra nøglen
                });
            }
            // Opret tomt json objekt til fejlbeskeder
            let error_msg = {};

            // Validering af værdier oprettelse af fejlbeskeder
            if (values.name == undefined || values.name == "") {
                error_msg.name = "Udfyld Navn (Client Side)";
            }

            // Hvis fejlbesked arrayet indeholder elementer, betyder det at noget er gået galt,
            // Derfor returneres fejlbesked arrayet så klienten kan se besked i konsol
            if (Object.keys(error_msg).length > 0) {
                (async () => {
                    try {
                        console.log(error_msg);
                        let data = await get_template_data();

                        await category_service.get_one(req.params.id)
                            .then(result => {
                                data.one_category = result;
                            })

                        res.render('pages/admin_categories', {
                            "title": "Kategorier",
                            "page": "admin_categories",
                            "error_msg": error_msg,
                            "all_categories": data.all_categories,
                            "one_category": data.one_category,
                            "formtype": 'rediger',
                            "delete_error": "",
                            "session": req.session
                        });

                    } catch (error) {
                        console.log(error);
                    }
                })();
            } else {
                category_service.edit_one(values.name, req.params.id)
                    .then(result => {
                        res.redirect('/admin/kategorier');
                    })
                    .catch(err => {
                        console.log(err);
                        res.redirect('/admin/kategorier');
                    });

            }
        }
    });

    // ========================   Sletter Kategori   ========================
    app.get('/admin/kategorier/slet/:id', (req, res) => {
        if (isNaN(req.params.id)) {
            res.redirect("/admin/kategorier"); // BAD REQUEST
        } else {
            (async () => {
                let data = await get_template_data();
                
                category_service.delete_one(req.params.id)
                    .then(result => {
                        res.redirect('/admin/kategorier');
                    })
                    .catch(error => {
                        console.log(error)
                        // render siden med en fejlbesked som fortæller brugeren det mislykkedes slette kategorien, fordi der er produkter i.
                        res.render('pages/admin_categories', {
                            "title": "Kategorier",
                            "page": "admin_categories",
                            "error_msg": '',
                            "all_categories": data.all_categories,
                            "one_category": data.one_category,
                            "delete_error": "Kategorien kunne ikke slettes, da den har produkter tilknyttet til sig",
                            "formtype": 'opret',
                            "session": req.session
                        });
                    })
            })();
        }
    });


    // ==========================================================================================================================================================================


    // ========================   Ordrer (Henter siden)   ========================
    app.get('/admin/ordrer', (req, res) => {
        (async () => {
            let data = await get_template_data();
            let all_orders = [];
            let all_statuses = [];
            let one_order = {
                "order_id": 0,
                "order_date": ""
            };
            
            await order_service.get_all_orders()
            .then(result => {
                all_orders = result;
            })
            .catch(error => {
                console.log(error);
            })
            
            await status_service.get_all_statuses()
                .then(result => {
                    all_statuses = result;
                })
                .catch(error => {
                    console.log(error);
                })


            all_orders.forEach(order => {
                order.order_date = datetime.format(order.order_date, "HH:mm DD/MM/YYYY");
            })

            res.render('pages/admin_orders', {
                "title": "Ordre",
                "page": "admin_orders",
                "one_order": one_order,
                "all_orders": all_orders,
                "all_statuses": all_statuses,
                "session": req.session
            });
        })();
    });

    // ========================   Ordre detalje side   ========================
    app.get('/admin/ordre/detalje/:id', (req, res) => {
        (async () => {
            try {
                let data = await get_template_data();
                let all_statuses = [];
                let all_order_lines_from_orders = [];
                let one_order = {
                    "order_id": 0,
                    "order_date": "",
                    "order_price": 0,
                    "order_status_id": 0,
                    "order_status_name": "",
                    "category_id": 0,
                    "user_id": 0,
                    "user_firstname": "",
                    "user_lastname": ""
                }

                await order_service.get_one(req.params.id)
                    .then(result => {
                        one_order = result;
                    })

                await order_line_service.get_all_order_lines_from_one_order(req.params.id)
                    .then(result => {
                        all_order_lines_from_orders = result;
                    })

                await status_service.get_all_statuses()
                    .then(result => {
                        all_statuses = result;
                    })

                res.render('pages/admin_orders_detail', {
                    "title": "Detaljeside",
                    "page": "admin_orders_detail",
                    // "fejlbesked": "",
                    // "email": "",
                    // "underNav": "iBrug",
                    "all_order_lines_from_orders": all_order_lines_from_orders,
                    "one_order": one_order,
                    "all_statuses": all_statuses,
                    "session": req.session
                });
            }
            catch (error) {
                console.log(error);
            }
        })();
    });  

    // ========================   Rediger ordre status api kald   ========================
    app.get('/admin/api/ordre_status/:ordre_id/:ordre_status_id', (req, res) => {
        // Validering
        let order_id = parseInt(req.params.ordre_id);
        let order_status_id = parseInt(req.params.ordre_status_id);
        status_service.set_order_status(order_id, order_status_id)
            .then(result => {
                res.sendStatus(204);
            })

            .catch(error => {
                res.sendStatus(500);
                console.log(error);
            })
    });

    // ========================   Sletter Ordre   ========================
    app.get('/admin/ordrer/slet/:id', (req, res) => {
        if (isNaN(req.params.id)) {
            res.redirect("/admin/ordrer"); // BAD REQUEST
        } else {
            (async () => {
                let data = await get_template_data();
                
                order_service.delete_one(req.params.id)
                    .then(result => {
                        res.redirect('/admin/ordrer');
                    })
                    .catch(error => {
                        console.log(error)
                        // render siden med en fejlbesked
                        res.redirect('/admin/ordrer');
                    })
            })();
        }
    });

    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> BRUGERE <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

    // ========================   Bruger Profil (Henter Siden)   ========================
    app.get('/bruger/profil', (req, res) => {
        (async () => {
            try {
                let data = await get_template_data();

                res.render('pages/user_profile', {
                    "title": "Profil",
                    "page": "user_profile",
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

    // ========================   Bruger Rediger (Henter Siden)   ========================
    app.get('/bruger/rediger', (req, res) => {
        (async () => {
            try {
                let data = await get_template_data();

                res.render('pages/user_edit', {
                    "title": "Rediger Profil",
                    "page": "user_edit",
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

    // ========================   Send ordre (api)  ========================
    app.post('/bruger/api/ordre', (req, res) => {
        // Tjek omm kunden er logget på hvis ikke send tilbage til logind side.
        (async () => {
            // console.log("test");
            let userid = req.session.user_id; // her tages selvfølgelig den userid som er gemt i session
            let orderid = 0; // denne ændre når ordre er oprettet i db

            await order_service.create_one(userid)
                .then(result => {
                    orderid = result; // her får vi den nye ordre ind
                })
                .catch(error => {
                    console.log('error:' + error);
                })

            req.body.forEach(product => {
                (async () => {
                    // oprettelse af ordre product linjer behøver ikke at køre asynkront
                    // console.log(product);
                    await order_service.create_product_line(orderid, product.product_id, product.product_price, product.product_amount)
                        .then(result => {
                            // ummidelbart er der ikke brug for at håndtere succes ved indsættelæse
                        })
                        .catch(error => {
                            console.log(error);
                        })
                })();
            })
            res.json({ 'message': 'modtaget' });
        })();
    })

}