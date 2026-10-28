begin;

-- Bucket publik khusus foto toko/menu. Hak tulis pemilik ditambahkan bersama
-- autentikasi; tahap ini tidak mengizinkan unggahan anonim.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('store-media', 'store-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'])
on conflict (id) do nothing;

commit;
