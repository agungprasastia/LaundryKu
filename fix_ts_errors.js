const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  for (const { from, to } of replacements) {
    const newContent = content.replace(from, to);
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

// 1. Fix app/index.tsx Reanimated issue
replaceInFile('app/index.tsx', [
  { from: /anim: import\("react-native"\)\.Animated\.Value/g, to: 'anim: import("react-native-reanimated").SharedValue<number>' }
]);

// 2. Fix AdminWalletModals form typing
replaceInFile('components/admin/AdminWalletModals.tsx', [
  { from: /withdrawForm: Record<string, unknown>/g, to: 'withdrawForm: Record<string, string>' },
  { from: /form: Record<string, unknown>/g, to: 'form: Record<string, string>' }
]);

// 3. Fix RegisterPayload in app/(auth)/register.tsx
replaceInFile('app/(auth)/register.tsx', [
  { from: /payload: import\("@\/types\/auth"\)\.RegisterPayload/g, to: 'payload: import("@/types/user").RegisterPayload' },
  { from: /payload: Record<string, unknown>/g, to: 'payload: import("@/types/user").RegisterPayload' }
]);

// 4. Fix WithdrawPayload in hooks/useAdminWallet.ts
replaceInFile('hooks/useAdminWallet.ts', [
  { from: /payload: Record<string, unknown>/g, to: 'payload: { amount?: number; bank_account_number?: string; bank_name?: string; e_wallet_number?: string; e_wallet_provider?: string; }' }
]);

// 5. Fix catch unknown error response issues
const fixErrorResponse = [
  { from: /error\.response/g, to: '(error as import("axios").AxiosError<{message: string}>).response' },
  { from: /error\?\.message/g, to: '(error as Error)?.message' },
  { from: /err\.response/g, to: '(err as import("axios").AxiosError<{message: string}>).response' },
  { from: /err\?\.message/g, to: '(err as Error)?.message' },
  { from: /e\.response/g, to: '(e as import("axios").AxiosError<{message: string}>).response' },
  { from: /e\?\.message/g, to: '(e as Error)?.message' },
];
replaceInFile('app/(auth)/login.tsx', fixErrorResponse);
replaceInFile('app/(auth)/register.tsx', fixErrorResponse);
replaceInFile('components/courier/roleComponents.tsx', fixErrorResponse);

// Fix app/(customer)/orders.tsx catch block specifically
replaceInFile('app/(customer)/orders.tsx', [
  { 
    from: `} catch (err: unknown) {\n      // Handle 409 response with existing payment_id\n      if ((err as any)?.response?.status === 409 && (err as any)?.response?.data?.data?.payment_id) {\n        setLastPaymentId((err as import("axios").AxiosError<{message: string}>).response.data.data.payment_id);\n      }\n      const msg = (err as any)?.response?.data?.message || (err as any)?.message || 'Gagal membuat payment';\n      crossAlert('Error', msg);\n    } finally {`, 
    to: `} catch (err: unknown) {\n      if ((err as import("axios").AxiosError<{data?: {payment_id: string}}>).response?.status === 409 && (err as import("axios").AxiosError<{data?: {payment_id: string}}>).response?.data?.data?.payment_id) {\n        setLastPaymentId((err as import("axios").AxiosError<{data: {payment_id: string}}>).response?.data.data.payment_id);\n      }\n      const msg = (err as import("axios").AxiosError<{message: string}>).response?.data?.message || (err as Error)?.message || 'Gagal membuat payment';\n      crossAlert('Error', msg);\n    } finally {` 
  }
]);


// 6. Fix Icon string typing
const fixIconString = [
  { from: /icon: string/g, to: 'icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap' },
  { from: /icon\?: string/g, to: 'icon?: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap' }
];
replaceInFile('app/(courier)/beranda.tsx', fixIconString);
replaceInFile('app/(courier)/tasks.tsx', fixIconString);
replaceInFile('components/courier/roleComponents.tsx', fixIconString);
replaceInFile('components/owner/ownerBerandaComponents.tsx', fixIconString);

// 8. Inject ThemeColors if totally missing in some files
function injectThemeColors(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  if (!content.includes('ThemeColors')) {
    content = "import { ThemeColors } from '@/constants/colors';\n" + content;
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Injected ThemeColors:', filePath);
  }
}
injectThemeColors('app/(owner)/orders.tsx');
injectThemeColors('components/ProfileModals.tsx');
injectThemeColors('components/ProtectedRoute.tsx');
injectThemeColors('components/courier/roleComponents.tsx');

console.log('\\n✅ TypeScript errors patched successfully!');
