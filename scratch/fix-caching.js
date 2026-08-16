const fs = require('fs');
const routes = ['leads', 'templates', 'tasks', 'appointments'];
routes.forEach(r => {
  const path = 'src/app/api/' + r + '/route.ts';
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    if (!content.includes('export const dynamic')) {
      content = "export const dynamic = 'force-dynamic';\nexport const revalidate = 0;\n" + content;
      fs.writeFileSync(path, content);
      console.log('Fixed ' + path);
    }
  }
});
