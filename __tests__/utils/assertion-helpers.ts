/**
 * Assertion Helpers
 * 
 * Provides specialized assertion functions for common testing scenarios
 * with detailed error messages and type safety.
 */

import { expect } from 'vitest';
import type { MockedFunction } from 'vitest';

/**
 * Assert file permissions are correctly set
 */
export function expectFilePermissions(
  mockChmod: MockedFunction<any>,
  filePath: string,
  expectedPermissions: number = 0o500
): void {
  expect(mockChmod).toHaveBeenCalledWith(filePath, expectedPermissions);
}

/**
 * Assert multiple file permissions at once
 */
export function expectFilePermissionsBatch(
  mockChmod: MockedFunction<any>,
  files: Array<{ path: string; permissions: number }>
): void {
  files.forEach(({ path, permissions }) => {
    expect(mockChmod).toHaveBeenCalledWith(path, permissions);
  });
}

/**
 * Assert JSON deep equality while ignoring formatting differences
 */
export function expectJsonEqual(actual: any, expected: any): void {
  expect(JSON.parse(JSON.stringify(actual))).toEqual(
    JSON.parse(JSON.stringify(expected))
  );
}

/**
 * Assert JSON contains specific hooks
 */
export function expectSettingsContainHooks(
  settings: any,
  expectedHooks: {
    notification?: string[];
    stop?: string[];
  }
): void {
  expect(settings).toHaveProperty('hooks');
  
  if (expectedHooks.notification) {
    expect(settings.hooks).toHaveProperty('notification');
    expectedHooks.notification.forEach(hook => {
      expect(settings.hooks.notification).toContain(hook);
    });
  }
  
  if (expectedHooks.stop) {
    expect(settings.hooks).toHaveProperty('stop');
    expectedHooks.stop.forEach(hook => {
      expect(settings.hooks.stop).toContain(hook);
    });
  }
}

/**
 * Assert settings preserve existing hooks
 */
export function expectSettingsPreserveExisting(
  originalSettings: any,
  mergedSettings: any
): void {
  if (originalSettings.hooks?.notification) {
    originalSettings.hooks.notification.forEach((hook: string) => {
      expect(mergedSettings.hooks.notification).toContain(hook);
    });
  }
  
  if (originalSettings.hooks?.stop) {
    originalSettings.hooks.stop.forEach((hook: string) => {
      expect(mergedSettings.hooks.stop).toContain(hook);
    });
  }
}

/**
 * Assert no duplicate hooks in settings
 */
export function expectNoDuplicateHooks(settings: any): void {
  if (settings.hooks?.notification) {
    const hooks = settings.hooks.notification;
    expect(hooks).toHaveLength(new Set(hooks).size);
  }
  
  if (settings.hooks?.stop) {
    const hooks = settings.hooks.stop;
    expect(hooks).toHaveLength(new Set(hooks).size);
  }
}

/**
 * Assert error message contains specific information
 */
export function expectErrorMessage(
  error: Error,
  expectedSubstrings: string[]
): void {
  expectedSubstrings.forEach(substring => {
    expect(error.message.toLowerCase()).toContain(substring.toLowerCase());
  });
}

/**
 * Assert error has specific properties
 */
export function expectErrorProperties(
  error: any,
  expectedProperties: Record<string, any>
): void {
  Object.entries(expectedProperties).forEach(([key, value]) => {
    expect(error).toHaveProperty(key, value);
  });
}

/**
 * Assert process exit was called with specific code
 */
export function expectProcessExit(
  mockExit: MockedFunction<any>,
  expectedCode: number
): void {
  expect(mockExit).toHaveBeenCalledWith(expectedCode);
}

/**
 * Assert console output contains specific messages
 */
export function expectConsoleOutput(
  mockConsole: MockedFunction<any>,
  expectedMessages: string[]
): void {
  const calls = mockConsole.mock.calls.flat();
  const output = calls.join(' ').toLowerCase();
  
  expectedMessages.forEach(message => {
    expect(output).toContain(message.toLowerCase());
  });
}

/**
 * Assert PowerShell command was executed
 */
export function expectPowerShellExecution(
  mockExec: MockedFunction<any>,
  expectedCommand: string
): void {
  const calls = mockExec.mock.calls;
  const found = calls.some(call => 
    call.some((arg: any) => 
      typeof arg === 'string' && arg.includes(expectedCommand)
    )
  );
  
  expect(found).toBe(true);
  if (!found) {
    const executedCommands = calls.map(call => call[0]).join('\n');
    throw new Error(
      `Expected PowerShell command "${expectedCommand}" not found.\n` +
      `Executed commands:\n${executedCommands}`
    );
  }
}

/**
 * Assert specific PowerShell module operation
 */
