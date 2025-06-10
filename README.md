![Version](https://img.shields.io/npm/v/%40jhae/tsup-sequential-build-plugin?label=Version&labelColor=%23404850&color=blue)
![License](https://img.shields.io/github/license/jhae-de/tsup-sequential-build-plugin?label=License&labelColor=%23404850&color=blue)
![Downloads](https://img.shields.io/npm/dt/%40jhae%2Ftsup-sequential-build-plugin?label=Downloads&labelColor=%23404850&color=blue)
![Tests](https://img.shields.io/github/actions/workflow/status/jhae-de/tsup-sequential-build-plugin/analyze.yaml?label=Tests&labelColor=%23404850)
![Coverage](https://img.shields.io/codecov/c/github/jhae-de/tsup-sequential-build-plugin/main?label=Coverage&labelColor=%23404850)

# tsup Sequential Build Plugin

A tsup/esbuild plugin that ensures dependent packages in monorepos are built in the correct sequence while maintaining
parallel format compilation.

This plugin seamlessly integrates with tsup configurations to manage complex monorepo builds. It automatically
determines the correct build sequence based on package dependencies, ensuring each package builds only after its
dependencies are complete. This simplifies the build process in monorepos with interdependent packages and reduces build
errors. The plugin preserves tsup's ability to compile different formats (CommonJS, ESM, etc.) in parallel within each
package while ensuring the correct build sequence between dependent packages.

Features:

- Builds dependent packages in monorepos in the correct sequence
- Maintains parallel builds for different formats (CommonJS, ESM, etc.) within each package
- Automatically manages build dependencies with intelligent waiting mechanism
- Integrates seamlessly with existing tsup configurations
- Provides zero-configuration dependency resolution
- Maintains build state across multiple sessions via singleton pattern

## Installation

Using npm:

```shell
npm install --save-dev @jhae/tsup-sequential-build-plugin
```

## Usage

Using the plugin is straightforward. Just import it and add it to the `esbuildPlugins` array in your tsup configuration,
making sure to pass a unique package identifier (such as the package name) to the plugin. This identifier is used to
track the build status of each package and its dependencies.

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
> Packages are built in the order they are configured in the tsup configuration. Ensure that dependent packages are
> listed after their dependencies to maintain the correct build sequence.

### Example log output

When running the build, the plugin provides informative log messages to indicate the build status and dependency
handling. Here's an example of what the output might look like when building a monorepo with two packages, `utils` and
`main`, where `main` depends on `utils` and both packages are built in CommonJS and ESM formats.

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

The plugin orchestrates the build process for monorepos by managing dependencies between packages and ensuring that they
are built in the correct order. It does this through a combination of package registration, dependency resolution, and
parallel format compilation. Here’s a breakdown of the key steps:

- **Package registration**  
  Each package registers itself with a unique identifier when the build process starts. This identifier is typically the
  package name, allowing the plugin to track which packages are being built.

- **Dependency resolution**  
  When a package's build begins, it identifies dependencies based on the order in the tsup configuration array and waits
  for them to complete before proceeding.

- **Parallel format compilation**  
  Different formats (cjs, esm) of the same package build in parallel for efficiency, while maintaining the correct
  dependency sequence between packages.

- **Build coordination**  
  The plugin tracks the status of all builds through a singleton state manager, ensuring that dependent packages only
  start building after their dependencies have completed.

- **Build status tracking**  
  When a build completes, it updates its status in the shared state, allowing dependent packages to proceed with their
  builds.

- **Sequential guarantee**  
  Packages are built in the exact sequence specified in the tsup configuration, ensuring that dependencies are always
  built before the packages that depend on them.

This architectural approach ensures packages are built in the correct dependency sequence while leveraging concurrent
format compilation, delivering both reliability and performance without requiring complex configuration.
