import { PluginBuild } from 'esbuild';
import { type Format } from 'tsup';
import { createSequentialBuildPlugin } from '../src';
import { BuildStateManager } from '../src/build-state-manager.class';

type OnStartCallback = () => void | Promise<void>;
type OnStartCallbackResult = void | Promise<void>;
type OnEndCallback = () => void;

type PluginTestSetup = {
  onStartMock: jest.Mock;
  onEndMock: jest.Mock;
  onStartCallback: OnStartCallback | undefined;
  onEndCallback: OnEndCallback | undefined;
};

/**
 * Sets up the plugin test environment for the SequentialBuildPlugin.
 *
 * This function initializes the necessary mocks and callbacks to test the plugin's behavior. It creates a mock build
 * object with `onStart` and `onEnd` methods, which are used to simulate the plugin's behavior during the build
 * process. It returns an object containing the mocks and callbacks for further assertions in the tests.
 *
 * @param {string} packageIdentifier - The identifier of the package being tested
 * @param {Format} [format] - The format of the build
 *
 * @returns {PluginTestSetup} An object containing the mocks and callbacks for testing the plugin
 */
function setupPluginTest(packageIdentifier: string, format?: Format): PluginTestSetup {
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

  void createSequentialBuildPlugin(packageIdentifier).setup(buildMock as PluginBuild);

  return { onStartMock, onEndMock, onStartCallback, onEndCallback };
}

/**
 * Validates the setup of the plugin test environment.
 *
 * This function checks that the necessary mocks and callbacks are defined and have been called as expected. It ensures
 * that the plugin's setup has been correctly initialized before running the tests.
 *
 * @param {PluginTestSetup} setup - The setup object containing mocks and callbacks for the plugin test
 */
function validatePluginSetup(setup: PluginTestSetup): void {
  const { onStartMock, onEndMock, onStartCallback, onEndCallback }: PluginTestSetup = setup;

  expect(onStartMock).toHaveBeenCalled();
  expect(onEndMock).toHaveBeenCalled();
  expect(onStartCallback).toBeDefined();
  expect(onEndCallback).toBeDefined();
}

const buildStateManager: BuildStateManager = BuildStateManager.getInstance();
const registerBuildSpy: jest.SpyInstance = jest.spyOn(buildStateManager, 'registerBuild');
const completeBuildSpy: jest.SpyInstance = jest.spyOn(buildStateManager, 'completeBuild');

jest.spyOn(console, 'log').mockImplementation((): void => {});

beforeEach((): void => buildStateManager.clear());
afterEach((): void => void jest.clearAllMocks());
afterAll((): void => void jest.restoreAllMocks());

describe('SequentialBuildPlugin', (): void => {
  it('uses "unknown" when format is missing in options', (): void => {
    const setup: PluginTestSetup = setupPluginTest('test-package');
    validatePluginSetup(setup);

    const { onStartCallback, onEndCallback }: PluginTestSetup = setup;

    // Assert build starts with no promise
    expect(onStartCallback?.()).toBeUndefined();

    // Assert build is registered
    expect(registerBuildSpy).toHaveBeenCalledWith('test-package-unknown');

    // End build
    onEndCallback?.();

    // Assert build is marked as completed
    expect(completeBuildSpy).toHaveBeenCalledWith('test-package-unknown');
  });

  it('starts build immediately when no dependencies exist', (): void => {
    const setup: PluginTestSetup = setupPluginTest('test-package', 'esm');
    validatePluginSetup(setup);

    const { onStartCallback, onEndCallback }: PluginTestSetup = setup;

    // Assert build starts with no promise
    expect(onStartCallback?.()).toBeUndefined();

    // Assert build is registered
    expect(registerBuildSpy).toHaveBeenCalledWith('test-package-esm');

    // End build
    onEndCallback?.();

    // Assert build is marked as completed
    expect(completeBuildSpy).toHaveBeenCalledWith('test-package-esm');
  });

  it('ignores builds from the same package when checking dependencies', (): void => {
    buildStateManager.registerBuild('test-package-cjs');

    const setup: PluginTestSetup = setupPluginTest('test-package', 'esm');
    validatePluginSetup(setup);

    const { onStartCallback, onEndCallback }: PluginTestSetup = setup;

    // Assert build starts with no promise
    expect(onStartCallback?.()).toBeUndefined();

    // Assert build is registered
    expect(registerBuildSpy).toHaveBeenCalledWith('test-package-esm');

    // End build
    onEndCallback?.();

    // Assert build is marked as completed
    expect(completeBuildSpy).toHaveBeenCalledWith('test-package-esm');
  });

  it('waits for dependencies before starting the build', async (): Promise<void> => {
    buildStateManager.registerBuild('dependency-build');

    const setup: PluginTestSetup = setupPluginTest('test-package', 'esm');
    validatePluginSetup(setup);

    const { onStartCallback }: PluginTestSetup = setup;

    // Start build
    const onStartCallbackResult: OnStartCallbackResult | undefined = onStartCallback?.();

    // Assert build starts with a promise
    expect(onStartCallbackResult).toBeInstanceOf(Promise);

    // Assert build is registered
    expect(registerBuildSpy).toHaveBeenCalledWith('test-package-esm');

    // Complete dependency build
    buildStateManager.completeBuild('dependency-build');

    // Assert promise resolves
    expect(await onStartCallbackResult).toBeUndefined();
  });

  it('correctly identifies different packages with similar names', async (): Promise<void> => {
    buildStateManager.registerBuild('test-pack-esm');

    const setup: PluginTestSetup = setupPluginTest('test-package', 'esm');
    validatePluginSetup(setup);

    const { onStartCallback }: PluginTestSetup = setup;

    // Start build
    const onStartCallbackResult: OnStartCallbackResult | undefined = onStartCallback?.();

    // Assert build starts with a promise
    expect(onStartCallbackResult).toBeInstanceOf(Promise);

    // Assert build is registered
    expect(registerBuildSpy).toHaveBeenCalledWith('test-package-esm');

    // Complete build
    buildStateManager.completeBuild('test-pack-esm');

    // Assert promise resolves
    expect(await onStartCallbackResult).toBeUndefined();
  });

  it('marks build as completed after build ends', (): void => {
    const setup: PluginTestSetup = setupPluginTest('test-package', 'esm');
    validatePluginSetup(setup);

    const { onStartCallback, onEndCallback }: PluginTestSetup = setup;

    // Start build
    void onStartCallback?.();

    // Assert build is registered
    expect(registerBuildSpy).toHaveBeenCalledWith('test-package-esm');

    // End build
    onEndCallback?.();

    // Assert build is marked as completed
    expect(completeBuildSpy).toHaveBeenCalledWith('test-package-esm');
  });
});
