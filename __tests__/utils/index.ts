/**
 * Test Utilities Index
 * 
 * Central export point for all test utilities, making them easily accessible
 * across the test suite with a single import.
 */

// Mock Utilities
export {
  MockUtilities,
  mockUtils,
  type MockedFileSystem,
  type MockedChildProcess,
  type MockedProcess,
  type MockState,
  mockFileRead,
  mockFileReadError,
  mockFileWrite,
  mockPowerShellCommand,
  createMockFileHandle,
} from './mock-utilities.js';

// Test Data Factories
export {
  createCliOptions,
  createClaudeSettings,
  createClaudeSettingsWithHooks,
  createCheckResult,
  DependencyScenarios,
  createCacheData,
  createInstallationResult,
  createHookPayload,
  HookPayloadFactories,
  createPowerShellResponse,
  PowerShellScenarios,
  createFileSystemState,
  createProcessState,
  createPerformanceMetrics,
  createTestError,
  ErrorScenarios,
  type CliOptions,
  type ClaudeSettings,
  type InstallationResult,
  type HookPayload,
  type PowerShellResponse,
  type FileSystemState,
  type ProcessState,
  type PerformanceMetrics,
  type TestError,
} from './test-factories.js';

// Assertion Helpers
export {
  expectFilePermissions,
  expectFilePermissionsBatch,
  expectJsonEqual,
  expectSettingsContainHooks,
  expectSettingsPreserveExisting,
  expectNoDuplicateHooks,
  expectErrorMessage,
  expectErrorProperties,
  expectProcessExit,
  expectConsoleOutput,
  expectPowerShellExecution,
  expectPowerShellModuleOperation,
  expectAtomicFileOperation,
  expectBackupCreated,
  expectDirectoryStructure,
  expectInstallationFiles,
  expectCacheOperations,
  expectPerformanceBenchmarks,
  expectCoverageThresholds,
  expectTimingConstraints,
  expectCallOrder,
  expectFlagValidation,
  expectPromptInteractions,
  expectHookPayloadStructure,
  expectJsoncPreservesComments,
  expectExitCodeMapping,
} from './assertion-helpers.js';

// Environment Helpers
export {
  TempDirectoryManager,
  EnvironmentManager,
  ProcessStateManager,
  CacheManager,
  PerformanceTimer,
  TestEnvironment,
  createWSLEnvironment,
  createNonWSLEnvironment,
  createWSLNoPowerShellEnvironment,
  timeAsync,
  createTempFileStructure,
  mockConsole,
} from './environment-helpers.js';

// Integration Helpers
export {
  VirtualFileSystem,
  ChildProcessMocker,
  MockProcess,
  ConfigurationBuilder,
  TestCommunicator,
  CleanupVerifier,
  createIntegrationSetup,
  mockCliEnvironment,
} from './integration-helpers.js';

/**
 * Convenience function to create a complete test setup
 */
export function createTestSuite(options: {
  tempDirs?: boolean;
  mockProcess?: boolean;
  mockFs?: boolean;
  vfs?: boolean;
  childProcess?: boolean;
  wsl?: boolean;
  powershell?: boolean;
} = {}) {
  const {
    tempDirs = true,
    mockProcess = true,
    mockFs = true,
    vfs = true,
    childProcess = true,
    wsl = true,
    powershell = true,
  } = options;

  const mockUtilsInstance = MockUtilities.getInstance();
  
  const suite = {
    // Core utilities
    mock: mockUtilsInstance,
    
    // Environment management
    env: new EnvironmentManager(),
    process: new ProcessStateManager(),
    perf: new PerformanceTimer(),
    
    // Cleanup function
    cleanup: async () => {
      mockUtilsInstance.cleanup();
      suite.env.restore();
      suite.process.restore();
      suite.perf.clear();
      
      if (suite.tempDir) {
        await suite.tempDir.cleanup();
      }
      
      if (suite.integration) {
        suite.integration.vfs.clear();
        suite.integration.childProcess.clear();
      }
    },
    
    // Optional components
    tempDir: tempDirs ? new TempDirectoryManager() : undefined,
    integration: (vfs || childProcess) ? createIntegrationSetup() : undefined,
  };

  // Setup initial state
  if (mockProcess) {
    suite.process.save();
    suite.process.mockProcessExit();
  }

  if (wsl) {
    suite.env.setupWSL();
  }

  if (powershell) {
    suite.env.setupPathWithPowerShell();
  }

  return suite;
}

/**
 * Test suite factory for specific scenarios
 */
