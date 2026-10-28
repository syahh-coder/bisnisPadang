begin;

-- auto_expose_new_tables=false juga meniadakan grant bawaan service_role.
-- Key ini hanya dipakai alat pengelola/server tepercaya, tidak dikirim ke UI.
grant usage on schema public to service_role;
grant all on public.profiles, public.categories, public.stores, public.products to service_role;

commit;
