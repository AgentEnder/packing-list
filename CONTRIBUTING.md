# Contributing to Packing List

Thank you for your interest in contributing to the Packing List project! This guide will help you get set up and understand our development workflow.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (version 18 or higher)
- **pnpm** (our package manager)
- **Podman** (for running containerized tests)

## Installing Podman

Podman is required for running visual regression tests in a consistent Linux environment.

### macOS

```bash
# Using Homebrew
brew install podman

# Initialize and start the Podman machine
podman machine init
podman machine start
```

### Linux (Ubuntu/Debian)

```bash
# Update package lists
sudo apt-get update

# Install Podman
sudo apt-get install -y podman

# Configure for rootless mode (recommended)
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 $USER
```

### Linux (RHEL/CentOS/Fedora)

```bash
# Install Podman
sudo dnf install podman

# or for older versions
sudo yum install podman
```

### Windows

Podman is a bit more complex to install on Windows. See: https://github.com/containers/podman/blob/main/docs/tutorials/podman-for-windows.md

### Verify Installation

```bash
podman --version
podman run hello-world
```

## Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd packing-list
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start the development server**
   ```bash
   nx serve frontend
   ```

## Visual Regression Testing

This project uses Playwright for end-to-end testing with visual regression snapshots. These snapshots ensure the UI remains consistent across changes.

### Running E2E Tests

```bash
# Run all e2e tests
nx e2e frontend-e2e

# Run tests with specific configuration
nx e2e frontend-e2e --configuration=ai
```

### Updating Visual Snapshots

When you make intentional UI changes, you'll need to update the visual snapshots. **Important**: This must be done in a Linux container to ensure consistency across different development environments.

#### Method 1: Using Nx Target

```bash
nx run frontend-e2e:update-snapshots
```

#### Method 2: Using Shell Script

```bash
./e2e/frontend-e2e/update-snapshots.sh
```

### How Snapshot Updates Work

The snapshot update process uses Podman to ensure consistency:

1. **Containerization**: Your code is copied into a Linux container
2. **Clean Dependencies**: All dependencies are installed fresh with Linux-compatible binaries
3. **Test Execution**: Playwright runs in the standardized Linux environment
4. **Snapshot Export**: Updated snapshots are copied back to your workspace

This approach prevents issues with:

- Native binary compatibility across different operating systems
- Font rendering differences between macOS/Windows/Linux
- Browser engine variations

### Snapshot Update Guidelines

- **Always review** updated snapshots before committing
- Only update snapshots when UI changes are **intentional**
- Run the full test suite after updating: `nx e2e frontend-e2e`
- Commit snapshot changes separately from code changes when possible

## Project Structure

This is an Nx monorepo with the following structure:

```
├── packages/          # Application packages
│   └── frontend/      # React frontend application using Vike
├── e2e/               # End-to-end tests
│   └── frontend-e2e/  # Frontend E2E tests with Playwright
└── docs/              # Documentation
```

## Testing

- **Unit Tests**: `nx test <project-name>`
- **E2E Tests**: `nx e2e <project-name>`: NOTE, this does not run the visual regression tests, you need to run `nx run frontend-e2e:update-snapshots` to update snapshots and compare. Otherwise, snapshots are only checked on CI.
- **Linting**: `nx lint <project-name>`
- **Build**: `nx build <project-name>`

## Commit Guidelines

- Use conventional commit format: `feat:`, `fix:`, `chore:`, etc.
- Include task file or GitHub issue number when applicable
- Never use `--no-verify` to bypass pre-commit hooks
- Don't push failing tests

## Getting Help

- Check existing issues and documentation
- For questions about the codebase, create a discussion
- For bugs, create an issue with reproduction steps

Thank you for contributing! 🎉
