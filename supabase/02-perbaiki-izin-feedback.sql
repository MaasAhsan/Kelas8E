-- Perbaikan izin Kritik & Saran di admin panel (tabel public.class_feedback)
-- Jalankan di Supabase > SQL Editor. Bagian 1 dan 2 hanya melihat data, aman dijalankan.

-- 1. Policy yang sudah ada (lihat apakah ada cmd = UPDATE dan DELETE)
select policyname, cmd, roles, qual, with_check
from pg_policies where schemaname = 'public' and tablename = 'class_feedback';

-- 2. Izin tabel untuk role login (harus ada UPDATE dan DELETE untuk 'authenticated')
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'class_feedback'
  and grantee in ('anon', 'authenticated');

-- 3. Perbaikan. Memakai fungsi public.is_admin() yang juga dipanggil oleh website.
--    Jika muncul error "function public.is_admin() does not exist", ganti kedua kondisi
--    is_admin() di bawah dengan kondisi yang SAMA seperti policy SELECT milikmu (lihat hasil bagian 1),
--    misalnya: exists (select 1 from public.admins where <kolom_uuid> = auth.uid())
grant update, delete on public.class_feedback to authenticated;

drop policy if exists "admin update feedback" on public.class_feedback;
create policy "admin update feedback" on public.class_feedback
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin delete feedback" on public.class_feedback;
create policy "admin delete feedback" on public.class_feedback
  for delete to authenticated
  using (public.is_admin());
