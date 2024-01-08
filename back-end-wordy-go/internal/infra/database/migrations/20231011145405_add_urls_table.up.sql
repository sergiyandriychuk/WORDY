CREATE TABLE IF NOT EXISTS public.urls
(
    id           serial PRIMARY KEY,
    user_id      int         NOT NULL references public.users (id),
    domain       text        NOT NULl,
    url          text        NOT NULL,
    "from"       varchar(2)  NOT NULL,
    "to"         varchar(2)  NOT NULL,
    enabled      bool        NOT NULL,
    created_date timestamptz NOT NULL,
    updated_date timestamptz NOT NULL,
    UNIQUE (user_id, url)
);
