ALTER TABLE public.urls
    DROP CONSTRAINT IF EXISTS urls_user_id_url_from_to_key;

ALTER TABLE public.urls
    ADD CONSTRAINT urls_user_id_url_key UNIQUE (user_id, url);