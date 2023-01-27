var http = require( 'http' );
var express = require( 'express' );
var pg = require( 'pg' );
var cookieParser = require( 'cookie-parser' );

var app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static("./static"));
app.use(cookieParser());
app.use(express.urlencoded({extended:true}));


/**
 * @param {request} req 
 * @returns user z req.body.cookies lub undefined gdy nie został zdefiniowany
 */

function GetUser(req) {
    if( !req.cookies.user ) {
        return undefined;
    } else {
        return req.cookies.user;
    }
}

/**
 * @param {*} login 
 * @param {*} password 
 * @returns użytkownik z bazy, gdy login i password zgadzają się w bazie danych lub undefined w przeciwnym przypadku
 */

function AuthenticateUser(login, password) {
    return {login: 'user', name: 'Jan', surname: 'Kowalski', type: 'admin', cart: undefined};
}

/**
 * @param {*} login 
 * @returns true, jeśli użytkownik o takim loginie istnieje w bazie lub false w przeciwnym przypadku
 */

function LoginAlreadyExists(login) {
    return false;
}

/**
 * dodaje użytkownika do bazy danych
 * @param {*} name 
 * @param {*} surname 
 * @param {*} login 
 * @param {*} password 
 */
function AddUserToDatabase(name, surname, login, password) {
    return;
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

app.post('/log_in', (req, res) => {
    var login = req.body.login;
    var password = req.body.password;

    if( !login || !password ) {
        res.render('log_in', {login: login, password: password, message: "Uzupełnij login i hasło"});
    } else {
        var user = AuthenticateUser(login, password);
        if( !user ) {
            res.render('log_in', {login: login, password: password, message: "Niepoprawny login lub hasło"});
        } else {
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

app.post('/sign_in', (req, res) => {
    var name = req.body.name;
    var surname = req.body.surname;
    var login = req.body.surname;
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
    else if( LoginAlreadyExists( login ) ) {
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
        AddUserToDatabase( name, surname, login, password );
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
    var user = GetUser(req);
    res.render('items', {user: user});
});

app.get('/cart', (req, res) => {
    var user = GetUser (req);
    if( !user || user.type != 'user' ) {
        res.render('error');
    } else {
        res.render('cart', {user: user});
    }
});

http.createServer( app ).listen( 3000 );
console.log( 'started' );

