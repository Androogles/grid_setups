// filen hedder --generic routes for at sikre det er den første route der indlæses
// på den måde sikres at admin seesion check route ligger først i routes samlingen

module.exports = (app) => {
    // app.get('*', (req, res, next) => {
    //     // sørg for at admin altid er logget på, så slipper man for at gå igennem login,
    //     // hver gang der har været gemt, super vigtigt at slå fra når siden lægges live!!
    //     req.session.user_id = 1;
    //     req.session.user_rank = 100;
    //     req.session.user_verified = 1;
    //     next();
    // });

    // simpel catch*all admin route til hurtig rolle tjek på samtlige admin routes
    app.get('/admin/*', (req, res, next) => {
        if (req.session.user_rank !== 100 || req.session.user_verified == 0 || isNaN(req.session.user_rank) || req.session.user_id == undefined) {
            res.redirect('/');
        } else {
            next();
        }
    });

    // simpel catch*all admin route til hurtig rolle tjek på samtlige user routes
    app.get('/bruger/*', (req, res, next) => {
        if (req.session.user_rank !== 10 || req.session.user_verified == 0 || isNaN(req.session.user_rank) || req.session.user_id == undefined) {
            res.redirect('/');
        } else {
            next();
        }
    });
}