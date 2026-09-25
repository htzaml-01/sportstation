-- ============================================================
-- JALANKAN SQL INI DI SUPABASE SQL EDITOR
-- Dashboard > SQL Editor > New Query > Paste > Run
-- ============================================================

-- 1. Hapus FK constraint yang mengaitkan profiles ke auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Ubah kolom id dari UUID ke TEXT supaya bisa terima ID dari website
ALTER TABLE public.profiles ALTER COLUMN id SET DATA TYPE TEXT USING id::TEXT;

-- 3. Matikan RLS di profiles agar anon key bisa insert/update
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 4. Lakukan hal yang sama untuk orders dan products
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- 5. Verifikasi
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public';
