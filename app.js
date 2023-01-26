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

app.get('/', (req, res) => {
    res.render('index');
});

http.createServer( app ).listen( 3000 );
console.log( 'started' );