export const TestSuites = {
  /**
   * Basic unit test setup
   */
  unit: (options?: Parameters<typeof createTestSuite>[0]) => 
    createTestSuite({
      tempDirs: false,
      vfs: false,
      childProcess: false,
      ...options,
    }),

  /**
   * Integration test setup
   */
  integration: (options?: Parameters<typeof createTestSuite>[0]) =>
    createTestSuite({
      tempDirs: true,
      vfs: true,
      childProcess: true,
      ...options,
    }),

  /**
   * End-to-end test setup
   */
  e2e: (options?: Parameters<typeof createTestSuite>[0]) =>
    createTestSuite({
      tempDirs: true,
      vfs: true,
      childProcess: true,
      mockProcess: true,
      mockFs: true,
      ...options,
    }),

  /**
   * CLI test setup
   */
  cli: (options?: Parameters<typeof createTestSuite>[0]) =>
    createTestSuite({
      tempDirs: false,
      vfs: false,
      childProcess: true,
      mockProcess: true,
      ...options,
    }),

  /**
   * Dependencies test setup
   */
  dependencies: (options?: Parameters<typeof createTestSuite>[0]) =>
    createTestSuite({
      tempDirs: true,
      vfs: true,
      childProcess: true,
      wsl: true,
      powershell: true,
      ...options,
    }),
};

/**
 * Quick assertion helpers for common patterns
 */
export const QuickAsserts = {
  /**
   * Assert CLI completed successfully
   */
  cliSuccess: (mockExit: any) => {
    expectProcessExit(mockExit, 0);
  },

  /**
   * Assert CLI failed with specific error
   */
  cliError: (mockExit: any, expectedCode: number) => {
    expectProcessExit(mockExit, expectedCode);
  },

  /**
   * Assert PowerShell module was checked
   */
  burntToastChecked: (mockExec: any) => {
    expectPowerShellModuleOperation(mockExec, 'check', 'BurntToast');
  },

  /**
   * Assert PowerShell module was installed
   */
  burntToastInstalled: (mockExec: any) => {
    expectPowerShellModuleOperation(mockExec, 'install', 'BurntToast');
  },

  /**
   * Assert settings contain expected hooks
   */
  hooksInstalled: (settings: any, scope: 'global' | 'local' = 'global') => {
    const scriptPath = scope === 'global' 
      ? '~/.claude/cctoast-wsl/show-toast.sh'
      : '.claude/cctoast-wsl/show-toast.sh';
    
    expectSettingsContainHooks(settings, {
      notification: [`${scriptPath} --notification-hook`],
      stop: [`${scriptPath} --stop-hook`],
    });
  },

  /**
   * Assert installation files were created
   */
  filesInstalled: (mockCopyFile: any, scope: 'global' | 'local' = 'global') => {
    const basePath = scope === 'global' 
      ? '~/.claude/cctoast-wsl'
      : '.claude/cctoast-wsl';
    
    expectInstallationFiles(mockCopyFile, [
      {
        source: expect.stringContaining('show-toast.sh'),
        destination: `${basePath}/show-toast.sh`,
      },
      {
        source: expect.stringContaining('claude.png'),
        destination: `${basePath}/assets/claude.png`,
      },
    ]);
  },
};

/**
 * Performance test helpers
 */
export const PerformanceTests = {
  /**
   * Test build performance
   */
  async testBuild(buildFn: () => Promise<void>): Promise<number> {
    const timer = new PerformanceTimer();
    await timer.timeFunction('build', buildFn);
    const duration = timer.getResult('build')!;
    
    expectPerformanceBenchmarks(
      { buildTime: duration },
      { buildTime: 1000 }
    );
    
    return duration;
  },

  /**
   * Test CLI startup performance
   */
  async testStartup(startupFn: () => Promise<void>): Promise<number> {
    const timer = new PerformanceTimer();
    await timer.timeFunction('startup', startupFn);
    const duration = timer.getResult('startup')!;
    
    expectPerformanceBenchmarks(
      { startupTime: duration },
      { startupTime: 100 }
    );
    
    return duration;
  },

  /**
   * Test installation performance
   */
  async testInstallation(installFn: () => Promise<void>): Promise<number> {
    const timer = new PerformanceTimer();
    await timer.timeFunction('installation', installFn);
    const duration = timer.getResult('installation')!;
    
    expectPerformanceBenchmarks(
      { installationTime: duration },
      { installationTime: 30000 }
    );
    
    return duration;
  },
};