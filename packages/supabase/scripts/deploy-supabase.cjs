const { execSync } = require('child_process');
const { join } = require('path');

const projectRoot = join(__dirname, '..');

execSync(`supabase link --project-ref ${process.env.SUPABASE_PROJECT_REF}`, {
  stdio: 'inherit',
  cwd: projectRoot,
});

execSync('supabase db push', {
  stdio: 'inherit',
  cwd: projectRoot,
});
