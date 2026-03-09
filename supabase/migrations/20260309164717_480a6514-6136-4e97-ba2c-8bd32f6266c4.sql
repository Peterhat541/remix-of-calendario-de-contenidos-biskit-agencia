-- Fix share_links: drop restrictive, create permissive
DROP POLICY IF EXISTS "Authenticated users can manage share_links" ON public.share_links;
CREATE POLICY "Authenticated users can manage share_links"
ON public.share_links FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Fix documents: drop restrictive, create permissive
DROP POLICY IF EXISTS "Authenticated users can manage documents" ON public.documents;
CREATE POLICY "Authenticated users can manage documents"
ON public.documents FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);