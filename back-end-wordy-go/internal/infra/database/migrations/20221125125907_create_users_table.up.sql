CREATE TABLE IF NOT EXISTS public.users (
    id           serial PRIMARY KEY,
    "name"       varchar(50)  NOT NULL,
    email        varchar(50)  NOT NULL,
    password     varchar(100) NOT NULL,
    social_id    varchar(255),
    social_name  varchar(255),
    "from"       varchar(2) NOT NULL,
    "to"         varchar(2) NOT NULL,
    avatar       varchar,
    created_date timestamptz NOT NULL,
    updated_date timestamptz NOT NULL,
    deleted_date timestamp
);
