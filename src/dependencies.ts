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
  promptInstall(): Promise<boolean>;
  install(): Promise<void>;
  verify(): Promise<boolean>;
}

export class DependencyChecker {
  private readonly cacheDir = join(homedir(), '.cache', 'cctoast-wsl');
  private readonly cacheFile = join(this.cacheDir, 'checks.json');
  private readonly cacheTimeoutMs = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private readonly _forceRefresh = false) {}

  /**
   * Check all dependencies with caching
   */
  async checkAll(): Promise<CheckResult[]> {
    const checks = [
      () => this.checkWSLEnvironment(),
      () => this.checkPowerShellAccess(),
      () => this.checkBurntToast(),
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
  async checkBurntToast(): Promise<CheckResult> {
    const name = 'burnttoast-module';

    try {
      // Check if BurntToast module is available
      const { stdout } = await execAsync(
        'powershell.exe -Command "Get-Module -ListAvailable -Name BurntToast | Select-Object Version"',
        { timeout: 10000 }
      );

      if (stdout.trim() && !stdout.includes('No modules')) {
        // Extract version if available
        const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
        const version = versionMatch ? versionMatch[1] : 'unknown';

        return {
          name,
          passed: true,
          fatal: true,
          message: `BurntToast module installed (version ${version})`,
          timestamp: Date.now(),
        };
      } else {
        return {
          name,
          passed: false,
          fatal: true,
          message: 'BurntToast PowerShell module not installed',
          remedy: 'Install-Module BurntToast -Scope CurrentUser -Force',
          timestamp: Date.now(),
        };
      }
    } catch {
      return {
        name,
        passed: false,
        fatal: true,
        message: 'Unable to check BurntToast module availability',
        remedy:
          'Check PowerShell execution policy and install: Install-Module BurntToast -Scope CurrentUser -Force',
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
 */
export class BurntToastAutoInstaller implements BurntToastInstaller {
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

  async promptInstall(): Promise<boolean> {
    // This will be called from CLI with user prompts
    // For now, just return true to indicate consent
    return true;
  }

  async install(): Promise<void> {
    try {
      console.log('Installing BurntToast PowerShell module...');

      const { stderr } = await execAsync(
        'powershell.exe -Command "Install-Module BurntToast -Scope CurrentUser -Force -AllowClobber"',
        { timeout: 60000 } // Allow up to 60 seconds for installation
      );

      if (stderr && !stderr.includes('WARNING')) {
        throw new Error(`Installation failed: ${stderr}`);
      }

      console.log('BurntToast module installed successfully');
    } catch (error) {
      throw new Error(
        `Failed to install BurntToast: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  async verify(): Promise<boolean> {
    try {
      // Verify installation by attempting to import the module
      const { stdout } = await execAsync(
        'powershell.exe -Command "Import-Module BurntToast -ErrorAction Stop; Write-Output success"',
        { timeout: 10000 }
      );

      return stdout.trim() === 'success';
    } catch {
      return false;
    }
  }
}
