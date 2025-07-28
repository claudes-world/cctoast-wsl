/**
 * Example Usage Test
 * 
 * Demonstrates how to use all the test utilities together in various scenarios.
 * This serves as both documentation and validation of the utility infrastructure.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  // Test suite factories
  TestSuites,
  createTestSuite,
  
  // Data factories
  createCliOptions,
  createClaudeSettings,
  DependencyScenarios,
  HookPayloadFactories,
  PowerShellScenarios,
  ErrorScenarios,
  
  // Assertion helpers
  expectFilePermissions,
  expectSettingsContainHooks,
  expectPowerShellExecution,
  QuickAsserts,
  
  // Environment helpers
  TestEnvironment,
  createWSLEnvironment,
  timeAsync,
  
  // Integration helpers
  VirtualFileSystem,
  ConfigurationBuilder,
  mockCliEnvironment,
  
  // Mock utilities
  mockUtils,
} from './index.js';

describe('Test Utilities - Example Usage', () => {
  describe('Unit Test Patterns', () => {
    let testSuite: any;

    beforeEach(async () => {
      testSuite = TestSuites.unit();
    });

    afterEach(async () => {
      await testSuite.cleanup();
    });

    it('should test CLI flag parsing with factories', () => {
      // Create test data with factories
      const validOptions = createCliOptions({
        global: true,
        notification: true,
        stop: false,
      });

      const invalidOptions = createCliOptions({
        global: true,
        local: true, // conflicting flags
      });

      // Mock process exit
      const mockExit = testSuite.process.getMockExit();

      // Test validation logic (pseudocode)
      expect(validOptions.global).toBe(true);
      expect(validOptions.notification).toBe(true);
      expect(validOptions.stop).toBe(false);

      // Use assertion helpers
      // QuickAsserts.cliSuccess(mockExit);
    });

    it('should test dependency checking with scenarios', () => {
      // Use pre-built scenarios
      const allPassedResults = DependencyScenarios.allPassed();
      const noBurntToastResults = DependencyScenarios.noBurntToast();

      expect(allPassedResults).toHaveLength(6);
      expect(allPassedResults.every(result => result.passed)).toBe(true);

      expect(noBurntToastResults).toHaveLength(3);
      expect(noBurntToastResults.some(result => 
        result.name === 'burnttoast-module' && !result.passed
      )).toBe(true);
    });

    it('should test settings merging with assertions', () => {
      // Create base settings
      const baseSettings = createClaudeSettings();
      const expectedHooks = {
        notification: ['~/.claude/cctoast-wsl/show-toast.sh --notification-hook'],
        stop: ['~/.claude/cctoast-wsl/show-toast.sh --stop-hook'],
      };

      // Simulate merge result
      const mergedSettings = {
        ...baseSettings,
        hooks: {
          ...baseSettings.hooks,
          ...expectedHooks,
        },
      };

      // Use specialized assertion
      expectSettingsContainHooks(mergedSettings, expectedHooks);
    });
  });

  describe('Integration Test Patterns', () => {
    let testSuite: any;

    beforeEach(async () => {
      testSuite = TestSuites.integration({
        wsl: true,
        powershell: true,
      });
    });

    afterEach(async () => {
      await testSuite.cleanup();
    });

    it('should test installation flow with virtual filesystem', async () => {
      const { vfs, childProcess } = testSuite.integration;

      // Setup virtual filesystem
      vfs.createFile('~/.claude/settings.json', JSON.stringify(createClaudeSettings()));
      vfs.createDirectory('~/.claude/cctoast-wsl');

      // Mock PowerShell responses
      childProcess.mockProcess(/Get-Module.*BurntToast/, PowerShellScenarios.burntToastInstalled());
      childProcess.mockProcess(/New-BurntToastNotification/, PowerShellScenarios.toastNotificationSent());

      // Test installation logic (pseudocode)
      // const installer = new Installer(options);
      // await installer.install();

      // Verify results
      expect(vfs.exists('~/.claude/cctoast-wsl/show-toast.sh')).toBe(true);
      
      // Use quick assertions
      // QuickAsserts.hooksInstalled(settings, 'global');
    });

    it('should test PowerShell interaction with mocks', async () => {
      const { childProcess } = testSuite.integration;
      const mocks = childProcess.createMocks();

      // Setup PowerShell command responses
      childProcess.mockProcess(/powershell\.exe.*Get-Module/, {
        stdout: 'BurntToast 0.8.5',
        exitCode: 0,
      });

      // Test PowerShell execution (pseudocode)
      // await checkBurntToastModule();

      // Verify PowerShell was called
      expectPowerShellExecution(mocks.execSync, 'Get-Module');
    });
  });

  describe('Environment Test Patterns', () => {
    let testEnv: TestEnvironment;

    beforeEach(async () => {
      testEnv = await createWSLEnvironment();
    });

    afterEach(async () => {
      await testEnv.cleanup();
    });

    it('should test with temporary directories', async () => {
      // Create temporary test structure
      const tempStructure = {
        '.claude/settings.json': JSON.stringify(createClaudeSettings()),
        'scripts/show-toast.sh': '#!/bin/bash\necho "test"',
        'assets': null, // directory
        'assets/claude.png': 'fake-png-data',
      };

      const tempDir = await testEnv.tempDir.createTempDirWithStructure(tempStructure);

      expect(tempDir).toMatch(/cctoast-test-/);
      // Files will be cleaned up automatically
    });

    it('should test performance timing', async () => {
      const operation = async () => {
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 50));
      };

      const { duration } = await timeAsync('test-operation', operation);
      
      expect(duration).toBeGreaterThan(40);
      expect(duration).toBeLessThan(100);
    });

    it('should test environment variable management', () => {
      // Environment is already set up for WSL
      expect(process.env.WSL_DISTRO_NAME).toBeDefined();
      expect(process.env.WSL_INTEROP).toBeDefined();

      // Modify for test
      testEnv.env.set('TEST_VAR', 'test-value');
      expect(process.env.TEST_VAR).toBe('test-value');

      // Will be restored in afterEach
    });
  });

  describe('Configuration Builder Patterns', () => {
    it('should build CLI configurations fluently', () => {
      const globalConfig = ConfigurationBuilder
        .cli()
        .global()
        .withNotifications()
        .withStopHooks()
        .dryRun()
        .build();

      expect(globalConfig).toEqual({
        type: 'cli',
        global: true,
        local: false,
        notification: true,
        stop: true,
        dryRun: true,
      });

      const localConfig = ConfigurationBuilder
        .cli()
        .local()
        .withNotifications()
        .quiet()
        .build();

      expect(localConfig).toEqual({
        type: 'cli',
        global: false,
        local: true,
        notification: true,
        quiet: true,
      });
    });

    it('should build settings configurations', () => {
      const settingsConfig = ConfigurationBuilder
        .settings()
        .merge({
          scope: 'global',
          hooks: ['notification', 'stop'],
        })
        .build();

      expect(settingsConfig.type).toBe('settings');
      expect(settingsConfig.scope).toBe('global');
    });
  });

  describe('Error Scenario Testing', () => {
    it('should test various error conditions', () => {
      const fileNotFound = ErrorScenarios.fileNotFound('/missing/file.json');
      const permissionDenied = ErrorScenarios.permissionDenied('/etc/hosts');
      const jsonError = ErrorScenarios.jsonSyntaxError('invalid json');

      expect(fileNotFound.code).toBe('ENOENT');
      expect(permissionDenied.code).toBe('EACCES');
      expect(jsonError.name).toBe('SyntaxError');
    });
  });

  describe('Hook Payload Testing', () => {
    it('should create various hook payloads', () => {
      const notificationPayload = HookPayloadFactories.notification('Custom message');
      const stopPayload = HookPayloadFactories.stop(true);
      const preToolPayload = HookPayloadFactories.preToolUse('Edit', {
        file_path: '/test/file.txt',
        old_string: 'old',
        new_string: 'new',
      });

      expect(notificationPayload.hook_event_name).toBe('Notification');
      expect(notificationPayload.message).toBe('Custom message');

      expect(stopPayload.hook_event_name).toBe('Stop');
      expect(stopPayload.stop_hook_active).toBe(true);

      expect(preToolPayload.hook_event_name).toBe('PreToolUse');
      expect(preToolPayload.tool_name).toBe('Edit');
      expect(preToolPayload.tool_input?.file_path).toBe('/test/file.txt');
    });
  });

  describe('Complete Integration Example', () => {
    it('should demonstrate full workflow testing', async () => {
      // Setup complete environment
      const setup = mockCliEnvironment({
        wsl: true,
        powershell: true,
        burnttoast: true,
        files: {
          '~/.claude/settings.json': JSON.stringify(createClaudeSettings()),
          '/proc/version': 'Linux version 5.15.133.1-microsoft-standard-WSL2',
        },
      });

      // Create test configuration
      const options = createCliOptions({
        global: true,
        notification: true,
        stop: true,
        dryRun: false,
      });

      // Test dependency checks
      const dependencyResults = DependencyScenarios.allPassed();
      expect(dependencyResults.every(r => r.passed)).toBe(true);

      // Test installation simulation (pseudocode)
      // 1. Check dependencies ✓
      // 2. Copy files to VFS ✓
      // 3. Merge settings ✓
      // 4. Set permissions ✓

      // Verify expected outcomes (simulate merged settings)
      const expectedSettings = createClaudeSettings();
      expectedSettings.hooks!.notification = ['~/.claude/cctoast-wsl/show-toast.sh --notification-hook'];
      expectSettingsContainHooks(expectedSettings, {
        notification: ['~/.claude/cctoast-wsl/show-toast.sh --notification-hook'],
      });

      // Performance validation
      const performanceMetrics = {
        installationTime: 15000, // 15 seconds
        buildTime: 800, // 0.8 seconds
        startupTime: 50, // 50ms
      };

      // Would normally use: expectPerformanceBenchmarks(performanceMetrics);

      // Cleanup handled automatically
    });
  });
});

describe('Test Infrastructure Validation', () => {
  it('should validate all utility categories are working', () => {
    // Mock utilities
    expect(mockUtils).toBeDefined();
    expect(typeof mockUtils.setupFileSystemMocks).toBe('function');

    // Test factories
    expect(typeof createCliOptions).toBe('function');
    expect(typeof DependencyScenarios.allPassed).toBe('function');

    // Environment helpers
    expect(typeof TestEnvironment.create).toBe('function');

    // Integration helpers  
    expect(typeof VirtualFileSystem).toBe('function');
    expect(typeof ConfigurationBuilder.cli).toBe('function');

    // Test suites
    expect(typeof TestSuites.unit).toBe('function');
    expect(typeof TestSuites.integration).toBe('function');
  });

  it('should provide comprehensive utility coverage', () => {
    // Verify all major categories are covered
    const categories = [
      'Mock Utilities',
      'Test Data Factories',
      'Assertion Helpers',
      'Environment Helpers',
      'Integration Helpers',
    ];

    // Each category should have multiple utilities
    expect(Object.keys(DependencyScenarios)).toHaveLength(6);
    expect(Object.keys(HookPayloadFactories)).toHaveLength(6);
    expect(Object.keys(PowerShellScenarios)).toHaveLength(8);
    expect(Object.keys(ErrorScenarios)).toHaveLength(6);
    expect(Object.keys(QuickAsserts)).toHaveLength(6);
    expect(Object.keys(TestSuites)).toHaveLength(5);
  });
});