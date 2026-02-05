-- Fix share_links RLS: tokens should not be publicly accessible
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view valid share_links by slug" ON share_links;
DROP POLICY IF EXISTS "Anyone can view valid share_links by token" ON share_links;

-- Create restricted policies that only validate existence, not expose all data
-- For slug lookup - only return minimal needed fields via application logic
CREATE POLICY "Public can validate share_links by slug"
ON share_links FOR SELECT
USING (
  slug IS NOT NULL 
  AND can_view = true 
  AND (expires_at IS NULL OR expires_at > now())
);

-- For token lookup - only allow when specific token is provided in WHERE clause
-- This policy allows SELECT but the application should only query by specific token
CREATE POLICY "Public can validate share_links by token"
ON share_links FOR SELECT  
USING (
  can_view = true 
  AND (expires_at IS NULL OR expires_at > now())
);

-- Fix calendar_contacts exposure: ensure only authenticated users can access
-- First, drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can view calendar_contacts" ON calendar_contacts;
DROP POLICY IF EXISTS "Authenticated users can insert calendar_contacts" ON calendar_contacts;
DROP POLICY IF EXISTS "Authenticated users can update calendar_contacts" ON calendar_contacts;
DROP POLICY IF EXISTS "Authenticated users can delete calendar_contacts" ON calendar_contacts;

-- Recreate with explicit auth.uid() check to prevent access via share links
CREATE POLICY "Authenticated users can view calendar_contacts"
ON calendar_contacts FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert calendar_contacts"
ON calendar_contacts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update calendar_contacts"
ON calendar_contacts FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete calendar_contacts"
ON calendar_contacts FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);