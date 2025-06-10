# PackingList

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is ready ✨.

A packing list application with comprehensive authentication flows and local Supabase development setup.

## 🚀 Quick Start

### Prerequisites

- Node.js & pnpm
- Docker Desktop or Podman
- No global installs required (Supabase CLI is included locally)

### Development Setup

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Set up local Supabase**

   ```bash
   pnpm setup:supabase
   ```

3. **Start the application**

   ```bash
   pnpm nx serve frontend
   ```

4. **Run e2e tests**
   ```bash
   pnpm nx e2e frontend-e2e
   ```

### 🔐 Authentication Testing

The app includes comprehensive authentication flows with test users for e2e testing:

- **Regular User**: `e2e-test@example.com` / `testpassword123`
- **Admin User**: `e2e-admin@example.com` / `adminpassword123`
- **Google OAuth**: `e2e-google@example.com` (mocked for testing)

See [Supabase Local Setup Guide](docs/SUPABASE_LOCAL_SETUP.md) for detailed authentication testing documentation.

### 📚 Documentation

- [Authentication Setup](docs/AUTHENTICATION.md) - Authentication implementation details
- [Supabase Local Development](docs/SUPABASE_LOCAL_SETUP.md) - Complete local setup guide
- [Contributing](CONTRIBUTING.md) - Development workflow and guidelines

## 📋 Available Commands

### Development

```bash
pnpm nx serve frontend          # Start frontend dev server
pnpm nx test auth              # Run auth package tests
pnpm nx test auth-state        # Run auth state tests
pnpm nx lint                   # Lint all projects
pnpm nx build                  # Build all projects
```

### Supabase

```bash
cd packages/supabase
supabase start                 # Start local Supabase
supabase stop                  # Stop local Supabase
supabase status                # Check service status
supabase db reset              # Reset database with seed data
supabase studio                # Open Supabase Studio
```

### Testing

```bash
pnpm nx e2e frontend-e2e                    # Run all e2e tests
pnpm nx e2e frontend-e2e --grep "auth"      # Run auth e2e tests
pnpm nx run-many -t test                    # Run all unit tests
pnpm nx run-many -t lint,test,build         # Run CI checks
```

## 🏗️ Architecture

This workspace includes:

- **Frontend** (`packages/frontend`) - Vike + React application
- **Auth** (`packages/auth`) - Authentication service with Supabase
- **Auth State** (`packages/auth-state`) - Redux-based auth state management
- **Shared Components** (`packages/shared-components`) - Reusable React components
- **Supabase** (`packages/supabase`) - Local Supabase configuration and seeds
- **E2E Tests** (`e2e/frontend-e2e`) - Comprehensive end-to-end testing

[Learn more about this workspace setup and its capabilities](https://nx.dev/nx-api/js?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created.

[Learn more about this workspace setup and its capabilities](https://nx.dev/nx-api/js?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

## Generate a library

```sh
npx nx g @nx/js:lib packages/pkg1 --publishable --importPath=@my-org/pkg1
```

## Run tasks

To build the library use:

```sh
npx nx build pkg1
```

To run any task with Nx use:

```sh
npx nx <target> <project-name>
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Versioning and releasing

To version and release the library use

```
npx nx release
```

Pass `--dry-run` to see what would happen without actually releasing the library.

[Learn more about Nx release &raquo;](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Keep TypeScript project references up to date

Nx automatically updates TypeScript [project references](https://www.typescriptlang.org/docs/handbook/project-references.html) in `tsconfig.json` files to ensure they remain accurate based on your project dependencies (`import` or `require` statements). This sync is automatically done when running tasks such as `build` or `typecheck`, which require updated references to function correctly.

To manually trigger the process to sync the project graph dependencies information to the TypeScript project references, run the following command:

```sh
npx nx sync
```

You can enforce that the TypeScript project references are always in the correct state when running in CI by adding a step to your CI job configuration that runs the following command:

```sh
npx nx sync:check
```

[Learn more about nx sync](https://nx.dev/reference/nx-commands#sync)

## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/nx-api/js?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:

- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
