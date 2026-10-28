begin;
create table public.store_visits (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  visited_at timestamptz not null default now(),
  source text not null check(source in ('google_maps','qr','search','direct'))
);
create index visits_store_time on public.store_visits(store_id,visited_at) include(source);
alter table public.store_visits enable row level security;
revoke all on public.store_visits from anon,authenticated;
grant select on public.store_visits to authenticated;
grant all on public.store_visits to service_role;
create policy visits_owner_read on public.store_visits for select to authenticated using (private.can_manage_store(store_id));

-- Waktu berasal dari database. ID kiriman ulang tidak menghasilkan hit kedua.
create function public.record_store_visit(shop_id uuid,event_id uuid,visit_source text default 'direct') returns boolean
language plpgsql security definer set search_path='' as $$
declare changed integer;
begin
  if event_id is null then raise exception 'ID kunjungan tidak valid' using errcode='22023'; end if;
  if not exists(select 1 from public.stores where id=shop_id) then raise exception 'Toko tidak ditemukan' using errcode='23503'; end if;
  insert into public.store_visits(id,store_id,source)
    values(event_id,shop_id,case when visit_source in ('google_maps','qr','search') then visit_source else 'direct' end)
    on conflict(id) do nothing;
  get diagnostics changed=row_count;
  return changed=1;
end $$;
revoke all on function public.record_store_visit(uuid,uuid,text) from public;
grant execute on function public.record_store_visit(uuid,uuid,text) to anon,authenticated;

create function public.store_visit_summary(shop_id uuid) returns table(source text,visits bigint,visit_date date)
language plpgsql stable security invoker set search_path='' as $$
declare today date := (now() at time zone 'Asia/Jakarta')::date;
  day_start timestamptz := today::timestamp at time zone 'Asia/Jakarta';
begin
  if not private.can_manage_store(shop_id) then raise exception 'Akses statistik ditolak' using errcode='42501'; end if;
  return query
    select s.source,count(v.id),today
    from (values ('google_maps',1),('qr',2),('search',3),('direct',4)) s(source,position)
    left join public.store_visits v on v.store_id=shop_id and v.source=s.source and v.visited_at>=day_start and v.visited_at<day_start+interval '1 day'
    group by s.source,s.position order by s.position;
end $$;
revoke all on function public.store_visit_summary(uuid) from public;
grant execute on function public.store_visit_summary(uuid) to authenticated;
commit;
