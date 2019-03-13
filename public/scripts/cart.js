// opretter javascript object
class Cart {
    // her oprettes kurvens "funktioner" som fordi de ligger 
    // i en klasse/javascript object, bliver kaldt metoder.

    // variabler bliver kaldt egenskaber, hvis de ikke indeholder 
    // en funktion, men en værdi, feks. --> static varNavn = 'string';

    // Henter indholdet ud af localStorage, returnere et Array
    static TakeCart() {
        // sikrer localStorage er oprettet
        if (localStorage['cart'] == undefined) {
            // opret localStorage variablen "cart" og gem et Array i den.
            // JSON.stringify benyttes fordi localStorage ikke kan indeholde Arrays
            localStorage['cart'] = JSON.stringify([]);
        }
        // indholdet af localStorage er et stringified JSON objekt,
        // parse ændrer værdien tilbage til det oprindelige Array som vi kan arbejde videre med
        return JSON.parse(localStorage['cart']);
    }

    static DeleteCart() {
        delete localStorage['cart'];
    }

    static SaveCart(cart) {
        // her løbes alle kurvens produkter igennem og alle der har nul eller mindre i antal fjernes
        // løkken kører baglæns for at undgå problemer ved at fjerne et element midtvejs.
        // *Når noget skal slettes fra et array og gemmes  
        for (let i = cart.length - 1; i >= 0; i--) {
            if (cart[i].product_amount <= 0) {
                cart.splice(i, 1);
            }
        }
        localStorage['cart'] = JSON.stringify(cart);
    }

    static AddToCart(product_id, product_name, product_price, product_amount) {
        console.log(product_id, product_name, product_price, product_amount);
        // denne variabel holder styr på om produktet allerede ligger i kurven eller ej
        // hvis denne forbliver true efter alle produkter er løbet igennem, tilføjes produktet
        let new_product = true;

        // hent kurvens data ind i en lokal variabel
        let cart = Cart.TakeCart();

        // løb igennem alle  produkter i kurven, hvis et produkt matcher det som skal tilføjes,
        // så vil produktet blive opdateret (antal ændres)
        cart.forEach(product => {
            if (product.product_id == product_id) {
                product.product_amount += parseInt(product_amount);
                new_product = false;
            }
        });

        // hvis det er et nyt produkt der ønskes tilføjet, pushes det til cart Arrayet.
        if (new_product) {
            cart.push({
                'product_id': product_id,
                'product_name': product_name,
                'product_price': parseFloat(product_price),
                'product_amount': parseInt(product_amount)
            });
        }

        // sørger for at gemme den opdaterede cart
        Cart.SaveCart(cart);
    }

    static EditProduct(product_id, product_amount) {
        // hent kurvens data ind i en lokal variabel
        let cart = Cart.TakeCart();

        // løb igennem alle produkter i kurven, hvis et produkt matcher det som skal tilføjes,
        // så vil produktet blive opdateret (antal ændrers)
        cart.forEach(product => {
            if (product.product_id == product_id) {
                product.product_amount = parseInt(product_amount);
            }
        });

        // sørger for at gemme den opdaterede cart
        Cart.SaveCart(cart);
    }

    static RemoveProductFromCart(product_id) {
        // hent kurvens data ind i en lokal variabel
        let cart = Cart.TakeCart();

        // her løbes alle kurvens produkter igennem og alle der har nul eller mindre i antal fjernes
        // løkken kører baglæns for at undgå problemer ved at fjerne et element midtvejs. 
        for (let i = cart.length - 1; i >= 0; i--) {
            if (cart[i].product_id == product_id) {
                cart.splice(i, 1);
            }
        }
        Cart.SaveCart(cart);
    }

    static get Total() {
        let total = 0;
        Cart.TakeCart().forEach(product => {
            total += (product.product_price * product.product_amount);
        });
        return total;
    }
}
