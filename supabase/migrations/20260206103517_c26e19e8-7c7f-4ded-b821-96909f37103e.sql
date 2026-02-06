-- Drop existing check constraint
ALTER TABLE public.content_calendar_edits DROP CONSTRAINT content_calendar_edits_action_check;

-- Add new check constraint with calendar_edited included
ALTER TABLE public.content_calendar_edits ADD CONSTRAINT content_calendar_edits_action_check 
CHECK (action = ANY (ARRAY['created'::text, 'updated'::text, 'calendar_edited'::text, 'pdf_generated'::text, 'status_changed'::text, 'note_added'::text, 'feedback_received'::text, 'feedback_reviewed'::text, 'email_sent'::text, 'calendar_sent'::text, 'email_error'::text]));