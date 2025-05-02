drop table if exists tb_scheduler cascade;

create table if not exists tb_scheduler (
	id uuid not null,
	id_brand uuid not null,
	st_platform varchar not null,
	st_cron varchar not null,
	dt_last_execution timestamp null,
	dt_created timestamp not null,
	dt_modified timestamp,
	st_created_by varchar not null,
	st_modified_by varchar,
	constraint pk_scheduler primary key (id),
	constraint fk_scheduler_brand foreign key (id_brand) references tb_client_brand(id_brand)
);

drop table if exists tb_scheduler_statistics cascade;

create table if not exists tb_scheduler_statistics (
	id_scheduler uuid not null,
	dt_created timestamp not null,
	nr_pages int not null,
	nr_total int not null,
	nr_processed int not null,
	nr_created int not null,
	nr_updated int not null,
	nr_error int not null,
	nr_manual_revision int not null,
	nr_reported int not null,
	nr_already_reported int not null,
	nr_invalidate int not null,
	nr_reconcile int not null,
	en_status varchar not null,
	constraint pk_scheduler_statistics primary key (id_scheduler, dt_created)
);

ALTER TABLE tb_advertisement ADD bl_reconcile boolean default false NOT NULL;
ALTER TABLE tb_advertisement_product ADD nr_quantity int NULL;
ALTER TABLE tb_advertisement_product ADD en_status varchar DEFAULT 'NR' NOT NULL;
COMMENT ON COLUMN tb_advertisement_product.en_status IS 'AR | NR | AI | MI | MR | ER';


