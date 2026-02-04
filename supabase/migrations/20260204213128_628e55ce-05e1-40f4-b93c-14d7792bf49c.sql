-- Add slug column for friendly URLs
ALTER TABLE share_links 
ADD COLUMN slug TEXT UNIQUE;

-- Add RLS policy for slug-based access
CREATE POLICY "Anyone can view valid share_links by slug"
ON share_links
FOR SELECT
USING (slug IS NOT NULL AND can_view = true AND (expires_at IS NULL OR expires_at > now()));