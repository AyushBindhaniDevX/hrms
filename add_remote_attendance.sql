-- ==============================================================================
-- ADD REMOTE CLOCK-IN FIELDS TO ATTENDANCE
-- ==============================================================================

ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS is_remote BOOLEAN DEFAULT FALSE;

ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS remote_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_attendance_is_remote ON public.attendance(is_remote);
