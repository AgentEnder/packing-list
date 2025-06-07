#!/usr/bin/env node

const { existsSync, writeFileSync, readFileSync } = require('fs');
const { execa } = require('execa');

const quiet =
  process.argv.includes('--quiet') || process.env.NX_TASK_TARGET_PROJECT;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, force = false) {
  if (!quiet || force) {
    console.log(message);
  }
}

function colorLog(color, message, force = false) {
  if (!quiet || force) {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }
}

async function checkCommandExists(command) {
  try {
    await execa('command', ['-v', command], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function checkDockerRunning() {
  try {
    await execa('docker', ['info'], { stdio: 'ignore' });
    return { available: true, runtime: 'docker' };
  } catch {
    return { available: false, runtime: null };
  }
}

async function checkPodmanRunning() {
  try {
    await execa('podman', ['info'], { stdio: 'ignore' });
    return { available: true, runtime: 'podman' };
  } catch {
    return { available: false, runtime: null };
  }
}

async function checkContainerRuntime() {
  // Check for Docker first, then Podman
  const dockerCheck = await checkDockerRunning();
  if (dockerCheck.available) {
    return dockerCheck;
  }

  const podmanCheck = await checkPodmanRunning();
  if (podmanCheck.available) {
    return podmanCheck;
  }

  return { available: false, runtime: null };
}

async function waitForSupabaseServices() {
  const maxAttempts = 12; // 12 * 5 seconds = 60 seconds total
  let attempts = 0;

  log('⏳ Waiting for Supabase services to be ready...', true);
  log('');

  while (attempts < maxAttempts) {
    try {
      const result = await runCommand('supabase', ['status'], {
        cwd: 'packages/supabase',
        preferLocal: true,
      });

      if (result.stdout?.includes('API URL:')) {
        colorLog('green', '✅ Supabase services are running');
        return true;
      }
    } catch (_e) {
      void _e; // Explicitly acknowledge unused variable
      // Ignore errors - container might not exist
    }

    attempts++;
    if (attempts === maxAttempts) {
      colorLog('red', '❌ Timed out waiting for Supabase services');
      return false;
    }

    log(`Still waiting... (${maxAttempts - attempts} attempts remaining)`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  return false;
}

async function getSupabaseAnonKey() {
  try {
    const result = await runCommand('supabase', ['status'], {
      cwd: 'packages/supabase',
      preferLocal: true,
    });

    if (result.stdout) {
      const match = result.stdout.match(/anon key:\s*(.+)/);
      return match ? match[1].trim() : null;
    }
  } catch (_e) {
    void _e; // Explicitly acknowledge unused variable
    // Could not get status - error already logged by runCommand
  }

  return null;
}

// Helper function to run commands with proper error handling
async function runCommand(command, args, options = {}) {
  const execOptions = {
    ...options,
    stdio: quiet ? 'pipe' : 'inherit',
  };

  try {
    const result = await execa(command, args, execOptions);
    return result;
  } catch (error) {
    // In quiet mode, show the error output so we can debug
    if (quiet && error.stderr) {
      colorLog('red', '❌ Command failed with error output:', true);
      console.error(error.stderr);
    }
    if (quiet && error.stdout && !error.stderr) {
      colorLog('red', '❌ Command failed with output:', true);
      console.error(error.stdout);
    }
    if (quiet && error.message && !error.stderr && !error.stdout) {
      colorLog('red', '❌ Command failed:', true);
      console.error(error.message);
    }
    throw error;
  }
}

async function main() {
  log('🚀 Setting up Supabase for local development...', true);
  log('', true);

  // Check if Docker or Podman is available and running
  const dockerAvailable = await checkCommandExists('docker');
  const podmanAvailable = await checkCommandExists('podman');

  if (!dockerAvailable && !podmanAvailable) {
    colorLog('red', '❌ No container runtime is installed!');
    log('Please install Docker Desktop or Podman and try again.', true);
    process.exit(1);
  }

  // Determine which runtime is available
  const containerRuntime = await checkContainerRuntime();
  if (!containerRuntime.available) {
    if (dockerAvailable && podmanAvailable) {
      colorLog('red', '❌ Neither Docker nor Podman is running!');
      log('Please start Docker Desktop or Podman and try again.');
    } else if (dockerAvailable) {
      colorLog('red', '❌ Docker is not running!');
      log('Please start Docker Desktop and try again.');
    } else {
      colorLog('red', '❌ Podman is not running!');
      log('Please start Podman and try again.');
    }
    process.exit(1);
  }

  const runtimeName =
    containerRuntime.runtime === 'docker' ? 'Docker' : 'Podman';
  colorLog('green', `✅ ${runtimeName} CLI found`);
  colorLog('green', `✅ ${runtimeName} is running`);

  // Check if Supabase is available locally
  try {
    await runCommand('supabase', ['--version'], {
      preferLocal: true,
    });
    colorLog('green', '✅ Supabase CLI available locally');
  } catch {
    colorLog('red', '❌ Supabase CLI not found locally');
    log(
      'This should be installed automatically. Try running: pnpm install',
      true
    );
    process.exit(1);
  }

  // Check if Supabase config exists
  if (!existsSync('packages/supabase/config.toml')) {
    colorLog('yellow', '⚠️  Supabase not initialized, running init...');
    try {
      await runCommand('supabase', ['init'], {
        cwd: 'packages/supabase',
        preferLocal: true,
      });
    } catch (_e) {
      void _e; // Explicitly acknowledge unused variable
      colorLog('red', '❌ Failed to initialize Supabase');
      process.exit(1);
    }
  } else {
    colorLog('green', '✅ Supabase already initialized');
  }

  // Start Supabase services
  log('🔄 Starting Supabase services...', true);
  try {
    await runCommand('supabase', ['start'], {
      cwd: 'packages/supabase',
      preferLocal: true,
    });
  } catch (_error) {
    void _error; // Explicitly acknowledge unused variable
    // Migration might already exist
    colorLog('red', '❌ Failed to start Supabase services');
    log('');
    log('Try running the following commands manually:');
    log('  cd packages/supabase');
    log('  npx supabase start');
    process.exit(1);
  }

  // Wait for services to be ready
  const servicesReady = await waitForSupabaseServices();
  if (!servicesReady) {
    process.exit(1);
  }

  // Display connection info
  log('');
  log('🔗 Supabase Local Development URLs:');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    await runCommand('supabase', ['status'], {
      cwd: 'packages/supabase',
      preferLocal: true,
    });
  } catch {
    colorLog('yellow', '⚠️  Could not display status');
  }

  // Display seed data info
  log('');
  log('🌱 Seed Data Information:');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('Test users have been created for e2e testing:');
  log('  📧 e2e-test@example.com (password: testpassword123)');
  log('  👑 e2e-admin@example.com (password: adminpassword123)');
  log('  🌐 e2e-google@example.com (Google OAuth user)');

  // Check and update .env.e2e
  if (existsSync('.env.e2e')) {
    colorLog('green', '✅ .env.e2e file found');
    // Check if environment variables are set correctly
    const envContent = readFileSync('.env.e2e', 'utf8');
    if (envContent.includes('http://localhost:54321')) {
      colorLog('green', '✅ Environment variables configured correctly');
    } else {
      colorLog('yellow', '⚠️  Environment variables may need updating');
    }
  } else {
    colorLog('yellow', '⚠️  .env.e2e file not found, creating one...');

    // Get the anon key from Supabase status
    const anonKey = await getSupabaseAnonKey();

    if (!anonKey) {
      colorLog('red', '❌ Could not retrieve anon key from Supabase');
      process.exit(1);
    }

    const envContent = `# Pull these from supabase
PUBLIC_ENV__SUPABASE_URL=http://localhost:54321
PUBLIC_ENV__SUPABASE_ANON_KEY=${anonKey}
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=dummy

# Path from origin to index (e.g. for craigory.dev/packing-list, its /packing-list)
PUBLIC_ENV__BASE_URL=/

# Full url that the app is expected to be hosted at
PUBLIC_ENV__LOCATION=http://localhost:3000
`;

    writeFileSync('.env.e2e', envContent);
    colorLog('green', '✅ Created .env.e2e file');
  }

  log('');
  log('🧪 E2E Testing Setup:');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('To run e2e tests with authentication:');
  log('  pnpm nx e2e frontend-e2e');
  log('');
  log('To run specific auth tests:');
  log('  pnpm nx e2e frontend-e2e --grep "Authentication Flows"');

  log('');
  log('📚 Useful Commands:');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('  pnpm supabase:status       - Check service status');
  log('  pnpm supabase:stop         - Stop all services');
  log(
    '  pnpm supabase:cleanup      - Clean up containers/networks (fixes startup issues)'
  );
  log('  pnpm supabase:reset        - Reset database with fresh seed data');
  log('  pnpm supabase:studio       - Open Studio in browser');
  log('  pnpm supabase:logs         - View service logs');

  log('');
  colorLog('green', '🎉 Local Supabase setup complete!');
  log('You can now run your application and e2e tests with local Supabase.');
}

// Handle errors gracefully
main().catch((error) => {
  log('');
  colorLog('red', '❌ Setup failed with error:');
  if (!quiet) {
    console.error(error);
  }
  process.exit(1);
});
