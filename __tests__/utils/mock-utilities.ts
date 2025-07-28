import { vi, type MockedFunction } from 'vitest';
import type { SpyInstance } from 'vitest';

/**
 * Standardized Mock Utilities for cctoast-wsl Test Suite
 * 
 * Provides consistent mock patterns and cleanup utilities across all test files.
 * Ensures reliable mock state management and reduces boilerplate in individual tests.
 */

// =============================================================================
// Types and Interfaces
// =============================================================================

export interface MockState {
  fs: MockedFileSystem;
  process: MockedProcess;
  childProcess: MockedChildProcess;
  console: MockedConsole;
  commander: MockedCommander;
  clackPrompts: MockedClackPrompts;
  dependencies: MockedDependencies;
}

export interface MockedFileSystem {
  promises: {
    readFile: MockedFunction<any>;
    writeFile: MockedFunction<any>;
    mkdir: MockedFunction<any>;
    chmod: MockedFunction<any>;
    stat: MockedFunction<any>;
    copyFile: MockedFunction<any>;
    unlink: MockedFunction<any>;
    access: MockedFunction<any>;
    readdir: MockedFunction<any>;
  };
  readFileSync: MockedFunction<any>;
  writeFileSync: MockedFunction<any>;
  existsSync: MockedFunction<any>;
  mkdirSync: MockedFunction<any>;
  chmodSync: MockedFunction<any>;
  constants: {
    F_OK: number;
    R_OK: number;
    W_OK: number;
    X_OK: number;
  };
}

export interface MockedProcess {
  argv: string[];
  exit: MockedFunction<any>;
  on: MockedFunction<any>;
  stdin: { isTTY: boolean };
  stdout: { isTTY: boolean };
  env: Record<string, string>;
}

export interface MockedChildProcess {
  spawn: MockedFunction<any>;
  exec: MockedFunction<any>;
  execSync: MockedFunction<any>;
}

export interface MockedConsole {
  log: SpyInstance;
  error: SpyInstance;
  warn: SpyInstance;
  info: SpyInstance;
}

export interface MockedCommander {
  name: MockedFunction<any>;
  description: MockedFunction<any>;
  version: MockedFunction<any>;
  option: MockedFunction<any>;
  addHelpText: MockedFunction<any>;
  parse: MockedFunction<any>;
  opts: MockedFunction<any>;
}

export interface MockedClackPrompts {
  intro: MockedFunction<any>;
  outro: MockedFunction<any>;
  select: MockedFunction<any>;
  multiselect: MockedFunction<any>;
  confirm: MockedFunction<any>;
  isCancel: MockedFunction<any>;
  cancel: MockedFunction<any>;
  log: {
    info: MockedFunction<any>;
    message: MockedFunction<any>;
  };
  spinner: MockedFunction<any>;
}

export interface MockedDependencies {
  DependencyChecker: MockedFunction<any>;
  BurntToastAutoInstaller: MockedFunction<any>;
  Installer: MockedFunction<any>;
  checker: {
    checkAll: MockedFunction<any>;
  };
  burntToastInstaller: {
    install: MockedFunction<any>;
    verify: MockedFunction<any>;
  };
  installer: {
    install: MockedFunction<any>;
    uninstall: MockedFunction<any>;
  };
}

// =============================================================================
// Core Mock Setup Functions
// =============================================================================

/**
 * Creates standardized filesystem mocks with default successful behaviors
 */
export function createFileSystemMocks(): MockedFileSystem {
  return {
    promises: {
      readFile: vi.fn().mockResolvedValue('{}'),
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
      chmod: vi.fn().mockResolvedValue(undefined),
      stat: vi.fn().mockResolvedValue({ isFile: () => true, mode: 0o644 }),
      copyFile: vi.fn().mockResolvedValue(undefined),
      unlink: vi.fn().mockResolvedValue(undefined),
      access: vi.fn().mockResolvedValue(undefined),
      readdir: vi.fn().mockResolvedValue([]),
    },
    readFileSync: vi.fn().mockReturnValue('{}'),
    writeFileSync: vi.fn(),
    existsSync: vi.fn().mockReturnValue(false),
    mkdirSync: vi.fn(),
    chmodSync: vi.fn(),
    constants: {
      F_OK: 0,
      R_OK: 4,
      W_OK: 2,
      X_OK: 1,
    },
  };
}

