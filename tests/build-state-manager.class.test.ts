import { BuildStateManager } from '../src/build-state-manager.class';

let buildStateManager: BuildStateManager;

beforeEach((): void => {
  buildStateManager = BuildStateManager.getInstance();
  buildStateManager.clear();
});

describe('BuildStateManager', (): void => {
  it('returns the same instance when getInstance is called multiple times', (): void => {
    // @ts-expect-error TS2341: Property `instance` is private and only accessible within class `BuildStateManager`
    BuildStateManager.instance = undefined;

    const instance1: BuildStateManager = BuildStateManager.getInstance();
    const instance2: BuildStateManager = BuildStateManager.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('initializes with empty build sets', (): void => {
    // @ts-expect-error TS2341: Property `instance` is private and only accessible within class `BuildStateManager`
    BuildStateManager.instance = undefined;

    buildStateManager = BuildStateManager.getInstance();

    expect(buildStateManager.hasRegisteredBuilds()).toBe(false);
    expect(buildStateManager.hasCompletedBuilds()).toBe(false);
  });

  describe('State modification', (): void => {
    it('allows registering a build identifier', (): void => {
      buildStateManager.registerBuild('build-identifier');

      expect(buildStateManager.isBuildRegistered('build-identifier')).toBe(true);
      expect(buildStateManager.hasRegisteredBuilds()).toBe(true);
    });

    it('allows marking a build as completed', (): void => {
      buildStateManager.registerBuild('build-identifier');
      buildStateManager.completeBuild('build-identifier');

      expect(buildStateManager.isBuildCompleted('build-identifier')).toBe(true);
      expect(buildStateManager.hasCompletedBuilds()).toBe(true);
    });

    it('returns true when registering a new build', (): void => {
      expect(buildStateManager.registerBuild('build-identifier')).toBe(true);
    });

    it('returns false when registering an already registered build', (): void => {
      buildStateManager.registerBuild('build-identifier');

      expect(buildStateManager.registerBuild('build-identifier')).toBe(false);
    });

    it('throws an error when completing an unregistered build', (): void => {
      expect((): void => buildStateManager.completeBuild('build-identifier')).toThrow(
        'Build "build-identifier" not registered',
      );
    });

    it('does not duplicate build identifiers in registeredBuilds', (): void => {
      buildStateManager.registerBuild('build-identifier');
      buildStateManager.registerBuild('build-identifier');

      expect(buildStateManager.getRegisteredBuilds().length).toBe(1);
    });

    it('does not duplicate build identifiers in completedBuilds', (): void => {
      buildStateManager.registerBuild('build-identifier');
      buildStateManager.completeBuild('build-identifier');
      buildStateManager.completeBuild('build-identifier');

      expect(buildStateManager.getCompletedBuilds().length).toBe(1);
    });
  });

  describe('Individual build state checks', (): void => {
    it('correctly identifies registered builds', (): void => {
      buildStateManager.registerBuild('build-identifier-1');

      expect(buildStateManager.isBuildRegistered('build-identifier-1')).toBe(true);
      expect(buildStateManager.isBuildRegistered('build-identifier-2')).toBe(false);
    });

    it('correctly identifies completed builds', (): void => {
      buildStateManager.registerBuild('build-identifier-1');
      buildStateManager.completeBuild('build-identifier-1');

      expect(buildStateManager.isBuildCompleted('build-identifier-1')).toBe(true);
      expect(buildStateManager.isBuildCompleted('build-identifier-2')).toBe(false);
    });

    it('correctly identifies pending builds', (): void => {
      buildStateManager.registerBuild('build-identifier-1');
      buildStateManager.registerBuild('build-identifier-2');
      buildStateManager.completeBuild('build-identifier-2');

      expect(buildStateManager.isBuildPending('build-identifier-1')).toBe(true);
      expect(buildStateManager.isBuildPending('build-identifier-2')).toBe(false);
      expect(buildStateManager.isBuildPending('build-identifier-3')).toBe(false);
    });
  });

  describe('Collection state checks', (): void => {
    it('clears all state when clear() is called', (): void => {
      buildStateManager.registerBuild('build-identifier-1');
      buildStateManager.registerBuild('build-identifier-2');
      buildStateManager.completeBuild('build-identifier-1');

      const callbackMock: jest.Mock = jest.fn();
      buildStateManager.onBuildCompleted(callbackMock);

      buildStateManager.clear();

      expect(buildStateManager.hasRegisteredBuilds()).toBe(false);
      expect(buildStateManager.hasCompletedBuilds()).toBe(false);
      expect(buildStateManager.hasPendingBuilds()).toBe(false);

      buildStateManager.registerBuild('build-identifier');
      buildStateManager.completeBuild('build-identifier');

      expect(callbackMock).not.toHaveBeenCalled();
    });

    it('correctly checks for registered builds', (): void => {
      expect(buildStateManager.hasRegisteredBuilds()).toBe(false);

      buildStateManager.registerBuild('build-identifier');
      expect(buildStateManager.hasRegisteredBuilds()).toBe(true);
    });

    it('correctly checks for completed builds', (): void => {
      expect(buildStateManager.hasCompletedBuilds()).toBe(false);

      buildStateManager.registerBuild('build-identifier');
      buildStateManager.completeBuild('build-identifier');
      expect(buildStateManager.hasCompletedBuilds()).toBe(true);
    });

    it('correctly checks for pending builds', (): void => {
      expect(buildStateManager.hasPendingBuilds()).toBe(false);

      buildStateManager.registerBuild('build-identifier-1');
      expect(buildStateManager.hasPendingBuilds()).toBe(true);

      buildStateManager.completeBuild('build-identifier-1');
      expect(buildStateManager.hasPendingBuilds()).toBe(false);

      buildStateManager.registerBuild('build-identifier-2');
      buildStateManager.registerBuild('build-identifier-3');
      buildStateManager.completeBuild('build-identifier-2');
      expect(buildStateManager.hasPendingBuilds()).toBe(true);

      buildStateManager.completeBuild('build-identifier-3');
      expect(buildStateManager.hasPendingBuilds()).toBe(false);
    });
  });

  describe('Collection data retrieval', (): void => {
    it('returns all registered builds correctly', (): void => {
      buildStateManager.registerBuild('build-identifier-1');
      buildStateManager.registerBuild('build-identifier-2');

      const registeredBuilds: readonly string[] = buildStateManager.getRegisteredBuilds();

      expect(registeredBuilds.length).toBe(2);
      expect(registeredBuilds).toContain('build-identifier-1');
      expect(registeredBuilds).toContain('build-identifier-2');
    });

    it('returns all completed builds correctly', (): void => {
      buildStateManager.registerBuild('build-identifier-1');
      buildStateManager.registerBuild('build-identifier-2');
      buildStateManager.completeBuild('build-identifier-1');

      const completedBuilds: readonly string[] = buildStateManager.getCompletedBuilds();

      expect(completedBuilds.length).toBe(1);
      expect(completedBuilds).toContain('build-identifier-1');
      expect(completedBuilds).not.toContain('build-identifier-2');
    });

    it('returns pending builds correctly', (): void => {
      buildStateManager.registerBuild('build-identifier-1');
      buildStateManager.registerBuild('build-identifier-2');
      buildStateManager.registerBuild('build-identifier-3');
      buildStateManager.completeBuild('build-identifier-2');

      const pendingBuilds: readonly string[] = buildStateManager.getPendingBuilds();

      expect(pendingBuilds.length).toBe(2);
      expect(pendingBuilds).toContain('build-identifier-1');
      expect(pendingBuilds).not.toContain('build-identifier-2');
      expect(pendingBuilds).toContain('build-identifier-3');
    });

    it('returns immutable collections that cannot be modified', (): void => {
      buildStateManager.registerBuild('build-identifier-1');
      buildStateManager.registerBuild('build-identifier-2');
      buildStateManager.completeBuild('build-identifier-1');

      const registeredBuilds: readonly string[] = buildStateManager.getRegisteredBuilds();
      const completedBuilds: readonly string[] = buildStateManager.getCompletedBuilds();
      const pendingBuilds: readonly string[] = buildStateManager.getPendingBuilds();

      (registeredBuilds as string[]).push('build-identifier-3');
      (completedBuilds as string[]).pop();
      (pendingBuilds as string[])[0] = 'modified-identifier';

      expect(buildStateManager.getRegisteredBuilds().length).toBe(2);
      expect(buildStateManager.isBuildRegistered('build-identifier-3')).toBe(false);
      expect(buildStateManager.getCompletedBuilds().length).toBe(1);
      expect(buildStateManager.isBuildCompleted('build-identifier-1')).toBe(true);
      expect(buildStateManager.getPendingBuilds()[0]).toBe('build-identifier-2');
    });
  });

  describe('Build completion callbacks', (): void => {
    it('notifies registered callbacks when a build is completed', (): void => {
      const callbackMock: jest.Mock = jest.fn();
      buildStateManager.onBuildCompleted(callbackMock);

      buildStateManager.registerBuild('build-identifier');
      buildStateManager.completeBuild('build-identifier');

      expect(callbackMock).toHaveBeenCalledTimes(1);
      expect(callbackMock).toHaveBeenCalledWith('build-identifier');
    });

    it('passes the correct build identifier to callbacks', (): void => {
      const callbackMock: jest.Mock = jest.fn();
      buildStateManager.onBuildCompleted(callbackMock);

      buildStateManager.registerBuild('build-identifier-1');
      buildStateManager.registerBuild('build-identifier-2');

      buildStateManager.completeBuild('build-identifier-1');
      expect(callbackMock).toHaveBeenCalledWith('build-identifier-1');

      buildStateManager.completeBuild('build-identifier-2');
      expect(callbackMock).toHaveBeenCalledWith('build-identifier-2');
    });

    it('allows unregistering callbacks with the returned function', (): void => {
      const callbackMock: jest.Mock = jest.fn();
      const unregister: () => void = buildStateManager.onBuildCompleted(callbackMock);

      unregister();

      buildStateManager.registerBuild('build-identifier');
      buildStateManager.completeBuild('build-identifier');

      expect(callbackMock).not.toHaveBeenCalled();
    });

    it('only calls callback once for already completed builds', (): void => {
      const callbackMock: jest.Mock = jest.fn();
      buildStateManager.onBuildCompleted(callbackMock);

      buildStateManager.registerBuild('build-identifier');
      buildStateManager.completeBuild('build-identifier');
      buildStateManager.completeBuild('build-identifier');

      expect(callbackMock).toHaveBeenCalledTimes(1);
      expect(callbackMock).toHaveBeenCalledWith('build-identifier');
    });

    it('calls multiple registered callbacks when a build completes', (): void => {
      const callbackMock1: jest.Mock = jest.fn();
      const callbackMock2: jest.Mock = jest.fn();

      buildStateManager.onBuildCompleted(callbackMock1);
      buildStateManager.onBuildCompleted(callbackMock2);

      buildStateManager.registerBuild('build-identifier');
      buildStateManager.completeBuild('build-identifier');

      expect(callbackMock1).toHaveBeenCalledTimes(1);
      expect(callbackMock1).toHaveBeenCalledWith('build-identifier');
      expect(callbackMock2).toHaveBeenCalledTimes(1);
      expect(callbackMock2).toHaveBeenCalledWith('build-identifier');
    });

    it('does not notify callbacks about builds completed before the callback was registered', (): void => {
      buildStateManager.registerBuild('build-identifier-1');
      buildStateManager.completeBuild('build-identifier-1');

      const callbackMock: jest.Mock = jest.fn();
      buildStateManager.onBuildCompleted(callbackMock);

      buildStateManager.registerBuild('build-identifier-2');
      buildStateManager.completeBuild('build-identifier-2');

      expect(callbackMock).toHaveBeenCalledTimes(1);
      expect(callbackMock).toHaveBeenCalledWith('build-identifier-2');
    });
  });
});
