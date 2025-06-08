#!/usr/bin/env node
//@ts-check

/**
 * Update Visual Snapshots Script for E2E Tests
 *
 * This script runs Playwright tests in a Linux container to ensure consistent snapshot generation
 * across different operating systems. It solves the following issues:
 *
 * 1. Cross-platform consistency: Screenshots taken on different OS can vary slightly
 * 2. Native binary compatibility: Host OS binaries won't work in Linux container
 * 3. Environment isolation: Container provides clean, reproducible environment
 *
 * Usage: node e2e/frontend-e2e/update-snapshots.js
 *
 * The script will:
 * - Check available disk space and warn if low
 * - Clean up existing container storage before starting
 * - Copy source files to container (excluding node_modules for Linux reinstall)
 * - Install dependencies with Linux-compatible binaries
 * - Build and serve the frontend application
 * - Run Playwright tests with --update-snapshots
 * - Copy updated snapshots back to host
 * - Clean up container storage and temporary files
 *
 * Disk Usage Optimizations:
 * - Uses minimal tmpfs for temp files
 * - Aggressive cleanup of container storage before/after runs
 * - Removes build artifacts and caches after completion
 * - Warns when disk space is low (<10GB available)
 *
 * Memory Optimizations:
 * - Unlimited swap usage allowed
 * - OOM kill protection
 * - Node.js memory limit for installs
 * - Disabled unnecessary caches
 *
 * Low Memory Alternative: If system memory is very low (<1GB free),
 * consider using Docker Desktop or increasing system swap space.
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function log(message) {
  console.log(message);
}

function getGitChanges() {
  try {
    const result = execSync('git status --porcelain', { encoding: 'utf8' });
    const lines = result.split('\n').filter((line) => line.trim());
    const changedFiles = lines.filter((line) => /^\s*[AM?]/.test(line));
    return changedFiles.length;
  } catch (_error) {
    void _error; // Explicitly acknowledge unused variable
    log('Warning: Could not get git status');
    return 0;
  }
}

function runCommand(command, options = {}) {
  try {
    if (!options.silent) {
      log(`Running: ${command}`);
    }
    return execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
  } catch (error) {
    if (!options.allowFailure) {
      log(`Error running command: ${command}`);
      log(error.message);
      process.exit(1);
    }
    return null;
  }
}

function createContainerScript() {
  const scriptContent = `#!/bin/bash
set -e

export SHELL=/bin/bash

echo "📋 Creating workspace and copying source files..."
mkdir -p /workspace

# Copy all files except excluded directories
find /host-workspace -maxdepth 1 -not -name "node_modules" -not -name "dist" -not -name "build" -not -name "test-results" -not -name ".tmp-*" -not -path "/host-workspace" -exec cp -r {} /workspace/ \\;

# Copy hidden files including .git for Nx functionality
find /host-workspace -maxdepth 1 -name ".*" -not -name ".tmp-*" -exec cp -r {} /workspace/ \\; 2>/dev/null || true

echo "📦 Installing pnpm and dependencies..."
curl -fsSL https://get.pnpm.io/install.sh | SHELL=/bin/bash sh -
export PATH="/root/.local/share/pnpm:$PATH"
cd /workspace

# Monitor memory usage
echo "💾 Memory usage before install:"
free -h

# Set pnpm to use less disk space and optimize for memory
pnpm config set store-dir /workspace/.pnpm-store
pnpm config set verify-store-integrity false
pnpm config set side-effects-cache false
NODE_OPTIONS="--max-old-space-size=2048" pnpm install --frozen-lockfile

echo "💾 Memory usage after install:"
free -h

echo "🧪 Running tests to update snapshots..."
export CI=true
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Use the locally installed playwright test runner to avoid npx module resolution issues
echo "Starting nx..."
pnpm nx e2e frontend-e2e --update-snapshots --reporter=list

echo "✉️ Sending snapshot files back to host..."
find /workspace/e2e/frontend-e2e -type d -name "*-snapshots" -exec cp -r {} /host-workspace/e2e/frontend-e2e/ \\; 2>/dev/null || true

echo "🧹 Cleaning up to save disk space..."
rm -rf /workspace/node_modules/.cache /workspace/dist /workspace/build 2>/dev/null || true

echo "✅ Container operations completed!"
`;

  // Create a temporary directory and script file
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'update-snapshots-'));
  const scriptPath = path.join(tmpDir, 'update-snapshots.sh');
  fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });

  return {
    scriptPath,
    cleanup: () => {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch (_error) {
        void _error; // Explicitly acknowledge unused variable
        // Ignore cleanup errors
      }
    },
  };
}

function checkDiskSpace() {
  try {
    // Check available disk space (works on macOS/Linux)
    const result = runCommand('df -h .', { silent: true });
    if (!result) return;

    const lines = result.split('\n');
    const dataLine = lines[1] || lines[0]; // Handle different df output formats
    const parts = dataLine.split(/\s+/);
    const availableSpace = parts[3] || parts[2];

    log(`💾 Available disk space: ${availableSpace}`);

    // Parse available space and warn if low
    const spaceMatch = availableSpace.match(/^(\d+(?:\.\d+)?)([KMGT]?)i?$/);
    if (spaceMatch) {
      const [, amount, unit] = spaceMatch;
      const amountNum = parseFloat(amount);

      // Convert to GB for comparison
      let spaceInGB = amountNum;
      if (unit === 'K') spaceInGB = amountNum / 1024 / 1024;
      else if (unit === 'M') spaceInGB = amountNum / 1024;
      else if (unit === 'T') spaceInGB = amountNum * 1024;

      if (spaceInGB < 10) {
        log('⚠️  WARNING: Low disk space detected. Consider running:');
        log('   podman system prune --all -f');
        log('   docker system prune --all -f  # if using Docker');
      }
    }
  } catch (_error) {
    void _error; // Explicitly acknowledge unused variable
    // Ignore disk space check errors
  }
}

async function main() {
  log('🚀 Starting snapshot update process...');

  // Check disk space before starting
  checkDiskSpace();

  const initialGitChanges = getGitChanges();

  // Get the workspace root (going up two levels from e2e/frontend-e2e)
  const workspaceRoot = path.resolve(__dirname, '../..');
  log(`📁 Workspace root: ${workspaceRoot}`);

  // Change to workspace root
  process.chdir(workspaceRoot);

  log('📦 Creating container script and running snapshot update...');

  // Clean up any existing containers and images to free space
  log('🧹 Cleaning up container storage...');
  runCommand('podman system prune -f', { allowFailure: true, silent: true });

  let cleanup;
  try {
    // Create temporary script
    const { scriptPath, cleanup: cleanupFn } = createContainerScript();
    cleanup = cleanupFn;

    // Run the Podman container with aggressive cleanup flags
    const podmanCommand = [
      'podman run --rm',
      `--tmpfs /tmp:exec,size=2G`, // Restore normal tmpfs size
      `-v "${process.cwd()}:/host-workspace"`,
      `-v "${scriptPath}:/tmp/update-script.sh"`,
      'mcr.microsoft.com/playwright:v1.52.0-jammy',
      'bash /tmp/update-script.sh',
    ].join(' ');

    runCommand(podmanCommand);
  } finally {
    // Clean up temporary script
    if (cleanup) {
      cleanup();
    }

    // Final cleanup of container storage
    log('🧹 Final container cleanup...');
    runCommand('podman system prune -f', { allowFailure: true, silent: true });
  }

  const postGitChanges = getGitChanges();

  if (initialGitChanges === postGitChanges) {
    log('No changes detected in the snapshot files.');
    process.exit(0);
  }

  log('✅ Snapshots updated successfully!');
  log(
    '📝 Please review the updated snapshot files and commit them if they look correct.'
  );
}

// Run the script
main().catch((error) => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
