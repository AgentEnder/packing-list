#!/usr/bin/env node

const { execa } = require('execa');

const quiet = process.argv.includes('--quiet');

process.env.SUPABASE_WORKDIR = join(__dirname, '../');

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
    await execa('command', ['-v', command], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function cleanupSupabase() {
  log('🧹 Cleaning up Supabase local development environment...', true);
  log('');

  try {
    // Step 1: Stop Supabase services
    colorLog('blue', '1️⃣ Stopping Supabase services...');
    try {
      await execa('supabase', ['stop'], {
        preferLocal: true,
        stdio: quiet ? 'pipe' : 'inherit',
      });
      colorLog('green', '✅ Supabase services stopped');
    } catch (error) {
      colorLog('yellow', '⚠️  Supabase services may already be stopped');
      if (!quiet) {
        console.log(error);
      }
    }

    // Step 2: Determine container runtime
    const dockerAvailable = await checkCommandExists('docker');
    const podmanAvailable = await checkCommandExists('podman');

    let containerRuntime = null;
    if (dockerAvailable) {
      containerRuntime = 'docker';
    } else if (podmanAvailable) {
      containerRuntime = 'podman';
    }

    if (!containerRuntime) {
      colorLog('yellow', '⚠️  No container runtime found (Docker or Podman)');
      colorLog('green', '✅ Cleanup completed (containers not managed)');
      return;
    }

    colorLog('blue', `2️⃣ Cleaning up ${containerRuntime} containers...`);

    // Step 3: Clean up containers
    try {
      const result = await execa(
        containerRuntime,
        ['container', 'prune', '-f'],
        {
          stdio: 'pipe',
        }
      );

      if (result.stdout.trim()) {
        colorLog('green', `✅ Cleaned up containers: ${result.stdout.trim()}`);
      } else {
        colorLog('green', '✅ No containers to clean up');
      }
    } catch (error) {
      colorLog('yellow', '⚠️  Could not clean up containers');
      if (!quiet) {
        console.log(error);
      }
    }

    // Step 4: Clean up networks
    colorLog('blue', `3️⃣ Cleaning up ${containerRuntime} networks...`);
    try {
      const result = await execa(containerRuntime, ['network', 'prune', '-f'], {
        stdio: 'pipe',
      });

      if (result.stdout.trim()) {
        colorLog('green', `✅ Cleaned up networks: ${result.stdout.trim()}`);
      } else {
        colorLog('green', '✅ No networks to clean up');
      }
    } catch (error) {
      colorLog('yellow', '⚠️  Could not clean up networks');
      if (!quiet) {
        console.log(error);
      }
    }

    // Step 5: Clean up volumes (optional, commented out by default)
    // Uncomment if you want to also clean up data volumes
    /*
    colorLog('blue', `4️⃣ Cleaning up ${containerRuntime} volumes...`);
    try {
      const result = await execa(containerRuntime, ['volume', 'prune', '-f'], {
        stdio: 'pipe',
      });
      
      if (result.stdout.trim()) {
        colorLog('green', `✅ Cleaned up volumes: ${result.stdout.trim()}`);
      } else {
        colorLog('green', '✅ No volumes to clean up');
      }
    } catch (error) {
      colorLog('yellow', '⚠️  Could not clean up volumes');
      if (!quiet) {
        console.log(error);
      }
    }
    */

    log('');
    colorLog('green', '🎉 Supabase cleanup completed!');
    log('You can now try starting Supabase again with: pnpm supabase:start');
  } catch (error) {
    log('');
    colorLog('red', '❌ Cleanup failed:');
    if (!quiet) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Handle errors gracefully
cleanupSupabase().catch((error) => {
  log('');
  colorLog('red', '❌ Cleanup failed with error:');
  if (!quiet) {
    console.error(error);
  }
  process.exit(1);
});
