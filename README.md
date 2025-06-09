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
[UTILS] CJS ⏳ Waiting for dependencies...
[UTILS] CJS 🚀 No dependencies, starting build...
[UTILS] ESM ⏳ Waiting for dependencies...
[UTILS] ESM 🚀 No dependencies, starting build...
[MAIN] CJS ⏳ Waiting for dependencies...
[MAIN] ESM ⏳ Waiting for dependencies...

CJS packages/utils/dist/index.cjs 1.00 KB
CJS ⚡️ Build success in 15ms
ESM packages/utils/dist/index.mjs 200.00 B
ESM ⚡️ Build success in 15ms

[MAIN] CJS 🚀 Dependencies resolved, starting build...
[MAIN] ESM 🚀 Dependencies resolved, starting build...

CJS dist/index.cjs 1.50 KB
CJS ⚡️ Build success in 2000ms
ESM dist/index.mjs 300.00 B
ESM ⚡️ Build success in 2000ms
```

## How it works

The plugin orchestrates the build process for monorepos by managing dependencies between packages:

- **Package registration**  
  Each package registers itself with a unique identifier when the build process starts.

- **Dependency resolution**  
  When a package's build begins, it identifies dependencies based on the configuration order and waits for them to
  complete before proceeding.

- **Parallel format compilation**  
  Different formats (cjs, esm) of the same package build in parallel for efficiency, while maintaining the correct
  dependency sequence between packages.

- **Build coordination**  
  The plugin tracks the status of all builds through a singleton state manager, ensuring that dependent packages only
  start building after their dependencies have completed.

- **Sequential guarantee**  
  Packages are built in the exact sequence specified in the tsup configuration, ensuring that dependencies are always
  built before the packages that depend on them.

- **Build status tracking**  
  When a build completes, it updates its status in the shared state, allowing dependent packages to proceed with their
  builds.

This approach maintains build integrity in complex monorepos while optimizing build performance through parallel format
compilation.
