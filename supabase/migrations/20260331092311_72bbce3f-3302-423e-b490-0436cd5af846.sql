
-- Drop the old CHECK constraint
ALTER TABLE public.content_calendar_edits DROP CONSTRAINT IF EXISTS content_calendar_edits_action_check;

-- Add new CHECK constraint with all valid actions
ALTER TABLE public.content_calendar_edits ADD CONSTRAINT content_calendar_edits_action_check
CHECK (action IN (
  'created',
  'updated',
  'calendar_edited',
  'pdf_generated',
  'status_changed',
  'note_added',
  'feedback_received',
  'feedback_reviewed',
  'feedback_reviewed_approved',
  'approved_no_changes',
  'approval_notification_sent',
  'approval_notification_error',
  'email_sent',
  'calendar_sent',
  'email_error',
  'document_updated'
));
