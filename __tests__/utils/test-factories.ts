/**
 * Test Data Factories for cctoast-wsl Test Suite
 * 
 * Provides standardized test data generation for all major data structures.
 * Reduces boilerplate and ensures consistent test data across the test suite.
 */

// =============================================================================
// Types and Interfaces
// =============================================================================

export interface CLIOptions {
  global: boolean;
  local: boolean;
  notification: boolean;
  stop: boolean;
  sync: boolean;
  printInstructions: boolean;
  json: boolean;
  dryRun: boolean;
  force: boolean;
  quiet: boolean;
  uninstall: boolean;
}

export interface DependencyResult {
  name: string;
  passed: boolean;
  fatal: boolean;
  message: string;
  remedy?: string;
  timestamp?: number;
}

export interface InstallationResult {
  success: boolean;
  installedTo: string;
  settingsPath: string;
  backupPath?: string;
  hooksAdded: string[];
  message: string;
  duration?: number;
}

export interface ClaudeSettings {
  hooks?: {
    notification?: string[];
    stop?: string[];
    preToolUse?: string[];
    postToolUse?: string[];
    userPromptSubmit?: string[];
    subagentStop?: string[];
    [key: string]: string[] | undefined;
  };
  version?: string;
  preferences?: Record<string, any>;
  [key: string]: any;
}

export interface HookPayload {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: string;
  timestamp?: string;
  [key: string]: any;
}

export interface PackageInfo {
  name: string;
  version: string;
  description: string;
  bin?: Record<string, string>;
  main?: string;
  [key: string]: any;
}

// =============================================================================
// CLI Options Factories
// =============================================================================

/**
 * Creates default CLI options (global install with both hooks)
 */
export function createDefaultCLIOptions(): CLIOptions {
  return {
    global: true,
    local: false,
    notification: true,
    stop: true,
    sync: false,
    printInstructions: false,
    json: false,
    dryRun: false,
    force: false,
    quiet: false,
    uninstall: false,
  };
}

/**
 * Creates CLI options for global installation scenarios
 */
export function createGlobalCLIOptions(overrides: Partial<CLIOptions> = {}): CLIOptions {
  return {
    ...createDefaultCLIOptions(),
    global: true,
    local: false,
    ...overrides,
  };
}

/**
 * Creates CLI options for local installation scenarios
 */
export function createLocalCLIOptions(overrides: Partial<CLIOptions> = {}): CLIOptions {
  return {
    ...createDefaultCLIOptions(),
    global: false,
    local: true,
    ...overrides,
  };
}

/**
 * Creates CLI options for interactive mode testing
 */
export function createInteractiveCLIOptions(overrides: Partial<CLIOptions> = {}): CLIOptions {
  return {
    ...createDefaultCLIOptions(),
    global: false, // Will be set by interactive prompts
    local: false,
    quiet: false,
    ...overrides,
  };
}

/**
 * Creates CLI options for CI/non-interactive mode
 */
export function createCICLIOptions(overrides: Partial<CLIOptions> = {}): CLIOptions {
  return {
    ...createDefaultCLIOptions(),
    quiet: true,
    ...overrides,
  };
}

/**
 * Creates CLI options for dry run scenarios
 */
export function createDryRunCLIOptions(overrides: Partial<CLIOptions> = {}): CLIOptions {
  return {
    ...createDefaultCLIOptions(),
    dryRun: true,
    quiet: true,
    ...overrides,
  };
}

/**
 * Creates CLI options for uninstallation scenarios
 */
export function createUninstallCLIOptions(overrides: Partial<CLIOptions> = {}): CLIOptions {
  return {
    ...createDefaultCLIOptions(),
    uninstall: true,
    ...overrides,
  };
}

/**
 * Creates various CLI option combinations for testing
 */
export function createCLIOptionCombinations(): Array<{ name: string; options: CLIOptions }> {
  return [
    {
      name: 'Global with notification only',
      options: createGlobalCLIOptions({ notification: true, stop: false }),
    },
    {
      name: 'Local with stop only',
      options: createLocalCLIOptions({ notification: false, stop: true }),
    },
    {
      name: 'Local with sync enabled',
      options: createLocalCLIOptions({ sync: true }),
    },
    {
      name: 'JSON output mode',
      options: createDefaultCLIOptions({ json: true }),
    },
    {
      name: 'Force mode bypassing checks',
      options: createDefaultCLIOptions({ force: true }),
    },
    {
      name: 'Quiet CI mode',
      options: createCICLIOptions(),
    },
    {
      name: 'Dry run preview',
      options: createDryRunCLIOptions(),
    },
  ];
}

