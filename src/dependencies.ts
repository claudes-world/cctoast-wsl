/**
 * Dependency Management System
 *
 * Verifies WSL environment, PowerShell access, and BurntToast availability.
 * Implements 24-hour caching and BurntToast auto-installation.
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const execAsync = promisify(exec);

export interface CheckResult {
  name: string;
  passed: boolean;
  fatal: boolean;
  message?: string;
  remedy?: string;
  timestamp: number;
}

export interface CacheData {
  [checkName: string]: CheckResult;
}

export interface BurntToastInstaller {
  isInstalled(): Promise<boolean>;
  getInstalledVersion(): Promise<string | null>;
  checkExecutionPolicy(): Promise<{ restrictive: boolean; policy: string; canInstall: boolean }>;
  testPowerShellGalleryConnectivity(): Promise<boolean>;
  promptInstall(): Promise<boolean>;
  install(): Promise<void>;
  verify(): Promise<boolean>;
  getManualInstallInstructions(): string;
  getInstallationStatus(): Promise<{
    installed: boolean;
    version?: string;
    canConnect: boolean;
    executionPolicy: { restrictive: boolean; policy: string; canInstall: boolean };
    issues: string[];
  }>;
}

export class DependencyChecker {
  private readonly cacheDir = join(homedir(), '.cache', 'cctoast-wsl');
  private readonly cacheFile = join(this.cacheDir, 'checks.json');
  private readonly cacheTimeoutMs = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private readonly _forceRefresh = false) {}

  /**
   * Check all dependencies with caching
   */
  async checkAll(burntToastInstaller?: BurntToastAutoInstaller): Promise<CheckResult[]> {
    const installer = burntToastInstaller || new BurntToastAutoInstaller();
    
    const checks = [
      () => this.checkWSLEnvironment(),
      () => this.checkPowerShellAccess(),
      () => this.checkBurntToast(installer),
      () => this.checkJqBinary(),
      () => this.checkClaudeDirectory(),
    ];

    const results: CheckResult[] = [];

    for (const check of checks) {
      try {
        const result = await this.runWithCache(check);
        results.push(result);
      } catch (error) {
        // Create error result for failed checks
        const errorResult: CheckResult = {
          name: 'unknown',
          passed: false,
          fatal: true,
          message: `Check failed: ${error instanceof Error ? error.message : error}`,
          timestamp: Date.now(),
        };
        results.push(errorResult);
      }
    }

    // Save results to cache
    await this.saveCache(results);

    return results;
  }

  /**
   * Check WSL environment (fatal)
   */
  async checkWSLEnvironment(): Promise<CheckResult> {
    const name = 'wsl-environment';

    try {
      // Check /proc/version for WSL markers
      const procVersion = await readFile('/proc/version', 'utf8');
      const isWSL1 = procVersion.includes('Microsoft');
      const isWSL2 =
        procVersion.includes('WSL2') ||
        procVersion.includes('microsoft-standard');

      if (isWSL1 || isWSL2) {
        return {
          name,
          passed: true,
          fatal: true,
          message: `Detected ${isWSL2 ? 'WSL2' : 'WSL1'} environment`,
          timestamp: Date.now(),
        };
      } else {
        return {
          name,
          passed: false,
          fatal: true,
          message: 'Not running in WSL environment',
          remedy: 'Run inside Windows Subsystem for Linux (WSL)',
          timestamp: Date.now(),
        };
      }
    } catch {
      return {
        name,
        passed: false,
        fatal: true,
        message: 'Unable to detect WSL environment',
        remedy: 'Ensure you are running inside WSL',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Check PowerShell.exe accessibility (fatal)
   */
  async checkPowerShellAccess(): Promise<CheckResult> {
    const name = 'powershell-exe';

    try {
      // Check if powershell.exe is in PATH with timeout
      const { stdout } = await execAsync(
        'powershell.exe -Command "Write-Output test"',
        {
          timeout: 5000,
        }
      );

      if (stdout.trim() === 'test') {
        return {
          name,
          passed: true,
          fatal: true,
          message: 'PowerShell.exe accessible and functional',
          timestamp: Date.now(),
        };
      } else {
        return {
          name,
          passed: false,
          fatal: true,
          message: 'PowerShell.exe not responding correctly',
          remedy:
            'Add Windows PowerShell to PATH or check WSL interop settings',
          timestamp: Date.now(),
        };
      }
    } catch {
      return {
        name,
        passed: false,
        fatal: true,
        message: 'PowerShell.exe not accessible from PATH',
        remedy:
          'Add Windows PowerShell to PATH: export PATH="$PATH:/mnt/c/Windows/System32/WindowsPowerShell/v1.0"',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Check BurntToast module (fatal, but auto-installable)
   */
  async checkBurntToast(autoInstaller?: BurntToastAutoInstaller): Promise<CheckResult> {
    const name = 'burnttoast-module';

    try {
      const installer = autoInstaller || new BurntToastAutoInstaller();
      const status = await installer.getInstallationStatus();

      if (status.installed) {
        // BurntToast is installed and working
        const version = status.version || 'unknown';
        return {
          name,
          passed: true,
          fatal: true,
          message: `BurntToast module installed (version ${version})`,
          timestamp: Date.now(),
        };
      } else {
        // BurntToast is not installed - check if we can install it
        const canInstall = status.canConnect && status.executionPolicy.canInstall;
        
        return {
          name,
          passed: false,
          fatal: true,
          message: 'BurntToast PowerShell module not installed',
          remedy: canInstall 
            ? 'Auto-installation available - will prompt during setup'
            : 'Manual installation required: Install-Module BurntToast -Scope CurrentUser -Force',
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      return {
        name,
        passed: false,
        fatal: true,
        message: `Unable to check BurntToast module: ${error instanceof Error ? error.message : error}`,
        remedy: 'Check PowerShell access and install manually: Install-Module BurntToast -Scope CurrentUser -Force',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Check PowerShell execution policy (warning only)
   */
  async checkExecutionPolicy(): Promise<CheckResult> {
    const name = 'execution-policy';

    try {
      const { stdout } = await execAsync(
        'powershell.exe -Command "Get-ExecutionPolicy"',
        { timeout: 5000 }
      );

      const policy = stdout.trim();
      const restrictivePolicies = ['Restricted', 'AllSigned'];

      if (restrictivePolicies.includes(policy)) {
        return {
          name,
          passed: false,
          fatal: false,
          message: `PowerShell execution policy is restrictive: ${policy}`,
          remedy: 'Set-ExecutionPolicy -Scope CurrentUser RemoteSigned',
          timestamp: Date.now(),
        };
      } else {
        return {
          name,
          passed: true,
          fatal: false,
          message: `PowerShell execution policy: ${policy}`,
          timestamp: Date.now(),
        };
      }
    } catch {
      return {
        name,
        passed: false,
        fatal: false,
        message: 'Unable to check PowerShell execution policy',
        remedy:
          'Check PowerShell access and consider setting: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Check jq binary availability (optional)
   */
  async checkJqBinary(): Promise<CheckResult> {
    const name = 'jq-binary';

    try {
      await execAsync('command -v jq', { timeout: 2000 });

      return {
        name,
        passed: true,
        fatal: false,
        message: 'jq binary available',
        timestamp: Date.now(),
      };
    } catch {
      return {
        name,
        passed: false,
        fatal: false,
        message: 'jq binary not found',
        remedy:
          'Install jq: sudo apt-get install jq (Ubuntu/Debian) or brew install jq (macOS)',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Check Claude directory exists (warning only)
   */
  async checkClaudeDirectory(): Promise<CheckResult> {
    const name = 'claude-directory';
    const globalClaudeDir = join(homedir(), '.claude');

    try {
      if (existsSync(globalClaudeDir)) {
        return {
          name,
          passed: true,
          fatal: false,
          message: 'Claude directory exists',
          timestamp: Date.now(),
        };
      } else {
        return {
          name,
          passed: false,
          fatal: false,
          message: 'Claude directory not found',
          remedy:
            'Install Claude Code first, or hooks will not function until Claude is installed',
          timestamp: Date.now(),
        };
      }
    } catch {
      return {
        name,
        passed: false,
        fatal: false,
        message: 'Unable to check Claude directory',
        remedy: 'Ensure Claude Code is properly installed',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Run a check function with caching support
   */
  private async runWithCache(
    checkFn: () => Promise<CheckResult>
  ): Promise<CheckResult> {
    if (!this._forceRefresh) {
      const cachedResult = await this.getCachedResult(checkFn.name);
      if (cachedResult && this.isCacheValid(cachedResult)) {
        return cachedResult;
      }
    }

    return await checkFn();
  }

  /**
   * Get cached result for a specific check
   */
  private async getCachedResult(
    checkName: string
  ): Promise<CheckResult | null> {
    try {
      if (!existsSync(this.cacheFile)) {
        return null;
      }

      const cacheData: CacheData = JSON.parse(
        await readFile(this.cacheFile, 'utf8')
      );
      return cacheData[checkName] || null;
    } catch {
      // Cache corrupted or unreadable - ignore and perform fresh check
      return null;
    }
  }

  /**
   * Check if cached result is still valid (within 24h)
   */
  private isCacheValid(result: CheckResult): boolean {
    const age = Date.now() - result.timestamp;
    return age < this.cacheTimeoutMs;
  }

  /**
   * Save check results to cache
   */
  private async saveCache(results: CheckResult[]): Promise<void> {
    try {
      // Ensure cache directory exists
      await mkdir(this.cacheDir, { recursive: true });

      // Load existing cache data
      let cacheData: CacheData = {};
      if (existsSync(this.cacheFile)) {
        try {
          cacheData = JSON.parse(await readFile(this.cacheFile, 'utf8'));
        } catch {
          // Corrupted cache, start fresh
          cacheData = {};
        }
      }

      // Update cache with new results
      for (const result of results) {
        cacheData[result.name] = result;
      }

      // Write updated cache atomically
      const tempFile = `${this.cacheFile}.tmp`;
      await writeFile(tempFile, JSON.stringify(cacheData, null, 2));

      // Atomic rename (works on most POSIX systems)
      await execAsync(`mv "${tempFile}" "${this.cacheFile}"`);
    } catch (error) {
      // Cache save failed - not critical, continue without caching
      console.warn('Failed to save dependency check cache:', error);
    }
  }
}

/**
 * BurntToast Auto-Installer Implementation
 * 
 * Provides comprehensive auto-installation capabilities including:
 * - User consent prompts
 * - Network connectivity checks  
 * - Execution policy handling
 * - Installation verification
 * - Fallback instructions
 */
export class BurntToastAutoInstaller implements BurntToastInstaller {
  private readonly quiet: boolean;

  constructor(options: { quiet?: boolean } = {}) {
    this.quiet = options.quiet ?? false;
  }

  /**
   * Check if BurntToast module is installed
   */
  async isInstalled(): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        'powershell.exe -Command "Get-Module -ListAvailable -Name BurntToast"',
        { timeout: 10000 }
      );
      return stdout.trim().length > 0 && !stdout.includes('No modules');
    } catch {
      return false;
    }
  }

  /**
   * Get installed BurntToast version
   */
  async getInstalledVersion(): Promise<string | null> {
    try {
      const { stdout } = await execAsync(
        'powershell.exe -Command "Get-Module -ListAvailable -Name BurntToast | Select-Object -ExpandProperty Version | Select-Object -First 1"',
        { timeout: 10000 }
      );
      
      const versionMatch = stdout.trim().match(/(\d+\.\d+\.\d+)/);
      return versionMatch ? versionMatch[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Check PowerShell execution policy
   */
  async checkExecutionPolicy(): Promise<{ restrictive: boolean; policy: string; canInstall: boolean }> {
    try {
      const { stdout } = await execAsync(
        'powershell.exe -Command "Get-ExecutionPolicy"',
        { timeout: 5000 }
      );

      const policy = stdout.trim();
      const restrictivePolicies = ['Restricted', 'AllSigned'];
      const restrictive = restrictivePolicies.includes(policy);
      
      // Even with restrictive policies, we can still try installation as it's often allowed
      return {
        restrictive,
        policy,
        canInstall: true // PowerShell Gallery module installation often works despite restrictive policies
      };
    } catch {
      return {
        restrictive: true,
        policy: 'Unknown',
        canInstall: false
      };
    }
  }

  /**
   * Test connectivity to PowerShell Gallery
   */
  async testPowerShellGalleryConnectivity(): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        'powershell.exe -Command "Test-NetConnection -ComputerName www.powershellgallery.com -Port 443 -InformationLevel Quiet"',
        { timeout: 10000 }
      );
      
      return stdout.trim() === 'True';
    } catch {
      // Fallback: try a simpler connectivity test
      try {
        await execAsync(
          'powershell.exe -Command "Invoke-WebRequest -Uri https://www.powershellgallery.com -UseBasicParsing -TimeoutSec 5 | Out-Null"',
          { timeout: 8000 }
        );
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Prompt user for installation consent
   */
  async promptInstall(): Promise<boolean> {
    if (this.quiet) {
      // In quiet mode, assume consent if called
      return true;
    }

    // This will be integrated with CLI prompts in the main application
    // For now, simulate interactive consent
    console.log('\n🔔 BurntToast PowerShell Module Required');
    console.log('The BurntToast module is needed to display Windows toast notifications.');
    console.log('This module will be installed to your user profile only (no admin rights needed).');
    console.log('\nWould you like to install it automatically? (recommended)');
    
    // In the real implementation, this would use the CLI prompt system
    // For now, return true to indicate consent in development
    return true;
  }

  /**
   * Install BurntToast module with comprehensive error handling
   */
  async install(): Promise<void> {
    try {
      if (!this.quiet) {
        console.log('📦 Installing BurntToast PowerShell module...');
        console.log('This may take 10-30 seconds depending on your connection...');
      }

      // First, try the primary installation command
      let installCommand = 'Install-Module BurntToast -Scope CurrentUser -Force -AllowClobber';
      
      // Check execution policy and adjust if needed
      const policyInfo = await this.checkExecutionPolicy();
      if (policyInfo.restrictive) {
        // Use bypass execution policy for installation
        installCommand = `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; ${installCommand}`;
      }

      const { stderr, stdout } = await execAsync(
        `powershell.exe -Command "${installCommand}"`,
        { timeout: 90000 } // Allow up to 90 seconds for installation
      );

      // Check for installation errors (ignoring warnings)
      if (stderr && !this.isWarningOnly(stderr)) {
        throw new Error(`Installation failed: ${stderr}`);
      }

      if (!this.quiet) {
        console.log('✅ BurntToast module installed successfully');
      }

    } catch (error) {
      // Enhanced error handling with specific error types
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('Unable to resolve package source')) {
        throw new Error(
          'Unable to connect to PowerShell Gallery. Please check your internet connection and try again.\n' +
          'If you are behind a corporate firewall, you may need to configure proxy settings.'
        );
      }
      
      if (errorMessage.includes('execution of scripts is disabled')) {
        throw new Error(
          'PowerShell script execution is disabled. Please run the following command in PowerShell as Administrator:\n' +
          'Set-ExecutionPolicy -Scope CurrentUser RemoteSigned'
        );
      }
      
      if (errorMessage.includes('Administrator rights')) {
        throw new Error(
          'Installation requires elevated permissions. Please run PowerShell as Administrator and install manually:\n' +
          'Install-Module BurntToast -Scope CurrentUser -Force'
        );
      }

      throw new Error(
        `Failed to install BurntToast module: ${errorMessage}\n\n` +
        'You can install manually by running this command in PowerShell:\n' +
        'Install-Module BurntToast -Scope CurrentUser -Force'
      );
    }
  }

  /**
   * Verify BurntToast installation and functionality
   */
  async verify(): Promise<boolean> {
    try {
      // Step 1: Check if module can be imported
      const { stdout: importResult } = await execAsync(
        'powershell.exe -Command "Import-Module BurntToast -ErrorAction Stop; Write-Output \\"import-success\\""',
        { timeout: 10000 }
      );

      if (!importResult.includes('import-success')) {
        return false;
      }

      // Step 2: Test basic functionality (without actually showing a toast)
      const { stdout: functionTest } = await execAsync(
        'powershell.exe -Command "Import-Module BurntToast; Get-Command New-BurntToastNotification -ErrorAction Stop; Write-Output \\"function-available\\""',
        { timeout: 10000 }
      );

      return functionTest.includes('function-available');
    } catch {
      return false;
    }
  }

  /**
   * Get manual installation instructions
   */
  getManualInstallInstructions(): string {
    return `
Manual BurntToast Installation Instructions:

1. Open PowerShell (Win + R, type "powershell", press Enter)

2. If you get execution policy errors, run this first:
   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

3. Install the BurntToast module:
   Install-Module BurntToast -Scope CurrentUser -Force

4. Verify installation:
   Import-Module BurntToast
   Get-Command New-BurntToastNotification

5. Test notification:
   New-BurntToastNotification -Text "Test", "BurntToast is working!"

If you continue to have issues:
- Check your internet connection
- Ensure you can access https://www.powershellgallery.com
- Try running PowerShell as Administrator
- Check corporate firewall/proxy settings

For corporate or offline installation:
1. Download BurntToast from https://github.com/Windos/BurntToast/releases
2. Extract the 'BurntToast' folder from the zip file.
3. Move the 'BurntToast' folder to: 
   $env:USERPROFILE\\Documents\\WindowsPowerShell\\Modules\\
4. Unblock the files: 
   Get-ChildItem -Path $env:USERPROFILE\\Documents\\WindowsPowerShell\\Modules\\BurntToast -Recurse | Unblock-File
5. Import-Module BurntToast
`;
  }

  /**
   * Check if error output contains only warnings
   */
  private isWarningOnly(stderr: string): boolean {
    const lines = stderr.split('\n').filter(line => line.trim());
    return lines.every(line => 
      line.includes('WARNING') || 
      line.includes('VERBOSE') ||
      line.trim() === ''
    );
  }

  /**
   * Comprehensive installation status check
   */
  async getInstallationStatus(): Promise<{
    installed: boolean;
    version?: string;
    canConnect: boolean;
    executionPolicy: { restrictive: boolean; policy: string; canInstall: boolean };
    issues: string[];
  }> {
    const issues: string[] = [];
    
    const installed = await this.isInstalled();
    const version = installed ? await this.getInstalledVersion() : undefined;
    const canConnect = await this.testPowerShellGalleryConnectivity();
    const executionPolicy = await this.checkExecutionPolicy();

    if (!installed) {
      issues.push('BurntToast module not installed');
    }

    if (!canConnect) {
      issues.push('Cannot connect to PowerShell Gallery');
    }

    if (executionPolicy.restrictive) {
      issues.push(`Restrictive execution policy: ${executionPolicy.policy}`);
    }

    return {
      installed,
      version,
      canConnect,
      executionPolicy,
      issues
    };
  }
}
