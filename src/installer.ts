/**
 * Installation Engine Module
 *
 * Handles copying scripts, assets, and merging Claude settings.
 * Implementation planned for Milestone 4.
 */

export interface InstallerConfig {
  global: boolean;
  local: boolean;
  notificationHook: boolean;
  stopHook: boolean;
  sync: boolean;
  dryRun: boolean;
}

export class Installer {
  constructor(private _config: InstallerConfig) {}

  async install(): Promise<void> {
    throw new Error('Installer not implemented yet - Milestone 4');
  }
}
