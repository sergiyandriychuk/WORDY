CREATE TABLE IF NOT EXISTS public.subscriptions
(
    id                serial PRIMARY KEY,
    user_id           int         NOT NULL references public.users (id),
    customer_id       text,
    subscription_id   text,
    price             int         NOT NULL,
    currency          varchar(3)  NOT NULL,
    card_data         jsonb,
    status            varchar(20),
    next_payment_date timestamptz,
    created_date      timestamptz NOT NULL,
    updated_date      timestamptz NOT NULL,
    deleted_date      timestamptz
);
