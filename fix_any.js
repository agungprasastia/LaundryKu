const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const appDir = path.join(__dirname, 'app');
const files = walkSync(appDir);

let filesModified = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Fix createStyles
  if (content.includes('createStyles = (LaundryColors: any)')) {
    content = content.replace(/createStyles = \(LaundryColors: any\)/g, 'createStyles = (LaundryColors: ThemeColors)');
    
    // Add import if missing
    if (!content.includes('import { ThemeColors } from')) {
      // Find the last import
      const importRegex = /import\s+.*?from\s+['"].*?['"];?/g;
      let lastMatch;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        lastMatch = match;
      }
      
      if (lastMatch) {
        const insertPos = lastMatch.index + lastMatch[0].length;
        content = content.slice(0, insertPos) + "\nimport { ThemeColors } from '@/constants/colors';" + content.slice(insertPos);
      } else {
        content = "import { ThemeColors } from '@/constants/colors';\n" + content;
      }
    }
  }

  // Fix catch (e: any)
  if (content.includes('catch (e: any)')) {
    content = content.replace(/catch \(e: any\)/g, 'catch (e: unknown)');
  }
  if (content.includes('catch (error: any)')) {
    content = content.replace(/catch \(error: any\)/g, 'catch (error: unknown)');
  }
  if (content.includes('catch (err: any)')) {
    content = content.replace(/catch \(err: any\)/g, 'catch (err: unknown)');
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    filesModified++;
    console.log(`Updated ${file}`);
  }
}

console.log(`\nFinished! Modified ${filesModified} files.`);
