/**
 * Integration Helpers
 * 
 * Utilities for integration testing including virtual file systems,
 * child process mocking, configuration builders, and cross-test communication.
 */

import { vi, type MockedFunction } from 'vitest';
import { EventEmitter } from 'node:events';
import type { SpawnOptions } from 'node:child_process';

/**
 * Virtual File System for Integration Testing
 */
export class VirtualFileSystem {
  private files = new Map<string, string>();
  private directories = new Set<string>();
  private permissions = new Map<string, number>();
  private timestamps = new Map<string, number>();

  /**
   * Create a file in the virtual filesystem
   */
  createFile(path: string, content: string, permissions: number = 0o644): void {
    this.files.set(path, content);
    this.permissions.set(path, permissions);
    this.timestamps.set(path, Date.now());
    
    // Ensure parent directories exist
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i++) {
      const dirPath = parts.slice(0, i + 1).join('/');
      this.directories.add(dirPath);
    }
  }

  /**
   * Create a directory in the virtual filesystem
   */
  createDirectory(path: string, permissions: number = 0o755): void {
    this.directories.add(path);
    this.permissions.set(path, permissions);
    this.timestamps.set(path, Date.now());
  }

  /**
   * Read file content
   */
  readFile(path: string): string {
    if (!this.files.has(path)) {
      const error = new Error(`ENOENT: no such file or directory, open '${path}'`) as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      error.errno = -2;
      error.path = path;
      throw error;
    }
    return this.files.get(path)!;
  }

  /**
   * Write file content
   */
  writeFile(path: string, content: string, permissions?: number): void {
    this.createFile(path, content, permissions);
  }

  /**
   * Check if file/directory exists
   */
  exists(path: string): boolean {
    return this.files.has(path) || this.directories.has(path);
  }

  /**
   * List directory contents
   */
  readDir(path: string): string[] {
    if (!this.directories.has(path)) {
      const error = new Error(`ENOENT: no such file or directory, scandir '${path}'`) as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      error.errno = -2;
      error.path = path;
      throw error;
    }

    const contents: string[] = [];
    const prefix = path === '/' ? '/' : path + '/';

    // Find direct children
    for (const filePath of this.files.keys()) {
      if (filePath.startsWith(prefix)) {
        const relative = filePath.slice(prefix.length);
        if (!relative.includes('/')) {
          contents.push(relative);
        }
      }
    }

    for (const dirPath of this.directories.keys()) {
      if (dirPath.startsWith(prefix) && dirPath !== path) {
        const relative = dirPath.slice(prefix.length);
        if (!relative.includes('/')) {
          contents.push(relative);
        }
      }
    }

    return [...new Set(contents)];
  }

  /**
   * Get file/directory stats
   */
  stat(path: string): {
    isFile: () => boolean;
    isDirectory: () => boolean;
    mode: number;
    mtime: Date;
    size: number;
  } {
    if (!this.exists(path)) {
      const error = new Error(`ENOENT: no such file or directory, stat '${path}'`) as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      error.errno = -2;
      error.path = path;
      throw error;
    }

    const isFile = this.files.has(path);
    const permissions = this.permissions.get(path) || (isFile ? 0o644 : 0o755);
    const timestamp = this.timestamps.get(path) || Date.now();
    const content = this.files.get(path) || '';

    return {
      isFile: () => isFile,
      isDirectory: () => !isFile,
      mode: permissions,
      mtime: new Date(timestamp),
      size: content.length,
    };
  }

  /**
   * Remove file or directory
   */
  remove(path: string): void {
    this.files.delete(path);
    this.directories.delete(path);
    this.permissions.delete(path);
    this.timestamps.delete(path);
  }

  /**
   * Set file permissions
   */
  chmod(path: string, permissions: number): void {
    if (!this.exists(path)) {
      const error = new Error(`ENOENT: no such file or directory, chmod '${path}'`) as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      error.errno = -2;
      error.path = path;
      throw error;
    }
    this.permissions.set(path, permissions);
  }

  /**
   * Create mocked fs methods
   */
  createMocks(): {
    readFile: MockedFunction<any>;
    writeFile: MockedFunction<any>;
    mkdir: MockedFunction<any>;
    access: MockedFunction<any>;
    stat: MockedFunction<any>;
    readdir: MockedFunction<any>;
    unlink: MockedFunction<any>;
    chmod: MockedFunction<any>;
    readFileSync: MockedFunction<any>;
    writeFileSync: MockedFunction<any>;
    existsSync: MockedFunction<any>;
    mkdirSync: MockedFunction<any>;
    chmodSync: MockedFunction<any>;
  } {
    const readFile = vi.fn().mockImplementation((path: string) => {
      return Promise.resolve(this.readFile(path));
    });

    const writeFile = vi.fn().mockImplementation((path: string, content: string) => {
      this.writeFile(path, content);
      return Promise.resolve();
    });

    const mkdir = vi.fn().mockImplementation((path: string, options?: any) => {
      this.createDirectory(path);
      return Promise.resolve();
    });

    const access = vi.fn().mockImplementation((path: string) => {
      if (!this.exists(path)) {
        const error = new Error(`ENOENT: no such file or directory, access '${path}'`) as NodeJS.ErrnoException;
        error.code = 'ENOENT';
        return Promise.reject(error);
      }
      return Promise.resolve();
    });

    const stat = vi.fn().mockImplementation((path: string) => {
      return Promise.resolve(this.stat(path));
    });

    const readdir = vi.fn().mockImplementation((path: string) => {
      return Promise.resolve(this.readDir(path));
    });

    const unlink = vi.fn().mockImplementation((path: string) => {
      this.remove(path);
      return Promise.resolve();
    });

    const chmod = vi.fn().mockImplementation((path: string, permissions: number) => {
      this.chmod(path, permissions);
      return Promise.resolve();
    });

    // Sync versions
    const readFileSync = vi.fn().mockImplementation((path: string) => {
      return this.readFile(path);
    });

    const writeFileSync = vi.fn().mockImplementation((path: string, content: string) => {
      this.writeFile(path, content);
    });

    const existsSync = vi.fn().mockImplementation((path: string) => {
      return this.exists(path);
    });

    const mkdirSync = vi.fn().mockImplementation((path: string, options?: any) => {
      this.createDirectory(path);
    });

    const chmodSync = vi.fn().mockImplementation((path: string, permissions: number) => {
      this.chmod(path, permissions);
    });

    return {
      readFile,
      writeFile,
      mkdir,
      access,
      stat,
      readdir,
      unlink,
      chmod,
      readFileSync,
      writeFileSync,
      existsSync,
      mkdirSync,
      chmodSync,
    };
  }

  /**
   * Load file structure from object
   */
  loadStructure(structure: Record<string, string | null>): void {
    for (const [path, content] of Object.entries(structure)) {
      if (content === null) {
        this.createDirectory(path);
      } else {
        this.createFile(path, content);
      }
    }
  }

  /**
   * Export current structure to object
   */
  exportStructure(): Record<string, string | null> {
    const structure: Record<string, string | null> = {};

    for (const [path, content] of this.files.entries()) {
      structure[path] = content;
    }

    for (const path of this.directories.keys()) {
      if (!structure[path]) {
        structure[path] = null;
      }
    }

    return structure;
  }

  /**
   * Reset virtual filesystem
   */
  clear(): void {
    this.files.clear();
    this.directories.clear();
    this.permissions.clear();
    this.timestamps.clear();
  }
}

