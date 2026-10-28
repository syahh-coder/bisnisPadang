begin;
create table public.daily_sales (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  date date not null,
  revenue numeric(14,2) not null check (revenue >= 0),
  sales_count integer not null check (sales_count >= 0),
  updated_at timestamptz not null default now(),
  unique(store_id,date)
);
alter table public.daily_sales enable row level security;
revoke all on public.daily_sales from anon,authenticated;
grant select,delete on public.daily_sales to authenticated;
grant insert(store_id,date,revenue,sales_count),update(revenue,sales_count) on public.daily_sales to authenticated;
grant all on public.daily_sales to service_role;
create policy sales_owner_read on public.daily_sales for select to authenticated using (private.can_manage_store(store_id));
create policy sales_owner_insert on public.daily_sales for insert to authenticated with check (private.can_manage_store(store_id));
create policy sales_owner_update on public.daily_sales for update to authenticated using (private.can_manage_store(store_id)) with check (private.can_manage_store(store_id));
create policy sales_owner_delete on public.daily_sales for delete to authenticated using (private.can_manage_store(store_id));

create function private.validate_daily_sales() returns trigger language plpgsql set search_path='' as $$
begin
  if new.date > (now() at time zone 'Asia/Jakarta')::date then
    raise exception 'Tanggal catatan tidak boleh melewati hari ini (WIB)' using errcode='22023';
  end if;
  new.updated_at := now();
  return new;
end $$;
revoke all on function private.validate_daily_sales() from public;
create trigger daily_sales_validate before insert or update on public.daily_sales for each row execute function private.validate_daily_sales();

-- Invoker: UPSERT tetap mengikuti izin kolom dan RLS sesi pemilik/admin.
create function public.save_daily_sales(shop_id uuid,sales_date date,total_revenue numeric,total_sales integer) returns uuid
language sql security invoker set search_path='' as $$
  insert into public.daily_sales(store_id,date,revenue,sales_count) values(shop_id,sales_date,total_revenue,total_sales)
  on conflict(store_id,date) do update set revenue=excluded.revenue,sales_count=excluded.sales_count returning id
$$;
revoke all on function public.save_daily_sales(uuid,date,numeric,integer) from public;
grant execute on function public.save_daily_sales(uuid,date,numeric,integer) to authenticated;
commit;
