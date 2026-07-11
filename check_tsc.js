const { exec } = require('child_process');

console.log('Running TypeScript compilation check (tsc --noEmit)...');
exec('npx tsc --noEmit', (error, stdout, stderr) => {
  if (error) {
    console.log('\n❌ TypeScript Errors Found:\n');
    console.log(stdout || stderr);
  } else {
    console.log('\n✅ No TypeScript errors! Codebase is clean!');
  }
});
