# Supabase Scripts

This directory contains utility scripts for managing the local Supabase development environment.

## cleanup-supabase.js

A cleanup script that resolves common Docker/Podman issues with Supabase containers.

### What it does:

1. **Stops Supabase services** using `supabase stop`
2. **Cleans up stopped containers** using `docker/podman container prune -f`
3. **Cleans up unused networks** using `docker/podman network prune -f`
4. **Auto-detects** whether you're using Docker or Podman
5. **Handles errors gracefully** if containers/networks are already clean

### When to use:

- When `supabase start` fails with "proxy already running" errors
- When containers are in a bad state after system restarts
- When you see networking conflicts
- Before a fresh start if you've had issues

### How to run:

```bash
# Using pnpm script (recommended)
pnpm supabase:cleanup

# Using nx target
pnpm nx cleanup supabase

# Directly
cd packages/supabase && node scripts/cleanup-supabase.js

# With quiet mode
cd packages/supabase && node scripts/cleanup-supabase.js --quiet
```

### Options:

- `--quiet`: Suppress non-essential output (useful in CI/automated environments)

### Note about volumes:

The script intentionally does **not** clean up Docker volumes by default to preserve your database data. If you need to completely reset everything including data, use:

```bash
pnpm supabase:reset
```

Or manually uncomment the volume cleanup section in the script if you need it for your use case.
