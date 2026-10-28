begin;

alter table public.stores add column manager_name text not null default '' check (char_length(manager_name) <= 160);
grant update(manager_name) on public.stores to authenticated;

create table public.affiliation_requests (
  id uuid primary key default gen_random_uuid(),
  store_id uuid unique references public.stores(id) on delete set null,
  manager_name text not null check (char_length(btrim(manager_name)) between 2 and 160),
  whatsapp text not null check (whatsapp ~ '^62[0-9]{8,13}$'),
  address text not null check (char_length(btrim(address)) between 5 and 500),
  appointment_date date not null check (extract(dow from appointment_date) <> 0),
  appointment_time time not null check (appointment_time in ('09:00', '11:00', '13:00', '15:00')),
  notes text not null default '' check (char_length(notes) <= 200),
  status text not null default 'menunggu' check (status in ('menunggu', 'dikonfirmasi', 'selesai', 'dibatalkan')),
  cancellation_hash text not null check (cancellation_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now()
);
create unique index affiliation_one_active_slot on public.affiliation_requests(appointment_date, appointment_time) where status <> 'dibatalkan';
create index affiliation_date on public.affiliation_requests(appointment_date, appointment_time, id);
alter table public.affiliation_requests enable row level security;
revoke all on public.affiliation_requests from anon, authenticated;
grant select(id,store_id,manager_name,whatsapp,address,appointment_date,appointment_time,notes,status,created_at), update(status) on public.affiliation_requests to authenticated;
grant all on public.affiliation_requests to service_role;
create policy affiliation_admin_read on public.affiliation_requests for select to authenticated using ((select private.is_admin()));
create policy affiliation_admin_update on public.affiliation_requests for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- Hanya slot kosong yang terbuka ke publik, tanpa identitas pemohon.
create function public.available_affiliation_slots() returns table(appointment_date date, appointment_time time)
language sql stable security definer set search_path = '' as $$
  select d::date, t::time from generate_series(1,14) n
  cross join lateral (select (now() at time zone 'Asia/Jakarta')::date + n as d) days
  cross join unnest(array['09:00','11:00','13:00','15:00']) t
  where extract(dow from d) <> 0 and not exists (
    select 1 from public.affiliation_requests r where r.appointment_date=d and r.appointment_time=t::time and r.status <> 'dibatalkan'
  ) order by 1,2
$$;

create function public.submit_affiliation(manager text, phone text, shop_address text, booking_date date, booking_time time, note text, token_hash text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare request_id uuid; today date := (now() at time zone 'Asia/Jakarta')::date;
begin
  if booking_date is null or booking_date < today+1 or booking_date > today+14 then
    raise exception 'Tanggal janji temu harus besok sampai 14 hari ke depan' using errcode='22023';
  end if;
  insert into public.affiliation_requests(manager_name,whatsapp,address,appointment_date,appointment_time,notes,cancellation_hash)
    values (btrim(manager),phone,btrim(shop_address),booking_date,booking_time,coalesce(note,''),token_hash) returning id into request_id;
  return request_id;
end $$;

create function public.affiliation_receipt(request_id uuid, token text)
returns table(id uuid, manager_name text, whatsapp text, address text, appointment_date date, appointment_time time, notes text, status text)
language sql stable security definer set search_path = '' as $$
  select r.id,r.manager_name,r.whatsapp,r.address,r.appointment_date,r.appointment_time,r.notes,r.status
  from public.affiliation_requests r where r.id=request_id
    and char_length(token)=64 and r.cancellation_hash=encode(sha256(convert_to(token,'UTF8')),'hex')
$$;

create function public.cancel_affiliation(request_id uuid, token text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare changed uuid;
begin
  update public.affiliation_requests set status='dibatalkan' where id=request_id and status='menunggu'
    and char_length(token)=64 and cancellation_hash=encode(sha256(convert_to(token,'UTF8')),'hex') returning id into changed;
  return changed is not null;
end $$;

-- Satu transaksi untuk menyimpan toko dan menautkan permohonannya.
create function public.save_admin_store(store_id uuid, details jsonb, request_id uuid default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare saved uuid := coalesce(store_id,gen_random_uuid()); owner uuid := nullif(details->>'owner_id','')::uuid;
begin
  if not private.is_admin() then raise exception 'Hanya admin' using errcode='42501'; end if;
  if owner is not null and not exists(select 1 from public.profiles where id=owner and role='toko') then
    raise exception 'Akun pemilik tidak tersedia' using errcode='22023';
  end if;
  if request_id is not null then
    perform 1 from public.affiliation_requests r where r.id=request_id and (r.store_id is null or r.store_id=saved) for update;
    if not found then raise exception 'Permohonan sudah ditautkan atau tidak ditemukan' using errcode='22023'; end if;
  end if;
  if store_id is null then
    insert into public.stores(id,name,slug,manager_name,owner_id,category_id,phone,address,delivery_info,latitude,longitude)
      values(saved,details->>'name',details->>'slug',details->>'manager_name',owner,(details->>'category_id')::uuid,details->>'phone',details->>'address',details->>'delivery_info',nullif(details->>'latitude','')::numeric,nullif(details->>'longitude','')::numeric);
  else
    update public.stores s set name=details->>'name',slug=details->>'slug',manager_name=details->>'manager_name',owner_id=owner,
      category_id=(details->>'category_id')::uuid,phone=details->>'phone',address=details->>'address',delivery_info=details->>'delivery_info',
      latitude=nullif(details->>'latitude','')::numeric,longitude=nullif(details->>'longitude','')::numeric where s.id=saved;
    if not found then raise exception 'Toko tidak ditemukan' using errcode='22023'; end if;
  end if;
  if request_id is not null then update public.affiliation_requests set store_id=saved where id=request_id; end if;
  return saved;
end $$;

revoke all on function public.available_affiliation_slots(),public.submit_affiliation(text,text,text,date,time,text,text),public.affiliation_receipt(uuid,text),public.cancel_affiliation(uuid,text),public.save_admin_store(uuid,jsonb,uuid) from public;
grant execute on function public.available_affiliation_slots(),public.submit_affiliation(text,text,text,date,time,text,text),public.affiliation_receipt(uuid,text),public.cancel_affiliation(uuid,text) to anon,authenticated;
grant execute on function public.save_admin_store(uuid,jsonb,uuid) to authenticated;
commit;
