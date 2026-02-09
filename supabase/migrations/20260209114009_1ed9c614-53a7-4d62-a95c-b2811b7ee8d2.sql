
-- Change default agencies from likearocket to biskit
ALTER TABLE public.content_calendars ALTER COLUMN agencies SET DEFAULT ARRAY['biskit'::text];

-- Update any existing records still referencing likearocket
UPDATE public.content_calendars 
SET agencies = array_replace(agencies, 'likearocket', 'biskit')
WHERE 'likearocket' = ANY(agencies);
