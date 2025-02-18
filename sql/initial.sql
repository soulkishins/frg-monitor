drop table if exists tb_user cascade;

create table if not exists tb_user (
	id uuid not null,
	st_name varchar not null,
	st_email varchar not null,
	st_phone varchar,
	dt_created timestamp not null,
	dt_modified timestamp,
	st_created_by varchar not null,
	st_modified_by varchar,
	constraint pk_user primary key (id),
	constraint uq_user unique (st_email)
);

drop table if exists tb_user_attr cascade;

create table if not exists tb_user_attr (
	id_user uuid not null,
	id_attr varchar not null,
	st_value varchar not null,
	dt_created timestamp not null,
	dt_modified timestamp,
	st_created_by varchar not null,
	st_modified_by varchar,
	constraint pk_user_attr primary key (id_user, id_attr),
	constraint fk_user_attr_user foreign key (id_user) references tb_user(id)
);

drop table if exists tb_category cascade;

create table if not exists tb_category (
	id_category uuid not null,
	st_category varchar not null,
	st_status varchar not null,
	dt_created timestamp not null,
	dt_modified timestamp,
	st_created_by varchar not null,
	st_modified_by varchar,
	constraint pk_category primary key (id_category)
);

drop table if exists tb_subcategory cascade;

create table if not exists tb_subcategory (
	id_subcategory uuid not null,
	id_category uuid not null,
	st_subcategory varchar not null,
	st_status varchar not null,
	dt_created timestamp not null,
	dt_modified timestamp,
	st_created_by varchar not null,
	st_modified_by varchar,
	constraint pk_subcategory primary key (id_subcategory),
	constraint fk_subcategory_category foreign key (id_category) references tb_category(id_category)
);

drop table if exists tb_client cascade;

create table if not exists tb_client (
	id uuid not null,
	st_name varchar not null,
	st_document varchar not null,
	st_status varchar not null,
	dt_created timestamp not null,
	dt_modified timestamp,
	st_created_by varchar not null,
	st_modified_by varchar,
	constraint pk_client primary key (id),
	constraint uq_client unique (st_document)
);

drop table if exists tb_client_brand cascade;

create table if not exists tb_client_brand (
	id_brand uuid not null,
	id_client uuid not null,
	st_brand varchar not null,
	st_status varchar not null,
	dt_created timestamp not null,
	dt_modified timestamp,
	st_created_by varchar not null,
	st_modified_by varchar,
	constraint pk_client_brand primary key (id_brand),
	constraint fk_client_brand_client foreign key (id_client) references tb_client(id)
);

drop table if exists tb_client_brand_product cascade;

create table if not exists tb_client_brand_product (
	id_product uuid not null,
	id_brand uuid not null,
	id_subcategory uuid not null,
	st_product varchar not null,
	st_variety varchar not null,
	st_status varchar not null,
	dt_created timestamp not null,
	dt_modified timestamp,
	st_created_by varchar not null,
	st_modified_by varchar,
	constraint pk_client_brand_product primary key (id_product),
	constraint fk_client_brand_product_client_brand foreign key (id_brand) references tb_client_brand(id_brand),
	constraint fk_client_brand_product_subcategory foreign key (id_subcategory) references tb_subcategory(id_subcategory)
);

drop table if exists tb_keyword cascade;

create table if not exists tb_keyword (
	id_keyword uuid not null,
	id_brand uuid not null,
	st_keyword varchar not null,
	st_product varchar not null,
	st_status varchar not null,
	dt_created timestamp not null,
	dt_modified timestamp,
	st_created_by varchar not null,
	st_modified_by varchar,
	constraint pk_keyword primary key (id_keyword),
	constraint fk_keyword_client_brand foreign key (id_brand) references tb_client_brand(id_brand)
);

drop table if exists tb_advertisement cascade;

create table if not exists tb_advertisement (
	id_advertisement uuid not null,
	id_brand uuid not null,
	st_plataform varchar not null,
	st_url varchar not null,
	st_title varchar not null,
	st_description varchar not null,
	st_photos varchar not null,
	db_price numeric(10, 2) not null,
	st_vendor varchar not null,
	st_details varchar,
	st_status varchar not null,
	dt_created timestamp not null,
	dt_modified timestamp,
	st_created_by varchar not null,
	st_modified_by varchar,
	constraint pk_advertisement primary key (id_advertisement),
	constraint fk_advertisement_client_brand foreign key (id_brand) references tb_client_brand(id_brand)
);

drop table if exists tb_advertisement_product cascade;

create table if not exists tb_advertisement_product (
	id_advertisement uuid not null,
	id_product uuid not null,
	st_varity_seq varchar not null,
	st_varity_name varchar not null,
	dt_created timestamp not null,
	dt_modified timestamp,
	st_created_by varchar not null,
	st_modified_by varchar,
	constraint pk_advertisement_product primary key (id_advertisement, id_product),
	constraint fk_advertisement_product_advertisement foreign key (id_advertisement) references tb_advertisement(id_advertisement),
	constraint fk_advertisement_product_client_brand_product foreign key (id_product) references tb_client_brand_product(id_product)
);

drop table if exists tb_advertisement_history cascade;

create table if not exists tb_advertisement_history (
	id_advertisement uuid not null,
	dt_history timestamp not null,
	st_status varchar not null,
	st_action varchar not null,
	st_history varchar null,
	dt_created timestamp not null,
	dt_modified timestamp,
	st_created_by varchar not null,
	st_modified_by varchar,
	constraint pk_advertisement_history primary key (id_advertisement, dt_history),
	constraint fk_advertisement_history_advertisement foreign key (id_advertisement) references tb_advertisement(id_advertisement)
);
