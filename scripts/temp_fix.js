const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'create_rls_policies.sql');
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace(/CREATE POLICY ("[^"]+") ON (\w+) FOR/g, (match, policyName, tableName) => {
    return `DROP POLICY IF EXISTS ${policyName} ON ${tableName};\n${match}`;
});

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Success');
