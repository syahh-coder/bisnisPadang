begin;

-- Fondasi identitas untuk FK pemilik. Login dan akses tulis menyusul di langkah 4.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role text not null default 'toko' check (role in ('toko', 'admin')),
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order integer not null default 0
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  category_id uuid not null references public.categories(id),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  phone text not null default '',
  address text not null check (char_length(btrim(address)) between 1 and 1000),
  latitude numeric check (latitude between -90 and 90),
  longitude numeric check (longitude between -180 and 180),
  delivery_info text not null default '',
  photo_path text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  price numeric(14, 2) not null check (price >= 0),
  photo_path text,
  sort_order integer not null default 0
);

create index stores_category_created_idx on public.stores(category_id, created_at desc, id);
create index stores_created_idx on public.stores(created_at desc, id);
create index products_store_idx on public.products(store_id);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;

-- Jangan bergantung pada default privileges proyek Supabase.
revoke all on public.profiles, public.categories, public.stores, public.products from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.categories to anon, authenticated;
grant select (id, category_id, name, slug, phone, address, latitude, longitude, delivery_info, photo_path, created_at) on public.stores to anon, authenticated;
grant select on public.products to anon, authenticated;

create policy profiles_read_self on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy categories_public_read on public.categories for select to anon, authenticated using (true);
create policy stores_public_read on public.stores for select to anon, authenticated using (true);
create policy products_public_read on public.products for select to anon, authenticated using (true);

insert into public.categories (name, slug, sort_order) values
  ('Makanan', 'makanan', 1),
  ('Minuman', 'minuman', 2),
  ('Jasa', 'jasa', 3),
  ('Belanja', 'belanja', 4);

-- Parameter terikat, pencarian substring literal, satu toko sekali walau beberapa
-- produknya cocok. SECURITY INVOKER menjaga RLS dan privilege kolom tetap berlaku.
create function public.search_stores(search_text text default '', category_slug text default '')
returns table (
  id uuid, slug text, name text, address text, delivery_info text,
  photo_path text, category_name text, category_slug text
)
language sql stable security invoker
set search_path = ''
as $$
  select s.id, s.slug, s.name, s.address, s.delivery_info, s.photo_path,
         c.name as category_name, c.slug as category_slug
  from public.stores s
  join public.categories c on c.id = s.category_id
  where (coalesce(search_stores.category_slug, '') = '' or c.slug = search_stores.category_slug)
    and (
      coalesce(btrim(search_text), '') = ''
      or strpos(lower(s.name), lower(left(btrim(search_text), 120))) > 0
      or exists (
        select 1 from public.products p
        where p.store_id = s.id
          and strpos(lower(p.name), lower(left(btrim(search_text), 120))) > 0
      )
    )
  order by s.created_at desc, s.id;
$$;

revoke all on function public.search_stores(text, text) from public;
grant execute on function public.search_stores(text, text) to anon, authenticated;

commit;
