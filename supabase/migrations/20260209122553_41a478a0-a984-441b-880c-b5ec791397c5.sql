
-- Drop the overly permissive public SELECT policies
DROP POLICY IF EXISTS "Public can validate share_links by slug" ON public.share_links;
DROP POLICY IF EXISTS "Public can validate share_links by token" ON public.share_links;

-- Create a SECURITY DEFINER function to validate a specific token or slug
-- This prevents enumeration of all share links
CREATE OR REPLACE FUNCTION public.validate_share_link(_identifier text)
RETURNS TABLE (
  id uuid,
  token text,
  document_id uuid,
  can_view boolean,
  can_propose boolean,
  expires_at timestamptz,
  slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sl.id, sl.token, sl.document_id, sl.can_view, sl.can_propose, sl.expires_at, sl.slug
  FROM public.share_links sl
  WHERE sl.can_view = true
    AND (sl.expires_at IS NULL OR sl.expires_at > now())
    AND (sl.token = _identifier OR sl.slug = _identifier)
  LIMIT 1;
$$;
