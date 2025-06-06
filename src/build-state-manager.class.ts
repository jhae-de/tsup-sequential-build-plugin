/**
 * The `BuildStateManager` class is a singleton that manages the state of builds.
 * It tracks registered builds, completed builds, and provides utility methods to query and manipulate the build states.
 *
 * @internal
 */
export class BuildStateManager {
  /**
   * The single instance of the BuildStateManager class.
   * Ensures that only one instance of the class exists.
   */
  private static instance: BuildStateManager;

  /**
   * A set containing the identifiers of registered builds.
   * Builds are added to this set when they are registered.
   */
  private readonly registeredBuilds: Set<string> = new Set<string>();

  /**
   * A set containing the identifiers of completed builds.
   * Builds are added to this set when they are marked as completed.
   */
  private readonly completedBuilds: Set<string> = new Set<string>();

  /**
   * Private constructor to prevent direct instantiation.
   * Ensures that the class can only be instantiated through the getInstance method.
   */
  private constructor() {}

  /**
   * Retrieves the singleton instance of the BuildStateManager class.
   * If the instance does not exist, it creates a new one.
   *
   * @returns {BuildStateManager} The singleton instance of the BuildStateManager
   */
  public static getInstance(): BuildStateManager {
    if (BuildStateManager.instance === undefined) {
      BuildStateManager.instance = new BuildStateManager();
    }

    return BuildStateManager.instance;
  }

  /**
   * Registers a build with the given identifier.
   * If the build is already registered, it does not add it again.
   *
   * @param {string} identifier - The identifier of the build to register
   *
   * @returns {boolean} True if the build was successfully registered, false if it was already registered
   */
  public registerBuild(identifier: string): boolean {
    const previousSize: number = this.registeredBuilds.size;
    this.registeredBuilds.add(identifier);

    return this.registeredBuilds.size > previousSize;
  }

  /**
   * Marks a build as completed by adding its identifier to the completed builds set.
   * Throws an error if the build is not registered.
   *
   * @param {string} identifier - The identifier of the build to mark as completed
   *
   * @throws {Error} If the build is not registered
   */
  public completeBuild(identifier: string): void {
    if (!this.registeredBuilds.has(identifier)) {
      throw new Error(`Build ${identifier} not registered`);
    }

    this.completedBuilds.add(identifier);
  }

  /**
   * Clears all registered and completed builds.
   * Resets the state of the BuildStateManager.
   */
  public clear(): void {
    this.registeredBuilds.clear();
    this.completedBuilds.clear();
  }

  /**
   * Checks if a build with the given identifier is registered.
   *
   * @param {string} identifier - The identifier of the build to check
   *
   * @returns {boolean} True if the build is registered, false otherwise
   */
  public isBuildRegistered(identifier: string): boolean {
    return this.registeredBuilds.has(identifier);
  }

  /**
   * Checks if a build with the given identifier is completed.
   *
   * @param {string} identifier - The identifier of the build to check
   *
   * @returns {boolean} True if the build is completed, false otherwise
   */
  public isBuildCompleted(identifier: string): boolean {
    return this.completedBuilds.has(identifier);
  }

  /**
   * Checks if a build with the given identifier is pending.
   * A build is considered pending if it is registered but not completed.
   *
   * @param {string} identifier - The identifier of the build to check
   *
   * @returns {boolean} True if the build is pending, false otherwise
   */
  public isBuildPending(identifier: string): boolean {
    return this.isBuildRegistered(identifier) && !this.isBuildCompleted(identifier);
  }

  /**
   * Checks if there are any registered builds.
   *
   * @returns {boolean} True if there are registered builds, false otherwise
   */
  public hasRegisteredBuilds(): boolean {
    return this.registeredBuilds.size > 0;
  }

  /**
   * Checks if there are any completed builds.
   *
   * @returns {boolean} True if there are completed builds, false otherwise
   */
  public hasCompletedBuilds(): boolean {
    return this.completedBuilds.size > 0;
  }

  /**
   * Checks if there are any pending builds.
   * A pending build is one that is registered but not completed.
   *
   * @returns {boolean} True if there are pending builds, false otherwise
   */
  public hasPendingBuilds(): boolean {
    return this.registeredBuilds.size > this.completedBuilds.size;
  }

  /**
   * Retrieves all registered builds.
   *
   * @returns {string[]} An array of identifiers for all registered builds
   */
  public getRegisteredBuilds(): string[] {
    return Array.from(this.registeredBuilds);
  }

  /**
   * Retrieves all completed builds.
   *
   * @returns {string[]} An array of identifiers for all completed builds
   */
  public getCompletedBuilds(): string[] {
    return Array.from(this.completedBuilds);
  }

  /**
   * Retrieves all pending builds.
   * A pending build is one that is registered but not completed.
   *
   * @returns {string[]} An array of identifiers for all pending builds
   */
  public getPendingBuilds(): string[] {
    return this.getRegisteredBuilds().filter((identifier: string): boolean => !this.completedBuilds.has(identifier));
  }
}
