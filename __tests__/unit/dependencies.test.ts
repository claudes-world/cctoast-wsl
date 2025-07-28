import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import { DependencyChecker, BurntToastAutoInstaller } from '../../src/dependencies.js';

// Mock node:child_process
vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}));

// Mock node:fs/promises  
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

// Mock node:fs
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));

const mockExec = vi.mocked(exec);

describe('BurntToast Auto-Installer', () => {
  let installer: BurntToastAutoInstaller;

  beforeEach(() => {
    vi.clearAllMocks();
    installer = new BurntToastAutoInstaller({ quiet: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isInstalled', () => {
    it('should return true when BurntToast is installed', async () => {
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, { stdout: 'BurntToast 0.8.5', stderr: '' } as any);
        }
        return {} as any;
      });

      const result = await installer.isInstalled();
      expect(result).toBe(true);
    });

    it('should return false when BurntToast is not installed', async () => {
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, { stdout: '', stderr: '' } as any);
        }
        return {} as any;
      });

      const result = await installer.isInstalled();
      expect(result).toBe(false);
    });

    it('should return false when PowerShell command fails', async () => {
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('PowerShell not found'), { stdout: '', stderr: '' } as any);
        }
        return {} as any;
      });

      const result = await installer.isInstalled();
      expect(result).toBe(false);
    });
  });

  describe('getInstalledVersion', () => {
    it('should return version when BurntToast is installed', async () => {
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, { stdout: '0.8.5', stderr: '' } as any);
        }
        return {} as any;
      });

      const result = await installer.getInstalledVersion();
      expect(result).toBe('0.8.5');
    });

    it('should return null when version cannot be determined', async () => {
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, { stdout: 'invalid output', stderr: '' } as any);
        }
        return {} as any;
      });

      const result = await installer.getInstalledVersion();
      expect(result).toBe(null);
    });

    it('should return null when command fails', async () => {
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('Failed'), { stdout: '', stderr: '' } as any);
        }
        return {} as any;
      });

      const result = await installer.getInstalledVersion();
      expect(result).toBe(null);
    });
  });

  describe('checkExecutionPolicy', () => {
    it('should identify restrictive execution policy', async () => {
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, { stdout: 'Restricted', stderr: '' } as any);
        }
        return {} as any;
      });

      const result = await installer.checkExecutionPolicy();
      expect(result.restrictive).toBe(true);
      expect(result.policy).toBe('Restricted');
      expect(result.canInstall).toBe(true); // Should still try to install
    });

    it('should identify permissive execution policy', async () => {
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, { stdout: 'RemoteSigned', stderr: '' } as any);
        }
        return {} as any;
      });

      const result = await installer.checkExecutionPolicy();
      expect(result.restrictive).toBe(false);
      expect(result.policy).toBe('RemoteSigned');
      expect(result.canInstall).toBe(true);
    });

    it('should handle policy check failure gracefully', async () => {
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('Access denied'), { stdout: '', stderr: '' } as any);
        }
        return {} as any;
      });

      const result = await installer.checkExecutionPolicy();
      expect(result.restrictive).toBe(true);
      expect(result.policy).toBe('Unknown');
      expect(result.canInstall).toBe(false);
    });
  });

  describe('testPowerShellGalleryConnectivity', () => {
    it('should return true when connectivity test succeeds', async () => {
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          if (command.includes('Test-NetConnection')) {
            callback(null, { stdout: 'True', stderr: '' } as any);
          } else {
            callback(null, { stdout: '', stderr: '' } as any);
          }
        }
        return {} as any;
      });

      const result = await installer.testPowerShellGalleryConnectivity();
      expect(result).toBe(true);
    });

    it('should fallback to Invoke-WebRequest when Test-NetConnection fails', async () => {
      let callCount = 0;
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          callCount++;
          if (callCount === 1) {
            // First call (Test-NetConnection) fails
            callback(new Error('Command not found'), { stdout: '', stderr: '' } as any);
          } else {
            // Second call (Invoke-WebRequest) succeeds
            callback(null, { stdout: '', stderr: '' } as any);
          }
        }
        return {} as any;
      });

      const result = await installer.testPowerShellGalleryConnectivity();
      expect(result).toBe(true);
      expect(callCount).toBe(2);
    });

    it('should return false when all connectivity tests fail', async () => {
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('Network unreachable'), { stdout: '', stderr: '' } as any);
        }
        return {} as any;
      });

      const result = await installer.testPowerShellGalleryConnectivity();
      expect(result).toBe(false);
    });
  });

  describe('install', () => {
    it('should install BurntToast successfully', async () => {
      // Mock execution policy check (non-restrictive)
      let callCount = 0;
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          callCount++;
          if (command.includes('Get-ExecutionPolicy')) {
            callback(null, { stdout: 'RemoteSigned', stderr: '' } as any);
          } else if (command.includes('Install-Module')) {
            callback(null, { stdout: 'Installation complete', stderr: '' } as any);
          } else {
            callback(null, { stdout: '', stderr: '' } as any);
          }
        }
        return {} as any;
      });

      await expect(installer.install()).resolves.not.toThrow();
      expect(callCount).toBeGreaterThanOrEqual(2); // Policy check + install
    });

    it('should handle installation with restrictive execution policy', async () => {
      let callCount = 0;
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          callCount++;
          if (command.includes('Get-ExecutionPolicy')) {
            callback(null, { stdout: 'Restricted', stderr: '' } as any);
          } else if (command.includes('Set-ExecutionPolicy') && command.includes('Install-Module')) {
            // Combined command with policy bypass
            callback(null, { stdout: 'Installation complete', stderr: '' } as any);
          } else {
            callback(null, { stdout: '', stderr: '' } as any);
          }
        }
        return {} as any;
      });

      await expect(installer.install()).resolves.not.toThrow();
    });

    it('should handle installation failure gracefully', async () => {
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          if (command.includes('Get-ExecutionPolicy')) {
            callback(null, { stdout: 'RemoteSigned', stderr: '' } as any);
          } else if (command.includes('Install-Module')) {
            callback(null, { stdout: '', stderr: 'Unable to resolve package source' } as any);
          }
        }
        return {} as any;
      });

      await expect(installer.install()).rejects.toThrow('Unable to connect to PowerShell Gallery');
    });

    it('should handle execution policy errors with specific message', async () => {
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          if (command.includes('Get-ExecutionPolicy')) {
            callback(null, { stdout: 'RemoteSigned', stderr: '' } as any);
          } else if (command.includes('Install-Module')) {
            callback(new Error('execution of scripts is disabled'), { stdout: '', stderr: '' } as any);
          }
        }
        return {} as any;
      });

      await expect(installer.install()).rejects.toThrow('PowerShell script execution is disabled');
    });

    it('should ignore warnings during installation', async () => {
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          if (command.includes('Get-ExecutionPolicy')) {
            callback(null, { stdout: 'RemoteSigned', stderr: '' } as any);
          } else if (command.includes('Install-Module')) {
            callback(null, { 
              stdout: 'Installation complete', 
              stderr: 'WARNING: Module already exists\nVERBOSE: Installing to user scope' 
            } as any);
          }
        }
        return {} as any;
      });

      await expect(installer.install()).resolves.not.toThrow();
    });
  });

  describe('verify', () => {
    it('should verify successful installation', async () => {
      let callCount = 0;
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          callCount++;
          if (command.includes('Import-Module') && command.includes('import-success')) {
            callback(null, { stdout: 'import-success', stderr: '' } as any);
          } else if (command.includes('Get-Command') && command.includes('function-available')) {
            callback(null, { stdout: 'function-available', stderr: '' } as any);
          } else {
            callback(null, { stdout: '', stderr: '' } as any);
          }
        }
        return {} as any;
      });

      const result = await installer.verify();
      expect(result).toBe(true);
      expect(callCount).toBe(2); // Import check + function check
    });

    it('should return false when import fails', async () => {
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          if (command.includes('Import-Module')) {
            callback(new Error('Module not found'), { stdout: '', stderr: '' } as any);
          }
        }
        return {} as any;
      });

      const result = await installer.verify();
      expect(result).toBe(false);
    });

    it('should return false when function is not available', async () => {
      let callCount = 0;
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          callCount++;
          if (command.includes('Import-Module') && command.includes('import-success')) {
            callback(null, { stdout: 'import-success', stderr: '' } as any);
          } else if (command.includes('Get-Command')) {
            callback(new Error('Command not found'), { stdout: '', stderr: '' } as any);
          }
        }
        return {} as any;
      });

      const result = await installer.verify();
      expect(result).toBe(false);
    });
  });

  describe('getInstallationStatus', () => {
    it('should return comprehensive status when everything is working', async () => {
      let callCount = 0;
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          callCount++;
          if (command.includes('Get-Module -ListAvailable')) {
            callback(null, { stdout: 'BurntToast 0.8.5', stderr: '' } as any);
          } else if (command.includes('Select-Object -ExpandProperty Version')) {
            callback(null, { stdout: '0.8.5', stderr: '' } as any);
          } else if (command.includes('Test-NetConnection')) {
            callback(null, { stdout: 'True', stderr: '' } as any);
          } else if (command.includes('Get-ExecutionPolicy')) {
            callback(null, { stdout: 'RemoteSigned', stderr: '' } as any);
          }
        }
        return {} as any;
      });

      const status = await installer.getInstallationStatus();
      
      expect(status.installed).toBe(true);
      expect(status.version).toBe('0.8.5');
      expect(status.canConnect).toBe(true);
      expect(status.executionPolicy.restrictive).toBe(false);
      expect(status.executionPolicy.policy).toBe('RemoteSigned');
      expect(status.issues).toHaveLength(0);
    });

    it('should identify issues when BurntToast is not installed', async () => {
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          if (command.includes('Get-Module -ListAvailable')) {
            callback(null, { stdout: '', stderr: '' } as any);
          } else if (command.includes('Select-Object -ExpandProperty Version')) {
            callback(new Error('No version'), { stdout: '', stderr: '' } as any);
          } else if (command.includes('Test-NetConnection')) {
            callback(new Error('Network error'), { stdout: '', stderr: '' } as any);
          } else if (command.includes('Invoke-WebRequest')) {
            callback(new Error('Network error'), { stdout: '', stderr: '' } as any);
          } else if (command.includes('Get-ExecutionPolicy')) {
            callback(null, { stdout: 'Restricted', stderr: '' } as any);
          } else {
            callback(null, { stdout: '', stderr: '' } as any);
          }
        }
        return {} as any;
      });

      const status = await installer.getInstallationStatus();
      
      expect(status.installed).toBe(false);
      expect(status.canConnect).toBe(false);
      expect(status.executionPolicy.restrictive).toBe(true);
      expect(status.issues).toContain('BurntToast module not installed');
      expect(status.issues).toContain('Cannot connect to PowerShell Gallery');
      expect(status.issues).toContain('Restrictive execution policy: Restricted');
    });
  });

  describe('getManualInstallInstructions', () => {
    it('should return comprehensive manual installation instructions', () => {
      const instructions = installer.getManualInstallInstructions();
      
      expect(instructions).toContain('Manual BurntToast Installation Instructions');
      expect(instructions).toContain('Install-Module BurntToast -Scope CurrentUser -Force');
      expect(instructions).toContain('Set-ExecutionPolicy -Scope CurrentUser RemoteSigned');
      expect(instructions).toContain('New-BurntToastNotification');
      expect(instructions).toContain('offline installation');
    });
  });
});