/**
 * Child Process Mock Manager
 */
export class ChildProcessMocker {
  private processes = new Map<string, MockProcess>();
  private globalHandlers = new Map<string, (command: string) => MockProcess>();

  /**
   * Mock process execution
   */
  mockProcess(command: string | RegExp, response: {
    stdout?: string;
    stderr?: string;
    exitCode?: number;
    error?: Error;
    delay?: number;
  }): MockProcess {
    const process = new MockProcess(response);
    
    if (command instanceof RegExp) {
      this.globalHandlers.set(command.source, (cmd: string) => {
        return command.test(cmd) ? process : this.createNotFoundProcess();
      });
    } else {
      this.processes.set(command, process);
    }

    return process;
  }

  /**
   * Create mocked child_process functions
   */
  createMocks(): {
    spawn: MockedFunction<any>;
    exec: MockedFunction<any>;
    execSync: MockedFunction<any>;
  } {
    const spawn = vi.fn().mockImplementation((command: string, args?: string[], options?: SpawnOptions) => {
      const fullCommand = [command, ...(args || [])].join(' ');
      return this.getProcess(fullCommand);
    });

    const exec = vi.fn().mockImplementation((command: string, callback?: Function) => {
      const process = this.getProcess(command);
      
      if (callback) {
        setTimeout(() => {
          if (process.mockResponse.error) {
            callback(process.mockResponse.error, null, null);
          } else {
            callback(null, process.mockResponse.stdout || '', process.mockResponse.stderr || '');
          }
        }, process.mockResponse.delay || 0);
      }

      return process;
    });

    const execSync = vi.fn().mockImplementation((command: string) => {
      const process = this.getProcess(command);
      
      if (process.mockResponse.error) {
        throw process.mockResponse.error;
      }

      if (process.mockResponse.exitCode !== 0) {
        const error = new Error(`Command failed: ${command}`) as any;
        error.status = process.mockResponse.exitCode;
        error.stdout = Buffer.from(process.mockResponse.stdout || '');
        error.stderr = Buffer.from(process.mockResponse.stderr || '');
        throw error;
      }

      return Buffer.from(process.mockResponse.stdout || '');
    });

    return { spawn, exec, execSync };
  }