export function expectPowerShellModuleOperation(
  mockExec: MockedFunction<any>,
  operation: 'check' | 'install' | 'import',
  moduleName: string = 'BurntToast'
): void {
  const expectedPatterns = {
    check: `Get-Module.*${moduleName}`,
    install: `Install-Module.*${moduleName}`,
    import: `Import-Module.*${moduleName}`,
  };
  
  const pattern = expectedPatterns[operation];
  const calls = mockExec.mock.calls;
  const found = calls.some(call =>
    call.some((arg: any) =>
      typeof arg === 'string' && new RegExp(pattern, 'i').test(arg)
    )
  );
  
  expect(found).toBe(true);
  if (!found) {
    throw new Error(
      `Expected PowerShell ${operation} operation for ${moduleName} not found`
    );
  }
}

/**
 * Assert file operation was atomic (temp -> sync -> rename)
 */
export function expectAtomicFileOperation(
  mockWriteFile: MockedFunction<any>,
  mockRename: MockedFunction<any>,
  mockSync: MockedFunction<any>,
  targetPath: string
): void {
  // Check temp file was written
  const tempPath = `${targetPath}.tmp`;
  expect(mockWriteFile).toHaveBeenCalledWith(
    tempPath,
    expect.any(String)
  );
  
  // Check sync was called on file handle
  expect(mockSync).toHaveBeenCalled();
  
  // Check atomic rename
  expect(mockRename).toHaveBeenCalledWith(tempPath, targetPath);
}

/**
 * Assert backup was created before file modification
 */
export function expectBackupCreated(
  mockCopyFile: MockedFunction<any>,
  originalPath: string,
  backupPattern: RegExp = /backup\/\d{8}-\d{6}/
): void {
  const calls = mockCopyFile.mock.calls;
  const backupCall = calls.find(call => 
    call[0] === originalPath && backupPattern.test(call[1])
  );
  
  expect(backupCall).toBeDefined();
  if (!backupCall) {
    throw new Error(
      `Expected backup creation for ${originalPath} not found`
    );
  }
}

/**
 * Assert directory structure was created
 */
export function expectDirectoryStructure(
  mockMkdir: MockedFunction<any>,
  expectedDirs: string[]
): void {
  expectedDirs.forEach(dir => {
    expect(mockMkdir).toHaveBeenCalledWith(
      dir,
      expect.objectContaining({ recursive: true })
    );
  });
}

/**
 * Assert installation files were copied
 */
export function expectInstallationFiles(
  mockCopyFile: MockedFunction<any>,
  expectedFiles: Array<{ source: string; destination: string }>
): void {
  expectedFiles.forEach(({ source, destination }) => {
    expect(mockCopyFile).toHaveBeenCalledWith(source, destination);
  });
}

/**
 * Assert cache operations
 */
export function expectCacheOperations(
  mockReadFile: MockedFunction<any>,
  mockWriteFile: MockedFunction<any>,
  cacheFile: string,
  expectRead: boolean = true,
  expectWrite: boolean = true
): void {
  if (expectRead) {
    expect(mockReadFile).toHaveBeenCalledWith(cacheFile);
  }
  
  if (expectWrite) {
    expect(mockWriteFile).toHaveBeenCalledWith(
      cacheFile,
      expect.any(String)
    );
  }
}

/**
 * Assert performance benchmarks are met
 */
export function expectPerformanceBenchmarks(
  metrics: {
    buildTime?: number;
    bundleSize?: number;
    startupTime?: number;
    installationTime?: number;
  },
  benchmarks: {
    buildTime?: number;
    bundleSize?: number;
    startupTime?: number;
    installationTime?: number;
  } = {
    buildTime: 1000, // ms
    bundleSize: 100000, // bytes
    startupTime: 100, // ms
    installationTime: 30000, // ms
  }
): void {
  if (metrics.buildTime !== undefined && benchmarks.buildTime !== undefined) {
    expect(metrics.buildTime).toBeLessThan(benchmarks.buildTime);
  }
  
  if (metrics.bundleSize !== undefined && benchmarks.bundleSize !== undefined) {
    expect(metrics.bundleSize).toBeLessThan(benchmarks.bundleSize);
  }
  
  if (metrics.startupTime !== undefined && benchmarks.startupTime !== undefined) {
    expect(metrics.startupTime).toBeLessThan(benchmarks.startupTime);
  }
  
  if (metrics.installationTime !== undefined && benchmarks.installationTime !== undefined) {
    expect(metrics.installationTime).toBeLessThan(benchmarks.installationTime);
  }
}

/**
 * Assert coverage thresholds are met
 */
