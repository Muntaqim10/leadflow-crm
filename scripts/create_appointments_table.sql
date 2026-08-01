-- Copy and paste this into your Supabase SQL Editor and hit Run

CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
  agent_id TEXT REFERENCES users(id) ON DELETE SET NULL, -- optional, if agents are in users table
  type TEXT NOT NULL, -- e.g., 'Site Tour', 'Phone Call', 'Zoom Meeting'
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL, -- e.g., '14:30' or '02:30 PM'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing read/write for now to match the leads table pattern)
CREATE POLICY "Enable read access for all users on appointments" ON appointments FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users on appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users on appointments" ON appointments FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users on appointments" ON appointments FOR DELETE USING (true);