  /**
   * Get process for command
   */
  private getProcess(command: string): MockProcess {
    // Check exact matches first
    if (this.processes.has(command)) {
      return this.processes.get(command)!;
    }

    // Check regex handlers
    for (const [pattern, handler] of this.globalHandlers.entries()) {
      if (new RegExp(pattern).test(command)) {
        return handler(command);
      }
    }

    // Return not found process
    return this.createNotFoundProcess();
  }

  /**
   * Create a process that simulates command not found
   */
  private createNotFoundProcess(): MockProcess {
    return new MockProcess({
      error: new Error('Command not found'),
      exitCode: 127,
      stderr: 'Command not found',
    });
  }

  /**
   * Clear all mocked processes
   */
  clear(): void {
    this.processes.clear();
    this.globalHandlers.clear();
  }

  /**
   * Get list of mocked commands
   */
  getMockedCommands(): string[] {
    return Array.from(this.processes.keys());
  }
}

/**
 * Mock Process Implementation
 */
export class MockProcess extends EventEmitter {
  public stdout = new EventEmitter();
  public stderr = new EventEmitter();
  public stdin = new EventEmitter();
  public pid = Math.floor(Math.random() * 10000);
  public exitCode: number | null = null;
  public killed = false;

  constructor(public mockResponse: {
    stdout?: string;
    stderr?: string;
    exitCode?: number;
    error?: Error;
    delay?: number;
  }) {
    super();

    // Simulate async process execution
    setTimeout(() => {
      if (this.mockResponse.stdout) {
        this.stdout.emit('data', Buffer.from(this.mockResponse.stdout));
      }

      if (this.mockResponse.stderr) {
        this.stderr.emit('data', Buffer.from(this.mockResponse.stderr));
      }

      this.exitCode = this.mockResponse.exitCode || 0;

      if (this.mockResponse.error) {
        this.emit('error', this.mockResponse.error);
      } else {
        this.emit('close', this.exitCode);
        this.emit('exit', this.exitCode);
      }
    }, this.mockResponse.delay || 10);
  }

  /**
   * Mock kill method
   */
  kill(signal?: string): boolean {
    this.killed = true;
    this.emit('close', null);
    return true;
  }

  /**
   * Mock ref/unref methods
   */
  ref(): this {
    return this;
  }

  unref(): this {
    return this;
  }
}

/**
 * Configuration Builder for Integration Tests
 */
export class ConfigurationBuilder {
  private config: any = {};

  /**
   * Create CLI options configuration
   */
  static cli(): ConfigurationBuilder {
    return new ConfigurationBuilder().set('type', 'cli');
  }

  /**
   * Create settings configuration
   */
  static settings(): ConfigurationBuilder {
    return new ConfigurationBuilder().set('type', 'settings');
  }

  /**
   * Create dependency check configuration
   */
  static dependencies(): ConfigurationBuilder {
    return new ConfigurationBuilder().set('type', 'dependencies');
  }

  /**
   * Set configuration value
   */
  set(key: string, value: any): this {
    this.config[key] = value;
    return this;
  }

  /**
   * Merge configuration object
   */
  merge(config: Record<string, any>): this {
    Object.assign(this.config, config);
    return this;
  }

  /**
   * Set global installation
   */
  global(): this {
    return this.set('global', true).set('local', false);
  }

  /**
   * Set local installation
   */
  local(): this {
    return this.set('global', false).set('local', true);
  }

  /**
   * Enable notification hooks
   */
  withNotifications(): this {
    return this.set('notification', true);
  }

  /**
   * Enable stop hooks
   */
  withStopHooks(): this {
    return this.set('stop', true);
  }

  /**
   * Enable dry run mode
   */
  dryRun(): this {
    return this.set('dryRun', true);
  }

  /**
   * Enable force mode
   */
  force(): this {
    return this.set('force', true);
  }

  /**
   * Enable quiet mode
   */
  quiet(): this {
    return this.set('quiet', true);
  }

  /**
   * Build final configuration
   */
  build(): any {
    return { ...this.config };
  }
}

/**
 * Cross-Test Communication Channel
 */
export class TestCommunicator {
  private static instance: TestCommunicator;
  private channels = new Map<string, EventEmitter>();
  private data = new Map<string, any>();

  static getInstance(): TestCommunicator {
    if (!TestCommunicator.instance) {
      TestCommunicator.instance = new TestCommunicator();
    }
    return TestCommunicator.instance;
  }

