const { execSync } = require('child_process');
try {
  execSync('git checkout HEAD "app/(admin)/beranda.tsx"', {cwd: 'd:/KULIAH/OpenSource/LaundryKu/LaundryKu', stdio: 'inherit'});
  console.log("Restored");
} catch (e) {
  console.error(e);
}