// =============================================================================
// Dependency Check Factories
// =============================================================================

/**
 * Creates successful dependency check results
 */
export function createSuccessfulDependencyResults(): DependencyResult[] {
  return [
    {
      name: 'wsl-environment',
      passed: true,
      fatal: true,
      message: 'WSL detected: Ubuntu-22.04',
      timestamp: Date.now(),
    },
    {
      name: 'powershell-exe',
      passed: true,
      fatal: true,
      message: 'PowerShell available at /mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe',
      timestamp: Date.now(),
    },
    {
      name: 'burnttoast-module',
      passed: true,
      fatal: true,
      message: 'BurntToast module installed (version 0.8.5)',
      timestamp: Date.now(),
    },
    {
      name: 'execution-policy',
      passed: true,
      fatal: false,
      message: 'Execution policy: RemoteSigned',
      timestamp: Date.now(),
    },
    {
      name: 'jq-binary',
      passed: true,
      fatal: false,
      message: 'jq available for JSON processing',
      timestamp: Date.now(),
    },
    {
      name: 'claude-directory',
      passed: true,
      fatal: false,
      message: 'Claude directory exists at /home/testuser/.claude',
      timestamp: Date.now(),
    },
  ];
}

/**
 * Creates dependency check results with specific failures
 */
export function createFailedDependencyResults(failedChecks: string[]): DependencyResult[] {
  const allResults = createSuccessfulDependencyResults();
  
  return allResults.map(result => {
    if (failedChecks.includes(result.name)) {
      return {
        ...result,
        passed: false,
        message: getDependencyFailureMessage(result.name),
        remedy: getDependencyRemedy(result.name),
      };
    }
    return result;
  });
}

/**
 * Creates dependency results for BurntToast auto-installation scenario
 */
export function createBurntToastMissingResults(): DependencyResult[] {
  return createFailedDependencyResults(['burnttoast-module']);
}

/**
 * Creates dependency results for PowerShell execution policy issues
 */
export function createExecutionPolicyFailureResults(): DependencyResult[] {
  return createFailedDependencyResults(['execution-policy']);
}

/**
 * Creates dependency results with non-fatal warnings only
 */
export function createWarningOnlyDependencyResults(): DependencyResult[] {
  return createFailedDependencyResults(['jq-binary', 'claude-directory']);
}

function getDependencyFailureMessage(dependencyName: string): string {
  const messages: Record<string, string> = {
    'wsl-environment': 'Not running in WSL environment',
    'powershell-exe': 'PowerShell executable not found in PATH',
    'burnttoast-module': 'BurntToast PowerShell module not installed',
    'execution-policy': 'PowerShell execution policy too restrictive (Restricted)',
    'jq-binary': 'jq binary not found in PATH',
    'claude-directory': 'Claude directory not found at ~/.claude',
  };
  return messages[dependencyName] || `Check failed: ${dependencyName}`;
}

function getDependencyRemedy(dependencyName: string): string {
  const remedies: Record<string, string> = {
    'wsl-environment': 'Run this tool from within WSL',
    'powershell-exe': 'Add Windows PowerShell to your PATH',
    'burnttoast-module': 'Install-Module BurntToast -Scope CurrentUser',
    'execution-policy': 'Set-ExecutionPolicy -Scope CurrentUser RemoteSigned',
    'jq-binary': 'Install jq: apt install jq (Ubuntu) or brew install jq (macOS)',
    'claude-directory': 'Install Claude Code first, or create ~/.claude directory manually',
  };
  return remedies[dependencyName] || `Fix ${dependencyName} manually`;
}

// =============================================================================
// Installation Result Factories
// =============================================================================

/**
 * Creates successful global installation result
 */
export function createSuccessfulGlobalInstallation(): InstallationResult {
  return {
    success: true,
    installedTo: '/home/testuser/.claude/cctoast-wsl',
    settingsPath: '/home/testuser/.claude/settings.json',
    backupPath: '/home/testuser/.claude/settings.json.backup.20240127-143022',
    hooksAdded: ['notification', 'stop'],
    message: 'Successfully installed cctoast-wsl to global Claude settings',
    duration: 1250,
  };
}

