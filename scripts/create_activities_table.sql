-- Create lead_activities table
CREATE TABLE IF NOT EXISTS lead_activities (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'status_change', 'email_generated', 'appointment_scheduled', 'appointment_cancelled', 'note_added'
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  performed_by TEXT
);

-- Enable RLS and add basic policies
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on lead_activities" ON lead_activities FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users on lead_activities" ON lead_activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users on lead_activities" ON lead_activities FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users on lead_activities" ON lead_activities FOR DELETE USING (true);
