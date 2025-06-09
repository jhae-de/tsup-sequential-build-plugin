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
     * This function registers the current build with the BuildStateManager and checks for any pending builds that
     * must complete before this one can start. If there are no pending builds, it starts the build immediately. If
     * there are pending builds, it waits for them to complete before proceeding. It logs the status of the build
     * process, indicating when it is waiting for dependencies and when it starts the build.
     *
     * @returns {Promise<void> | undefined} A promise that resolves when the build can start, or undefined if there
     *   are no dependencies.
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
        .filter((identifier: string): boolean => !packageRegex.test(identifier));

      /**
       * Checks if all dependent builds are completed.
       *
       * @returns {boolean} True if all dependent builds are completed, false otherwise
       */
      const areDependentBuildsCompleted: () => boolean = (): boolean =>
        pendingBuilds.every((identifier: string): boolean => buildStateManager.isBuildCompleted(identifier));

      // Start the build immediately if there are no dependencies
      if (areDependentBuildsCompleted()) {
        console.log(`${logPrefix} 🚀 No dependencies, starting build...`);
        return;
      }

      // Wait for dependencies to complete before starting the build
      return new Promise<void>((resolve: (value: void | PromiseLike<void>) => void): void => {
        /**
         * Callback function that is called when a build is completed.
         *
         * This function checks two conditions before proceeding:
         * 1. If the completed build is NOT one of the pending dependencies, the callback ignores it as it's
         *    unrelated to this package's build process.
         * 2. If any dependent builds are still running, the build process must continue waiting.
         *
         * Only when both conditions are false (the completed build is one of the dependencies AND all
         * dependent builds are completed), the callback unregisters itself to avoid memory leaks and resolves the
         * promise to start the current build.
         */
        const unregisterCallback: () => void = buildStateManager.onBuildCompleted((identifier: string): void => {
          if (!pendingBuilds.includes(identifier) || !areDependentBuildsCompleted()) {
            return;
          }

          unregisterCallback();

          console.log(`${logPrefix} 🚀 Dependencies resolved, starting build...`);
          resolve();
        });
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
