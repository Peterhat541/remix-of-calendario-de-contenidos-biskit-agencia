
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can delete competencia_reports" ON public.competencia_reports;
DROP POLICY IF EXISTS "Authenticated users can insert competencia_reports" ON public.competencia_reports;
DROP POLICY IF EXISTS "Authenticated users can update competencia_reports" ON public.competencia_reports;
DROP POLICY IF EXISTS "Authenticated users can view competencia_reports" ON public.competencia_reports;

-- Create RBAC policies
CREATE POLICY "Admins and managers can view competencia_reports" ON public.competencia_reports FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Admins and managers can insert competencia_reports" ON public.competencia_reports FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Admins and managers can update competencia_reports" ON public.competencia_reports FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Admins and managers can delete competencia_reports" ON public.competencia_reports FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
