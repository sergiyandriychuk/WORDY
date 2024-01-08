CREATE TABLE IF NOT EXISTS public.feedbacks
(
    id           serial PRIMARY KEY,
    user_id      int         NOT NULL references public.users (id),
    subject      text        NOT NULl,
    message      text,
    url          text,
    status       varchar(10),
    "from"       varchar(2),
    created_date timestamptz NOT NULL,
    updated_date timestamptz NOT NULL
);
