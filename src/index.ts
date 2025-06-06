import { Plugin, PluginBuild } from 'esbuild';
import { type Format } from 'tsup';
import { BuildStateManager } from './build-state-manager.class';

/**
 * Creates an esbuild plugin for sequential builds in tsup.
 *
 * This plugin ensures that builds for different packages are executed in sequence, waiting for dependencies to be
 * resolved before starting the build. It uses a set to track registered builds and another set to track completed
 * builds, allowing it to check for dependencies before proceeding with the build. It logs the status of the build
 * process, indicating when it is waiting for dependencies and when it starts the build. This is particularly useful in
 * monorepo setups where packages may depend on each other, ensuring that builds are executed in the correct order.
 * This plugin is designed to work with tsup's build process and can be used in conjunction with other tsup
 * configurations.
 *
 * @param {string} packageIdentifier - The identifier of the package being built
 *
 * @returns {Plugin} The esbuild plugin
 */
const createSequentialBuildPlugin: (packageIdentifier: string) => Plugin = (packageIdentifier: string): Plugin => ({
  name: 'sequential-build',
  setup(build: PluginBuild): void {
    const buildStateManager: BuildStateManager = BuildStateManager.getInstance();
    const buildFormat: Format | 'unknown' = build.initialOptions.format || 'unknown';
    const buildIdentifier: string = `${packageIdentifier}-${buildFormat}`;
    const logPrefix: string = `[${packageIdentifier.toUpperCase()}] ${buildFormat.toUpperCase()}`;

    /**
     * Handles the start of the build process.
     *
     * This function checks for dependencies by looking at the registered builds and completed builds. If there are
     * pending builds that are not completed, it waits until all dependencies are resolved before proceeding. It logs
     * the status of the build process, indicating when it is waiting for dependencies and when it starts the build.
     *
     * @returns {Promise<void> | undefined} A promise that resolves when dependencies are resolved, or undefined if
     *   there are no dependencies
     */
    build.onStart((): Promise<void> | undefined => {
      console.log(`${logPrefix} ⏳ Waiting for dependencies...`);

      // Register the current build
      buildStateManager.registerBuild(buildIdentifier);

      // Identify builds that must complete before this one
      // Exclude builds of the same package to maintain parallel format compilation.
      const packageRegex: RegExp = new RegExp(`^${packageIdentifier}-[^-]+$`);
      const pendingBuilds: string[] = buildStateManager
        .getPendingBuilds()
        .filter((id: string): boolean => !packageRegex.test(id));

      // Start the build immediately if there are no pending builds
      if (pendingBuilds.length === 0) {
        console.log(`${logPrefix} 🚀 No dependencies, starting build...`);
        return;
      }

      // Wait for dependencies to complete before starting the build
      return new Promise<void>((resolve: (value: void | PromiseLike<void>) => void): void => {
        const checkPendingBuilds: () => void = (): void => {
          // Check if all dependencies are completed
          if (!pendingBuilds.every((id: string): boolean => buildStateManager.isBuildCompleted(id))) {
            setTimeout(checkPendingBuilds, 100);
            return;
          }

          console.log(`${logPrefix} 🚀 Dependencies resolved, starting build...`);
          resolve();
        };

        checkPendingBuilds();
      });
    });

    /**
     * Handles the end of the build process.
     *
     * This function marks the build as completed by adding it to the completed builds set. This allows the plugin to
     * track which builds have been completed.
     */
    build.onEnd((): void => buildStateManager.completeBuild(buildIdentifier));
  },
});

export { createSequentialBuildPlugin };
export default createSequentialBuildPlugin;
