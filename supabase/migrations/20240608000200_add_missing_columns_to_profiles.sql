ALTER TABLE public.profiles
  ADD COLUMN user_id UUID,
  ADD COLUMN website TEXT,
  ADD COLUMN role TEXT,
  ADD COLUMN institution TEXT; 