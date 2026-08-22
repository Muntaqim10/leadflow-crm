import re

with open(r'c:\Users\monst\.gemini\antigravity\scratch\Sales app\scripts\create_rls_policies.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all CREATE POLICY lines and insert DROP POLICY IF EXISTS before them
def replace_func(match):
    policy_name = match.group(1)
    table_name = match.group(2)
    return f'DROP POLICY IF EXISTS {policy_name} ON {table_name};\n{match.group(0)}'

new_content = re.sub(r'CREATE POLICY (\"\w[^\"]+\") ON (\w+) FOR', replace_func, content)

with open(r'c:\Users\monst\.gemini\antigravity\scratch\Sales app\scripts\create_rls_policies.sql', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Success")
