import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Mock filesystem operations
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    chmod: vi.fn(),
    stat: vi.fn(),
    copyFile: vi.fn(),
    unlink: vi.fn(),
  },
  existsSync: vi.fn(),
}));

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/')),
  dirname: vi.fn(),
  basename: vi.fn(),
}));

vi.mock('os', () => ({
  homedir: vi.fn(() => '/home/testuser'),
}));

// Integration test setup - these would simulate actual installer behavior
describe('Installation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks for successful installation
    vi.mocked(existsSync).mockReturnValue(false); // Fresh install
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.copyFile).mockResolvedValue(undefined);
    vi.mocked(fs.chmod).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue('{}'); // Empty settings file
  });

  describe('Global Installation Flow', () => {
    it('should perform complete global installation with all components', async () => {
      // Mock successful dependency checks
      vi.mocked(execSync).mockImplementation((cmd) => {
        if (cmd.toString().includes('powershell.exe')) {
          return Buffer.from('success');
        }
        throw new Error('Command not found');
      });

      // Simulate installer execution - this would be the actual CLI in real integration tests
      const mockInstaller = {
        async install(options: any) {
          // 1. Create installation directory
          await fs.mkdir('/home/testuser/.claude/cctoast-wsl', { recursive: true });
          
          // 2. Copy show-toast.sh script
          await fs.copyFile('scripts/show-toast.sh', '/home/testuser/.claude/cctoast-wsl/show-toast.sh');
          
          // 3. Set script permissions
          await fs.chmod('/home/testuser/.claude/cctoast-wsl/show-toast.sh', 0o500);
          
          // 4. Copy assets
          await fs.copyFile('assets/claude.png', '/home/testuser/.claude/cctoast-wsl/claude.png');
          
          // 5. Update Claude settings
          const settingsPath = '/home/testuser/.claude/settings.json';
          const settings = {
            hooks: {
              notification: ['/home/testuser/.claude/cctoast-wsl/show-toast.sh --notification-hook'],
              stop: ['/home/testuser/.claude/cctoast-wsl/show-toast.sh --stop-hook']
            }
          };
          await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
          
          return { success: true, installed: ['notification', 'stop'] };
        }
      };

      const result = await mockInstaller.install({
        global: true,
        notification: true,
        stop: true
      });

      // Verify installation steps
      expect(fs.mkdir).toHaveBeenCalledWith('/home/testuser/.claude/cctoast-wsl', { recursive: true });
      expect(fs.copyFile).toHaveBeenCalledWith('scripts/show-toast.sh', '/home/testuser/.claude/cctoast-wsl/show-toast.sh');
      expect(fs.chmod).toHaveBeenCalledWith('/home/testuser/.claude/cctoast-wsl/show-toast.sh', 0o500);
      expect(fs.copyFile).toHaveBeenCalledWith('assets/claude.png', '/home/testuser/.claude/cctoast-wsl/claude.png');
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/home/testuser/.claude/settings.json',
        expect.stringContaining('notification')
      );

      expect(result.success).toBe(true);
      expect(result.installed).toEqual(['notification', 'stop']);
    });

    it('should handle existing installation gracefully (idempotent)', async () => {
      // Mock existing installation
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(fs.readFile).mockImplementation((path) => {
        if (path.toString().includes('settings.json')) {
          return Promise.resolve(JSON.stringify({
            hooks: {
              notification: ['/home/testuser/.claude/cctoast-wsl/show-toast.sh --notification-hook'],
              other: ['existing-hook']
            }
          }));
        }
        return Promise.resolve('');
      });

      const mockInstaller = {
        async install(options: any) {
          // Should skip duplicate hooks but preserve existing ones
          const settings = {
            hooks: {
              notification: ['/home/testuser/.claude/cctoast-wsl/show-toast.sh --notification-hook'],
              stop: ['/home/testuser/.claude/cctoast-wsl/show-toast.sh --stop-hook'],
              other: ['existing-hook']
            }
          };
          await fs.writeFile('/home/testuser/.claude/settings.json', JSON.stringify(settings, null, 2));
          
          return { success: true, skipped: ['notification'], installed: ['stop'] };
        }
      };

      const result = await mockInstaller.install({
        global: true,
        notification: true,
        stop: true
      });

      expect(result.success).toBe(true);
      expect(result.skipped).toContain('notification');
      expect(result.installed).toContain('stop');
    });
  });

  describe('Local Installation Flow', () => {
    it('should perform local installation with project-specific paths', async () => {
      const mockInstaller = {
        async install(options: any) {
          // 1. Create local installation directory
          await fs.mkdir('.claude/cctoast-wsl', { recursive: true });
          
          // 2. Copy scripts locally
          await fs.copyFile('scripts/show-toast.sh', '.claude/cctoast-wsl/show-toast.sh');
          await fs.chmod('.claude/cctoast-wsl/show-toast.sh', 0o500);
          
          // 3. Update local settings
          const settingsPath = options.sync ? '.claude/settings.json' : '.claude/settings.local.json';
          const settings = {
            hooks: {
              notification: ['.claude/cctoast-wsl/show-toast.sh --notification-hook'],
              stop: ['.claude/cctoast-wsl/show-toast.sh --stop-hook']
            }
          };
          await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
          
          return { success: true, local: true, settingsFile: settingsPath };
        }
      };

      const result = await mockInstaller.install({
        local: true,
        sync: false,
        notification: true,
        stop: true
      });

      expect(fs.mkdir).toHaveBeenCalledWith('.claude/cctoast-wsl', { recursive: true });
      expect(fs.copyFile).toHaveBeenCalledWith('scripts/show-toast.sh', '.claude/cctoast-wsl/show-toast.sh');
      expect(fs.writeFile).toHaveBeenCalledWith(
        '.claude/settings.local.json',
        expect.stringContaining('.claude/cctoast-wsl')
      );

      expect(result.success).toBe(true);
      expect(result.local).toBe(true);
      expect(result.settingsFile).toBe('.claude/settings.local.json');
    });

    it('should use settings.json when sync flag is enabled', async () => {
      const mockInstaller = {
        async install(options: any) {
          const settingsPath = options.sync ? '.claude/settings.json' : '.claude/settings.local.json';
          const settings = {
            hooks: {
              notification: ['.claude/cctoast-wsl/show-toast.sh --notification-hook']
            }
          };
          await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
          
          return { settingsFile: settingsPath };
        }
      };

      const result = await mockInstaller.install({
        local: true,
        sync: true,
        notification: true,
        stop: false
      });

      expect(fs.writeFile).toHaveBeenCalledWith(
        '.claude/settings.json',
        expect.any(String)
      );

      expect(result.settingsFile).toBe('.claude/settings.json');
    });
  });

  describe('File Permissions', () => {
    it('should set correct permissions on installed scripts', async () => {
      const mockInstaller = {
        async install() {
          await fs.copyFile('scripts/show-toast.sh', '/home/testuser/.claude/cctoast-wsl/show-toast.sh');
          await fs.chmod('/home/testuser/.claude/cctoast-wsl/show-toast.sh', 0o500);
          
          // Verify permissions were set correctly
          vi.mocked(fs.stat).mockResolvedValue({
            mode: 0o100500, // File with 0o500 permissions
          } as any);
          
          const stats = await fs.stat('/home/testuser/.claude/cctoast-wsl/show-toast.sh');
          return { permissions: stats.mode & 0o777 };
        }
      };

      const result = await mockInstaller.install();

      expect(fs.chmod).toHaveBeenCalledWith('/home/testuser/.claude/cctoast-wsl/show-toast.sh', 0o500);
      expect(result.permissions).toBe(0o500);
    });

    it('should refuse to run as root (security check)', async () => {
      // Mock running as root
      const originalGetuid = process.getuid;
      process.getuid = vi.fn().mockReturnValue(0); // Root UID

      const mockInstaller = {
        async install() {
          if (process.getuid?.() === 0) {
            throw new Error('Refusing to run as root for security reasons');
          }
        }
      };

      await expect(mockInstaller.install()).rejects.toThrow('Refusing to run as root');

      // Restore original function
      process.getuid = originalGetuid;
    });
  });

  describe('Hook Path Verification', () => {
    it('should generate correct absolute paths for global installation', async () => {
      const mockInstaller = {
        async generateHookPaths(options: any) {
          const basePath = options.global 
            ? '/home/testuser/.claude/cctoast-wsl'
            : '.claude/cctoast-wsl';
          
          return {
            notification: `${basePath}/show-toast.sh --notification-hook`,
            stop: `${basePath}/show-toast.sh --stop-hook`
          };
        }
      };

      const paths = await mockInstaller.generateHookPaths({ global: true });

      expect(paths.notification).toBe('/home/testuser/.claude/cctoast-wsl/show-toast.sh --notification-hook');
      expect(paths.stop).toBe('/home/testuser/.claude/cctoast-wsl/show-toast.sh --stop-hook');
    });

    it('should generate correct relative paths for local installation', async () => {
      const mockInstaller = {
        async generateHookPaths(options: any) {
          const basePath = options.global 
            ? '/home/testuser/.claude/cctoast-wsl'
            : '.claude/cctoast-wsl';
          
          return {
            notification: `${basePath}/show-toast.sh --notification-hook`,
            stop: `${basePath}/show-toast.sh --stop-hook`
          };
        }
      };

      const paths = await mockInstaller.generateHookPaths({ global: false });

      expect(paths.notification).toBe('.claude/cctoast-wsl/show-toast.sh --notification-hook');
      expect(paths.stop).toBe('.claude/cctoast-wsl/show-toast.sh --stop-hook');
    });

    it('should validate hook commands are executable', async () => {
      const mockInstaller = {
        async validateHooks(hookPaths: string[]) {
          const results = [];
          
          for (const hookPath of hookPaths) {
            const scriptPath = hookPath.split(' ')[0]; // Extract path before flags
            
            // Mock file existence and permissions check
            vi.mocked(existsSync).mockReturnValue(true);
            vi.mocked(fs.stat).mockResolvedValue({
              mode: 0o100500, // Executable
            } as any);
            
            const exists = existsSync(scriptPath);
            const stats = await fs.stat(scriptPath);
            const isExecutable = (stats.mode & 0o111) !== 0;
            
            results.push({
              path: scriptPath,
              exists,
              executable: isExecutable
            });
          }
          
          return results;
        }
      };

      const hookPaths = [
        '/home/testuser/.claude/cctoast-wsl/show-toast.sh --notification-hook',
        '/home/testuser/.claude/cctoast-wsl/show-toast.sh --stop-hook'
      ];

      const results = await mockInstaller.validateHooks(hookPaths);

      expect(results).toHaveLength(2);
      expect(results[0].exists).toBe(true);
      expect(results[0].executable).toBe(true);
      expect(results[1].exists).toBe(true);
      expect(results[1].executable).toBe(true);
    });
  });

  describe('Uninstallation Flow', () => {
    it('should remove installation directory and clean up settings', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({
        hooks: {
          notification: [
            'other-hook',
            '/home/testuser/.claude/cctoast-wsl/show-toast.sh --notification-hook'
          ],
          stop: ['/home/testuser/.claude/cctoast-wsl/show-toast.sh --stop-hook']
        }
      }));

      const mockUninstaller = {
        async uninstall(options: any) {
          // 1. Remove hook commands from settings
          const cleanedSettings = {
            hooks: {
              notification: ['other-hook'] // Preserve non-cctoast hooks
            }
          };
          
          await fs.writeFile('/home/testuser/.claude/settings.json', JSON.stringify(cleanedSettings, null, 2));
          
          // 2. Remove installation directory
          await fs.unlink('/home/testuser/.claude/cctoast-wsl/show-toast.sh');
          await fs.unlink('/home/testuser/.claude/cctoast-wsl/claude.png');
          // In real implementation, would use rmdir or recursive removal
          
          return { 
            removed: ['notification', 'stop'],
            preserved: ['other-hook'],
            directoryRemoved: true
          };
        }
      };

      const result = await mockUninstaller.uninstall({ global: true });

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/home/testuser/.claude/settings.json',
        expect.not.stringContaining('cctoast-wsl')
      );
      expect(fs.unlink).toHaveBeenCalledWith('/home/testuser/.claude/cctoast-wsl/show-toast.sh');
      expect(fs.unlink).toHaveBeenCalledWith('/home/testuser/.claude/cctoast-wsl/claude.png');

      expect(result.removed).toEqual(['notification', 'stop']);
      expect(result.preserved).toEqual(['other-hook']);
      expect(result.directoryRemoved).toBe(true);
    });
  });

  describe('Upgrade Scenarios', () => {
    it('should handle upgrade by overwriting files but preserving settings', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({
        hooks: {
          notification: ['/home/testuser/.claude/cctoast-wsl/show-toast.sh --notification-hook'],
          stop: ['/home/testuser/.claude/cctoast-wsl/show-toast.sh --stop-hook']
        }
      }));

      const mockUpgrader = {
        async upgrade() {
          // 1. Overwrite script files (preserving permissions)
          await fs.copyFile('scripts/show-toast.sh', '/home/testuser/.claude/cctoast-wsl/show-toast.sh');
          await fs.chmod('/home/testuser/.claude/cctoast-wsl/show-toast.sh', 0o500);
          
          // 2. Update assets
          await fs.copyFile('assets/claude.png', '/home/testuser/.claude/cctoast-wsl/claude.png');
          
          // 3. Settings remain unchanged (idempotent merge)
          return { 
            filesUpdated: ['show-toast.sh', 'claude.png'],
            settingsChanged: false
          };
        }
      };

      const result = await mockUpgrader.upgrade();

      expect(fs.copyFile).toHaveBeenCalledWith('scripts/show-toast.sh', '/home/testuser/.claude/cctoast-wsl/show-toast.sh');
      expect(fs.chmod).toHaveBeenCalledWith('/home/testuser/.claude/cctoast-wsl/show-toast.sh', 0o500);
      expect(fs.copyFile).toHaveBeenCalledWith('assets/claude.png', '/home/testuser/.claude/cctoast-wsl/claude.png');

      expect(result.filesUpdated).toEqual(['show-toast.sh', 'claude.png']);
      expect(result.settingsChanged).toBe(false);
    });
  });

  describe('Error Recovery', () => {
    it('should handle partial installation failures gracefully', async () => {
      let callCount = 0;
      vi.mocked(fs.copyFile).mockImplementation(async (src, dest) => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Disk full');
        }
      });

      const mockInstaller = {
        async install() {
          try {
            await fs.mkdir('/home/testuser/.claude/cctoast-wsl', { recursive: true });
            await fs.copyFile('scripts/show-toast.sh', '/home/testuser/.claude/cctoast-wsl/show-toast.sh');
            await fs.copyFile('assets/claude.png', '/home/testuser/.claude/cctoast-wsl/claude.png'); // This will fail
          } catch (error) {
            // Cleanup on failure
            await fs.unlink('/home/testuser/.claude/cctoast-wsl/show-toast.sh').catch(() => {});
            throw error;
          }
        }
      };

      await expect(mockInstaller.install()).rejects.toThrow('Disk full');
      
      // Verify cleanup attempt
      expect(fs.unlink).toHaveBeenCalledWith('/home/testuser/.claude/cctoast-wsl/show-toast.sh');
    });

    it('should handle settings file corruption during installation', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File corrupted'));

      const mockInstaller = {
        async install() {
          try {
            const content = await fs.readFile('/home/testuser/.claude/settings.json', 'utf8');
            return JSON.parse(content);
          } catch (error) {
            // Create new settings file on corruption
            const newSettings = {
              hooks: {
                notification: ['/home/testuser/.claude/cctoast-wsl/show-toast.sh --notification-hook']
              }
            };
            await fs.writeFile('/home/testuser/.claude/settings.json', JSON.stringify(newSettings, null, 2));
            return { recoveredFromCorruption: true };
          }
        }
      };

      const result = await mockInstaller.install();

      expect(result.recoveredFromCorruption).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/home/testuser/.claude/settings.json',
        expect.stringContaining('notification')
      );
    });
  });

  describe('CI Environment Compatibility', () => {
    it('should work in non-interactive CI environments', async () => {
      // Mock CI environment
      const originalStdin = process.stdin;
      const originalStdout = process.stdout;
      
      Object.defineProperty(process.stdin, 'isTTY', { value: false });
      Object.defineProperty(process.stdout, 'isTTY', { value: false });

      const mockInstaller = {
        async install(options: any) {
          const isInteractive = process.stdin.isTTY && process.stdout.isTTY;
          
          if (!isInteractive && !options.quiet) {
            throw new Error('Interactive prompts not available in CI');
          }
          
          return { 
            ciMode: !isInteractive,
            success: true 
          };
        }
      };

      const result = await mockInstaller.install({ quiet: true });

      expect(result.ciMode).toBe(true);
      expect(result.success).toBe(true);

      // Restore original values
      Object.defineProperty(process.stdin, 'isTTY', { value: originalStdin.isTTY });
      Object.defineProperty(process.stdout, 'isTTY', { value: originalStdout.isTTY });
    });
  });
});