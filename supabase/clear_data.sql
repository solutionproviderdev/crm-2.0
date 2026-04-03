-- =================================================================================
-- CLEAR SCRIPT FOR DEV / ADMIN USE
-- =================================================================================
-- This script safely deletes all leads. 
-- Because we have set up ON DELETE CASCADE on the foreign constraints below:
-- public.calls (lead_id)
-- public.meetings (lead_id)
-- public.meeting_analyses (via meeting_id which cascades when meeting is deleted)
-- public.lead_comments (lead_id)
-- public.lead_follow_ups (lead_id)
--
-- Deleting from public.leads will automatically wipe all associated 
-- calls, meetings, comments, analysis, and follow-ups.

DELETE FROM public.leads;

-- Reset sequence/ID counters if applicable (not needed for UUIDs, just visual clarity)
-- Note: As IDs are UUIDs, this simply drops the entire data set cleanly.
