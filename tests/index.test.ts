import { PluginBuild } from 'esbuild';
import { type Format } from 'tsup';
import { BuildStateManager } from '../src/build-state-manager.class';
import { createSequentialBuildPlugin } from '../src';

type OnStartCallback = () => void | Promise<void>;
type OnEndCallback = () => void;

function setupPluginTest(
  packageName: string,
  format?: Format,
): {
  onStartMock: jest.Mock;
  onEndMock: jest.Mock;
  onStartCallback: OnStartCallback | undefined;
  onEndCallback: OnEndCallback | undefined;
} {
  let onStartCallback: OnStartCallback | undefined;
  const onStartMock: jest.Mock = jest.fn().mockImplementation((callback: OnStartCallback): void => {
    onStartCallback = callback;
  });

  let onEndCallback: OnEndCallback | undefined;
  const onEndMock: jest.Mock = jest.fn().mockImplementation((callback: OnEndCallback): void => {
    onEndCallback = callback;
  });

  const buildMock: Partial<PluginBuild> = {
    initialOptions: { format },
    onStart: onStartMock,
    onEnd: onEndMock,
  };

  void createSequentialBuildPlugin(packageName).setup(buildMock as PluginBuild);

  return { onStartMock, onEndMock, onStartCallback, onEndCallback };
}

describe('SequentialBuildPlugin', (): void => {
  let buildStateManager: BuildStateManager;

  beforeEach((): void => {
    buildStateManager = BuildStateManager.getInstance();
    buildStateManager.clear();

    jest.spyOn(console, 'log').mockImplementation((): void => {});
  });

  afterEach((): void => {
    jest.restoreAllMocks();
  });

  it('uses "unknown" when format is missing in options', (): void => {
    const { onStartCallback, onEndCallback } = setupPluginTest('test-package');

    expect(onStartCallback).toBeDefined();
    expect(onEndCallback).toBeDefined();

    void onStartCallback?.();
    onEndCallback?.();

    expect(buildStateManager.isBuildCompleted('test-package-unknown')).toBe(true);
  });

  it('starts build immediately when no dependencies exist', (): void => {
    const { onStartMock, onStartCallback } = setupPluginTest('test-package', 'esm');

    expect(onStartMock).toHaveBeenCalled();
    expect(onStartCallback).toBeDefined();
    expect(onStartCallback?.()).toBeUndefined();
  });

  it('ignores builds from the same package when checking dependencies', (): void => {
    buildStateManager.registerBuild('test-package-cjs');

    const { onStartCallback } = setupPluginTest('test-package', 'esm');

    expect(onStartCallback).toBeDefined();
    expect(onStartCallback?.()).toBeUndefined();
  });

  it('correctly identifies different packages with similar names', async (): Promise<void> => {
    buildStateManager.registerBuild('test-pack-esm');

    const { onStartCallback } = setupPluginTest('test-package', 'esm');

    const startPromise: Promise<void> | void | undefined = onStartCallback?.();
    expect(startPromise).toBeInstanceOf(Promise);

    buildStateManager.completeBuild('test-pack-esm');

    await startPromise;
  });

  it('waits for dependencies before starting the build', async (): Promise<void> => {
    buildStateManager.registerBuild('dependency-build');

    const { onStartMock, onStartCallback } = setupPluginTest('test-package', 'esm');

    expect(onStartCallback).toBeDefined();

    const startPromise: Promise<void> | void | undefined = onStartCallback?.();
    expect(startPromise).toBeInstanceOf(Promise);

    buildStateManager.completeBuild('dependency-build');
    await startPromise;

    expect(onStartMock).toHaveBeenCalled();
  });

  it('marks build as completed after build ends', (): void => {
    const { onStartCallback, onEndCallback } = setupPluginTest('test-package', 'esm');

    expect(onStartCallback).toBeDefined();
    expect(onEndCallback).toBeDefined();

    void onStartCallback?.();
    onEndCallback?.();

    expect(buildStateManager.isBuildCompleted('test-package-esm')).toBe(true);
  });
});
