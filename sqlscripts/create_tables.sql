-- type definitions
create type user_type_enum as enum ('user', 'admin');
create type product_category as enum ('mug', 't-shirt', 'sweatshirt', 'other');
-- tables
create table users (
	login varchar(20) primary key,
	-- password varchar(20) not null, -- TU NIE TRZYMAMY HASEŁ :)
	user_name varchar(50) not null,
	user_surname varchar(50) not null,
	user_type user_type_enum not null,
	-- 'admin' or 'user'
	cur_order_id int unique -- if null then the cart is empty
);
create table orders (
	id serial primary key,
	user_id varchar(20) not null,
	order_date date
);
create table items (
	id serial primary key,
	product_name varchar(50) unique not null,
	price numeric CHECK (price > 0) not null,
	description varchar(300),
	category product_category,
	-- one of categories defined above
	photo varchar(150) -- path to photofile?
);
create table item_order(
	-- many-to-many relation: list of items in an order
	id serial primary key,
	item_id int not null,
	order_id int not null
);
create table passwords(
	login varchar(20) primary key,
	-- unique identifier
	password varchar(200) not null
	-- password's hash
);
-- relations 
-- one user has one one current order (current cart contents); that's not supposed to be a relation???
alter table users
add constraint fk_order foreign key (cur_order_id) references orders(id);
-- one user has many orders
alter table orders
add constraint fk_users foreign key (user_id) references users(login);
-- many items in one order and one item in many orders
alter table item_order
add constraint fk_orders foreign key (order_id) references orders(id),
	add constraint fk_items foreign key (item_id) references items(id);
-- one to one user-password
alter table passwords
add constraint fk_passwd foreign key (login) references users(login);