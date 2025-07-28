/**
 * Environment Helpers
 * 
 * Utilities for managing test environment state, temporary directories,
 * environment variables, and process state during tests.
 */

import { vi } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Temporary Directory Manager
 */
export class TempDirectoryManager {
  private tempDirs: string[] = [];
  private cleanupFunctions: Array<() => Promise<void>> = [];

  /**
   * Create a temporary directory for testing
   */
  async createTempDir(prefix: string = 'cctoast-test-'): Promise<string> {
    const tempDir = await mkdtemp(join(tmpdir(), prefix));
    this.tempDirs.push(tempDir);
    return tempDir;
  }

  /**
   * Create a temporary directory with specific structure
   */
  async createTempDirWithStructure(structure: {
    [path: string]: string | null; // null for directories, string for file content
  }, prefix: string = 'cctoast-test-'): Promise<string> {
    const tempDir = await this.createTempDir(prefix);
    
    for (const [relativePath, content] of Object.entries(structure)) {
      const fullPath = join(tempDir, relativePath);
      
      if (content === null) {
        // Create directory
        await mkdir(fullPath, { recursive: true });
      } else {
        // Create file with content
        const dir = fullPath.split('/').slice(0, -1).join('/');
        await mkdir(dir, { recursive: true });
        await writeFile(fullPath, content);
      }
    }
    
    return tempDir;
  }