/**
 * Creates standardized process mocks with WSL environment defaults
 */
export function createProcessMocks(): MockedProcess {
  return {
    argv: ['node', 'cctoast-wsl'],
    exit: vi.fn().mockImplementation(() => undefined as never),
    on: vi.fn().mockImplementation(() => process),
    stdin: { isTTY: true },
    stdout: { isTTY: true },
    env: {
      NODE_ENV: 'test',
      HOME: '/home/testuser',
      WSL_DISTRO_NAME: 'Ubuntu-22.04',
      WSL_INTEROP: '/run/WSL/123_interop',
    },
  };
}

/**
 * Creates standardized child_process mocks with PowerShell simulation
 */
export function createChildProcessMocks(): MockedChildProcess {
  return {
    spawn: vi.fn(),
    exec: vi.fn(),
    execSync: vi.fn().mockImplementation((cmd: string) => {
      if (cmd.includes('powershell.exe')) {
        return Buffer.from('PowerShell available');
      }
      if (cmd.includes('wslpath')) {
        return Buffer.from('C:\\converted\\path');
      }
      throw new Error('Command not found');
    }),
  };
}

/**
 * Creates standardized console mocks that capture output without noise
 */
export function createConsoleMocks(): MockedConsole {
  return {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
  };
}

/**
 * Creates standardized Commander.js mocks with chainable API
 */
export function createCommanderMocks(): MockedCommander {
  const commander = {
    name: vi.fn(),
    description: vi.fn(),
    version: vi.fn(),
    option: vi.fn(),
    addHelpText: vi.fn(),
    parse: vi.fn(),
    opts: vi.fn().mockReturnValue({}),
  };

  // Make all methods chainable except opts
  Object.keys(commander).forEach(key => {
    if (key !== 'opts' && key !== 'parse') {
      (commander as any)[key].mockReturnThis();
    }
  });

  return commander;
}

/**
 * Creates standardized @clack/prompts mocks with happy path defaults
 */
export function createClackPromptsMocks(): MockedClackPrompts {
  return {
    intro: vi.fn(),
    outro: vi.fn(),
    select: vi.fn().mockResolvedValue('global'),
    multiselect: vi.fn().mockResolvedValue(['notification', 'stop']),
    confirm: vi.fn().mockResolvedValue(true),
    isCancel: vi.fn().mockReturnValue(false),
    cancel: vi.fn(),
    log: {
      info: vi.fn(),
      message: vi.fn(),
    },
    spinner: vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn(),
    })),
  };
}

/**
 * Creates standardized dependency and installer mocks with success defaults
 */
export function createDependencyMocks(): MockedDependencies {
  const checker = {
    checkAll: vi.fn().mockResolvedValue([
      { name: 'wsl-environment', passed: true, fatal: true, message: 'WSL detected' },
      { name: 'powershell-exe', passed: true, fatal: true, message: 'PowerShell available' },
      { name: 'burnttoast-module', passed: true, fatal: true, message: 'BurntToast installed' },
    ]),
  };

  const burntToastInstaller = {
    install: vi.fn().mockResolvedValue(true),
    verify: vi.fn().mockResolvedValue(true),
  };

  const installer = {
    install: vi.fn().mockResolvedValue({
      success: true,
      installedTo: '/home/testuser/.claude/cctoast-wsl',
      settingsPath: '/home/testuser/.claude/settings.json',
      backupPath: '/home/testuser/.claude/settings.json.backup',
      hooksAdded: ['notification', 'stop'],
      message: 'Successfully installed cctoast-wsl',
    }),
    uninstall: vi.fn().mockResolvedValue({
      success: true,
      installedTo: '/home/testuser/.claude/cctoast-wsl',
      settingsPath: '/home/testuser/.claude/settings.json',
      hooksAdded: [],
      message: 'Successfully uninstalled cctoast-wsl',
    }),
  };

  return {
    DependencyChecker: vi.fn(() => checker),
    BurntToastAutoInstaller: vi.fn(() => burntToastInstaller),
    Installer: vi.fn(() => installer),
    checker,
    burntToastInstaller,
    installer,
  };
}

// =============================================================================
// Mock State Management
// =============================================================================

/**
 * Creates a complete mock state with all common mocks initialized
 */