describe('Dependency Checker Integration', () => {
  let checker: DependencyChecker;
  let installer: BurntToastAutoInstaller;

  beforeEach(() => {
    vi.clearAllMocks();
    installer = new BurntToastAutoInstaller({ quiet: true });
    checker = new DependencyChecker(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkBurntToast integration', () => {
    it('should return success when BurntToast is installed', async () => {
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          // Mock all the status check calls
          if (command.includes('Get-Module -ListAvailable')) {
            callback(null, { stdout: 'BurntToast 0.8.5', stderr: '' } as any);
          } else if (command.includes('Select-Object -ExpandProperty Version')) {
            callback(null, { stdout: '0.8.5', stderr: '' } as any);
          } else if (command.includes('Test-NetConnection')) {
            callback(null, { stdout: 'True', stderr: '' } as any);
          } else if (command.includes('Get-ExecutionPolicy')) {
            callback(null, { stdout: 'RemoteSigned', stderr: '' } as any);
          }
        }
        return {} as any;
      });

      const result = await checker.checkBurntToast(installer);
      
      expect(result.name).toBe('burnttoast-module');
      expect(result.passed).toBe(true);
      expect(result.fatal).toBe(true);
      expect(result.message).toContain('BurntToast module installed');
      expect(result.message).toContain('0.8.5');
    });

    it('should return failure with auto-install hint when BurntToast is missing but installable', async () => {
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          if (command.includes('Get-Module -ListAvailable')) {
            callback(null, { stdout: '', stderr: '' } as any);
          } else if (command.includes('Test-NetConnection')) {
            callback(null, { stdout: 'True', stderr: '' } as any);
          } else if (command.includes('Get-ExecutionPolicy')) {
            callback(null, { stdout: 'RemoteSigned', stderr: '' } as any);
          }
        }
        return {} as any;
      });

      const result = await checker.checkBurntToast(installer);
      
      expect(result.passed).toBe(false);
      expect(result.fatal).toBe(true);
      expect(result.remedy).toContain('Auto-installation available');
    });

    it('should return failure with manual install hint when auto-install is not possible', async () => {
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof callback === 'function') {
          if (command.includes('Get-Module -ListAvailable')) {
            callback(null, { stdout: '', stderr: '' } as any);
          } else if (command.includes('Select-Object -ExpandProperty Version')) {
            callback(new Error('No version'), { stdout: '', stderr: '' } as any);
          } else if (command.includes('Test-NetConnection')) {
            callback(new Error('Network error'), { stdout: '', stderr: '' } as any);
          } else if (command.includes('Invoke-WebRequest')) {
            callback(new Error('Network error'), { stdout: '', stderr: '' } as any);
          } else if (command.includes('Get-ExecutionPolicy')) {
            callback(new Error('Access denied'), { stdout: '', stderr: '' } as any);
          } else {
            callback(null, { stdout: '', stderr: '' } as any);
          }
        }
        return {} as any;
      });

      const result = await checker.checkBurntToast(installer);
      
      expect(result.passed).toBe(false);
      expect(result.fatal).toBe(true);
      expect(result.remedy).toContain('Manual installation required');
    });
  });
});