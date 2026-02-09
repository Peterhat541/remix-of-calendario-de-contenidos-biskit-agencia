
-- Drop the existing permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.user_activity_logs;

-- Create a stricter INSERT policy that validates user_id matches auth.uid()
CREATE POLICY "Users can only insert own logs"
ON public.user_activity_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
