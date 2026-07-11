const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  for (const { from, to } of replacements) {
    let newContent = content;
    if (from instanceof RegExp) {
      newContent = content.replace(from, to);
    } else {
      const lfContent = content.replace(/\r\n/g, '\n');
      const lfFrom = from.replace(/\r\n/g, '\n');
      const lfTo = to.replace(/\r\n/g, '\n');
      
      if (lfContent.includes(lfFrom)) {
        let replacedLf = lfContent.split(lfFrom).join(lfTo);
        if (content.includes('\r\n')) {
          newContent = replacedLf.replace(/\n/g, '\r\n');
        } else {
          newContent = replacedLf;
        }
      }
    }
    
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Fixed:', filePath);
  }
}

function injectThemeColors(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  // Check if ThemeColors is imported
  if (!content.includes('ThemeColors') || (!content.includes("import { ThemeColors }") && !content.includes("import {ThemeColors}"))) {
    // Inject at top
    if (content.includes('\r\n')) {
      content = "import { ThemeColors } from '@/constants/colors';\r\n" + content;
    } else {
      content = "import { ThemeColors } from '@/constants/colors';\n" + content;
    }
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Injected ThemeColors:', filePath);
  }
}

injectThemeColors('components/customer/StatusTimeline.tsx');
injectThemeColors('components/owner/roleComponents.tsx');
injectThemeColors('components/TrackingMap.tsx');
injectThemeColors('utils/AlertProvider.tsx');

// 2. Fix components/owner/roleComponents.tsx specific errors (just in case)
replaceInFile('components/owner/roleComponents.tsx', [
  {
    from: `export const getErrorMessage = (error: unknown, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;`,
    to: `export const getErrorMessage = (error: unknown, fallback: string) =>
  (error as import('axios').AxiosError<{message: string}>)?.response?.data?.message || (error as Error)?.message || fallback;`
  },
  {
    from: `export function EmptyState({
  title,
  message,
  icon = "file-tray-outline",
}: {
  title: string;
  message?: string;
  icon?: string;
}) {`,
    to: `export function EmptyState({
  title,
  message,
  icon = "file-tray-outline",
}: {
  title: string;
  message?: string;
  icon?: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
}) {`
  }
]);

console.log('\n✅ Patches for tsc errors applied successfully!');
