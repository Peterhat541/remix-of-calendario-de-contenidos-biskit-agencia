
-- Drop existing permissive policies on calendar_contacts
DROP POLICY IF EXISTS "Authenticated users can delete calendar_contacts" ON public.calendar_contacts;
DROP POLICY IF EXISTS "Authenticated users can insert calendar_contacts" ON public.calendar_contacts;
DROP POLICY IF EXISTS "Authenticated users can update calendar_contacts" ON public.calendar_contacts;
DROP POLICY IF EXISTS "Authenticated users can view calendar_contacts" ON public.calendar_contacts;

-- Create role-based policies restricting to admin and manager only
CREATE POLICY "Admins and managers can view calendar_contacts"
ON public.calendar_contacts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can insert calendar_contacts"
ON public.calendar_contacts FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can update calendar_contacts"
ON public.calendar_contacts FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can delete calendar_contacts"
ON public.calendar_contacts FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
