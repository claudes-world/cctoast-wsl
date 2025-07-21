/**
 * JSONC Settings Merger
 *
 * Provides idempotent deep merge functionality for Claude settings files
 * with support for JSON with Comments (JSONC) format.
 * Implementation planned for Milestone 4.
 */

export interface ClaudeSettings {
  hooks?: {
    notification?: string[];
    stop?: string[];
    [key: string]: string[] | undefined;
  };
  [key: string]: unknown;
}

export class SettingsMerger {
  async merge(
    _existing: ClaudeSettings,
    _updates: Partial<ClaudeSettings>
  ): Promise<ClaudeSettings> {
    throw new Error('SettingsMerger not implemented yet - Milestone 4');
  }

  async parseJsonc(_content: string): Promise<ClaudeSettings> {
    throw new Error('JSONC parser not implemented yet - Milestone 4');
  }
}