  /**
   * Create or get communication channel
   */
  channel(name: string): EventEmitter {
    if (!this.channels.has(name)) {
      this.channels.set(name, new EventEmitter());
    }
    return this.channels.get(name)!;
  }

  /**
   * Send message on channel
   */
  send(channel: string, event: string, data?: any): void {
    const ch = this.channel(channel);
    ch.emit(event, data);
  }

  /**
   * Listen for messages on channel
   */
  listen(channel: string, event: string, handler: (data?: any) => void): void {
    const ch = this.channel(channel);
    ch.on(event, handler);
  }

  /**
   * Store shared data
   */
  store(key: string, value: any): void {
    this.data.set(key, value);
  }

  /**
   * Retrieve shared data
   */
  retrieve(key: string): any {
    return this.data.get(key);
  }

  /**
   * Wait for event on channel
   */
  waitFor(channel: string, event: string, timeout: number = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      const ch = this.channel(channel);
      let timer: NodeJS.Timeout;

      const handler = (data: any) => {
        clearTimeout(timer);
        resolve(data);
      };

      ch.once(event, handler);

      timer = setTimeout(() => {
        ch.off(event, handler);
        reject(new Error(`Timeout waiting for event '${event}' on channel '${channel}'`));
      }, timeout);
    });
  }

  /**
   * Clear all channels and data
   */
  clear(): void {
    this.channels.forEach(channel => channel.removeAllListeners());
    this.channels.clear();
    this.data.clear();
  }

  /**
   * Get active channels
   */
  getChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}

/**
 * Integration Test Cleanup Verification
 */
export class CleanupVerifier {
  private initialState = new Map<string, any>();
  private cleanupFunctions: Array<() => Promise<void> | void> = [];

  /**
   * Capture initial state
   */
  captureInitialState(name: string, getValue: () => any): void {
    this.initialState.set(name, getValue());
  }

  /**
   * Register cleanup function
   */
  registerCleanup(fn: () => Promise<void> | void): void {
    this.cleanupFunctions.push(fn);
  }

  /**
   * Verify cleanup was successful
   */
  async verifyCleanup(): Promise<void> {
    // Run all cleanup functions
    for (const cleanup of this.cleanupFunctions) {
      await cleanup();
    }

    // Verify state restoration
    const failures: string[] = [];
    for (const [name, initialValue] of this.initialState.entries()) {
      const currentValue = this.getCurrentValue(name);
      if (JSON.stringify(currentValue) !== JSON.stringify(initialValue)) {
        failures.push(`${name}: expected ${JSON.stringify(initialValue)}, got ${JSON.stringify(currentValue)}`);
      }
    }

    if (failures.length > 0) {
      throw new Error(`Cleanup verification failed:\n${failures.join('\n')}`);
    }
  }

  /**
   * Get current value for comparison
   */
  private getCurrentValue(name: string): any {
    // This is a placeholder - in real implementation, you'd have
    // specific logic to get current values for different state types
    return null;
  }

  /**
   * Clear verifier state
   */
  clear(): void {
    this.initialState.clear();
    this.cleanupFunctions = [];
  }
}

/**
 * Convenience Functions
 */

/**
 * Create complete integration test setup
 */
export function createIntegrationSetup(): {
  vfs: VirtualFileSystem;
  childProcess: ChildProcessMocker;
  config: typeof ConfigurationBuilder;
  communicator: TestCommunicator;
  cleanup: CleanupVerifier;
} {
  return {
    vfs: new VirtualFileSystem(),
    childProcess: new ChildProcessMocker(),
    config: ConfigurationBuilder,
    communicator: TestCommunicator.getInstance(),
    cleanup: new CleanupVerifier(),
  };
}

/**
 * Mock full CLI environment for integration testing
 */
export function mockCliEnvironment(options: {
  wsl?: boolean;
  powershell?: boolean;
  burnttoast?: boolean;
  files?: Record<string, string | null>;
} = {}) {
  const {
    wsl = true,
    powershell = true,
    burnttoast = true,
    files = {},
  } = options;

  const setup = createIntegrationSetup();

  // Setup virtual filesystem
  if (Object.keys(files).length > 0) {
    setup.vfs.loadStructure(files);
  }

  // Setup child process mocks
  if (powershell) {
    setup.childProcess.mockProcess(/powershell\.exe.*Get-Module/, {
      stdout: burnttoast ? 'BurntToast 0.8.5' : '',
      exitCode: burnttoast ? 0 : 1,
    });

    setup.childProcess.mockProcess(/powershell\.exe.*New-BurntToastNotification/, {
      stdout: 'Toast notification sent',
      exitCode: 0,
    });

    setup.childProcess.mockProcess(/powershell\.exe.*Install-Module/, {
      stdout: 'Installation completed',
      exitCode: 0,
    });
  }

  return setup;
}