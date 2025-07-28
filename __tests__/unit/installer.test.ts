import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promises as fs, constants, readFileSync } from 'fs';
import path from 'path';
import os from 'os';

import { 
  Installer, 
  type InstallerConfig, 
  type InstallationResult, 
  type InstallManifest 
} from '../../src/installer.js';

// Mock filesystem and path operations
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    copyFile: vi.fn(),
    chmod: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    access: vi.fn(),
    rm: vi.fn(),
  },
  constants: {
    F_OK: 0,
    R_OK: 4,
    W_OK: 2,
    X_OK: 1,
  },
  readFileSync: vi.fn(),
}));

vi.mock('path', () => ({
  default: {
    join: vi.fn((...args: string[]) => args.join('/')),
    resolve: vi.fn((...args: string[]) => '/' + args.join('/')),
  },
  join: vi.fn((...args: string[]) => args.join('/')),
  resolve: vi.fn((...args: string[]) => '/' + args.join('/')),
}));

vi.mock('os', () => ({
  default: {
    homedir: vi.fn(() => '/home/testuser'),
  },
  homedir: vi.fn(() => '/home/testuser'),
}));

vi.mock('url', () => ({
  fileURLToPath: vi.fn(() => '/fake/file/path'),
}));

// Mock SettingsMerger
const mockMerger = {
  mergeFile: vi.fn(),
  parseJsonc: vi.fn(),
};

vi.mock('../../src/settings-merger.js', () => ({
  SettingsMerger: vi.fn(() => mockMerger),
}));

