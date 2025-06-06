![Version](https://img.shields.io/npm/v/%40jhae/tsup-sequential-build-plugin?label=Version&labelColor=%23404850&color=blue)
![License](https://img.shields.io/github/license/jhae-de/tsup-sequential-build-plugin?label=License&labelColor=%23404850&color=blue)
![Downloads](https://img.shields.io/npm/dt/%40jhae%2Ftsup-sequential-build-plugin?label=Downloads&labelColor=%23404850&color=blue)
![Tests](https://img.shields.io/github/actions/workflow/status/jhae-de/tsup-sequential-build-plugin/analyze.yaml?label=Tests&labelColor=%23404850)
![Coverage](https://img.shields.io/codecov/c/github/jhae-de/tsup-sequential-build-plugin/main?label=Coverage&labelColor=%23404850)

# tsup Sequential Build Plugin

A tsup/esbuild plugin that ensures dependent packages in monorepos are built in the correct sequence while maintaining
parallel format compilation.

Features:

- Ensures dependent packages in monorepos are built in the correct order
- Supports parallel builds for different formats (cjs, esm, etc.) within a package
- Automatically waits for dependencies to finish before starting the build
- Easy integration with existing tsup configurations
- No extra configuration needed for dependency resolution
- Supports multiple build sessions via singleton state management

## Installation

Using npm:

```shell
npm install --save-dev @jhae/tsup-sequential-build-plugin
```

## Usage

Using the plugin is straightforward. Just import it and add it to the `esbuildPlugins` array in your `tsup`
configuration, making sure to pass a unique package identifier (such as the package name) to the plugin:

```typescript
import { createSequentialBuildPlugin } from '@jhae/tsup-sequential-build-plugin';
import { defineConfig } from 'tsup';

// For CommonJS:
// const createSequentialBuildPlugin = require('@jhae/tsup-sequential-build-plugin');

export default defineConfig([
  // Build the shared utilities package first
  {
    entry: ['packages/utils/src/index.ts'],
    format: ['cjs', 'esm'],
    esbuildPlugins: [createSequentialBuildPlugin('utils')],
    // Other tsup options...
  },
  // Main package that depends on utils
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    esbuildPlugins: [createSequentialBuildPlugin('main')],
    // Other tsup options...
  },
]);
```

> [!IMPORTANT]
> Packages are built in the order they are configured in your `tsup` configuration.

### Example log output

When running the build, the plugin provides informative log messages to indicate the build status and dependency
handling:

```shell
...
[UTILS] CJS ⏳ Waiting for dependencies...
[UTILS] CJS 🚀 No dependencies, starting build...
[UTILS] ESM ⏳ Waiting for dependencies...
[UTILS] ESM 🚀 No dependencies, starting build...
[MAIN] ESM ⏳ Waiting for dependencies...
[MAIN] CJS ⏳ Waiting for dependencies...

CJS packages/utils/dist/index.cjs 1.00 KB
CJS ⚡️ Build success in 15ms
ESM packages/utils/dist/index.mjs 200.00 B
ESM ⚡️ Build success in 15ms

[MAIN] ESM 🚀 Dependencies resolved, starting build...
[MAIN] CJS 🚀 Dependencies resolved, starting build...

ESM dist/index.mjs 300.00 B
ESM ⚡️ Build success in 2000ms
CJS dist/index.cjs 1.50 KB
CJS ⚡️ Build success in 2000ms
```

## How it works

The plugin coordinates the build process across multiple packages and formats using a singleton build state manager.

- **Registration**  
  Each build (identified by a package identifier and the format, e.g., `main-cjs`) registers itself with the build state
  manager at the start.

- **Dependency detection**  
  Before a build starts, it checks for other registered builds that do not belong to the same package. If any of these
  are still pending, the build waits and periodically re-checks their status.

- **Parallel format builds**  
  Builds for different formats (e.g., `cjs`, `esm`) of the same package are allowed to run in parallel, as they do not
  block each other.

- **Build start**  
  Once all dependencies are resolved, the build proceeds and logs its status.

- **Completion tracking**  
  After finishing, the build marks itself as completed, allowing dependent builds to proceed.

- **Order guarantee**  
  Packages are always built in the order they are configured in your `tsup` config, ensuring that dependencies are built
  before dependents.

This mechanism ensures correct build sequencing in monorepos, while maximizing parallelism for different formats within
the same package.
