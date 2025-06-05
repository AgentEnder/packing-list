# frontend-e2e

This library was generated with [Nx](https://nx.dev).

## Visual Regression Testing

This project includes visual regression tests using Playwright screenshots. These tests ensure the UI remains consistent across changes.

### Updating Snapshots

When UI changes are intentional and you need to update the visual snapshots:

#### Option 1: Using Nx Target

```bash
nx run frontend-e2e:update-snapshots
```

#### Option 2: Using Node.js Script

```bash
node e2e/frontend-e2e/update-snapshots.js
```

#### Option 3: Direct Execution (Unix-like systems)

```bash
./e2e/frontend-e2e/update-snapshots.js
```

All methods will:

- Check for existing changes before starting
- Copy workspace source files into a Linux Podman container (excluding node_modules, .git, etc.)
- Install dependencies with Linux-compatible native binaries inside the container
- Run the tests with `--update-snapshots` flag in the Linux environment
- Copy the updated snapshots back to the host filesystem
- Check if any snapshots were actually updated and report accordingly
- Ensure cross-platform consistency by using the same Linux environment

### How It Works

The snapshot update process uses a container-based approach to ensure consistency:

1. **Change Detection**: Checks git status before starting to detect if snapshots actually change
2. **Smart File Copy**: Only copies source files, excluding large directories like node_modules
3. **Clean Install**: Dependencies are installed inside the Linux container, ensuring all native binaries are Linux-compatible
4. **Test Execution**: Playwright tests run in the Linux environment for consistent rendering
5. **Snapshot Export**: Updated snapshots are copied back to the host filesystem
6. **Change Validation**: Confirms whether any snapshots were actually updated

This approach prevents issues with native dependencies that might be compiled for different operating systems.

### Cross-Platform Support

The update script is written in JavaScript and works on:

- ✅ **Windows** (with Podman Desktop)
- ✅ **macOS** (with Podman)
- ✅ **Linux** (with Podman)

### Important Notes

- **Always review** the updated snapshots before committing them
- The Linux container ensures snapshots are consistent regardless of your local OS
- Updated snapshots should only be committed when UI changes are intentional
- The script requires Podman to be installed and running
  - As we are running builds, playwright etc in the container, it needs a good amount of memory. I recommend trying to give it at least 8GB, but ymmv with lower amounts.
- The script will exit early if no snapshot changes are detected

### Running Regular E2E Tests

```bash
nx e2e frontend-e2e
```