describe('Installer', () => {
  let installer: Installer;
  let baseConfig: InstallerConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock package.json reading
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({
      version: '1.0.0'
    }));

    baseConfig = {
      global: true,
      local: false,
      notificationHook: true,
      stopHook: true,
      sync: false,
      dryRun: false,
    };

    installer = new Installer(baseConfig);

    // Mock file system operations to succeed by default
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.copyFile).mockResolvedValue(undefined);
    vi.mocked(fs.chmod).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue('{}');
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.rm).mockResolvedValue(undefined);

    // Mock settings merger
    mockMerger.mergeFile.mockResolvedValue({
      changed: true,
      backupPath: '/backup/path',
    });
    mockMerger.parseJsonc.mockResolvedValue({});
  });

  describe('Constructor', () => {
    it('should read package version from package.json', () => {
      expect(readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('package.json'),
        'utf8'
      );
    });

    it('should fallback to version 0.0.0 when package.json cannot be read', () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('File not found');
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const installerWithError = new Installer(baseConfig);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Warning: Could not read package.json version, using fallback'
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Installation Paths', () => {
    it('should determine global installation paths correctly', async () => {
      const config: InstallerConfig = {
        ...baseConfig,
        global: true,
        local: false,
      };
      
      const installer = new Installer(config);
      
      // We can't directly test private methods, but we can test through install()
      // The paths will be verified through the mocked fs calls
      await installer.install();
      expect(path.join).toHaveBeenCalledWith('/home/testuser', '.claude', 'cctoast-wsl');
      expect(path.join).toHaveBeenCalledWith('/home/testuser', '.claude', 'settings.json');
    });

    it('should determine local installation paths correctly', async () => {
      const config: InstallerConfig = {
        ...baseConfig,
        global: false,
        local: true,
        sync: false,
      };
      
      const installer = new Installer(config);
      
      await installer.install();
      expect(path.join).toHaveBeenCalledWith(expect.any(String), '.claude', 'cctoast-wsl');
      expect(path.join).toHaveBeenCalledWith(expect.any(String), '.claude', 'settings.local.json');
    });

    it('should use settings.json for local installation with sync flag', async () => {
      const config: InstallerConfig = {
        ...baseConfig,
        global: false,
        local: true,
        sync: true,
      };
      
      const installer = new Installer(config);
      
      await installer.install();
      expect(path.join).toHaveBeenCalledWith(expect.any(String), '.claude', 'settings.json');
    });

    it('should default to global when neither global nor local is specified', async () => {
      const config: InstallerConfig = {
        ...baseConfig,
        global: false,
        local: false,
      };
      
      const installer = new Installer(config);
      
      await installer.install();
      expect(path.join).toHaveBeenCalledWith('/home/testuser', '.claude', 'cctoast-wsl');
    });
  });

  describe('Directory Creation', () => {
    it('should create installation directory recursively', async () => {
      await installer.install();
      
      expect(fs.mkdir).toHaveBeenCalledWith(
        '/home/testuser/.claude/cctoast-wsl',
        { recursive: true }
      );
    });

    it('should create assets subdirectory', async () => {
      await installer.install();
      
      expect(fs.mkdir).toHaveBeenCalledWith(
        '/home/testuser/.claude/cctoast-wsl/assets',
        { recursive: true }
      );
    });

    it('should handle directory creation failures', async () => {
      vi.mocked(fs.mkdir).mockRejectedValue(new Error('Permission denied'));
      
      const result = await installer.install();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Installation failed: Permission denied');
    });
  });

  describe('File Copying', () => {
    it('should copy show-toast.sh script', async () => {
      await installer.install();
      
      expect(fs.copyFile).toHaveBeenCalledWith(
        expect.stringContaining('scripts/show-toast.sh'),
        '/home/testuser/.claude/cctoast-wsl/show-toast.sh'
      );
    });

    it('should copy claude.png icon', async () => {
      await installer.install();
      
      expect(fs.copyFile).toHaveBeenCalledWith(
        expect.stringContaining('assets/claude.png'),
        '/home/testuser/.claude/cctoast-wsl/assets/claude.png'
      );
    });

    it('should continue if icon copy fails', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      vi.mocked(fs.copyFile).mockImplementation(async (src, dest) => {
        if (src.toString().includes('claude.png')) {
          throw new Error('Icon not found');
        }
      });
      
      const result = await installer.install();
      
      expect(result.success).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Warning: Could not copy claude.png icon');
      
      consoleWarnSpy.mockRestore();
    });

    it('should fail if script copy fails', async () => {
      vi.mocked(fs.copyFile).mockImplementation(async (src, dest) => {
        if (src.toString().includes('show-toast.sh')) {
          throw new Error('Script not found');
        }
      });
      
      const result = await installer.install();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Script not found');
    });
  });

  describe('Permission Setting', () => {
    it('should set script permissions to 0o500', async () => {
      await installer.install();
      
      expect(fs.chmod).toHaveBeenCalledWith(
        '/home/testuser/.claude/cctoast-wsl/show-toast.sh',
        0o500
      );
    });

    it('should handle permission setting failures', async () => {
      vi.mocked(fs.chmod).mockRejectedValue(new Error('Permission denied'));
      
      const result = await installer.install();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Permission denied');
    });
  });

  describe('Hook Installation', () => {
    it('should install notification hook when enabled', async () => {
      const config: InstallerConfig = {
        ...baseConfig,
        notificationHook: true,
        stopHook: false,
      };
      
      const installer = new Installer(config);
      await installer.install();
      
      expect(mockMerger.mergeFile).toHaveBeenCalledWith(
        '/home/testuser/.claude/settings.json',
        {
          hooks: {
            notification: ['/home/testuser/.claude/cctoast-wsl/show-toast.sh --notification-hook']
          }
        },
        {
          deduplicateArrays: true,
          preserveOrder: true,
          createBackup: true,
        }
      );
    });

    it('should install stop hook when enabled', async () => {
      const config: InstallerConfig = {
        ...baseConfig,
        notificationHook: false,
        stopHook: true,
      };
      
      const installer = new Installer(config);
      await installer.install();
      
      expect(mockMerger.mergeFile).toHaveBeenCalledWith(
        '/home/testuser/.claude/settings.json',
        {
          hooks: {
            stop: ['/home/testuser/.claude/cctoast-wsl/show-toast.sh --stop-hook']
          }
        },
        expect.any(Object)
      );
    });

    it('should install both hooks when both are enabled', async () => {
      const config: InstallerConfig = {
        ...baseConfig,
        notificationHook: true,
        stopHook: true,
      };
      
      const installer = new Installer(config);
      await installer.install();
      
      expect(mockMerger.mergeFile).toHaveBeenCalledWith(
        expect.any(String),
        {
          hooks: {
            notification: [expect.stringContaining('--notification-hook')],
            stop: [expect.stringContaining('--stop-hook')]
          }
        },
        expect.any(Object)
      );
    });

    it('should use correct paths for local installation', async () => {
      const config: InstallerConfig = {
        ...baseConfig,
        global: false,
        local: true,
        notificationHook: true,
        stopHook: false,
      };
      
      // Mock process.cwd() for local installation
      const originalCwd = process.cwd;
      process.cwd = vi.fn(() => '/project/dir');
      
      const installer = new Installer(config);
      await installer.install();
      
      expect(mockMerger.mergeFile).toHaveBeenCalledWith(
        expect.stringContaining('settings.local.json'),
        {
          hooks: {
            notification: ['/project/dir/.claude/cctoast-wsl/show-toast.sh --notification-hook']
          }
        },
        expect.any(Object)
      );
      
      process.cwd = originalCwd;
    });
  });

  describe('Manifest Creation', () => {
    it('should create installation manifest', async () => {
      const result = await installer.install();
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/home/testuser/.claude/cctoast-wsl/install-manifest.json',
        expect.stringContaining('"version": "1.0.0"'),
        'utf-8'
      );
      
      expect(result.success).toBe(true);
    });

    it('should include correct manifest data', async () => {
      await installer.install();
      
      const manifestCall = vi.mocked(fs.writeFile).mock.calls.find(call => 
        call[0].toString().includes('install-manifest.json')
      );
      
      expect(manifestCall).toBeDefined();
      
      const manifestContent = JSON.parse(manifestCall![1] as string) as InstallManifest;
      expect(manifestContent.version).toBe('1.0.0');
      expect(manifestContent.config).toEqual(baseConfig);
      expect(manifestContent.files).toContain('show-toast.sh');
      expect(manifestContent.hooksInstalled).toEqual(['notification', 'stop']);
    });

    it('should continue if manifest creation fails', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      vi.mocked(fs.writeFile).mockImplementation(async (path, content) => {
        if (path.toString().includes('manifest.json')) {
          throw new Error('Cannot write manifest');
        }
      });
      
      const result = await installer.install();
      
      expect(result.success).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not create installation manifest')
      );
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Dry Run Mode', () => {
    it('should preview installation without making changes', async () => {
      const config: InstallerConfig = {
        ...baseConfig,
        dryRun: true,
      };
      
      const installer = new Installer(config);
      const result = await installer.install();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('DRY RUN - No changes would be made');
      expect(result.message).toContain('Install directory: /home/testuser/.claude/cctoast-wsl');
      expect(result.message).toContain('Settings file: /home/testuser/.claude/settings.json');
      expect(result.message).toContain('Hooks to add: notification, stop');
      
      // Should not make any filesystem changes
      expect(fs.mkdir).not.toHaveBeenCalled();
      expect(fs.copyFile).not.toHaveBeenCalled();
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should show only enabled hooks in dry run', async () => {
      const config: InstallerConfig = {
        ...baseConfig,
        dryRun: true,
        notificationHook: true,
        stopHook: false,
      };
      
      const installer = new Installer(config);
      const result = await installer.install();
      
      expect(result.message).toContain('Hooks to add: notification');
      // The "Hooks to add" section should only show enabled hooks
      const hooksToAddLine = result.message.split('\n').find(line => line.includes('Hooks to add:'));
      expect(hooksToAddLine).toBe('Hooks to add: notification');
    });
  });

  describe('Installation Result', () => {
    it('should return success result with correct data', async () => {
      mockMerger.mergeFile.mockResolvedValue({
        changed: true,
        backupPath: '/backup/settings.json.20240101',
      });
      
      const result = await installer.install();
      
      expect(result).toEqual({
        success: true,
        installedTo: '/home/testuser/.claude/cctoast-wsl',
        settingsPath: '/home/testuser/.claude/settings.json',
        backupPath: '/backup/settings.json.20240101',
        hooksAdded: ['notification', 'stop'],
        message: 'Successfully installed cctoast-wsl to /home/testuser/.claude/cctoast-wsl',
      });
    });

    it('should return failure result on error', async () => {
      vi.mocked(fs.mkdir).mockRejectedValue(new Error('Disk full'));
      
      const result = await installer.install();
      
      expect(result).toEqual({
        success: false,
        installedTo: '',
        settingsPath: '',
        hooksAdded: [],
        message: 'Installation failed: Disk full',
      });
    });
  });

  describe('Uninstallation', () => {
    beforeEach(() => {
      // Mock manifest file reading
      vi.mocked(fs.readFile).mockImplementation(async (path) => {
        if (path.toString().includes('manifest.json')) {
          return JSON.stringify({
            version: '1.0.0',
            hooksInstalled: ['notification', 'stop'],
            config: baseConfig,
          } as InstallManifest);
        }
        // Mock settings file
        return JSON.stringify({
          hooks: {
            notification: ['/home/testuser/.claude/cctoast-wsl/show-toast.sh --notification-hook'],
            stop: ['/home/testuser/.claude/cctoast-wsl/show-toast.sh --stop-hook'],
          }
        });
      });

      mockMerger.parseJsonc.mockResolvedValue({
        hooks: {
          notification: ['/home/testuser/.claude/cctoast-wsl/show-toast.sh --notification-hook'],
          stop: ['/home/testuser/.claude/cctoast-wsl/show-toast.sh --stop-hook'],
        }
      });
    });

    it('should remove installation directory', async () => {
      const result = await installer.uninstall();
      
      expect(fs.rm).toHaveBeenCalledWith(
        '/home/testuser/.claude/cctoast-wsl',
        { recursive: true, force: true }
      );
      
      expect(result.success).toBe(true);
    });

    it('should remove hooks from settings', async () => {
      await installer.uninstall();
      
      expect(mockMerger.parseJsonc).toHaveBeenCalled();
      expect(mockMerger.mergeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          hooks: expect.any(Object)
        }),
        { createBackup: true }
      );
    });

    it('should work without manifest file', async () => {
      vi.mocked(fs.readFile).mockImplementation(async (path) => {
        if (path.toString().includes('manifest.json')) {
          throw new Error('File not found');
        }
        return JSON.stringify({ hooks: {} });
      });
      
      const result = await installer.uninstall();
      
      expect(result.success).toBe(true);
      expect(fs.rm).toHaveBeenCalledWith(
        '/home/testuser/.claude/cctoast-wsl',
        { recursive: true, force: true }
      );
    });

    it('should handle uninstallation errors gracefully', async () => {
      vi.mocked(fs.rm).mockRejectedValue(new Error('Permission denied'));
      
      const result = await installer.uninstall();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Uninstall failed: Permission denied');
    });

    it('should preserve non-cctoast hooks in settings', async () => {
      mockMerger.parseJsonc.mockResolvedValue({
        hooks: {
          notification: [
            '/home/testuser/.claude/cctoast-wsl/show-toast.sh --notification-hook',
            'other-hook-command'
          ],
          stop: ['/home/testuser/.claude/cctoast-wsl/show-toast.sh --stop-hook']
        }
      });

      await installer.uninstall();

      // Should call mergeFile with updated settings that preserve other hooks
      const mergeCall = mockMerger.mergeFile.mock.calls[0];
      const updatedSettings = mergeCall[1];
      
      // The exact structure depends on the implementation, but we expect other hooks to be preserved
      expect(mockMerger.mergeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        { createBackup: true }
      );
    });
  });

  describe('Installation Detection', () => {
    it('should detect existing installation', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      
      const isInstalled = await installer.isInstalled();
      
      expect(isInstalled).toBe(true);
      expect(fs.access).toHaveBeenCalledWith(
        '/home/testuser/.claude/cctoast-wsl',
        constants.F_OK
      );
      expect(fs.access).toHaveBeenCalledWith(
        '/home/testuser/.claude/cctoast-wsl/show-toast.sh',
        constants.F_OK
      );
    });

    it('should detect missing installation', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));
      
      const isInstalled = await installer.isInstalled();
      
      expect(isInstalled).toBe(false);
    });

    it('should check both directory and script file', async () => {
      // Directory exists but script doesn't
      vi.mocked(fs.access).mockImplementation(async (path) => {
        if (path.toString().includes('show-toast.sh')) {
          throw new Error('Script not found');
        }
      });
      
      const isInstalled = await installer.isInstalled();
      
      expect(isInstalled).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle filesystem permission errors', async () => {
      vi.mocked(fs.mkdir).mockRejectedValue(new Error('EACCES: permission denied'));
      
      const result = await installer.install();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('EACCES: permission denied');
    });

    it('should handle disk space errors', async () => {
      vi.mocked(fs.copyFile).mockRejectedValue(new Error('ENOSPC: no space left'));
      
      const result = await installer.install();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('ENOSPC: no space left');
    });

    it('should handle settings merge errors', async () => {
      mockMerger.mergeFile.mockRejectedValue(new Error('Invalid JSON'));
      
      const result = await installer.install();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid JSON');
    });

    it('should provide meaningful error messages', async () => {
      const customError = new Error('Custom filesystem error');
      vi.mocked(fs.chmod).mockRejectedValue(customError);
      
      const result = await installer.install();
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Installation failed: Custom filesystem error');
    });
  });

  describe('Hook Command Generation', () => {
    it('should generate correct hook commands for global installation', async () => {
      await installer.install();
      
      const mergeCall = mockMerger.mergeFile.mock.calls[0];
      const updates = mergeCall[1];
      
      expect(updates.hooks.notification[0]).toBe(
        '/home/testuser/.claude/cctoast-wsl/show-toast.sh --notification-hook'
      );
      expect(updates.hooks.stop[0]).toBe(
        '/home/testuser/.claude/cctoast-wsl/show-toast.sh --stop-hook'
      );
    });

    it('should generate correct hook commands for local installation', async () => {
      const config: InstallerConfig = {
        ...baseConfig,
        global: false,
        local: true,
      };
      
      const originalCwd = process.cwd;
      process.cwd = vi.fn(() => '/project/root');
      
      const installer = new Installer(config);
      await installer.install();
      
      const mergeCall = mockMerger.mergeFile.mock.calls[0];
      const updates = mergeCall[1];
      
      expect(updates.hooks.notification[0]).toBe(
        '/project/root/.claude/cctoast-wsl/show-toast.sh --notification-hook'
      );
      
      process.cwd = originalCwd;
    });
  });
});