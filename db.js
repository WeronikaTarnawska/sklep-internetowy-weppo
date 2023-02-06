var pg = require('pg');
var bcrypt = require('bcrypt');
var saltRounds = 10

class UserRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async check_exists(login) {
        try {
            var result = await pool.query('select * from users where login = $1', [login]);
            if (result.rowCount > 0) { return true; }
            return false;
        }
        catch (err) {
            console.log(err);
            return [];
        }
    }

    async retrieve(login = null) {
        try {
            if (login) {
                var result = await pool.query('select * from users where login = $1', [login]);
                if (result.rowCount == 0) {
                    console.log('no such user');
                }
            }
            else {
                var result = await pool.query('select * from users');
            }
            return result.rows;
        }
        catch (err) {
            console.log(err);
            return [];
        }
    }

    async insert(login, user_name, user_surname, user_type, cur_order_id = null) {
        if (!login) return;
        try {
            var exists = await pool.query('select * from users where login = $1', [login]);
            if (exists.rowCount > 0) {
                console.log('user already exists');
                return null;
            }
            else {
                var result = await pool.query('insert into users (login, user_name, user_surname, user_type, cur_order_id) values ($1, $2, $3, $4, $5)', [login, user_name, user_surname, user_type, cur_order_id]);
                return login;
            }
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    async update_cur_order(login, cur_order_id = null) {
        if (!login) return;
        try {
            var exists = await pool.query('select * from users where login = $1', [login]);
            if (exists.rowCount > 0) {
                if (cur_order_id != null) {
                    var order = await pool.query('select * from orders where id=$1', [cur_order_id]);
                    // console.log(order.rows[0].user_id);
                    if (order.rows[0].user_id != login) {
                        console.log("the order belongs to a different user\n");
                        return null;
                    }
                }
                var result = await pool.query('update users set cur_order_id = $1 where login = $2', [cur_order_id, login]);
                return login;
            }
            else {
                console.log("user does not exist\n");
                exit(1);
                // return null;
            }
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }

    // async view_cart(login) {
    //     if (!login) return;
    //     try {
    //         var result = await pool.query('select items.product_name, items.description, items.category, count(items.id) as num_of_items, sum(items.price) as total_price from users join orders on users.cur_order_id = orders.id join item_order on orders.id = item_order.order_id  join items on items.id = item_order.item_id  where users.login = $1 group by items.product_name, items.description, items.category', [login]);
    //         return result.rows;
    //     }
    //     catch (err) {
    //         console.log(err);
    //         throw err;
    //     }
    // }

    // async view_cart(login) {
    //     if (!login) return;
    //     try {
    //         var result = await pool.query('select item_order.id, items.product_name, items.description, items.category, items.price from users join orders on users.cur_order_id = orders.id join item_order on orders.id = item_order.order_id  join items on items.id = item_order.item_id  where users.login = $1', [login]);
    //         return result.rows;
    //     }
    //     catch (err) {
    //         console.log(err);
    //         throw err;
    //     }
    // }

    async view_cart(login) {
        if (!login) return;
        try {
            var result = await pool.query('select items.id, items.product_name, items.description, items.category, items.price, count(items.id) as cnt, sum(items.price) from users join orders on users.cur_order_id = orders.id join item_order on orders.id = item_order.order_id  join items on items.id = item_order.item_id  where users.login = $1 group by items.id', [login]);
            return result.rows;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }

    async sum_cart(login) {
        if (!login) return;
        try {
            var result = await pool.query('select sum(items.price) as total from users join orders on users.cur_order_id = orders.id join item_order on orders.id = item_order.order_id  join items on items.id = item_order.item_id  where users.login = $1', [login]);
            if (result.rows[0].total == null) {
                return 0;
            }
            return result.rows[0].total;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    async count_cart(login) {
        if (!login) return;
        try {
            var result = await pool.query('select count(items.id) as cnt from users join orders on users.cur_order_id = orders.id join item_order on orders.id = item_order.order_id  join items on items.id = item_order.item_id  where users.login = $1', [login]);
            if (result.rows[0].cnt == null) {
                return 0;
            }
            return result.rows[0].cnt;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    async view_users(text = null, usrtype = null) {
        try {
            if (text && usrtype) {
                var res = await pool.query('select user_type, login, user_name, user_surname from users where (login like $1 or user_name like $1 or user_surname like $1) and user_type=$2', ["%" + text + "%", usrtype]);
                return res.rows;
            }
            if (text) {
                var res = await pool.query('select user_type, login, user_name, user_surname from users where login like $1 or user_name like $1 or user_surname like $1 order by user_type desc', ["%" + text + "%"]);
                return res.rows;
            }
            else if (usrtype) {
                var res = await pool.query('select user_type, login, user_name, user_surname from users where user_type=$1', [usrtype]);
                return res.rows;
            }
            else {
                var res = await pool.query('select user_type, login, user_name, user_surname from users order by user_type DESC');
                return res.rows;
            }
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
}

class ItemRepository {
    constructor(pool) {
        this.pool = pool;
    }
    // async retrieve(id = null, name = null, category = null) {
    //     try {
    //         if (id) {
    //             var result = await pool.query('select * from items where id = $1', [id]);
    //         }
    //         else if (name) {
    //             var result = await pool.query('select * from items where product_name = $1', [name]);
    //         }
    //         else if (category) {
    //             var result = await pool.query('select * from items where category = $1', [category]);
    //         }
    //         else {
    //             var result = await pool.query('select * from items');
    //         }
    //         return result.rows;
    //     }
    //     catch (err) {
    //         console.log(err);
    //         return [];
    //     }
    // }

    async retrieve(id = null, text = null) {
        try {
            if (id) {
                var result = await pool.query('select * from items where id = $1', [id]);
            }
            else if (text) {
                var result = await pool.query("select * from items where product_name like $1 or description like $1", ["%" + text + "%"]);
            }
            else {
                var result = await pool.query('select * from items');
            }
            return result.rows;
        }
        catch (err) {
            console.log(err);
            return [];
        }
    }

    async insert(product_name, price, category, description = '', photo = null) {
        try {
            var exists = await pool.query('select * from items where product_name = $1', [product_name]);
            if (exists.rowCount > 0) {
                /*change the existing one */
                // console.log('change');
                var id = exists.rows[0].id;
                var result = await pool.query('update items set price=$1, category=$2, description=$3, photo=$4 where id=$5', [price, category, description, photo, id]);
                return id;
            }
            else {
                /*add*/
                // console.log('add');
                var result = await pool.query('insert into items (product_name, price, description, category, photo) values ($1, $2, $3, $4, $5) returning id', [product_name, price, description, category, photo]);
                return result.rows[0].id;
            }
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    async update(id, product_name, price, category, description = '', photo = null) {
        if (!id) return;
        try {
            var item = await pool.query('select * from items where id = $1', [id]);
            if (item.rowCount > 0) {
                var result = await pool.query('update items set price=$1, category=$2, description=$3, photo=$4, product_name=$5 where id=$6', [price, category, description, photo, product_name, id]);
                return id;
            }
            else {
                console.log('no such item');
                exit(1);
            }
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    async remove(id) {
        try {
            var res = await pool.query('delete from items where id=$1 returning *', [id]);
            return res.rows;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }

}

class OrderRepository {
    constructor(pool) {
        this.pool = pool;
    }
    async retrieve(id = null, user = null, date = null) {
        try {
            if (id) {
                var result = await pool.query('select * from orders where id = $1', [id]);
            }
            else if (user) {
                var result = await pool.query('select * from orders where user_id = $1', [user]);
            }
            else if (date) {
                var result = await pool.query('select * from orders where order_date = $1', [date]);
            }
            else {
                var result = await pool.query('select * from orders');
            }
            return result.rows;
        }
        catch (err) {
            console.log(err);
            return [];
        }
    }
    async insert(user, date = null) {
        try {
            var result = await pool.query('insert into orders (user_id, order_date) values ($1, $2) returning id', [user, date]);
            return result.rows[0].id;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    async timestamp(id) {
        var now = new Date()
        try {
            var result = await pool.query('update orders set order_date=$1 where id=$2', [now, id]);
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    async remove(id) {
        try {
            var res = await pool.query('delete from orders where id=$1 returning *', [id]);
            return res.rows;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    async view_orders() {
        try {
            // var res = await pool.query('select orders.id, orders.order_date, users.login, sum(items.price) as total_price from users join orders on orders.user_id = users.login join item_order on item_order.order_id = orders.id join items on items.id = item_order.item_id where orders.order_date is not null group by orders.id, orders.order_date, users.login order by orders.id');
            var res = await pool.query('select orders.id, orders.order_date, users.login, sum(items.price) as total_price from users join orders on orders.user_id = users.login join item_order on item_order.order_id = orders.id join items on items.id = item_order.item_id group by orders.id, orders.order_date, users.login order by orders.id');
            return res.rows;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    async view_ordered_items(id) {
        try {
            var res = await pool.query('select items.product_name, sum(items.price) as totat_price, count(item_order.id) as num_of_items from orders join item_order on item_order.order_id = orders.id join items on items.id = item_order.item_id where orders.order_date is not null and orders.id = $1 group by items.id', [id]);
            return res.rows;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
}

class ItemOrderRepository {
    constructor(pool) {
        this.pool = pool;
    }
    async retrieve(id, item_id = null, order_id = null) {
        try {
            if (id) {
                var result = await pool.query('select * from item_order where id = $1', [id]);
            }
            else if (item_id && order_id) {
                var result = await pool.query('select * from item_order where item_id = $1 and order_id = $2', [item_id, order_id]);
            }
            else if (item_id) {
                var result = await pool.query('select * from item_order where item_id = $1', [item_id]);
            }
            else if (order_id) {
                var result = await pool.query('select * from item_order where order_id = $1', [order_id]);
            }
            else {
                var result = await pool.query('select * from item_order');
            }
            return result.rows;
        }
        catch (err) {
            console.log(err);
            return [];
        }
    }
    async insert(item, order) {
        try {
            var result = await pool.query('insert into item_order (item_id, order_id) values ($1, $2) returning id', [item, order]);
            return result.rows[0].id;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    // async remove(id) {
    //     try {
    //         var res = await pool.query('delete from item_order where id=$1 returning *', [id]);
    //         return res.rows;
    //     }
    //     catch (err) {
    //         console.log(err);
    //         throw err;
    //     }
    // }

    async remove(id, item_id = null) {
        try {
            if (id) {
                var res = await pool.query('delete from item_order where id=$1 returning *', [id]);
            } else {
                var res = await pool.query('delete from item_order where item_id=$1 returning *', [item_id]);
            }
            return res.rows;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }

    async countitems(order_id) {
        try {
            var res = await pool.query('select count(id) as cnt from item_order where order_id=$1 group by order_id', [order_id]);
            if (res.rowCount == 0) {
                return 0;
            }
            return res.rows[0].cnt;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
}

class PasswordRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async insert(login, password) {
        try {
            var hash = await bcrypt.hash(password, saltRounds);
            var result = await pool.query('insert into passwords (login, password) values ($1, $2)', [login, hash]);
            return hash;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }

    async validate(login, password) {
        try {
            var res = await pool.query('select * from passwords where login = $1', [login]);
            if(res.rowCount==0){
                console.log('no such user');
                return false;
            }
            var hash = res.rows[0].password;
            var ok = await bcrypt.compare(password, hash);
            return ok;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
}

/* operations that require manipulating multiple tables: add_user, add_to_cart, remove_from_cart, submit_order, remove_item */
class CommonRepository {

    async add_user(login, password, user_name, user_surname, user_type, cur_order_id = null) {
        try {
            await users_repo.insert(login, user_name, user_surname, user_type, cur_order_id = null);
            await passwords_repo.insert(login, password);
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }

    async add_to_cart(user_login, item_id) {
        try {
            var res = await users_repo.retrieve(user_login);
            var order_id = res[0].cur_order_id;
            if (order_id == null) {
                /* new order */
                order_id = await orders_repo.insert(user_login, null);
                await users_repo.update_cur_order(user_login, order_id);
                await item_order_repo.insert(item_id, order_id);
            }
            else {
                /* add to old order */
                await item_order_repo.insert(item_id, order_id);
            }
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }

    // async remove_from_cart(user_login, instance) {
    //     try {
    //         var res = await item_order_repo.remove(instance);
    //         var order_id = res[0].order_id;
    //         // res = await orders_repo.retrieve(order_id);/** */
    //         // var user_login = res[0].user_id;/** */
    //         var cnt = await item_order_repo.countitems(order_id);
    //         if (cnt == 0) {
    //             /* cart is empty */
    //             await users_repo.update_cur_order(user_login, null);
    //             order = await orders_repo.remove(order_id);
    //         }
    //     }
    //     catch (err) {
    //         console.log(err);
    //         throw err;
    //     }
    // }

    async remove_from_cart(user_login, item_id) {
        try {
            var user = (await users_repo.retrieve(user_login))[0];
            var order_id = user.cur_order_id;
            var res = (await item_order_repo.retrieve(null, item_id, order_id))[0];
            var item_order_id = res.id;
            await item_order_repo.remove(item_order_id);
            var cnt = await item_order_repo.countitems(order_id);
            if (cnt == 0) {
                /* cart is empty */
                await users_repo.update_cur_order(user_login, null);
                await orders_repo.remove(order_id);
            }
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }

    async submit_order(user_login) {
        try {
            var res = await users_repo.retrieve(user_login);
            var order_id = res[0].cur_order_id;
            await orders_repo.timestamp(order_id);
            await users_repo.update_cur_order(user_login, null);
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }

    async remove_item(id) {
        try {
            var res = await item_order_repo.remove(null, id);
            var resItem = await items_repo.remove(id);

        } catch (err) {
            console.log(err);
            throw err;
        }
    }
}


var pool = new pg.Pool({
    host: 'localhost',
    database: 'shop',
    user: 'shop',
    password: 'password'
});

var users_repo = new UserRepository(pool);
var items_repo = new ItemRepository(pool);
var orders_repo = new OrderRepository(pool);
var item_order_repo = new ItemOrderRepository(pool);
var passwords_repo = new PasswordRepository(pool);
var common_repo = new CommonRepository(pool);

module.exports = { common_repo, users_repo, items_repo, item_order_repo, orders_repo, passwords_repo };


async function tests() {
    var r;
    // await users_repo.insert("alamakota", "alama", "kota", "user", null);
    await passwords_repo.insert("alamakota", "kotmaale");
    await passwords_repo.insert("werka666", "tosty<3");
    await passwords_repo.insert("werka123", "tosty<3");
    await passwords_repo.insert("jan123", "xd");

    r = await passwords_repo.validate("alamakota", "xd");
    console.log(r);

    r = await passwords_repo.validate("alamakota", "kotmaale");
    console.log(r);

}
// tests();