/**
 * Creates successful local installation result
 */
export function createSuccessfulLocalInstallation(sync = false): InstallationResult {
  const settingsFile = sync ? 'settings.json' : 'settings.local.json';
  return {
    success: true,
    installedTo: '/home/testuser/project/.claude/cctoast-wsl',
    settingsPath: `/home/testuser/project/.claude/${settingsFile}`,
    backupPath: `/home/testuser/project/.claude/${settingsFile}.backup.20240127-143022`,
    hooksAdded: ['notification', 'stop'],
    message: `Successfully installed cctoast-wsl to local Claude settings (${settingsFile})`,
    duration: 980,
  };
}

/**
 * Creates successful uninstallation result
 */
export function createSuccessfulUninstallation(scope: 'global' | 'local' = 'global'): InstallationResult {
  const basePath = scope === 'global' 
    ? '/home/testuser/.claude'
    : '/home/testuser/project/.claude';
    
  return {
    success: true,
    installedTo: `${basePath}/cctoast-wsl`,
    settingsPath: `${basePath}/settings.json`,
    hooksAdded: [], // Removed hooks
    message: `Successfully uninstalled cctoast-wsl from ${scope} Claude settings`,
    duration: 420,
  };
}

/**
 * Creates installation failure result with specific error
 */
export function createFailedInstallationResult(errorType: 'permission' | 'disk-space' | 'corrupted-settings' | 'general'): InstallationResult {
  const errorMessages: Record<string, string> = {
    permission: 'Permission denied when creating installation directory',
    'disk-space': 'No space left on device',
    'corrupted-settings': 'Failed to parse existing Claude settings.json',
    general: 'Unexpected installation error occurred',
  };

  return {
    success: false,
    installedTo: '',
    settingsPath: '',
    hooksAdded: [],
    message: errorMessages[errorType],
    duration: 150,
  };
}

/**
 * Creates partial installation result (some hooks installed, some failed)
 */
export function createPartialInstallationResult(): InstallationResult {
  return {
    success: true,
    installedTo: '/home/testuser/.claude/cctoast-wsl',
    settingsPath: '/home/testuser/.claude/settings.json',
    backupPath: '/home/testuser/.claude/settings.json.backup.20240127-143022',
    hooksAdded: ['notification'], // Only notification hook added
    message: 'Partially installed cctoast-wsl (notification hook only)',
    duration: 890,
  };
}

// =============================================================================
// Claude Settings Factories
// =============================================================================

/**
 * Creates empty Claude settings
 */
export function createEmptyClaudeSettings(): ClaudeSettings {
  return {};
}

/**
 * Creates minimal Claude settings with version
 */
export function createMinimalClaudeSettings(): ClaudeSettings {
  return {
    version: '1.0.0',
  };
}

/**
 * Creates Claude settings with existing hooks
 */
export function createExistingHooksSettings(): ClaudeSettings {
  return {
    hooks: {
      notification: ['/usr/local/bin/notify-send "Claude notification"'],
      preToolUse: ['/home/testuser/scripts/pre-tool.sh'],
      customHook: ['/home/testuser/custom/hook.sh'],
    },
    version: '1.0.0',
    preferences: {
      theme: 'dark',
      notifications: true,
    },
  };
}

/**
 * Creates Claude settings with cctoast-wsl already installed
 */
export function createCCToastInstalledSettings(): ClaudeSettings {
  return {
    hooks: {
      notification: [
        '/home/testuser/.claude/cctoast-wsl/show-toast.sh --notification-hook',
        '/usr/local/bin/notify-send "Backup notification"',
      ],
      stop: [
        '/home/testuser/.claude/cctoast-wsl/show-toast.sh --stop-hook',
      ],
    },
    version: '1.0.0',
  };
}

/**
 * Creates Claude settings with JSONC comments
 */
export function createJSONCSettings(): string {
  return `{
  // Claude Code Settings with Comments
  "version": "1.0.0",
  "hooks": {
    "notification": [
      // Primary notification handler
      "/home/testuser/.claude/cctoast-wsl/show-toast.sh --notification-hook"
    ],
    /* Multi-line comment
       for stop hooks */
    "stop": [
      "/home/testuser/.claude/cctoast-wsl/show-toast.sh --stop-hook"
    ]
  },
  "preferences": {
    "theme": "dark", // User theme preference
    "notifications": true
  }
}`;
}

