#!/usr/bin/env node

const { existsSync, readFileSync } = require('fs');
const { execa } = require('execa');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
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

async function main() {
  console.log('🔍 Validating Supabase local setup...');
  console.log('');

  let errors = 0;
  let warnings = 0;

  // Check configuration files
  console.log('📁 Checking configuration files...');

  if (existsSync('packages/supabase/config.toml')) {
    colorLog('green', '✅ config.toml found');
  } else {
    colorLog('red', '❌ config.toml missing');
    errors++;
  }

  if (existsSync('packages/supabase/seed.sql')) {
    colorLog('green', '✅ seed.sql found');
  } else {
    colorLog('red', '❌ seed.sql missing');
    errors++;
  }

  if (existsSync('.env.e2e')) {
    colorLog('green', '✅ .env.e2e found');
  } else {
    colorLog('yellow', '⚠️  .env.e2e missing (will be created on first run)');
    warnings++;
  }

  // Check e2e test files
  console.log('');
  console.log('🧪 Checking e2e test files...');

  if (existsSync('e2e/frontend-e2e/src/auth-utils.ts')) {
    colorLog('green', '✅ auth-utils.ts found');
  } else {
    colorLog('red', '❌ auth-utils.ts missing');
    errors++;
  }

  if (existsSync('e2e/frontend-e2e/src/auth-flows.spec.ts')) {
    colorLog('green', '✅ auth-flows.spec.ts found');
  } else {
    colorLog('red', '❌ auth-flows.spec.ts missing');
    errors++;
  }

  // Check dependencies
  console.log('');
  console.log('🔧 Checking dependencies...');

  // Check for local Supabase CLI in node_modules
  if (existsSync('node_modules/.bin/supabase')) {
    colorLog('green', '✅ Supabase CLI available locally');

    // Try to get version using execa
    try {
      const result = await execa('supabase', ['--version'], {
        preferLocal: true,
        stdio: 'pipe',
      });
      if (result.stdout) {
        console.log(`   Version: ${result.stdout.trim()}`);
      }
    } catch {
      colorLog('yellow', '⚠️  Could not get Supabase CLI version');
      warnings++;
    }
  } else {
    colorLog('yellow', '⚠️  Supabase CLI not found locally');
    console.log('   This should be installed automatically via pnpm install');
    warnings++;
  }

  // Check for container runtime (Docker or Podman)
  const dockerAvailable = await checkCommandExists('docker');
  const podmanAvailable = await checkCommandExists('podman');

  if (dockerAvailable || podmanAvailable) {
    // Check which runtime is available and running
    const containerRuntime = await checkContainerRuntime();

    if (containerRuntime.available) {
      const runtimeName =
        containerRuntime.runtime === 'docker' ? 'Docker' : 'Podman';
      colorLog('green', `✅ ${runtimeName} CLI available`);
      colorLog('green', `✅ ${runtimeName} daemon running`);
    } else {
      if (dockerAvailable && podmanAvailable) {
        colorLog(
          'yellow',
          '⚠️  Both Docker and Podman are installed but neither daemon is running'
        );
        console.log('   Please start Docker Desktop or Podman');
      } else if (dockerAvailable) {
        colorLog('yellow', '⚠️  Docker daemon not running');
        console.log('   Please start Docker Desktop');
      } else {
        colorLog('yellow', '⚠️  Podman daemon not running');
        console.log('   Please start Podman');
      }
      warnings++;
    }
  } else {
    colorLog('red', '❌ No container runtime installed');
    console.log('   Please install Docker Desktop or Podman');
    errors++;
  }

  // Check execa dependency
  try {
    require.resolve('execa');
    colorLog('green', '✅ execa dependency available');
  } catch {
    colorLog('red', '❌ execa dependency missing');
    console.log('   Run: pnpm install');
    errors++;
  }

  // Check Supabase services if CLI is available
  if (existsSync('node_modules/.bin/supabase')) {
    console.log('');
    console.log('🚀 Checking Supabase services...');

    try {
      const result = await execa('supabase', ['status'], {
        cwd: 'packages/supabase',
        preferLocal: true,
        stdio: 'pipe',
      });

      if (
        result.stdout?.includes('Status:') &&
        result.stdout?.includes('running')
      ) {
        colorLog('green', '✅ Supabase services running');

        // Check if test users exist
        console.log('👥 Checking test users...');
        try {
          const usersResult = await execa(
            'supabase',
            [
              'db',
              'execute',
              '--sql',
              "SELECT email FROM auth.users WHERE email LIKE 'e2e-%@%'",
            ],
            {
              cwd: 'packages/supabase',
              preferLocal: true,
              stdio: 'pipe',
            }
          );

          if (usersResult.stdout?.includes('e2e-')) {
            colorLog('green', '✅ Test users found in database');
          } else {
            colorLog(
              'yellow',
              "⚠️  Test users not found (run 'pnpm supabase:reset' to seed)"
            );
            warnings++;
          }
        } catch {
          colorLog('yellow', '⚠️  Could not check test users');
          warnings++;
        }
      } else {
        colorLog('yellow', '⚠️  Supabase services not running');
        console.log('   Run: pnpm setup:supabase to start');
        warnings++;
      }
    } catch {
      colorLog('yellow', '⚠️  Could not check Supabase status');
      warnings++;
    }
  }

  // Check project configuration
  console.log('');
  console.log('📋 Checking project configuration...');

  if (existsSync('nx.json')) {
    colorLog('green', '✅ Nx workspace configured');
  } else {
    colorLog('red', '❌ nx.json missing');
    errors++;
  }

  if (existsSync('packages/auth/package.json')) {
    colorLog('green', '✅ Auth package found');
  } else {
    colorLog('red', '❌ Auth package missing');
    errors++;
  }

  // Check package.json scripts
  if (existsSync('package.json')) {
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      const scripts = packageJson.scripts || {};

      const expectedScripts = [
        'setup:supabase',
        'validate:setup',
        'supabase:status',
        'supabase:stop',
        'supabase:reset',
        'supabase:studio',
        'supabase:logs',
      ];

      const missingScripts = expectedScripts.filter(
        (script) => !scripts[script]
      );

      if (missingScripts.length === 0) {
        colorLog('green', '✅ Package.json scripts configured');
      } else {
        colorLog(
          'yellow',
          `⚠️  Missing package.json scripts: ${missingScripts.join(', ')}`
        );
        warnings++;
      }
    } catch {
      colorLog('red', '❌ Could not parse package.json');
      errors++;
    }
  }

  // Validate auth utilities
  console.log('');
  console.log('🔐 Validating auth utilities...');

  if (existsSync('e2e/frontend-e2e/src/auth-utils.ts')) {
    try {
      const authUtilsContent = readFileSync(
        'e2e/frontend-e2e/src/auth-utils.ts',
        'utf8'
      );

      if (authUtilsContent.includes('E2E_TEST_USERS')) {
        colorLog('green', '✅ E2E test users defined');
      } else {
        colorLog('red', '❌ E2E test users not properly defined');
        errors++;
      }

      if (authUtilsContent.includes('signInWithEmail')) {
        colorLog('green', '✅ Auth utility functions available');
      } else {
        colorLog('red', '❌ Auth utility functions missing');
        errors++;
      }
    } catch {
      colorLog('red', '❌ Could not read auth-utils.ts');
      errors++;
    }
  }

  // Summary
  console.log('');
  console.log('📊 Validation Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (errors === 0) {
    colorLog('green', '🎉 All checks passed! Your setup looks good.');

    if (warnings > 0) {
      console.log('');
      colorLog(
        'yellow',
        `⚠️  ${warnings} warning(s) found, but these are non-critical.`
      );
    }

    console.log('');
    console.log('Next steps:');
    console.log("1. Run 'pnpm setup:supabase' if services aren't running");
    console.log("2. Start your app: 'pnpm nx serve frontend'");
    console.log("3. Run e2e tests: 'pnpm nx e2e frontend-e2e'");
  } else {
    colorLog(
      'red',
      `❌ Found ${errors} error(s). Please fix the issues above.`
    );

    if (warnings > 0) {
      colorLog('yellow', `⚠️  Also found ${warnings} warning(s).`);
    }

    console.log('');
    console.log('Common fixes:');
    console.log("- Run 'pnpm install' to install missing dependencies");
    console.log('- Ensure Docker Desktop is installed and running');
    console.log(
      '- Check that all required files exist in the correct locations'
    );

    process.exit(1);
  }
}

// Handle errors gracefully
main().catch((error) => {
  console.error('');
  colorLog('red', '❌ Validation failed with error:');
  console.error(error);
  process.exit(1);
});