export function createMockState(): MockState {
  return {
    fs: createFileSystemMocks(),
    process: createProcessMocks(),
    childProcess: createChildProcessMocks(),
    console: createConsoleMocks(),
    commander: createCommanderMocks(),
    clackPrompts: createClackPromptsMocks(),
    dependencies: createDependencyMocks(),
  };
}

/**
 * Applies all mocks in the mock state to their respective modules
 */
export function applyMockState(mockState: MockState): void {
  // Note: Module mocking is typically done at the top level of test files
  // This function would be used in setupFiles, not individual tests
  vi.doMock('fs', () => mockState.fs);
  vi.doMock('child_process', () => mockState.childProcess);
  vi.doMock('commander', () => ({ Command: vi.fn(() => mockState.commander) }));
  vi.doMock('@clack/prompts', () => mockState.clackPrompts);
}

/**
 * Resets all mocks in the state to their initial values
 */
export function resetMockState(mockState: MockState): void {
  Object.values(mockState.fs.promises).forEach(mock => mock.mockClear());
  mockState.fs.readFileSync.mockClear();
  mockState.fs.writeFileSync.mockClear();
  mockState.fs.existsSync.mockClear();
  mockState.fs.mkdirSync.mockClear();
  mockState.fs.chmodSync.mockClear();

  mockState.process.exit.mockClear();
  mockState.process.on.mockClear();

  Object.values(mockState.childProcess).forEach(mock => mock.mockClear());
  Object.values(mockState.console).forEach(mock => mock.mockClear());
  Object.values(mockState.commander).forEach(mock => mock.mockClear());
  Object.values(mockState.clackPrompts).forEach(mock => {
    if (typeof mock === 'function') mock.mockClear();
  });
  Object.values(mockState.clackPrompts.log).forEach(mock => mock.mockClear());

  mockState.dependencies.checker.checkAll.mockClear();
  mockState.dependencies.burntToastInstaller.install.mockClear();
  mockState.dependencies.burntToastInstaller.verify.mockClear();
  mockState.dependencies.installer.install.mockClear();
  mockState.dependencies.installer.uninstall.mockClear();
}

/**
 * Restores all mocks in the state (cleanup for afterEach)
 */
export function restoreMockState(mockState: MockState): void {
  Object.values(mockState.console).forEach(mock => mock.mockRestore());
}

// =============================================================================
// Specialized Mock Helpers
// =============================================================================

/**
 * Mock setup for PowerShell environment testing
 */
export function mockPowerShellEnvironment(mockState: MockState, options: {
  available?: boolean;
  executionPolicyRestricted?: boolean;
  burntToastInstalled?: boolean;
} = {}): void {
  const {
    available = true,
    executionPolicyRestricted = false,
    burntToastInstalled = true,
  } = options;

  mockState.childProcess.execSync.mockImplementation((cmd: string) => {
    if (cmd.includes('powershell.exe')) {
      if (!available) throw new Error('PowerShell not found');
      
      if (cmd.includes('Get-ExecutionPolicy')) {
        return Buffer.from(executionPolicyRestricted ? 'Restricted' : 'RemoteSigned');
      }
      
      if (cmd.includes('Get-Module') && cmd.includes('BurntToast')) {
        if (!burntToastInstalled) throw new Error('Module not found');
        return Buffer.from('BurntToast 0.8.5');
      }
      
      return Buffer.from('success');
    }
    throw new Error('Command not found');
  });
}

/**
 * Mock setup for file system scenarios (permissions, missing files, etc.)
 */
export function mockFileSystemScenario(mockState: MockState, scenario: 
  | 'clean-install'
  | 'existing-installation' 
  | 'permission-denied'
  | 'disk-full'
  | 'corrupted-settings'
): void {
  switch (scenario) {
    case 'clean-install':
      mockState.fs.existsSync.mockReturnValue(false);
      mockState.fs.promises.readFile.mockRejectedValue(new Error('ENOENT: no such file'));
      break;

    case 'existing-installation':
      mockState.fs.existsSync.mockReturnValue(true);
      mockState.fs.promises.readFile.mockImplementation((path: string) => {
        if (path.includes('settings.json')) {
          return Promise.resolve(JSON.stringify({
            hooks: {
              notification: ['/home/testuser/.claude/cctoast-wsl/show-toast.sh --notification-hook'],
              other: ['existing-hook']
            }
          }));
        }
        return Promise.resolve('');
      });
      break;

    case 'permission-denied':
      mockState.fs.promises.mkdir.mockRejectedValue(new Error('EACCES: permission denied'));
      mockState.fs.promises.writeFile.mockRejectedValue(new Error('EACCES: permission denied'));
      mockState.fs.promises.chmod.mockRejectedValue(new Error('EACCES: permission denied'));
      break;

    case 'disk-full':
      mockState.fs.promises.writeFile.mockRejectedValue(new Error('ENOSPC: no space left on device'));
      mockState.fs.promises.copyFile.mockRejectedValue(new Error('ENOSPC: no space left on device'));
      break;

    case 'corrupted-settings':
      mockState.fs.promises.readFile.mockImplementation((path: string) => {
        if (path.includes('settings.json')) {
          return Promise.resolve('{ invalid json }');
        }
        return Promise.resolve('{}');
      });
      break;
  }
}

