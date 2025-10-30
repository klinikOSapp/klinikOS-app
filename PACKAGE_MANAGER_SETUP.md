# KlinikOS Package Manager Configuration

This project is configured to use **PNPM exclusively** as the package manager to ensure consistency and avoid conflicts.

## Quick Start

```bash
# Development
pnpm dev

# Build
pnpm build

# Install dependencies
pnpm install

# Clean install
pnpm clean
```

## Maintenance Scripts

### Clean Installation
```bash
pnpm clean
```
Removes node_modules, .next, and reinstalls fresh dependencies.

### Complete Package Manager Cleanup
```bash
pnpm cleanup-pm
```
Runs the comprehensive cleanup script that:
- Removes all conflicting lockfiles (package-lock.json, yarn.lock)
- Cleans all package manager caches
- Removes node_modules and build artifacts
- Performs fresh pnpm install
- Verifies installation success

## Configuration Files

### `.npmrc`
- Enforces pnpm usage with engine-strict
- Configures isolated node linker
- Sets security and performance optimizations
- Hoists ESLint and Prettier for better tooling

### `package.json`
- `packageManager`: Specifies pnpm@10.15.1
- `engines`: Enforces Node.js >=18.0.0 and pnpm >=8.0.0

### `.gitignore`
- Prevents other package manager lockfiles from being committed
- Includes pnpm-specific ignore patterns

### VS Code Settings
- Configures npm.packageManager to use pnpm
- Hides conflicting lockfiles from explorer
- Excludes them from search results

## Troubleshooting

### Server Hangs During Compilation
1. Stop the dev server (Ctrl+C)
2. Run cleanup: `pnpm cleanup-pm`
3. Restart: `pnpm dev`

### VS Code Warnings About Multiple Lockfiles
1. Run: `pnpm cleanup-pm`
2. Reload VS Code window
3. Warnings should disappear

### Dependency Installation Issues
```bash
# Clear everything and start fresh
pnpm cleanup-pm

# Or manual cleanup
rm -rf node_modules .next
pnpm store prune
pnpm install
```

## Why PNPM?

- **Disk Efficiency**: Saves space with hard linking
- **Speed**: Faster installs with intelligent caching
- **Security**: Better dependency isolation
- **Monorepo Ready**: Excellent workspace support
- **Next.js Compatible**: Full support for Turbopack/Turbo

## Preventing Package Manager Conflicts

This setup prevents conflicts by:
1. Strict engine enforcement in package.json
2. .gitignore blocks other lockfiles
3. .npmrc prevents package-lock creation
4. Cleanup scripts remove artifacts
5. VS Code configuration hides conflicts

## Support

If you encounter issues:
1. Run `pnpm cleanup-pm`
2. Check Node.js version: `node --version` (should be >=18)
3. Check pnpm version: `pnpm --version` (should be >=8)
4. Verify .npmrc exists and is configured properly