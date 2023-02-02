var http = require( 'http' );
var express = require( 'express' );
var pg = require( 'pg' );
var cookieParser = require( 'cookie-parser' );
var db = require('./db.js');
var app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static("./static"));
app.use(cookieParser());
app.use(express.urlencoded({extended:true}));


/**
 * zwraca user z req.body.cookies lub undefined gdy nie został zdefiniowany
 * @param {request} req 
 * @returns object
 */

function GetUser(req) {
    if( !req.cookies.user ) {
        return undefined;
    } else {
        return req.cookies.user;
    }
}

/**
 * zwraca użytkownika z bazy, gdy login i password zgadzają się w bazie danych lub undefined w przeciwnym przypadku
 * @param {*} login 
 * @param {*} password 
 * @returns object
 */

async function AuthenticateUser(login, password) {
    var valid = await db.passwords_repo.validate(login, password);
    console.log(valid);
    if(valid){
    console.log(valid);

        var res = await db.users_repo.retrieve(login);
        return res[0];
    }
    // return {login: 'user', name: 'Jan', surname: 'Kowalski', type: 'admin', cart: undefined};
}

/**
 * zwraca true, jeśli użytkownik o takim loginie istnieje w bazie lub false w przeciwnym przypadku
 * @param {*} login 
 * @returns boolean
 */

async function LoginAlreadyExists(login) {
    var result = await db.users_repo.check_exists(login);
    return result;
}

/**
 * dodaje użytkownika do bazy danych
 * @param {*} name 
 * @param {*} surname 
 * @param {*} login 
 * @param {*} password 
 */
async function AddUserToDatabase(name, surname, login, password) {
    await db.common_repo.add_user(login, password, name, surname, 'user', null);
    return;
}

/**
 * zwraca koszyk użytkownika o danym loginie
 * @param {*} login 
 * @returns object
 */
async function GetCart(login) { 
    var cart = await db.users_repo.view_cart(login);
    return cart;
}



app.get('/', (req, res) => {
    var user = GetUser(req);
    res.render('index', {user: user});
});

app.get('/log_in', (req, res) => {
    var user = GetUser(req);
    if( user ) {
        res.redirect('/');
    } else {
        res.render('log_in', {login: '', password: '', message: ''});
    }
});

app.post('/log_in', async (req, res) => {
    var login = req.body.login;
    var password = req.body.password;

    if( !login || !password ) {
        res.render('log_in', {login: login, password: password, message: "Uzupełnij login i hasło"});
    } else {
        var user = await AuthenticateUser(login, password);
        if( !user ) {
            res.render('log_in', {login: login, password: password, message: "Niepoprawny login lub hasło"});
        } else {
            console.log(':(');
            res.cookie('user', user);
            res.redirect('/');
        }
    }

});

app.get('/sign_in', (req, res) => {
    var user = GetUser(req);
    if( user ) {
        res.redirect('/');
    } else {
        res.render('sign_in', {
            name: '', 
            surname: '', 
            login: '', 
            password: '', 
            confirmPassword: '', 
            message: ''});
    }
});

app.post('/sign_in', async (req, res) => {
    var name = req.body.name;
    var surname = req.body.surname;
    var login = req.body.login;
    var password = req.body.password;
    var confirmPassword = req.body.confirmPassword;
    if( !name || !surname || !login || !password || !confirmPassword ){
        res.render('sign_in', {
            name: name, 
            surname: surname, 
            login: login, 
            password: password, 
            confirmPassword: confirmPassword, 
            message: "Uzupełnij wszystkie pola."});
    }
    else if(await LoginAlreadyExists( login ) ) {
        res.render('sign_in', {
            name: name, 
            surname: surname, 
            login: login, 
            password: password, 
            confirmPassword: confirmPassword, 
            message: "Podany login jest już zajęty."});
    } else if( password != confirmPassword ) {
        res.render('sign_in', {
            name: name, 
            surname: surname, 
            login: login, 
            password: password, 
            confirmPassword: confirmPassword, 
            message: "Podane hasła są różne."});
    } else {
        await AddUserToDatabase( name, surname, login, password );
        res.render('sign_in', {
            name: '', 
            surname: '',    
            login: '', 
            password: '', 
            confirmPassword: '', 
            message: "Zarejestrowano pomyślnie. Zaloguj się, aby kontynuować."});
    }
});

app.get('/logout', (req, res) => {
    res.cookie('user', undefined, {maxAge: -1});
    res.redirect('/');
});

app.get('/items', (req, res) => {
    (async () => {
        var user = GetUser(req);
        var items = await db.items_repo.retrieve();
        res.render('items', {user: user, items: items});
    })();
});

app.post('/items/add_to_cart/:id', (req, res) => {
    (async () => {
        var id = req.params.id;
        console.log(id);
        var user = GetUser(req);
        await db.common_repo.add_to_cart(user.login, id);
        var items = await db.items_repo.retrieve();
        res.redirect('/items');
    })();
});

app.post('/items/change_item/:id', (req, res) => {
    var id = req.params.id;
    res.redirect('/change_item/'+id);
});

app.get('/change_item/:id', (req, res) => {
    var id = req.params.id;
    var user = GetUser(req);
    if( !user || user.user_type!='admin' ) {
        res.render('error', {user: user});
    } else {
        res.render('change_item', {user: user});
    }
})

app.get('/cart', (req, res) => {
    var user = GetUser(req);
    if( !user || user.user_type != 'user' ) {
        res.render('error', {user: user});
    } else {
        var cart = GetCart(user.login);
        res.render('cart', {user: user, cart: cart});
    }
});

http.createServer( app ).listen( 3000 );
console.log( 'started' );

