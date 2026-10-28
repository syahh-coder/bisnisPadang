begin;
create table public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  kind text not null check(kind in ('static','dynamic')),
  code text not null unique default replace(gen_random_uuid()::text,'-','') check(code ~ '^[a-f0-9]{32}$'),
  site_origin text not null check(char_length(site_origin) <= 300 and site_origin ~ '^https?://[^/?#[:space:]@]+$'),
  target_slug text not null check(target_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  check((kind='static' and expires_at is null) or (kind='dynamic' and expires_at is not null and expires_at > created_at and expires_at <= created_at + interval '15 days'))
);
create index qr_created on public.qr_codes(created_at desc,id);
create index qr_store on public.qr_codes(store_id);
alter table public.qr_codes enable row level security;
revoke all on public.qr_codes from anon,authenticated;
grant select,delete on public.qr_codes to authenticated;
grant insert(store_id,kind,site_origin,expires_at),update(expires_at) on public.qr_codes to authenticated;
grant all on public.qr_codes to service_role;
create policy qr_admin_read on public.qr_codes for select to authenticated using ((select private.is_admin()));
create policy qr_admin_insert on public.qr_codes for insert to authenticated with check ((select private.is_admin()));
create policy qr_admin_update on public.qr_codes for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy qr_admin_delete on public.qr_codes for delete to authenticated using ((select private.is_admin()));

-- Slug statis disalin saat dibuat agar berkas yang diunduh ulang tetap sama.
create function private.capture_qr_slug() returns trigger language plpgsql set search_path='' as $$
begin
  select slug into new.target_slug from public.stores where id=new.store_id;
  if new.target_slug is null then raise exception 'Toko tidak tersedia' using errcode='23503'; end if;
  return new;
end $$;
revoke all on function private.capture_qr_slug() from public;
create trigger qr_capture_slug before insert on public.qr_codes for each row execute function private.capture_qr_slug();

-- Publik hanya boleh menukar satu kode dinamis dengan slug toko yang masih aktif.
create function public.resolve_dynamic_qr(qr_code text) returns table(status text,slug text)
language plpgsql stable security definer set search_path='' as $$
declare qr public.qr_codes%rowtype; current_slug text;
begin
  if qr_code is null or qr_code !~ '^[a-f0-9]{32}$' then return query select 'missing'::text,null::text; return; end if;
  select * into qr from public.qr_codes q where q.code=qr_code and q.kind='dynamic';
  if not found then return query select 'missing'::text,null::text;
  elsif qr.expires_at <= now() then return query select 'expired'::text,null::text;
  else
    select s.slug into current_slug from public.stores s where s.id=qr.store_id;
    if current_slug is null then return query select 'missing'::text,null::text;
    else return query select 'active'::text,current_slug; end if;
  end if;
end $$;
revoke all on function public.resolve_dynamic_qr(text) from public;
grant execute on function public.resolve_dynamic_qr(text) to anon,authenticated;
commit;
