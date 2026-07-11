const fs = require('fs');
const path = require('path');

const srcDirs = ['app', 'components', 'hooks', 'utils', 'services', 'types'];
const extensions = ['.ts', '.tsx'];

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      getAllFiles(path.join(dir, file), fileList);
    } else if (extensions.includes(path.extname(file))) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

let modifiedFiles = 0;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // 1. (LaundryColors: any) =>
  content = content.replace(/\(LaundryColors:\s*any\)/g, '(LaundryColors: ThemeColors)');
  
  // 2. catch (e: any)
  content = content.replace(/catch\s*\(\s*([a-zA-Z0-9_]+)\s*:\s*any\s*\)/g, 'catch ($1: unknown)');

  // 3. fontWeight: '...' as any
  content = content.replace(/fontWeight:\s*(['"][0-9a-zA-Z]+['"])\s*as\s*any/g, 'fontWeight: $1');
  
  // 4. Icon names
  content = content.replace(/<Ionicons\s+name=\{([^\}]+)\s+as\s+any\}/g, '<Ionicons name={$1 as React.ComponentProps<typeof Ionicons>["name"]}');
  content = content.replace(/<MaterialCommunityIcons\s+name=\{([^\}]+)\s+as\s+any\}/g, '<MaterialCommunityIcons name={$1 as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}');

  // 5. icon: any
  content = content.replace(/icon(\?)?:\s*any/g, 'icon$1: string');

  // 6. Generic payload: any
  content = content.replace(/payload:\s*any/g, 'payload: Record<string, unknown>');
  content = content.replace(/withdrawForm:\s*any/g, 'withdrawForm: Record<string, unknown>');
  content = content.replace(/form:\s*any/g, 'form: Record<string, unknown>');

  // 7. Event handlers (e: any)
  content = content.replace(/\(e:\s*any\)/g, '(e: import("react-native").GestureResponderEvent)');
  
  // 8. width/height as any
  content = content.replace(/width\s+as\s+any/g, 'width as number');
  content = content.replace(/height\s+as\s+any/g, 'height as number');
  
  // 9. float(anim: any, dur: number)
  content = content.replace(/anim:\s*any/g, 'anim: import("react-native").Animated.Value');

  // 10. getErrorMessage(error: any)
  content = content.replace(/error:\s*any/g, 'error: unknown');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
    modifiedFiles++;
  }
}

srcDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  const files = getAllFiles(fullPath);
  files.forEach(processFile);
});

console.log(`\n✅ Done! Modified ${modifiedFiles} files.`);
