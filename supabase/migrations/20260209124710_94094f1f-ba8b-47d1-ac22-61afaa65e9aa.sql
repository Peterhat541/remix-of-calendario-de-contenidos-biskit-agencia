-- Allow RLS subquery access for valid share links (used by documents, proposals, content_calendars policies)
CREATE POLICY "Allow RLS subquery access for valid links"
ON public.share_links FOR SELECT
USING (
  can_view = true 
  AND (expires_at IS NULL OR expires_at > now())
);