  /**
   * Clean up all temporary directories
   */
  async cleanup(): Promise<void> {
    // Run custom cleanup functions first
    for (const cleanup of this.cleanupFunctions) {
      try {
        await cleanup();
      } catch (error) {
        console.warn('Cleanup function failed:', error);
      }
    }

    // Remove temporary directories
    for (const dir of this.tempDirs) {
      try {
        await rm(dir, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Failed to remove temp dir ${dir}:`, error);
      }
    }
    
    this.tempDirs = [];
    this.cleanupFunctions = [];
  }

  /**
   * Register a custom cleanup function
   */
  onCleanup(fn: () => Promise<void>): void {
    this.cleanupFunctions.push(fn);
  }

  /**
   * Get list of created temporary directories
   */
  getTempDirs(): string[] {
    return [...this.tempDirs];
  }
}

/**
 * Environment Variable Manager
 */
export class EnvironmentManager {
  private originalEnv: Record<string, string | undefined> = {};
  private modifiedKeys = new Set<string>();

  /**
   * Save current environment state
   */
  save(): void {
    this.originalEnv = { ...process.env };
    this.modifiedKeys.clear();
  }

  /**
   * Set environment variable for testing
   */
  set(key: string, value: string | undefined): void {
    if (!this.modifiedKeys.has(key) && !(key in this.originalEnv)) {
      this.originalEnv[key] = process.env[key];
    }
    
    this.modifiedKeys.add(key);
    
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  /**
   * Set multiple environment variables
   */
  setMultiple(env: Record<string, string | undefined>): void {
    Object.entries(env).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  /**
   * Restore original environment
   */
  restore(): void {
    for (const key of this.modifiedKeys) {
      if (key in this.originalEnv) {
        const originalValue = this.originalEnv[key];
        if (originalValue === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = originalValue;
        }
      }
    }
    
    this.modifiedKeys.clear();
    this.originalEnv = {};
  }

  /**
   * Setup WSL environment variables
   */
  setupWSL(version: 1 | 2 = 2, distro: string = 'Ubuntu-22.04'): void {
    this.set('WSL_DISTRO_NAME', distro);
    
    if (version === 2) {
      this.set('WSL_INTEROP', '/run/WSL/123_interop');
    } else {
      this.set('WSL_INTEROP', undefined);
    }
  }

  /**
   * Setup non-WSL environment (remove WSL variables)
   */
  setupNonWSL(): void {
    this.set('WSL_DISTRO_NAME', undefined);
    this.set('WSL_INTEROP', undefined);
  }

  /**
   * Setup PATH with PowerShell
   */
  setupPathWithPowerShell(): void {
    const currentPath = process.env.PATH || '';
    const powershellPath = '/mnt/c/Windows/System32/WindowsPowerShell/v1.0';
    
    if (!currentPath.includes(powershellPath)) {
      this.set('PATH', `${currentPath}:${powershellPath}`);
    }
  }

  /**
   * Setup PATH without PowerShell
   */
  setupPathWithoutPowerShell(): void {
    const currentPath = process.env.PATH || '';
    const pathParts = currentPath.split(':');
    const filteredPath = pathParts.filter(part => 
      !part.includes('PowerShell') && !part.includes('powershell')
    );
    
    this.set('PATH', filteredPath.join(':'));
  }

  /**
   * Get current modified keys
   */
  getModifiedKeys(): string[] {
    return Array.from(this.modifiedKeys);
  }
}

/**
 * Process State Manager
 */
export class ProcessStateManager {
  private originalArgv: string[] = [];
  private originalExit: typeof process.exit = process.exit;
  private mockExit = vi.fn();
  private signalHandlers = new Map<string, Array<(...args: any[]) => void>>();

  /**
   * Save original process state
   */
  save(): void {
    this.originalArgv = [...process.argv];
  }

  /**
   * Mock process.exit
   */
  mockProcessExit(): typeof this.mockExit {
    process.exit = this.mockExit as any;
    return this.mockExit;
  }

  /**
   * Set process.argv for testing
   */
  setArgv(argv: string[]): void {
    process.argv = [...argv];
  }

  /**
   * Mock signal handlers
   */
  mockSignalHandlers(): void {
    const originalOn = process.on.bind(process);
    
    vi.spyOn(process, 'on').mockImplementation((event: string, handler: any) => {
      if (typeof event === 'string' && event.startsWith('SIG')) {
        if (!this.signalHandlers.has(event)) {
          this.signalHandlers.set(event, []);
        }
        this.signalHandlers.get(event)!.push(handler);
        return process;
      }
      return originalOn(event, handler);
    });
  }

  /**
   * Trigger a mocked signal
   */
  triggerSignal(signal: string, ...args: any[]): void {
    const handlers = this.signalHandlers.get(signal) || [];
    handlers.forEach(handler => handler(...args));
  }

  /**
   * Restore original process state
   */
  restore(): void {
    process.argv = this.originalArgv;
    process.exit = this.originalExit;
    this.mockExit.mockClear();
    this.signalHandlers.clear();
    vi.restoreAllMocks();
  }

  /**
   * Get mock exit function
   */
  getMockExit(): typeof this.mockExit {
    return this.mockExit;
  }

  /**
   * Get registered signal handlers
   */
  getSignalHandlers(signal: string): Array<(...args: any[]) => void> {
    return this.signalHandlers.get(signal) || [];
  }
}

/**
 * Cache State Manager
 */
export class CacheManager {
  private tempDir: string | null = null;
  private cacheFiles = new Map<string, string>();

  /**
   * Setup temporary cache directory
   */
  async setup(tempDirManager: TempDirectoryManager): Promise<void> {
    this.tempDir = await tempDirManager.createTempDir('cctoast-cache-');
    
    // Register cleanup
    tempDirManager.onCleanup(async () => {
      this.cacheFiles.clear();
      this.tempDir = null;
    });
  }

  /**
   * Create cache file with content
   */
  async createCacheFile(filename: string, content: any): Promise<string> {
    if (!this.tempDir) {
      throw new Error('Cache manager not setup - call setup() first');
    }
    
    const cacheFile = join(this.tempDir, filename);
    const contentString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    
    await writeFile(cacheFile, contentString);
    this.cacheFiles.set(filename, cacheFile);
    
    return cacheFile;
  }

  /**
   * Get cache file path
   */
  getCacheFile(filename: string): string | undefined {
    return this.cacheFiles.get(filename);
  }

  /**
   * Get cache directory
   */
  getCacheDir(): string | null {
    return this.tempDir;
  }

  /**
   * List all cache files
   */
  listCacheFiles(): string[] {
    return Array.from(this.cacheFiles.keys());
  }
}

/**
 * Performance Timing Utilities
 */
export class PerformanceTimer {
  private timers = new Map<string, number>();
  private results = new Map<string, number>();

  /**
   * Start timing an operation
   */
  start(name: string): void {
    this.timers.set(name, performance.now());
  }

  /**
   * End timing and record result
   */
  end(name: string): number {
    const startTime = this.timers.get(name);
    if (startTime === undefined) {
      throw new Error(`Timer '${name}' not started`);
    }
    
    const duration = performance.now() - startTime;
    this.results.set(name, duration);
    this.timers.delete(name);
    
    return duration;
  }

  /**
   * Time a function execution
   */
  async timeFunction<T>(name: string, fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    this.start(name);
    const result = await fn();
    const duration = this.end(name);
    
    return { result, duration };
  }

  /**
   * Get all timing results
   */
  getResults(): Record<string, number> {
    return Object.fromEntries(this.results);
  }

  /**
   * Get specific timing result
   */
  getResult(name: string): number | undefined {
    return this.results.get(name);
  }

  /**
   * Clear all timers and results
   */
  clear(): void {
    this.timers.clear();
    this.results.clear();
  }

  /**
   * Get active timers
   */
  getActiveTimers(): string[] {
    return Array.from(this.timers.keys());
  }
}

/**
 * Combined Test Environment Manager
 */
export class TestEnvironment {
  public readonly tempDir = new TempDirectoryManager();
  public readonly env = new EnvironmentManager();
  public readonly process = new ProcessStateManager();
  public readonly cache = new CacheManager();
  public readonly perf = new PerformanceTimer();

  /**
   * Setup complete test environment
   */
  async setup(options: {
    wsl?: boolean;
    powershell?: boolean;
    tempDirs?: string[];
    envVars?: Record<string, string | undefined>;
    mockProcessExit?: boolean;
  } = {}): Promise<void> {
    const {
      wsl = true,
      powershell = true,
      tempDirs = [],
      envVars = {},
      mockProcessExit = true,
    } = options;

    // Save current state
    this.env.save();
    this.process.save();

    // Setup environment
    if (wsl) {
      this.env.setupWSL();
    } else {
      this.env.setupNonWSL();
    }

    if (powershell) {
      this.env.setupPathWithPowerShell();
    } else {
      this.env.setupPathWithoutPowerShell();
    }

    this.env.setMultiple(envVars);

    // Setup process
    if (mockProcessExit) {
      this.process.mockProcessExit();
    }

    // Setup cache
    await this.cache.setup(this.tempDir);

    // Create additional temp directories
    for (const prefix of tempDirs) {
      await this.tempDir.createTempDir(prefix);
    }
  }

  /**
   * Cleanup entire test environment
   */
  async cleanup(): Promise<void> {
    await this.tempDir.cleanup();
    this.env.restore();
    this.process.restore();
    this.perf.clear();
  }

  /**
   * Reset environment for next test
   */
  async reset(): Promise<void> {
    await this.cleanup();
    await this.setup();
  }

  /**
   * Create isolated test environment for a single test
   */
  static async create(options?: Parameters<TestEnvironment['setup']>[0]): Promise<TestEnvironment> {
    const env = new TestEnvironment();
    await env.setup(options);
    return env;
  }
}

/**
 * Convenience functions for common environment setups
 */

/**
 * Create WSL environment with PowerShell
 */
export async function createWSLEnvironment(): Promise<TestEnvironment> {
  return TestEnvironment.create({
    wsl: true,
    powershell: true,
  });
}

/**
 * Create non-WSL environment
 */
export async function createNonWSLEnvironment(): Promise<TestEnvironment> {
  return TestEnvironment.create({
    wsl: false,
    powershell: false,
  });
}

/**
 * Create WSL environment without PowerShell
 */
export async function createWSLNoPowerShellEnvironment(): Promise<TestEnvironment> {
  return TestEnvironment.create({
    wsl: true,
    powershell: false,
  });
}

/**
 * Time an async operation
 */
export async function timeAsync<T>(
  name: string,
  operation: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const timer = new PerformanceTimer();
  return timer.timeFunction(name, operation);
}

/**
 * Create temporary file structure for testing
 */
export async function createTempFileStructure(
  structure: Record<string, string | null>,
  prefix?: string
): Promise<{ path: string; cleanup: () => Promise<void> }> {
  const tempDir = new TempDirectoryManager();
  const path = await tempDir.createTempDirWithStructure(structure, prefix);
  
  return {
    path,
    cleanup: () => tempDir.cleanup(),
  };
}

/**
 * Mock console for testing
 */
export function mockConsole(): {
  log: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  restore: () => void;
} {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  const mockLog = vi.fn();
  const mockError = vi.fn();
  const mockWarn = vi.fn();

  console.log = mockLog as any;
  console.error = mockError as any;
  console.warn = mockWarn as any;

  return {
    log: mockLog,
    error: mockError,
    warn: mockWarn,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    },
  };
}