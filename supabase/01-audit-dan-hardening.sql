-- AUDIT & PENGUATAN SUPABASE (jalankan di Supabase > SQL Editor)
-- PENTING: baca dulu. Bagian A hanya MELIHAT data. Bagian B mengubah izin; sesuaikan dengan hasil bagian A.
-- Skema di bawah diambil dari kode website: site_data(key, value, updated_at) dan
-- class_feedback(category, message, display_name, is_anonymous, status, created_at).
-- Struktur tabel admins dan fungsi public.is_admin() TIDAK terlihat dari kode website, jadi tidak diubah di sini.

-------------------------------------------------------------------------------
-- A. AUDIT (aman, hanya membaca)
-------------------------------------------------------------------------------
-- A1. RLS harus TRUE untuk ketiga tabel
select c.relname as tabel, c.relrowsecurity as rls_aktif
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('site_data', 'class_feedback', 'admins');

-- A2. Semua policy. CARI yang berbahaya: policy INSERT/UPDATE/DELETE/ALL pada site_data
--     yang untuk role anon/public, atau yang kondisinya hanya "true".
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies where schemaname = 'public'
order by tablename, cmd;

-- A3. Izin tabel untuk anon (pengunjung tanpa login). Idealnya:
--     site_data -> SELECT saja | class_feedback -> INSERT saja | admins -> tidak ada
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated')
  and table_name in ('site_data', 'class_feedback', 'admins')
order by table_name, grantee, privilege_type;

-- A4. Daftar akun yang terdaftar. Pastikan hanya akunmu sendiri.
select id, email, created_at, last_sign_in_at from auth.users order by created_at;

-------------------------------------------------------------------------------
-- B. PENGUATAN (tinjau dulu, lalu jalankan)
-- Catatan: policy di Postgres bersifat PERMISIF (digabung dengan OR). Kalau di hasil A2 ada
-- policy lama yang terlalu longgar, HAPUS dulu dengan: drop policy "nama policy" on public.<tabel>;
-- Bagian ini memakai public.is_admin() (dipanggil juga oleh website). Jika fungsi itu belum ada,
-- buat dulu sesuai struktur tabel admins milikmu, atau ganti kondisinya.
-------------------------------------------------------------------------------
alter table public.site_data      enable row level security;
alter table public.class_feedback enable row level security;

-- B1. site_data: semua orang boleh BACA (konten website publik), hanya admin boleh TULIS
revoke all on public.site_data from anon, authenticated;
grant select on public.site_data to anon, authenticated;
grant insert, update, delete on public.site_data to authenticated;

drop policy if exists "publik baca site_data" on public.site_data;
create policy "publik baca site_data" on public.site_data for select to anon, authenticated using (true);
drop policy if exists "admin tambah site_data" on public.site_data;
create policy "admin tambah site_data" on public.site_data for insert to authenticated with check (public.is_admin());
drop policy if exists "admin ubah site_data" on public.site_data;
create policy "admin ubah site_data" on public.site_data for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin hapus site_data" on public.site_data;
create policy "admin hapus site_data" on public.site_data for delete to authenticated using (public.is_admin());

-- B2. class_feedback: pengunjung hanya boleh KIRIM (dengan batas isi), admin yang boleh baca/ubah/hapus
revoke all on public.class_feedback from anon, authenticated;
grant insert on public.class_feedback to anon, authenticated;
grant select, update, delete on public.class_feedback to authenticated;

drop policy if exists "pengunjung kirim feedback" on public.class_feedback;
create policy "pengunjung kirim feedback" on public.class_feedback
  for insert to anon, authenticated
  with check (
    status = 'baru'
    and category in ('kritik', 'saran', 'apresiasi')
    and char_length(btrim(message)) between 10 and 800
    and (display_name is null or char_length(display_name) <= 60)
  );
drop policy if exists "admin baca feedback" on public.class_feedback;
create policy "admin baca feedback" on public.class_feedback for select to authenticated using (public.is_admin());
drop policy if exists "admin ubah feedback" on public.class_feedback;
create policy "admin ubah feedback" on public.class_feedback for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin hapus feedback" on public.class_feedback;
create policy "admin hapus feedback" on public.class_feedback for delete to authenticated using (public.is_admin());

-- B3. Tabel admins: jangan bisa dibaca/ditulis lewat API publik
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;
-- (tanpa policy = tidak ada yang bisa akses lewat API; pengecekan admin tetap bisa lewat fungsi is_admin()
--  asalkan fungsi itu dibuat dengan "security definer" dan "set search_path = public")
