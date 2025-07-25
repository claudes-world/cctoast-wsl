/**
 * Installation Engine Module
 *
 * Handles copying scripts, assets, and merging Claude settings with
 * atomic operations and direct script path injection.
 */

import { SettingsMerger, ClaudeSettings } from './settings-merger.js';
import { promises as fs, constants } from 'fs';
import path from 'path';
import os from 'os';

export interface InstallerConfig {
  global: boolean;
  local: boolean;
  notificationHook: boolean;
  stopHook: boolean;
  sync: boolean;
  dryRun: boolean;
}

export interface InstallationResult {
  success: boolean;
  installedTo: string;
  settingsPath: string;
  backupPath?: string;
  hooksAdded: string[];
  message: string;
}

export interface InstallManifest {
  version: string;
  installedAt: string;
  config: InstallerConfig;
  files: string[];
  settingsPath: string;
  hooksInstalled: string[];
}

/**
 * Installation engine with atomic operations and direct script paths
 */
export class Installer {
  private merger = new SettingsMerger();

  constructor(private config: InstallerConfig) {}

  /**
   * Main installation method
   */
  async install(): Promise<InstallationResult> {
    if (this.config.dryRun) {
      return this.dryRunInstall();
    }

    try {
      // Determine installation paths
      const paths = this.getInstallationPaths();

      // Create installation directory
      await this.createInstallationDirectory(paths.installDir);

      // Copy scripts and assets
      const copiedFiles = await this.copyFiles(paths.installDir);

      // Set permissions
      await this.setPermissions(paths.installDir);

      // Install hooks into settings
      const hookResult = await this.installHooks(paths);

      // Create installation manifest
      await this.createManifest(
        paths.installDir,
        copiedFiles,
        paths.settingsPath,
        hookResult.hooksAdded
      );

      return {
        success: true,
        installedTo: paths.installDir,
        settingsPath: paths.settingsPath,
        backupPath: hookResult.backupPath,
        hooksAdded: hookResult.hooksAdded,
        message: `Successfully installed cctoast-wsl to ${paths.installDir}`,
      };
    } catch (error) {
      return {
        success: false,
        installedTo: '',
        settingsPath: '',
        hooksAdded: [],
        message: `Installation failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Dry run installation to show what would be done
   */
  private async dryRunInstall(): Promise<InstallationResult> {
    const paths = this.getInstallationPaths();
    const hooks = this.generateHookCommands(paths.installDir);
    const hooksAdded = [];

    if (this.config.notificationHook) {
      hooksAdded.push('notification');
    }
    if (this.config.stopHook) {
      hooksAdded.push('stop');
    }

    const message = [
      'DRY RUN - No changes would be made:',
      `Install directory: ${paths.installDir}`,
      `Settings file: ${paths.settingsPath}`,
      `Hooks to add: ${hooksAdded.join(', ')}`,
      `Hook commands:`,
      ...Object.entries(hooks).map(([key, cmd]) => `  ${key}: ${cmd}`),
    ].join('\n');

    return {
      success: true,
      installedTo: paths.installDir,
      settingsPath: paths.settingsPath,
      hooksAdded,
      message,
    };
  }

  /**
   * Determine installation paths based on config
   */
  private getInstallationPaths() {
    const isGlobal = this.config.global || !this.config.local;

    if (isGlobal) {
      const homeDir = os.homedir();
      const installDir = path.join(homeDir, '.claude', 'cctoast-wsl');
      const settingsPath = path.join(homeDir, '.claude', 'settings.json');
      return { installDir, settingsPath, scope: 'global' as const };
    } else {
      const cwd = process.cwd();
      const installDir = path.join(cwd, '.claude', 'cctoast-wsl');
      const settingsPath = this.config.sync
        ? path.join(cwd, '.claude', 'settings.json')
        : path.join(cwd, '.claude', 'settings.local.json');
      return { installDir, settingsPath, scope: 'local' as const };
    }
  }

  /**
   * Create installation directory
   */
  private async createInstallationDirectory(installDir: string): Promise<void> {
    await fs.mkdir(installDir, { recursive: true });

    // Create assets subdirectory
    await fs.mkdir(path.join(installDir, 'assets'), { recursive: true });
  }

  /**
   * Copy scripts and assets to installation directory
   */
  private async copyFiles(installDir: string): Promise<string[]> {
    const copiedFiles: string[] = [];

    // Copy show-toast.sh script
    const scriptSource = path.join(process.cwd(), 'scripts', 'show-toast.sh');
    const scriptDest = path.join(installDir, 'show-toast.sh');
    await fs.copyFile(scriptSource, scriptDest);
    copiedFiles.push('show-toast.sh');

    // Copy claude.png icon
    const iconSource = path.join(process.cwd(), 'assets', 'claude.png');
    const iconDest = path.join(installDir, 'assets', 'claude.png');

    try {
      await fs.copyFile(iconSource, iconDest);
      copiedFiles.push('assets/claude.png');
    } catch (error) {
      // Icon is optional, continue without it
      console.warn('Warning: Could not copy claude.png icon');
    }

    return copiedFiles;
  }

  /**
   * Set proper permissions on installed files
   */
  private async setPermissions(installDir: string): Promise<void> {
    const scriptPath = path.join(installDir, 'show-toast.sh');

    // Set script to be executable by user only (0o500)
    await fs.chmod(scriptPath, 0o500);
  }

  /**
   * Install hooks into Claude settings
   */
  private async installHooks(paths: {
    installDir: string;
    settingsPath: string;
    scope: 'global' | 'local';
  }) {
    const hookCommands = this.generateHookCommands(paths.installDir);
    const updates: Partial<ClaudeSettings> = { hooks: {} };
    const hooksAdded: string[] = [];

    if (this.config.notificationHook) {
      updates.hooks!.notification = [hookCommands.notification];
      hooksAdded.push('notification');
    }

    if (this.config.stopHook) {
      updates.hooks!.stop = [hookCommands.stop];
      hooksAdded.push('stop');
    }

    const result = await this.merger.mergeFile(paths.settingsPath, updates, {
      deduplicateArrays: true,
      preserveOrder: true,
      createBackup: true,
    });

    return {
      hooksAdded,
      backupPath: result.backupPath,
      changed: result.changed,
    };
  }

  /**
   * Generate hook commands with direct script paths
   */
  private generateHookCommands(installDir: string) {
    const scriptPath = path.join(installDir, 'show-toast.sh');

    return {
      notification: `${scriptPath} --notification-hook`,
      stop: `${scriptPath} --stop-hook`,
    };
  }

  /**
   * Create installation manifest for uninstall tracking
   */
  private async createManifest(
    installDir: string,
    files: string[],
    settingsPath: string,
    hooksInstalled: string[]
  ): Promise<void> {
    const manifest: InstallManifest = {
      version: '1.0.0', // TODO: Get from package.json
      installedAt: new Date().toISOString(),
      config: this.config,
      files,
      settingsPath,
      hooksInstalled,
    };

    const manifestPath = path.join(installDir, 'install-manifest.json');
    await fs.writeFile(
      manifestPath,
      JSON.stringify(manifest, null, 2),
      'utf-8'
    );
  }

  /**
   * Uninstall cctoast-wsl
   */
  async uninstall(): Promise<InstallationResult> {
    try {
      const paths = this.getInstallationPaths();

      // Load manifest
      const manifestPath = path.join(paths.installDir, 'install-manifest.json');
      let manifest: InstallManifest | null = null;

      try {
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        manifest = JSON.parse(manifestContent);
      } catch {
        // Continue without manifest
      }

      // Remove hooks from settings
      const removedHooks = await this.removeHooks(paths, manifest);

      // Remove installation directory
      await fs.rm(paths.installDir, { recursive: true, force: true });

      return {
        success: true,
        installedTo: paths.installDir,
        settingsPath: paths.settingsPath,
        hooksAdded: [], // Actually removed
        message: `Successfully uninstalled cctoast-wsl from ${paths.installDir}. Removed hooks: ${removedHooks.join(', ')}`,
      };
    } catch (error) {
      return {
        success: false,
        installedTo: '',
        settingsPath: '',
        hooksAdded: [],
        message: `Uninstall failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Remove hooks from Claude settings
   */
  private async removeHooks(
    paths: { settingsPath: string; installDir: string },
    manifest: InstallManifest | null
  ): Promise<string[]> {
    const removedHooks: string[] = [];

    try {
      const content = await fs.readFile(paths.settingsPath, 'utf-8');
      const settings = await this.merger.parseJsonc(content);

      if (!settings.hooks) return removedHooks;

      const hookCommands = this.generateHookCommands(paths.installDir);

      // Remove our hook commands
      for (const [hookType, command] of Object.entries(hookCommands)) {
        const hooks = settings.hooks[hookType];
        if (hooks) {
          const filtered = hooks.filter(hook => hook !== command);
          if (filtered.length !== hooks.length) {
            settings.hooks[hookType] =
              filtered.length > 0 ? filtered : undefined;
            removedHooks.push(hookType);
          }
        }
      }

      // Write updated settings
      await this.merger.mergeFile(paths.settingsPath, settings, {
        createBackup: true,
      });
    } catch (error) {
      // Settings file might not exist, that's okay
    }

    return removedHooks;
  }

  /**
   * Check if cctoast-wsl is installed
   */
  async isInstalled(): Promise<boolean> {
    const paths = this.getInstallationPaths();

    try {
      await fs.access(paths.installDir, constants.F_OK);
      await fs.access(
        path.join(paths.installDir, 'show-toast.sh'),
        constants.F_OK
      );
      return true;
    } catch {
      return false;
    }
  }
}
