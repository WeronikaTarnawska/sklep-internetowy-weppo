insert into items (product_name, price, description, category, photo) 
values ('czerwony kubek', 25.0, 'kubek 300ml, kolor czerwony', 'mug', null);

insert into items (product_name, price, description, category, photo) 
values ('niebieski kubek', 25.0, 'kubek 300ml, kolor niebieski', 'mug', null);

insert into items (product_name, price, description, category, photo) 
values ('czerwona koszulka', 40.0, '...', 't-shirt', null);

insert into items (product_name, price, description, category, photo) 
values ('niebieska koszulka', 40.0, '...', 't-shirt', null);

insert into items (product_name, price, description, category, photo) 
values ('zielona bluza', 123.0, '...', 'sweatshirt', null);

insert into items (product_name, price, description, category, photo) 
values ('tost z keczupem :)', 5.0, '...', 'other', null);

insert into users (login, user_name, user_surname, user_type, cur_order_id)
values ('werka666', 'werka', 'werka', 'admin', null);

insert into users (login, user_name, user_surname, user_type, cur_order_id)
values ('werka123', 'werka', 'werka', 'user', null);

insert into users (login, user_name, user_surname, user_type, cur_order_id)
values ('jan123', 'Jan', 'Kowalski', 'user', null);



-- view all carts 
select users.login, items.product_name, items.price from users
join orders on users.cur_order_id = orders.id
join item_order on orders.id = item_order.order_id 
join items on items.id = item_order.item_id 

-- total price
select users.login, sum(items.price) as total from users
join orders on users.cur_order_id = orders.id
join item_order on orders.id = item_order.order_id 
join items on items.id = item_order.item_id 
group by users.login 

-- view specified user's cart
select items.product_name, items.description, items.category, count(items.id) as num_of_items, sum(items.price) as total_price from users
join orders on users.cur_order_id = orders.id
join item_order on orders.id = item_order.order_id 
join items on items.id = item_order.item_id 
where users.login = 'werka123'
group by items.product_name, items.description, items.category  

-- sum specified user's cart
select sum(items.price) as total from users
join orders on users.cur_order_id = orders.id
join item_order on orders.id = item_order.order_id 
join items on items.id = item_order.item_id 
where users.login = 'werka123'

-- submitted orders 
select orders.id, orders.order_date, users.login, sum(items.price) as total_price
from users  
join orders on orders.user_id = users.login 
join item_order on item_order.order_id = orders.id 
join items on items.id = item_order.item_id 
where orders.order_date is not null
group by orders.id, orders.order_date, users.login 
order by orders.id

-- ordered items
select items.product_name, sum(items.price) as totat_price, count(item_order.id) as num_of_items
from orders 
join item_order on item_order.order_id = orders.id 
join items on items.id = item_order.item_id 
where orders.order_date is not null and orders.id = 1
group by items.id
