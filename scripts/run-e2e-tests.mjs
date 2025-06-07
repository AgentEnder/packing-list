#!/usr/bin/env node

import { exec, execSync } from 'child_process';
import { existsSync, renameSync, copyFileSync } from 'fs';
import { resolve } from 'path';
import { platform } from 'os';

const ROOT_DIR = resolve(process.cwd());
const ENV_FILE = resolve(ROOT_DIR, '.env');
const ENV_E2E_FILE = resolve(ROOT_DIR, '.env.e2e');
const ENV_BACKUP_FILE = resolve(ROOT_DIR, '.env.backup');

function log(message) {
  console.log(`🔧 ${message}`);
}

function error(message) {
  console.error(`❌ ${message}`);
}

function success(message) {
  console.log(`✅ ${message}`);
}

async function killProcessOnPort3000() {
  log('Killing any process running on port 3000...');

  try {
    const currentPlatform = platform();

    if (currentPlatform === 'win32') {
      // Windows
      try {
        const result = execSync('netstat -ano | findstr :3000', {
          encoding: 'utf8',
          stdio: 'pipe',
        });

        const lines = result
          .split('\n')
          .filter((line) => line.includes(':3000'));

        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5) {
            const pid = parts[parts.length - 1];
            try {
              execSync(`taskkill /f /pid ${pid}`, { stdio: 'pipe' });
              log(`Killed process on port 3000 (PID: ${pid})`);
            } catch (e) {
              // Ignore failures
            }
          }
        }
      } catch (windowsError) {
        log('No process found on port 3000 (Windows)');
      }
    } else {
      // Unix-like systems (Linux, macOS, etc.)
      try {
        const result = execSync('lsof -ti:3000', {
          encoding: 'utf8',
          stdio: 'pipe',
        });

        const pids = result.split('\n').filter((pid) => pid.trim());

        for (const pid of pids) {
          try {
            execSync(`kill ${pid.trim()}`, { stdio: 'pipe' });
            log(`Killed process on port 3000 (PID: ${pid.trim()})`);
          } catch (e) {
            // Ignore failures
          }
        }
      } catch (unixError) {
        log('No process found on port 3000 (Unix)');
      }
    }

    // Wait a moment for process to terminate
    log('Waiting for port 3000 to be freed...');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    log(`Note: Could not check/kill process on port 3000: ${error.message}`);
    log('This is normal if no process was using port 3000');
  }
}

function backupOriginalEnv() {
  if (existsSync(ENV_FILE)) {
    copyFileSync(ENV_FILE, ENV_BACKUP_FILE);
    log('Backed up original .env file to ' + ENV_BACKUP_FILE);
    if (!existsSync(ENV_BACKUP_FILE)) {
      throw new Error('Failed to backup .env file');
    }
  } else {
    log('No existing .env file found at ' + ENV_FILE + ', skipping backup');
  }
}

function swapToE2eEnv() {
  if (!existsSync(ENV_E2E_FILE)) {
    throw new Error('.env.e2e file not found! Cannot proceed with e2e tests.');
  }

  copyFileSync(ENV_E2E_FILE, ENV_FILE);
  log('Copied .env.e2e to .env for e2e testing');
}

function restoreOriginalEnv() {
  // Remove the current .env (which is the e2e version)
  if (existsSync(ENV_FILE)) {
    renameSync(ENV_FILE, ENV_E2E_FILE);
    log('Restored .env.e2e file');
  }

  if (!existsSync(ENV_BACKUP_FILE)) {
    console.log('No backup file found at ' + ENV_BACKUP_FILE);
  }
  // Restore the original .env if backup exists
  else if (existsSync(ENV_BACKUP_FILE)) {
    renameSync(ENV_BACKUP_FILE, ENV_FILE);
    log('Restored original .env file');
  } else {
    log('No backup found, .env file removed');
  }
}

async function runE2eTests() {
  log('Running e2e tests with nx...');
  try {
    const child_process = exec(
      'pnpm nx run-many --output-style=stream -t e2e' +
        process.argv
          .slice(2)
          .map((arg) => (arg.includes(' ') ? `"${arg}"` : arg))
          .join(' '),
      {
        stdio: 'pipe',
        cwd: ROOT_DIR,
      }
    );
    child_process.stdout.on('data', (data) => {
      console.log(data);
    });
    child_process.stderr.on('data', (data) => {
      console.error(data);
    });
    await new Promise((resolve, reject) =>
      child_process.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('E2E tests failed!'));
        }
      })
    );
    success('E2E tests completed successfully!');
    return true;
  } catch (error) {
    console.error('E2E tests failed!', error);
    return false;
  }
}

function showPlaywrightReportInfo() {
  console.log('');
  console.log('📊 View Test Results:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('To view the Playwright test report, run:');
  console.log('  pnpm nx view-report frontend-e2e');
  console.log('');
}

async function main() {
  log('Starting e2e test run with environment swap...');

  let testsSucceeded = false;

  try {
    // Step 1: Kill any process using port 3000
    await killProcessOnPort3000();

    // Step 2: Backup original .env
    backupOriginalEnv();

    // Step 3: Copy .env.e2e to .env
    swapToE2eEnv();

    // Step 4: Run e2e tests
    testsSucceeded = await runE2eTests();

    if (testsSucceeded) {
      success('E2E test run completed successfully!');
    } else {
      error('E2E tests failed, but environment has been restored');
    }
  } catch (err) {
    error(`E2E test run failed: ${err.message}`);
    process.exitCode = 1;
  } finally {
    // Step 5: Always restore original files
    try {
      restoreOriginalEnv();
      success('Environment files restored');
    } catch (restoreError) {
      error(
        `Failed to restore environment files: ${restoreError.message}. Original .env file is at ${ENV_BACKUP_FILE}`
      );
      process.exitCode = 1;
    }

    // Show Playwright report info regardless of test outcome
    showPlaywrightReportInfo();
  }
}

main().catch((err) => {
  error(`Unexpected error: ${err.message}`);
  process.exit(1);
});

process.on('SIGINT', () => {
  // restoreOriginalEnv();
  process.exit(130);
});
