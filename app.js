var http = require( 'http' );
var express = require( 'express' );
var pg = require( 'pg' );
var cookieParser = require( 'cookie-parser' );
var multer = require( 'multer' );
var db = require('./db.js');
var app = express();

var multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'static/photos')
    },
    filename: function (req, file, cb) {
        var ext = file.mimetype.split('/')[1];
        cb(null, file.fieldname + '-' + Date.now() + '.' + ext);
    }
  })

var upload = multer({
    storage: multerStorage
});
app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static("static"));
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
    var total = await db.users_repo.sum_cart(login);
    var cnt = await db.users_repo.count_cart(login);
    return {cart: cart, total: total, cnt: cnt};
}

/**
 * sprawdza, czy produkt został właśnie dodany do bazy
 * @param {*} product_name 
 * @param {*} price 
 * @param {*} category 
 * @param {*} description 
 * @returns boolean
 */

function IsNewItem(product_name, price, category, description){
    return ( product_name=='PRODUCT_NAME' && price==1 && category=='other' && description=='');
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
    var user = GetUser(req);
    if( user ){
        res.redirect('/');
    } else {
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
    }
});

app.get('/logout', (req, res) => {
    res.cookie('user', undefined, {maxAge: -1});
    res.redirect('/');
});

app.get('/items', async (req, res) => {
    var user = GetUser(req);
    var items = await db.items_repo.retrieve();
    res.render('items', {user: user, items: items, search: ''});     
});

app.post('/items', async (req, res) => {
    var user = GetUser(req);
    var search = req.body.search;
    var items = await db.items_repo.retrieve(null,search);
    res.render('items', {user: user, search: search, items: items})
});

app.get('/items/:id', async (req, res) => {
    var id = req.params.id;
    var user = GetUser(req);
    var item = (await db.items_repo.retrieve(id))[0];
    if( !item ) {
        res.render( 'fail', {user: user} );
    } else {
        res.render( 'view_item', {user: user, item:item});
    }
})

app.post('/items/add_to_cart/:id', async (req, res) => {
    var id = req.params.id;
    var user = GetUser(req);
    if( !user || user.user_type!='user' ) {
        res.render('error');
    } else {
        await db.common_repo.add_to_cart(user.login, id);
        var items = await db.items_repo.retrieve();
        res.redirect('/items');
    }
});

app.post('/items/change_item/:id', (req, res) => {
    var id = req.params.id;
    var user = GetUser(req);
    if( !user || user.user_type!='admin' ) {
        res.render('error', {user: user});
    } else {
        res.redirect('/change_item/'+id);
    }
});

app.get('/change_item/:id', async (req, res) => {
    var id = req.params.id;
    var user = GetUser(req);
    var item = (await db.items_repo.retrieve(id))[0];
    if( !user || user.user_type!='admin' ) {
        res.render('error', {user: user});
    } else {
        if( !item ) {
            res.render('fail', {user: user, id: id});
        } else {
            if( IsNewItem(item.product_name, item.price, item.category, item.description )) {
                res.render('change_item', {
                    user: user,
                    item: {
                        id: id,
                        product_name: '',
                        price: '',
                        description: '',
                        category: ''
                    },
                    message: ''                    
                });
            } else {
                res.render('change_item', {user: user, item: item, message: ''});
            }
        }
    }
});

app.post('/change_item/:id', async (req, res) => {
    var id = req.params.id;
    var user = GetUser(req);
    if( !user || user.user_type!='admin' ) {
        res.render('error', {user: user});
    } else {
        var [product_name, price, description, category, photo] = [req.body.product_name, req.body.price, req.body.description, req.body.category, req.body.photo];
        if( !product_name || !price || !description || !category ) {
            res.render('change_item', {
                user: user,
                item: {
                    id: id,
                    product_name: product_name,
                    price: price,
                    description: description,
                    category: category,
                    photo: photo
                },
                message: 'Uzupełnij wszystkie pola'
            });
        } else {
            var update = await db.items_repo.update(id, product_name, price, category, description);
            var updated = (await db.items_repo.retrieve(update))[0];
            res.render('change_item', {
                user: user,
                item: updated,
                message: ''
            });
        }
    }
});

app.post('/upload_photo/:id', upload.single('photo'), async (req, res) => {
    var user = GetUser(req);
    if( !user || user.user_type!='admin' ) {
        res.render('error', {user: user});
    } else {
        var id = req.params.id;
        var item = (await db.items_repo.retrieve(id))[0];
        var path = req.file.path;
        path = path.replace('static/', '');
        await db.items_repo.update(id,item.product_name, item.price,item.category,item.description,path);
        res.redirect('/change_item/'+id);
    }
});

app.post('/items/add_item', async (req, res) => {
    var user = GetUser(req);
    if( !user || user.user_type!='admin' ) {
        res.render('error', {user: user});
    } else {
        var id = await db.items_repo.insert('PRODUCT_NAME', 1, 'other', '');
        res.redirect('/change_item/'+id);
    }    
});

app.post('/items/delete_item/:id', async (req, res) => {
    var user = GetUser(req);
    if( !user || user.user_type!='admin' ) {
        res.render('error', {user: user});
    } else {
        var id = req.params.id;
        var item = await db.items_repo.retrieve(id);
        
        if( !item ){
            res.render('fail', {user: user});
        } else {
            await db.common_repo.remove_item(id);
            res.redirect('/items');
        }
    }    
});

app.get('/cart', async (req, res) => {
    var user = GetUser(req);
    if( !user || user.user_type != 'user' ) {
        res.render('error', {user: user});
    } else {
        var cart = await GetCart(user.login);
        var [items, total, cnt] = [cart.cart, cart.total, cart.cnt];
        res.render('cart', {user: user, items: items, total: total, cnt: cnt});
    }
});

app.post('/submit_order', async (req, res) => {
    var user = GetUser(req);
    if( !user || user.user_type!='user' ){
         res.render('error', {user: user});
    } else {
        await db.common_repo.submit_order(user.login);
        res.redirect('/cart');
    }
});

app.get('/orders', async (req, res) => {
    var user = GetUser(req);
    if( !user || user.user_type!='admin' ) {
        res.render('error', {user: user});
    } else {
        var orders = await db.orders_repo.view_orders();
        res.render('orders', {user: user, orders: orders});
    }
});

app.get('/users', async (req, res) => {
    var user = GetUser(req);
    if( !user || user.user_type!='admin' ) {
        res.render('error', {user: user});
    } else {
        var users = await db.users_repo.view_users();
        res.render('users', {user: user, users: users});
    }
});

http.createServer( app ).listen( 3000 );
console.log( 'started' );

