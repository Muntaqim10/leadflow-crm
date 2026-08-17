const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src/app/api', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    let needsCrypto = false;

    // Pattern to match:
    // } catch (error: any) {
    //   console.error('...', error);
    //   return NextResponse.json({ error: 'An unexpected server error occurred.' }, { status: 500 });
    // }
    
    const regex = /\} catch \(([^)]+)\) \{\s*console\.error\('([^']+)', ([^)]+)\);\s*return NextResponse\.json\(\{ error: 'An unexpected server error occurred\.' \}, \{ status: 500 \}\);\s*\}/g;

    let newContent = content.replace(regex, (match, errVar, logMsg, errVar2) => {
      needsCrypto = true;
      return `} catch (${errVar}) {
    const correlationId = crypto.randomUUID();
    console.error(\`[Error \${correlationId}] ${logMsg}:\`, ${errVar2});
    return NextResponse.json({ error: 'An unexpected server error occurred.', correlationId }, { status: 500 });
  }`;
    });

    if (needsCrypto && !newContent.includes("import crypto from 'crypto';") && !newContent.includes("import * as crypto")) {
      const importRegex = /(import .*;\n)/g;
      let lastIndex = 0;
      let match;
      while ((match = importRegex.exec(newContent)) !== null) {
        lastIndex = match.index + match[0].length;
      }
      
      if (lastIndex > 0) {
        newContent = newContent.slice(0, lastIndex) + "import crypto from 'crypto';\n" + newContent.slice(lastIndex);
      } else {
        newContent = "import crypto from 'crypto';\n" + newContent;
      }
    }

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
