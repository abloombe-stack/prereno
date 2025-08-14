-- One-time cleanup of duplicate prices (run in Supabase SQL Editor)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY zip, category ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC) rn
  FROM public.prices
)
DELETE FROM public.prices p
USING ranked r
WHERE p.id = r.id AND r.rn > 1;