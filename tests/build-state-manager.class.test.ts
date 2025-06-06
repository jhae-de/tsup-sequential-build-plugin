import { BuildStateManager } from '../src/build-state-manager.class';

describe('BuildStateManager', (): void => {
  let buildStateManager: BuildStateManager;

  beforeEach((): void => {
    buildStateManager = BuildStateManager.getInstance();
    buildStateManager.clear();
  });

  it('returns the same instance when getInstance is called multiple times', (): void => {
    const instance1: BuildStateManager = BuildStateManager.getInstance();
    const instance2: BuildStateManager = BuildStateManager.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('initializes with empty build sets', (): void => {
    expect(buildStateManager.hasRegisteredBuilds()).toBe(false);
    expect(buildStateManager.hasCompletedBuilds()).toBe(false);
  });

  describe('State modification', (): void => {
    it('allows registering a build identifier', (): void => {
      buildStateManager.registerBuild('_build_identifier_');

      expect(buildStateManager.isBuildRegistered('_build_identifier_')).toBe(true);
      expect(buildStateManager.hasRegisteredBuilds()).toBe(true);
    });

    it('allows marking a build as completed', (): void => {
      buildStateManager.registerBuild('_build_identifier_');
      buildStateManager.completeBuild('_build_identifier_');

      expect(buildStateManager.isBuildCompleted('_build_identifier_')).toBe(true);
      expect(buildStateManager.hasCompletedBuilds()).toBe(true);
    });

    it('returns true when registering a new build', (): void => {
      expect(buildStateManager.registerBuild('_build_identifier_')).toBe(true);
    });

    it('returns false when registering an already registered build', (): void => {
      buildStateManager.registerBuild('_build_identifier_');

      expect(buildStateManager.registerBuild('_build_identifier_')).toBe(false);
    });

    it('throws an error when completing an unregistered build', (): void => {
      expect((): void => {
        buildStateManager.completeBuild('_build_identifier_');
      }).toThrow('Build _build_identifier_ not registered');
    });

    it('does not duplicate build identifiers in registeredBuilds', (): void => {
      buildStateManager.registerBuild('_build_identifier_');
      buildStateManager.registerBuild('_build_identifier_');

      expect(buildStateManager.getRegisteredBuilds().length).toBe(1);
    });

    it('does not duplicate build identifiers in completedBuilds', (): void => {
      buildStateManager.registerBuild('_build_identifier_');
      buildStateManager.completeBuild('_build_identifier_');
      buildStateManager.completeBuild('_build_identifier_');

      expect(buildStateManager.getCompletedBuilds().length).toBe(1);
    });
  });

  describe('Individual build state checks', (): void => {
    it('correctly identifies registered builds', (): void => {
      buildStateManager.registerBuild('_build_identifier_1_');

      expect(buildStateManager.isBuildRegistered('_build_identifier_1_')).toBe(true);
      expect(buildStateManager.isBuildRegistered('_build_identifier_2_')).toBe(false);
    });

    it('correctly identifies completed builds', (): void => {
      buildStateManager.registerBuild('_build_identifier_1_');
      buildStateManager.completeBuild('_build_identifier_1_');

      expect(buildStateManager.isBuildCompleted('_build_identifier_1_')).toBe(true);
      expect(buildStateManager.isBuildCompleted('_build_identifier_2_')).toBe(false);
    });

    it('correctly identifies pending builds', (): void => {
      buildStateManager.registerBuild('_build_identifier_1_');
      buildStateManager.registerBuild('_build_identifier_2_');
      buildStateManager.completeBuild('_build_identifier_2_');

      expect(buildStateManager.isBuildPending('_build_identifier_1_')).toBe(true);
      expect(buildStateManager.isBuildPending('_build_identifier_2_')).toBe(false);
      expect(buildStateManager.isBuildPending('_build_identifier_3_')).toBe(false);
    });
  });

  describe('Collection state checks', (): void => {
    it('correctly checks for registered builds', (): void => {
      expect(buildStateManager.hasRegisteredBuilds()).toBe(false);

      buildStateManager.registerBuild('_build_identifier_');
      expect(buildStateManager.hasRegisteredBuilds()).toBe(true);

      buildStateManager.clear();
      expect(buildStateManager.hasRegisteredBuilds()).toBe(false);
    });

    it('correctly checks for completed builds', (): void => {
      expect(buildStateManager.hasCompletedBuilds()).toBe(false);

      buildStateManager.registerBuild('_build_identifier_');
      buildStateManager.completeBuild('_build_identifier_');
      expect(buildStateManager.hasCompletedBuilds()).toBe(true);

      buildStateManager.clear();
      expect(buildStateManager.hasCompletedBuilds()).toBe(false);
    });

    it('correctly checks for pending builds', (): void => {
      expect(buildStateManager.hasPendingBuilds()).toBe(false);

      buildStateManager.registerBuild('_build_identifier_1_');
      expect(buildStateManager.hasPendingBuilds()).toBe(true);

      buildStateManager.completeBuild('_build_identifier_1_');
      expect(buildStateManager.hasPendingBuilds()).toBe(false);

      buildStateManager.registerBuild('_build_identifier_2_');
      buildStateManager.registerBuild('_build_identifier_3_');
      buildStateManager.completeBuild('_build_identifier_2_');
      expect(buildStateManager.hasPendingBuilds()).toBe(true);

      buildStateManager.completeBuild('_build_identifier_3_');
      expect(buildStateManager.hasPendingBuilds()).toBe(false);
    });
  });

  describe('Collection data retrieval', (): void => {
    it('returns all registered builds correctly', (): void => {
      buildStateManager.registerBuild('_build_identifier_1_');
      buildStateManager.registerBuild('_build_identifier_2_');

      const registeredBuilds: string[] = buildStateManager.getRegisteredBuilds();

      expect(registeredBuilds.length).toBe(2);
      expect(registeredBuilds).toContain('_build_identifier_1_');
      expect(registeredBuilds).toContain('_build_identifier_2_');
    });

    it('returns all completed builds correctly', (): void => {
      buildStateManager.registerBuild('_build_identifier_1_');
      buildStateManager.registerBuild('_build_identifier_2_');
      buildStateManager.completeBuild('_build_identifier_1_');

      const completedBuilds: string[] = buildStateManager.getCompletedBuilds();

      expect(completedBuilds.length).toBe(1);
      expect(completedBuilds).toContain('_build_identifier_1_');
      expect(completedBuilds).not.toContain('_build_identifier_2_');
    });

    it('returns pending builds correctly', (): void => {
      buildStateManager.registerBuild('_build_identifier_1_');
      buildStateManager.registerBuild('_build_identifier_2_');
      buildStateManager.registerBuild('_build_identifier_3_');
      buildStateManager.completeBuild('_build_identifier_2_');

      const pendingBuilds: string[] = buildStateManager.getPendingBuilds();

      expect(pendingBuilds.length).toBe(2);
      expect(pendingBuilds).toContain('_build_identifier_1_');
      expect(pendingBuilds).not.toContain('_build_identifier_2_');
      expect(pendingBuilds).toContain('_build_identifier_3_');
    });
  });
});
