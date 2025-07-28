import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

import { 
  DependencyChecker, 
  BurntToastAutoInstaller,
  type CheckResult 
} from '../../src/dependencies.js';

// Mock filesystem operations
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  },
  existsSync: vi.fn(),
}));

// Mock Node.js modules
vi.mock('os', () => ({
  homedir: vi.fn(() => '/home/testuser'),
}));

vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/')),
}));

// Mock child_process and util
const mockExecAsync = vi.fn();

vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}));

vi.mock('node:util', () => ({
  promisify: vi.fn(() => mockExecAsync),
}));

describe('Dependencies Module', () => {
  let checker: DependencyChecker;
  let installer: BurntToastAutoInstaller;

  beforeEach(() => {
    vi.clearAllMocks();
    checker = new DependencyChecker();
    installer = new BurntToastAutoInstaller();
    
    // Mock Date.now for consistent testing
    vi.spyOn(Date, 'now').mockReturnValue(1640995200000); // 2022-01-01T00:00:00.000Z
  });

  describe('WSL Environment Detection', () => {
    beforeEach(() => {
      // Reset process.env for each test
      delete process.env.WSL_DISTRO_NAME;
      delete process.env.WSL_INTEROP;
    });

    it('should detect WSL2 environment correctly', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        'Linux version 5.15.90.1-microsoft-standard-WSL2 #1 SMP'
      );

      const result = await checker.checkWSLEnvironment();

      expect(result.name).toBe('wsl-environment');
      expect(result.passed).toBe(true);
      expect(result.fatal).toBe(true);
      expect(result.message).toContain('WSL2');
      expect(result.timestamp).toBe(1640995200000);
    });

    it('should detect WSL1 environment correctly', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        'Linux version 4.4.0-19041-Microsoft #488-Microsoft'
      );

      const result = await checker.checkWSLEnvironment();

      expect(result.name).toBe('wsl-environment');
      expect(result.passed).toBe(true);
      expect(result.fatal).toBe(true);
      expect(result.message).toContain('WSL1');
    });

    it('should fail when not in WSL environment', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        'Linux version 5.15.0-73-generic #80-Ubuntu SMP'
      );

      const result = await checker.checkWSLEnvironment();

      expect(result.name).toBe('wsl-environment');
      expect(result.passed).toBe(false);
      expect(result.fatal).toBe(true);
      expect(result.message).toBe('Not running in WSL environment');
      expect(result.remedy).toBe('Run inside Windows Subsystem for Linux (WSL)');
    });

    it('should handle file read errors gracefully', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Permission denied'));

      const result = await checker.checkWSLEnvironment();

      expect(result.name).toBe('wsl-environment');
      expect(result.passed).toBe(false);
      expect(result.fatal).toBe(true);
      expect(result.message).toBe('Unable to detect WSL environment');
      expect(result.remedy).toBe('Ensure you are running inside WSL');
    });
  });

  describe('PowerShell Access Detection', () => {
    it('should detect accessible PowerShell correctly', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'test\n', stderr: '' });

      const result = await checker.checkPowerShellAccess();

      expect(result.name).toBe('powershell-exe');
      expect(result.passed).toBe(true);
      expect(result.fatal).toBe(true);
      expect(result.message).toBe('PowerShell.exe accessible and functional');
    });

    it('should fail when PowerShell returns wrong output', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'wrong output\n', stderr: '' });

      const result = await checker.checkPowerShellAccess();

      expect(result.name).toBe('powershell-exe');
      expect(result.passed).toBe(false);
      expect(result.fatal).toBe(true);
      expect(result.message).toBe('PowerShell.exe not responding correctly');
      expect(result.remedy).toBe('Add Windows PowerShell to PATH or check WSL interop settings');
    });

    it('should fail when PowerShell command throws error', async () => {
      mockExecAsync.mockRejectedValue(new Error('Command not found'));

      const result = await checker.checkPowerShellAccess();

      expect(result.name).toBe('powershell-exe');
      expect(result.passed).toBe(false);
      expect(result.fatal).toBe(true);
      expect(result.message).toBe('PowerShell.exe not accessible from PATH');
      expect(result.remedy).toBe(
        'Add Windows PowerShell to PATH: export PATH="$PATH:/mnt/c/Windows/System32/WindowsPowerShell/v1.0"'
      );
    });
  });

  describe('BurntToast Module Detection', () => {
    it('should detect installed BurntToast module with version', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'Version\n-------\n0.8.5\n', stderr: '' });

      const result = await checker.checkBurntToast();

      expect(result.name).toBe('burnttoast-module');
      expect(result.passed).toBe(true);
      expect(result.fatal).toBe(true);
      expect(result.message).toBe('BurntToast module installed (version 0.8.5)');
    });

    it('should detect installed BurntToast module without version info', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'ModuleType Name\n---------- ----\nManifest   BurntToast\n', stderr: '' });

      const result = await checker.checkBurntToast();

      expect(result.name).toBe('burnttoast-module');
      expect(result.passed).toBe(true);
      expect(result.fatal).toBe(true);
      expect(result.message).toBe('BurntToast module installed (version unknown)');
    });

    it('should fail when BurntToast module is not installed', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      const result = await checker.checkBurntToast();

      expect(result.name).toBe('burnttoast-module');
      expect(result.passed).toBe(false);
      expect(result.fatal).toBe(true);
      expect(result.message).toBe('BurntToast PowerShell module not installed');
      expect(result.remedy).toBe('Install-Module BurntToast -Scope CurrentUser -Force');
    });

    it('should handle PowerShell execution errors', async () => {
      mockExecAsync.mockRejectedValue(new Error('PowerShell error'));

      const result = await checker.checkBurntToast();

      expect(result.name).toBe('burnttoast-module');
      expect(result.passed).toBe(false);
      expect(result.fatal).toBe(true);
      expect(result.message).toBe('Unable to check BurntToast module availability');
      expect(result.remedy).toBe(
        'Check PowerShell execution policy and install: Install-Module BurntToast -Scope CurrentUser -Force'
      );
    });
  });

  describe('Execution Policy Check', () => {
    it('should pass when execution policy is permissive', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'RemoteSigned\n', stderr: '' });

      const result = await checker.checkExecutionPolicy();

      expect(result.name).toBe('execution-policy');
      expect(result.passed).toBe(true);
      expect(result.fatal).toBe(false);
      expect(result.message).toBe('PowerShell execution policy: RemoteSigned');
    });

    it('should fail when execution policy is restrictive', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'Restricted\n', stderr: '' });

      const result = await checker.checkExecutionPolicy();

      expect(result.name).toBe('execution-policy');
      expect(result.passed).toBe(false);
      expect(result.fatal).toBe(false);
      expect(result.message).toBe('PowerShell execution policy is restrictive: Restricted');
      expect(result.remedy).toBe('Set-ExecutionPolicy -Scope CurrentUser RemoteSigned');
    });

    it('should handle PowerShell execution errors', async () => {
      mockExecAsync.mockRejectedValue(new Error('PowerShell error'));

      const result = await checker.checkExecutionPolicy();

      expect(result.name).toBe('execution-policy');
      expect(result.passed).toBe(false);
      expect(result.fatal).toBe(false);
      expect(result.message).toBe('Unable to check PowerShell execution policy');
      expect(result.remedy).toBe(
        'Check PowerShell access and consider setting: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned'
      );
    });
  });

  describe('JQ Binary Detection', () => {
    it('should detect available jq binary', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '/usr/bin/jq\n', stderr: '' });

      const result = await checker.checkJqBinary();

      expect(result.name).toBe('jq-binary');
      expect(result.passed).toBe(true);
      expect(result.fatal).toBe(false);
      expect(result.message).toBe('jq binary available');
    });

    it('should fail when jq binary is not found', async () => {
      mockExecAsync.mockRejectedValue(new Error('Command not found'));

      const result = await checker.checkJqBinary();

      expect(result.name).toBe('jq-binary');
      expect(result.passed).toBe(false);
      expect(result.fatal).toBe(false);
      expect(result.message).toBe('jq binary not found');
      expect(result.remedy).toBe(
        'Install jq: sudo apt-get install jq (Ubuntu/Debian) or brew install jq (macOS)'
      );
    });
  });

  describe('Claude Directory Detection', () => {
    it('should detect existing Claude directory', async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      const result = await checker.checkClaudeDirectory();

      expect(result.name).toBe('claude-directory');
      expect(result.passed).toBe(true);
      expect(result.fatal).toBe(false);
      expect(result.message).toBe('Claude directory exists');
      expect(existsSync).toHaveBeenCalledWith('/home/testuser/.claude');
    });

    it('should fail when Claude directory does not exist', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const result = await checker.checkClaudeDirectory();

      expect(result.name).toBe('claude-directory');
      expect(result.passed).toBe(false);
      expect(result.fatal).toBe(false);
      expect(result.message).toBe('Claude directory not found');
      expect(result.remedy).toBe(
        'Install Claude Code first, or hooks will not function until Claude is installed'
      );
    });

    it('should handle file system errors gracefully', async () => {
      vi.mocked(existsSync).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await checker.checkClaudeDirectory();

      expect(result.name).toBe('claude-directory');
      expect(result.passed).toBe(false);
      expect(result.fatal).toBe(false);
      expect(result.message).toBe('Unable to check Claude directory');
      expect(result.remedy).toBe('Ensure Claude Code is properly installed');
    });
  });

  describe('Caching System', () => {
    beforeEach(() => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    });

    it('should return cached result when cache is valid', async () => {
      const cachedResult: CheckResult = {
        name: 'wsl-environment',
        passed: true,
        fatal: true,
        message: 'Cached WSL2 result',
        timestamp: 1640995200000 - 1000, // 1 second ago
      };

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({
        'wsl-environment': cachedResult
      }));

      // Mock WSL check to verify it's not called
      vi.mocked(fs.readFile).mockImplementation((path) => {
        if (path.toString().includes('checks.json')) {
          return Promise.resolve(JSON.stringify({
            'wsl-environment': cachedResult
          }));
        }
        throw new Error('Should not read /proc/version when cache is valid');
      });

      const results = await checker.checkAll();

      expect(results).toHaveLength(5); // All 5 checks should return
      expect(results[0]).toEqual(cachedResult);
    });

    it('should ignore invalid cache and run fresh checks', async () => {
      const expiredResult: CheckResult = {
        name: 'wsl-environment',
        passed: true,
        fatal: true,
        message: 'Expired result',
        timestamp: 1640995200000 - (25 * 60 * 60 * 1000), // 25 hours ago
      };

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(fs.readFile).mockImplementation((path) => {
        if (path.toString().includes('checks.json')) {
          return Promise.resolve(JSON.stringify({
            'wsl-environment': expiredResult
          }));
        }
        // Mock /proc/version for fresh WSL check
        return Promise.resolve('Linux version 5.15.90.1-microsoft-standard-WSL2');
      });

      // Mock other external calls
      mockExecAsync.mockResolvedValue({ stdout: 'test\n', stderr: '' });

      const results = await checker.checkAll();

      // Should run fresh checks, not use expired cache
      expect(results[0].message).not.toBe('Expired result');
      expect(results[0].timestamp).toBe(1640995200000); // Fresh timestamp
    });

    it('should handle corrupted cache gracefully', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(fs.readFile).mockImplementation((path) => {
        if (path.toString().includes('checks.json')) {
          return Promise.resolve('invalid json{');
        }
        // Mock /proc/version for WSL check
        return Promise.resolve('Linux version 5.15.90.1-microsoft-standard-WSL2');
      });

      // Mock other external calls
      mockExecAsync.mockResolvedValue({ stdout: 'test\n', stderr: '' });

      const results = await checker.checkAll();

      // Should run fresh checks when cache is corrupted
      expect(results).toHaveLength(5);
      expect(results[0].timestamp).toBe(1640995200000);
    });

    it('should save results to cache after checks', async () => {
      vi.mocked(existsSync).mockReturnValue(false); // No existing cache
      vi.mocked(fs.readFile).mockImplementation((path) => {
        if (path.toString().includes('/proc/version')) {
          return Promise.resolve('Linux version 5.15.90.1-microsoft-standard-WSL2');
        }
        throw new Error('File not found');
      });

      // Mock external exec calls for PowerShell (others will fail)
      mockExecAsync.mockImplementation(async (cmd: string) => {
        if (cmd.includes('powershell.exe')) {
          return { stdout: 'test\n', stderr: '' };
        } else {
          throw new Error('Command not found');
        }
      });

      await checker.checkAll();

      // Verify cache directory creation and save
      expect(fs.mkdir).toHaveBeenCalledWith('/home/testuser/.cache/cctoast-wsl', { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.tmp'),
        expect.stringContaining('"wsl-environment"'),
        'utf-8'
      );
    });

    it('should handle cache save failures gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(fs.readFile).mockImplementation((path) => {
        if (path.toString().includes('/proc/version')) {
          return Promise.resolve('Linux version 5.15.90.1-microsoft-standard-WSL2');
        }
        throw new Error('File not found');
      });
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Disk full'));
      mockExecAsync.mockResolvedValue({ stdout: 'test\n', stderr: '' });

      const results = await checker.checkAll();

      // Should still return results even if cache save fails
      expect(results).toHaveLength(5);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to save dependency check cache:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('BurntToast Auto-Installer', () => {
    it('should detect installed BurntToast module', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'BurntToast module found\n', stderr: '' });

      const isInstalled = await installer.isInstalled();

      expect(isInstalled).toBe(true);
    });

    it('should detect missing BurntToast module', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      const isInstalled = await installer.isInstalled();

      expect(isInstalled).toBe(false);
    });

    it('should handle PowerShell errors during detection', async () => {
      mockExecAsync.mockRejectedValue(new Error('PowerShell error'));

      const isInstalled = await installer.isInstalled();

      expect(isInstalled).toBe(false);
    });

    it('should return true for install prompt (hardcoded for now)', async () => {
      const shouldInstall = await installer.promptInstall();

      expect(shouldInstall).toBe(true);
    });

    it('should install BurntToast module successfully', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockExecAsync.mockResolvedValue({ stdout: 'Module installed', stderr: '' });

      await expect(installer.install()).resolves.not.toThrow();

      expect(consoleLogSpy).toHaveBeenCalledWith('Installing BurntToast PowerShell module...');
      expect(consoleLogSpy).toHaveBeenCalledWith('BurntToast module installed successfully');

      consoleLogSpy.mockRestore();
    });

    it('should handle installation failures', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: 'Installation failed: Access denied' });

      await expect(installer.install()).rejects.toThrow(
        'Failed to install BurntToast: Installation failed: Access denied'
      );
    });

    it('should ignore warnings during installation', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockExecAsync.mockResolvedValue({ stdout: '', stderr: 'WARNING: Module already exists' });

      await expect(installer.install()).resolves.not.toThrow();

      expect(consoleLogSpy).toHaveBeenCalledWith('BurntToast module installed successfully');

      consoleLogSpy.mockRestore();
    });

    it('should verify BurntToast installation successfully', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'success\n', stderr: '' });

      const isVerified = await installer.verify();

      expect(isVerified).toBe(true);
    });

    it('should fail verification when module import fails', async () => {
      mockExecAsync.mockRejectedValue(new Error('Module not found'));

      const isVerified = await installer.verify();

      expect(isVerified).toBe(false);
    });

    it('should fail verification when output is incorrect', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'failure\n', stderr: '' });

      const isVerified = await installer.verify();

      expect(isVerified).toBe(false);
    });
  });

  describe('Force Refresh Mode', () => {
    it('should bypass cache when force refresh is enabled', async () => {
      const forceChecker = new DependencyChecker(true);

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(fs.readFile).mockImplementation((path) => {
        if (path.toString().includes('checks.json')) {
          return Promise.resolve(JSON.stringify({
            'wsl-environment': {
              name: 'wsl-environment',
              passed: true,
              fatal: true,
              message: 'Cached result',
              timestamp: 1640995200000 - 1000, // Valid cache
            }
          }));
        }
        // Fresh check
        return Promise.resolve('Linux version 5.15.90.1-microsoft-standard-WSL2');
      });

      mockExecAsync.mockResolvedValue({ stdout: 'test\n', stderr: '' });

      const results = await forceChecker.checkAll();

      // Should not use cached result due to force refresh
      expect(results[0].message).toBe('Detected WSL2 environment');
      expect(results[0].timestamp).toBe(1640995200000);
    });
  });

  describe('Error Handling in checkAll', () => {
    it('should handle individual check failures gracefully', async () => {
      // Mock first check to throw error
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Unexpected error'));

      // Mock other checks to succeed
      mockExecAsync.mockResolvedValue({ stdout: 'test\n', stderr: '' });

      const results = await checker.checkAll();

      expect(results).toHaveLength(5);
      expect(results[0].name).toBe('unknown');
      expect(results[0].passed).toBe(false);
      expect(results[0].fatal).toBe(true);
      expect(results[0].message).toContain('Check failed: Unexpected error');
    });
  });
});