/**
 * Creates corrupted/invalid Claude settings for error testing
 */
export function createCorruptedClaudeSettings(): string {
  return `{
  "version": "1.0.0",
  "hooks": {
    "notification": [
      "/home/testuser/.claude/cctoast-wsl/show-toast.sh --notification-hook"
    ],
    // Missing closing bracket
    "stop": [
      "/home/testuser/.claude/cctoast-wsl/show-toast.sh --stop-hook"
  }`;
}

// =============================================================================
// Hook Payload Factories
// =============================================================================

/**
 * Creates basic hook payload with common fields
 */
export function createBaseHookPayload(eventName: string): HookPayload {
  return {
    session_id: 'test-session-123',
    transcript_path: '/home/testuser/.claude/transcripts/2024-01-27.json',
    cwd: '/home/testuser/project',
    hook_event_name: eventName,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates notification hook payload
 */
export function createNotificationHookPayload(message?: string): HookPayload {
  return {
    ...createBaseHookPayload('Notification'),
    message: message || 'Waiting for your response',
  };
}

/**
 * Creates stop hook payload
 */
export function createStopHookPayload(active = false): HookPayload {
  return {
    ...createBaseHookPayload('Stop'),
    stop_hook_active: active,
  };
}

/**
 * Creates PreToolUse hook payload
 */
export function createPreToolUseHookPayload(toolName: string, toolInput: Record<string, any>): HookPayload {
  return {
    ...createBaseHookPayload('PreToolUse'),
    tool_name: toolName,
    tool_input: toolInput,
  };
}

/**
 * Creates PostToolUse hook payload
 */
export function createPostToolUseHookPayload(
  toolName: string, 
  toolInput: Record<string, any>,
  toolResponse: Record<string, any>
): HookPayload {
  return {
    ...createBaseHookPayload('PostToolUse'),
    tool_name: toolName,
    tool_input: toolInput,
    tool_response: toolResponse,
  };
}

/**
 * Creates UserPromptSubmit hook payload
 */
export function createUserPromptSubmitHookPayload(prompt: string): HookPayload {
  return {
    ...createBaseHookPayload('UserPromptSubmit'),
    prompt,
  };
}

/**
 * Creates common tool input payloads for testing
 */
export function createToolInputPayloads() {
  return {
    bash: {
      command: 'ls -la',
      description: 'List files in current directory',
      timeout: 120000,
    },
    edit: {
      file_path: '/home/testuser/project/src/main.ts',
      old_string: 'console.log("hello")',
      new_string: 'console.log("hello world")',
      replace_all: false,
    },
    write: {
      file_path: '/home/testuser/project/output.txt',
      content: 'Generated file content',
    },
    read: {
      file_path: '/home/testuser/project/config.json',
      offset: 0,
      limit: 100,
    },
  };
}

/**
 * Creates tool response payloads for testing
 */
export function createToolResponsePayloads() {
  return {
    success: {
      success: true,
      output: 'Command executed successfully',
      exit_code: 0,
      duration_ms: 1500,
    },
    failure: {
      success: false,
      error: 'Command failed with exit code 1',
      output: '',
      exit_code: 1,
      duration_ms: 250,
    },
    timeout: {
      success: false,
      error: 'Command timed out after 30 seconds',
      output: 'Partial output...',
      exit_code: 124,
      duration_ms: 30000,
    },
  };
}

// =============================================================================
// Package Info Factory
// =============================================================================

/**
 * Creates package.json content for testing
 */
export function createPackageInfo(overrides: Partial<PackageInfo> = {}): PackageInfo {
  return {
    name: '@claude/cctoast-wsl',
    version: '0.0.2',
    description: 'Secure, zero-admin utility for Windows toast notifications from WSL via Claude Code hooks',
    bin: {
      'cctoast-wsl': './bin/cctoast-wsl',
    },
    main: './bin/cctoast-wsl',
    ...overrides,
  };
}

// =============================================================================
// Test Environment Factories
// =============================================================================

/**
 * Creates environment variables for testing
 */
export function createTestEnvironment(scenario: 'wsl' | 'non-wsl' | 'ci' = 'wsl'): Record<string, string> {
  const base = {
    NODE_ENV: 'test',
    HOME: '/home/testuser',
  };

  switch (scenario) {
    case 'wsl':
      return {
        ...base,
        WSL_DISTRO_NAME: 'Ubuntu-22.04',
        WSL_INTEROP: '/run/WSL/123_interop',
        PATH: '/usr/local/bin:/usr/bin:/bin:/mnt/c/Windows/System32/WindowsPowerShell/v1.0',
      };

    case 'non-wsl':
      return {
        ...base,
        PATH: '/usr/local/bin:/usr/bin:/bin',
      };

    case 'ci':
      return {
        ...base,
        CI: 'true',
        GITHUB_ACTIONS: 'true',
        WSL_DISTRO_NAME: 'Ubuntu-22.04',
        WSL_INTEROP: '/run/WSL/123_interop',
      };

    default:
      return base;
  }
}

/**
 * Creates argv arrays for testing different CLI invocation scenarios
 */
export function createArgvScenarios(): Array<{ name: string; argv: string[] }> {
  return [
    {
      name: 'No flags (interactive mode)',
      argv: ['node', 'cctoast-wsl'],
    },
    {
      name: 'Global installation',
      argv: ['node', 'cctoast-wsl', '--global'],
    },
    {
      name: 'Local with sync',
      argv: ['node', 'cctoast-wsl', '--local', '--sync'],
    },
    {
      name: 'Notification only',
      argv: ['node', 'cctoast-wsl', '--notification', '--no-stop'],
    },
    {
      name: 'Dry run mode',
      argv: ['node', 'cctoast-wsl', '--dry-run'],
    },
    {
      name: 'Force mode',
      argv: ['node', 'cctoast-wsl', '--force', '--quiet'],
    },
    {
      name: 'JSON output',
      argv: ['node', 'cctoast-wsl', '--json'],
    },
    {
      name: 'Uninstall',
      argv: ['node', 'cctoast-wsl', '--uninstall'],
    },
    {
      name: 'Help',
      argv: ['node', 'cctoast-wsl', '--help'],
    },
    {
      name: 'Version',
      argv: ['node', 'cctoast-wsl', '--version'],
    },
  ];
}

// =============================================================================
// Cache Data Factories
// =============================================================================

/**
 * Creates dependency check cache data
 */
export function createDependencyCache(age: 'fresh' | 'stale' | 'expired' = 'fresh'): Record<string, any> {
  const baseTime = Date.now();
  const ageOffsets = {
    fresh: 0,
    stale: 12 * 60 * 60 * 1000, // 12 hours
    expired: 25 * 60 * 60 * 1000, // 25 hours (expired after 24h)
  };

  return {
    timestamp: baseTime - ageOffsets[age],
    checks: createSuccessfulDependencyResults(),
    version: '0.0.2',
  };
}

/**
 * Creates various test data combinations for comprehensive testing
 */
export function createTestDataMatrix(): Array<{
  name: string;
  cliOptions: CLIOptions;
  dependencies: DependencyResult[];
  environment: Record<string, string>;
  expectedResult: 'success' | 'failure' | 'warning';
}> {
  return [
    {
      name: 'Happy path: Global install with all dependencies',
      cliOptions: createGlobalCLIOptions(),
      dependencies: createSuccessfulDependencyResults(),
      environment: createTestEnvironment('wsl'),
      expectedResult: 'success',
    },
    {
      name: 'BurntToast missing but auto-install succeeds',
      cliOptions: createGlobalCLIOptions(),
      dependencies: createBurntToastMissingResults(),
      environment: createTestEnvironment('wsl'),
      expectedResult: 'success',
    },
    {
      name: 'Non-fatal warnings only',
      cliOptions: createGlobalCLIOptions(),
      dependencies: createWarningOnlyDependencyResults(),
      environment: createTestEnvironment('wsl'),
      expectedResult: 'warning',
    },
    {
      name: 'PowerShell not available',
      cliOptions: createGlobalCLIOptions(),
      dependencies: createFailedDependencyResults(['powershell-exe']),
      environment: createTestEnvironment('non-wsl'),
      expectedResult: 'failure',
    },
    {
      name: 'Force mode bypasses warnings',
      cliOptions: createGlobalCLIOptions({ force: true }),
      dependencies: createWarningOnlyDependencyResults(),
      environment: createTestEnvironment('wsl'),
      expectedResult: 'success',
    },
  ];
}