/**
 * Mock setup for interactive terminal scenarios
 */
export function mockTerminalEnvironment(mockState: MockState, options: {
  interactive?: boolean;
  hasExplicitFlags?: boolean;
  quiet?: boolean;
} = {}): void {
  const { interactive = true, hasExplicitFlags = false, quiet = false } = options;

  mockState.process.stdin.isTTY = interactive;
  mockState.process.stdout.isTTY = interactive;

  if (hasExplicitFlags) {
    mockState.process.argv = ['node', 'cctoast-wsl', '--global'];
  } else {
    mockState.process.argv = ['node', 'cctoast-wsl'];
  }

  if (quiet) {
    mockState.commander.opts.mockReturnValue({
      ...mockState.commander.opts(),
      quiet: true,
    });
  }
}

/**
 * Sets up signal handler mocks for testing Ctrl+C behavior
 */
export function mockSignalHandling(mockState: MockState): {
  triggerSIGINT: () => void;
  triggerSIGTERM: () => void;
} {
  let sigintHandler: Function | undefined;
  let sigtermHandler: Function | undefined;

  mockState.process.on.mockImplementation((signal: string, handler: Function) => {
    if (signal === 'SIGINT') {
      sigintHandler = handler;
    } else if (signal === 'SIGTERM') {
      sigtermHandler = handler;
    }
    return process as any;
  });

  return {
    triggerSIGINT: () => sigintHandler?.(),
    triggerSIGTERM: () => sigtermHandler?.(),
  };
}

/**
 * Mock setup for date/time-dependent operations (caching, timestamps)
 */
export function mockTimeEnvironment(fixedTimestamp?: number): {
  mockDate: any;
  restore: () => void;
} {
  const timestamp = fixedTimestamp || Date.now();
  const mockDate = vi.spyOn(Date, 'now').mockReturnValue(timestamp);

  return {
    mockDate,
    restore: () => mockDate.mockRestore(),
  };
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validates that all required mocks are properly set up
 */
export function validateMockState(mockState: MockState): boolean {
  const requiredMocks = [
    mockState.fs.promises.readFile,
    mockState.fs.promises.writeFile,
    mockState.process.exit,
    mockState.childProcess.execSync,
    mockState.console.log,
    mockState.commander.opts,
    mockState.dependencies.checker.checkAll,
  ];

  return requiredMocks.every(mock => vi.isMockFunction(mock));
}

/**
 * Checks if a mock has been called with specific patterns
 */
export function wasMockCalledWith(mock: MockedFunction<any>, patterns: Array<string | RegExp>): boolean {
  return mock.mock.calls.some(call => 
    patterns.every(pattern => 
      call.some((arg: any) => {
        const str = typeof arg === 'string' ? arg : JSON.stringify(arg);
        return typeof pattern === 'string' ? str.includes(pattern) : pattern.test(str);
      })
    )
  );
}

/**
 * Gets mock call count for common operations
 */
export function getMockCallCounts(mockState: MockState): Record<string, number> {
  return {
    fsRead: mockState.fs.promises.readFile.mock.calls.length,
    fsWrite: mockState.fs.promises.writeFile.mock.calls.length,
    fsMkdir: mockState.fs.promises.mkdir.mock.calls.length,
    processExit: mockState.process.exit.mock.calls.length,
    consoleLog: mockState.console.log.mock.calls.length,
    consoleError: mockState.console.error.mock.calls.length,
    dependencyCheck: mockState.dependencies.checker.checkAll.mock.calls.length,
    install: mockState.dependencies.installer.install.mock.calls.length,
  };
}