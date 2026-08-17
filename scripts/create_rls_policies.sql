-- RLS policies for leads, email_templates, and tasks

-- Enable RLS for leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on leads" ON leads FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users on leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users on leads" ON leads FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users on leads" ON leads FOR DELETE USING (true);

-- Enable RLS for email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on email_templates" ON email_templates FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users on email_templates" ON email_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users on email_templates" ON email_templates FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users on email_templates" ON email_templates FOR DELETE USING (true);

-- Enable RLS for tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users on tasks" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users on tasks" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users on tasks" ON tasks FOR DELETE USING (true);
