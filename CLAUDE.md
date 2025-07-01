# Claude Code Configuration

## Project Overview
This is an Nx workspace using Nx 21.1.2 with pnpm as the package manager for a packing list application.

## Development Guidelines

### Core Operating Principles
- Be proactive and complete tasks fully
- Use brief, clear communication
- Make decisions independently when possible
- Prefer many small files over large ones
- Work in commit-sized chunks for easy rollback

### Package Management
- **Default:** Use `pnpm` for all operations
- **Workspace:** Never install packages directly in workspace packages - use catalog versions or install in root

### Testing Standards
- Run tests in single-run mode: `nx test {projectName} --watch=false` or `vitest run`
- Prefer fail-fast execution
- **Verification Command:** `nx run-many -t lint,test,build` followed by `pnpm test:e2e` if all pass

### Git Practices
- **Commit Prefixes:** Always use `fix:`, `feat:`, or `chore:`
- **Never:** Use `--no-verify` or bypass pre-commit hooks
- **Never:** Push failing tests
- **Avoid:** Interactive git commands (`git rebase --continue`, `git commit --amend`)

### Project Generation
- Prefer Nx generators: `nx g @nx/js:library path/to/project --name project`

### Icons
- Primary: Use lucide-react components
- Fallback: react-icons if needed
- Avoid: Raw SVG tags

### Framework-Specific Notes

#### Vike
- Parameterized routes: `static/[dynamic]/+Page.tsx`

#### E2E Testing
- Avoid direct `page.goto()` calls (loses Redux state)
- Avoid `page.waitForTimeout()` - the app is fast
- Test user-facing functionality, not implementation details
- **Never run:** `nx e2e` or Playwright directly - use `pnpm test:e2e`

### Code Philosophy (Zen of Coding)
- Beautiful is better than ugly
- Explicit is better than implicit
- Simple is better than complex
- Readability counts
- Errors should never pass silently
- There should be one obvious way to do it
- If implementation is hard to explain, it's a bad idea

### MCP Server Configuration
The project uses an Nx MCP server at `http://localhost:9052/sse` for enhanced development capabilities.