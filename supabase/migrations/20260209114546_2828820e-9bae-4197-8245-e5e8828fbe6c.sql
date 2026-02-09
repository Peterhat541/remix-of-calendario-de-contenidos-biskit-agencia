
-- Drop existing permissive policies on seguimiento_reports
DROP POLICY IF EXISTS "Authenticated users can delete seguimiento reports" ON public.seguimiento_reports;
DROP POLICY IF EXISTS "Authenticated users can insert seguimiento reports" ON public.seguimiento_reports;
DROP POLICY IF EXISTS "Authenticated users can update seguimiento reports" ON public.seguimiento_reports;
DROP POLICY IF EXISTS "Authenticated users can view seguimiento reports" ON public.seguimiento_reports;

-- Create role-based policies restricting to admin and manager only
CREATE POLICY "Admins and managers can view seguimiento_reports"
ON public.seguimiento_reports FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can insert seguimiento_reports"
ON public.seguimiento_reports FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can update seguimiento_reports"
ON public.seguimiento_reports FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can delete seguimiento_reports"
ON public.seguimiento_reports FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