export function expectCoverageThresholds(
  coverage: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  },
  thresholds: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  } = {
    lines: 90,
    branches: 85,
    functions: 90,
    statements: 90,
  }
): void {
  expect(coverage.lines).toBeGreaterThanOrEqual(thresholds.lines);
  expect(coverage.branches).toBeGreaterThanOrEqual(thresholds.branches);
  expect(coverage.functions).toBeGreaterThanOrEqual(thresholds.functions);
  expect(coverage.statements).toBeGreaterThanOrEqual(thresholds.statements);
}

/**
 * Assert timing constraints
 */
export function expectTimingConstraints(
  startTime: number,
  endTime: number,
  maxDuration: number,
  operation: string = 'operation'
): void {
  const duration = endTime - startTime;
  expect(duration).toBeLessThan(maxDuration);
  
  if (duration >= maxDuration) {
    throw new Error(
      `${operation} took ${duration}ms, expected less than ${maxDuration}ms`
    );
  }
}

/**
 * Assert mock function call order
 */
export function expectCallOrder(
  mocks: MockedFunction<any>[],
  expectedOrder: string[]
): void {
  const calls: Array<{ mock: string; time: number }> = [];
  
  mocks.forEach((mock, index) => {
    mock.mock.invocationCallOrder.forEach(callTime => {
      calls.push({ mock: expectedOrder[index], time: callTime });
    });
  });
  
  calls.sort((a, b) => a.time - b.time);
  
  const actualOrder = calls.map(call => call.mock);
  const expectedPattern = expectedOrder.join(' -> ');
  const actualPattern = actualOrder.join(' -> ');
  
  // Check if actual order contains the expected sequence
  let expectedIndex = 0;
  for (const actual of actualOrder) {
    if (actual === expectedOrder[expectedIndex]) {
      expectedIndex++;
    }
  }
  
  expect(expectedIndex).toBe(expectedOrder.length);
  
  if (expectedIndex !== expectedOrder.length) {
    throw new Error(
      `Expected call order: ${expectedPattern}\n` +
      `Actual call order: ${actualPattern}`
    );
  }
}

/**
 * Assert CLI flag validation
 */
export function expectFlagValidation(
  validator: (flags: any) => boolean | string,
  validFlags: any,
  invalidFlags: any,
  expectedError?: string
): void {
  expect(validator(validFlags)).toBe(true);
  
  const result = validator(invalidFlags);
  expect(result).not.toBe(true);
  
  if (expectedError && typeof result === 'string') {
    expect(result.toLowerCase()).toContain(expectedError.toLowerCase());
  }
}

/**
 * Assert interactive prompt responses
 */
export function expectPromptInteractions(
  mockPrompts: any,
  expectedPrompts: Array<{
    type: string;
    message?: string;
    choices?: string[];
    defaultValue?: any;
  }>
): void {
  expectedPrompts.forEach(({ type, message, choices, defaultValue }, index) => {
    const call = mockPrompts[type].mock.calls[index];
    expect(call).toBeDefined();
    
    if (message) {
      expect(call[0]).toMatchObject({ message });
    }
    
    if (choices) {
      expect(call[0]).toMatchObject({ options: expect.arrayContaining(choices) });
    }
    
    if (defaultValue !== undefined) {
      expect(call[0]).toMatchObject({ initialValue: defaultValue });
    }
  });
}

/**
 * Assert hook payload structure
 */
export function expectHookPayloadStructure(
  payload: any,
  expectedType: string,
  requiredFields: string[] = ['session_id', 'transcript_path', 'cwd', 'hook_event_name']
): void {
  expect(payload).toHaveProperty('hook_event_name', expectedType);
  
  requiredFields.forEach(field => {
    expect(payload).toHaveProperty(field);
    expect(payload[field]).toBeDefined();
  });
}

/**
 * Assert JSONC parsing preserves comments
 */
export function expectJsoncPreservesComments(
  original: string,
  parsed: any,
  serialized: string
): void {
  // Check that parsing succeeded
  expect(parsed).toBeDefined();
  expect(typeof parsed).toBe('object');
  
  // Check that comments are approximately preserved
  const originalComments = (original.match(/\/\/.*$/gm) || []).length;
  const serializedComments = (serialized.match(/\/\/.*$/gm) || []).length;
  
  expect(serializedComments).toBeGreaterThanOrEqual(originalComments * 0.8);
}

/**
 * Assert exit code mapping
 */
export function expectExitCodeMapping(
  actualCode: number,
  expectedCode: number,
  codeMap: Record<string, number> = {
    SUCCESS: 0,
    USER_ABORT: 1,
    DEPENDENCY_FAILURE: 2,
    IO_ERROR: 3,
  }
): void {
  expect(actualCode).toBe(expectedCode);
  
  const codeName = Object.keys(codeMap).find(key => codeMap[key] === expectedCode);
  if (codeName && actualCode !== expectedCode) {
    throw new Error(
      `Expected exit code ${expectedCode} (${codeName}), got ${actualCode}`
    );
  }
}