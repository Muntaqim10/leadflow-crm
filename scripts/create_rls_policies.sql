-- Drop existing permissive policies
DROP POLICY IF EXISTS "Enable read access for all users on leads" ON leads;
DROP POLICY IF EXISTS "Enable insert for all users on leads" ON leads;
DROP POLICY IF EXISTS "Enable update for all users on leads" ON leads;
DROP POLICY IF EXISTS "Enable delete for all users on leads" ON leads;

DROP POLICY IF EXISTS "Enable read access for all users on email_templates" ON email_templates;
DROP POLICY IF EXISTS "Enable insert for all users on email_templates" ON email_templates;
DROP POLICY IF EXISTS "Enable update for all users on email_templates" ON email_templates;
DROP POLICY IF EXISTS "Enable delete for all users on email_templates" ON email_templates;

DROP POLICY IF EXISTS "Enable read access for all users on tasks" ON tasks;
DROP POLICY IF EXISTS "Enable insert for all users on tasks" ON tasks;
DROP POLICY IF EXISTS "Enable update for all users on tasks" ON tasks;
DROP POLICY IF EXISTS "Enable delete for all users on tasks" ON tasks;

-- Helper function to replicate the app's admin role logic
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
DECLARE
  jwt jsonb := auth.jwt();
  role text := lower(jwt -> 'user_metadata' ->> 'role');
  email text := lower(auth.email());
BEGIN
  RETURN 
    (jwt -> 'user_metadata' ->> 'permission_tier' = 'admin') OR
    (role LIKE '%admin%') OR
    (role LIKE '%general manager%') OR
    (role LIKE '%supervisor%') OR
    (role LIKE '%director%') OR
    (email IN ('muntaqim@leadflow.com', 'muntaquime@gmail.com'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- LEADS POLICIES
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for leads" ON leads FOR SELECT TO authenticated
USING (auth.uid()::text = assigned_sales_manager_id OR is_admin());

CREATE POLICY "Enable insert for leads" ON leads FOR INSERT TO authenticated
WITH CHECK (true); -- Anyone logged in can create a lead, but assigned_sales_manager_id is typically set

CREATE POLICY "Enable update for leads" ON leads FOR UPDATE TO authenticated
USING (auth.uid()::text = assigned_sales_manager_id OR is_admin());

CREATE POLICY "Enable delete for leads" ON leads FOR DELETE TO authenticated
USING (auth.uid()::text = assigned_sales_manager_id OR is_admin());

-- TASKS POLICIES
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for tasks" ON tasks FOR SELECT TO authenticated
USING (auth.uid()::text = assigned_to OR is_admin());

CREATE POLICY "Enable insert for tasks" ON tasks FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for tasks" ON tasks FOR UPDATE TO authenticated
USING (auth.uid()::text = assigned_to OR is_admin());

CREATE POLICY "Enable delete for tasks" ON tasks FOR DELETE TO authenticated
USING (auth.uid()::text = assigned_to OR is_admin());

-- EMAIL TEMPLATES POLICIES (Read-only for all authenticated, write for admins)
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for email_templates" ON email_templates FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Enable insert for email_templates" ON email_templates FOR INSERT TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Enable update for email_templates" ON email_templates FOR UPDATE TO authenticated
USING (is_admin());

CREATE POLICY "Enable delete for email_templates" ON email_templates FOR DELETE TO authenticated
USING (is_admin());
