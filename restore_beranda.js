const { execSync } = require('child_process');
try {
  execSync('git restore "app\\\\(admin)\\\\beranda.tsx"', { stdio: 'inherit' });
  console.log('Restored');
} catch (e) {
  console.error(e);
}
