begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create function private.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'admin') $$;

create function private.can_manage_store(store_id uuid) returns boolean
language sql stable security definer set search_path = ''
as $$ select private.is_admin() or exists(select 1 from public.stores where id = store_id and owner_id = (select auth.uid())) $$;

create function private.can_manage_media(object_name text) returns boolean
language sql stable security definer set search_path = ''
as $$
  select case
    when private.is_admin() then true
    when split_part(object_name, '/', 1) = 'stores'
      and split_part(object_name, '/', 2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and split_part(object_name, '/', 3) <> ''
    then private.can_manage_store(split_part(object_name, '/', 2)::uuid)
    else false end
$$;

revoke all on function private.is_admin(), private.can_manage_store(uuid), private.can_manage_media(text) from public;
grant execute on function private.is_admin(), private.can_manage_store(uuid), private.can_manage_media(text) to authenticated, service_role;

-- Metadata pengguna tidak dapat menentukan role atau kepemilikan toko.
create function private.create_profile() returns trigger
language plpgsql security definer set search_path = ''
as $$ begin
  insert into public.profiles(id, name, role)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'name', ''), 160), 'toko')
  on conflict(id) do nothing;
  return new;
end $$;
revoke all on function private.create_profile() from public;
create trigger auth_user_create_profile after insert on auth.users for each row execute function private.create_profile();
insert into public.profiles(id, name, role)
select id, left(coalesce(raw_user_meta_data ->> 'name', ''), 160), 'toko' from auth.users
on conflict(id) do nothing;

create function private.guard_profile_role() returns trigger
language plpgsql security invoker set search_path = ''
as $$ begin
  if new.role is distinct from old.role
    and current_user not in ('postgres', 'supabase_admin', 'service_role')
    and not private.is_admin() then
    raise exception 'Perubahan role hanya untuk admin' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger profiles_guard_role before update on public.profiles for each row execute function private.guard_profile_role();

create function private.guard_store_owner() returns trigger
language plpgsql security invoker set search_path = ''
as $$ begin
  if new.owner_id is distinct from old.owner_id
    and current_user not in ('postgres', 'supabase_admin', 'service_role')
    and not private.is_admin() then
    raise exception 'Perubahan pemilik hanya untuk admin' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger stores_guard_owner before update on public.stores for each row execute function private.guard_store_owner();
revoke all on function private.guard_profile_role(), private.guard_store_owner() from public;

drop policy profiles_read_self on public.profiles;
create policy profiles_read_self_or_admin on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));
grant update (name, role) on public.profiles to authenticated;
create policy profiles_update_self_or_admin on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()))
  with check (id = (select auth.uid()) or (select private.is_admin()));

-- Katalog publik dibaca dengan client anon terpisah. Sesi toko hanya membaca
-- baris miliknya; owner_id tetap tidak dapat dibaca oleh pengunjung anonim.
drop policy stores_public_read on public.stores;
create policy stores_public_read on public.stores for select to anon using (true);
grant select, insert, delete on public.stores to authenticated;
grant update (owner_id,category_id,name,slug,phone,address,latitude,longitude,delivery_info,photo_path) on public.stores to authenticated;
create policy stores_owner_read on public.stores for select to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_admin()));
create policy stores_owner_update on public.stores for update to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_admin()))
  with check (owner_id = (select auth.uid()) or (select private.is_admin()));
create policy stores_admin_insert on public.stores for insert to authenticated with check ((select private.is_admin()));
create policy stores_admin_delete on public.stores for delete to authenticated using ((select private.is_admin()));

drop policy products_public_read on public.products;
create policy products_public_read on public.products for select to anon using (true);
grant select, insert, update, delete on public.products to authenticated;
create policy products_owner_read on public.products for select to authenticated using (private.can_manage_store(store_id));
create policy products_owner_insert on public.products for insert to authenticated with check (private.can_manage_store(store_id));
create policy products_owner_update on public.products for update to authenticated
  using (private.can_manage_store(store_id)) with check (private.can_manage_store(store_id));
create policy products_owner_delete on public.products for delete to authenticated using (private.can_manage_store(store_id));

grant insert, update, delete on public.categories to authenticated;
create policy categories_admin_insert on public.categories for insert to authenticated with check ((select private.is_admin()));
create policy categories_admin_update on public.categories for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy categories_admin_delete on public.categories for delete to authenticated using ((select private.is_admin()));

grant select, insert, update, delete on storage.objects to authenticated;
create policy store_media_owner_read on storage.objects for select to authenticated
  using (bucket_id = 'store-media' and private.can_manage_media(name));
create policy store_media_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'store-media' and private.can_manage_media(name));
create policy store_media_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'store-media' and private.can_manage_media(name))
  with check (bucket_id = 'store-media' and private.can_manage_media(name));
create policy store_media_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'store-media' and private.can_manage_media(name));

commit;
