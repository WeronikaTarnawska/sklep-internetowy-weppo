var http = require( 'http' );
var express = require( 'express' );
var pg = require( 'pg' );
var cookieParser = require('cookie-parser');

var app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

app.use( express.static( "./static" ) );
app.use(cookieParser());
app.use(express.urlencoded({extended:true}));


/*
GetUser analizuje ciastka w req
*/

function GetUser(req) {
    if( !req.cookies.user ) {
        return undefined;
    } else {
        return req.cookies.user;
    }
}

/*
AuthenticateUser dostaje login i hasło, sprawdza, czy dane zgadzają się w bazie
zwraca obiekt User z bazy, jeśli tak lub undefined w przeciwnym przypadku
*/
function AuthenticateUser(login, password) {
    return {login: 'user', name: 'Jan', surname: 'Kowalski', type: 'admin', cart: undefined};
}

app.get('/', (req, res) => {
    var user = GetUser(req);
    res.render('index', {user: user});
});

app.get('/login', (req, res) => {
    var user = GetUser(req);
    if( user ) {
        res.redirect('/');
    } else {
        res.render('login', {login: '', password: '', message: ''});
    }
});

app.post('/login', (req, res) => {
    var login = req.body.login;
    var password = req.body.password;

    if( !login || !password ) {
        res.render('login', {login: login, password: password, message: "Uzupełnij login i hasło"});
    } else {
        var user = AuthenticateUser(login, password);
        if( !user ) {
            res.render('login', {login: login, password: password, message: "Niepoprawny login lub hasło"});
        } else {
            res.cookie('user', user);
            res.redirect('/');
        }
    }

});


http.createServer( app ).listen( 3000 );
console.log( 'started' );

