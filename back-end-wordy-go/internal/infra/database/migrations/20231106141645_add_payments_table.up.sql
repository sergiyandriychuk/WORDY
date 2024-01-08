CREATE TABLE IF NOT EXISTS public.payments
(
    id                serial PRIMARY KEY,
    user_id           int         NOT NULL references public.users (id),
    customer_id       text,
    subscription_id   text,
    invoice_id        text,
    payment_intent_id text,
    price             int         NOT NULL,
    currency          varchar(3)  NOT NULL,
    card_data         jsonb,
    status            varchar(20),
    invoice_url       text,
    created_date      timestamptz NOT NULL,
    updated_date      timestamptz NOT NULL,
    UNIQUE (customer_id, invoice_id)
);
