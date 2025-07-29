import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { SettingsMerger, type ClaudeSettings, type HookCommands } from '../../src/settings-merger.js';

// Mock filesystem operations
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    open: vi.fn(() => ({
      sync: vi.fn(),
      close: vi.fn(),
    })),
    rename: vi.fn(),
    unlink: vi.fn(),
  },
}));

// Mock os module with proper default export
vi.mock('os', async () => {
  const actual = await vi.importActual('os');
  return {
    ...actual,
    default: {
      ...actual,
      homedir: vi.fn(() => '/home/testuser'),
    },
    homedir: vi.fn(() => '/home/testuser'),
  };
});

describe('Settings Merger Module', () => {
  let merger: SettingsMerger;
  let tempDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    merger = new SettingsMerger();
    tempDir = '/tmp/test-claude';

    // Mock file handle for atomic writes
    const mockHandle = {
      sync: vi.fn(),
      close: vi.fn(),
    };
    vi.mocked(fs.open).mockResolvedValue(mockHandle as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('JSONC Parsing', () => {
    it('should parse valid JSON', async () => {
      const validJson = '{"test": "value"}';
      const result = await merger.parseJsonc(validJson);
      expect(result).toEqual({ test: 'value' });
    });

    it('should parse JSON with single-line comments', async () => {
      const jsonWithComments = `{
        // This is a comment
        "test": "value"
      }`;
      const result = await merger.parseJsonc(jsonWithComments);
      expect(result).toEqual({ test: 'value' });
    });

    it('should parse JSON with multi-line comments', async () => {
      const jsonWithComments = `{
        /* This is a
           multi-line comment */
        "test": "value"
      }`;
      const result = await merger.parseJsonc(jsonWithComments);
      expect(result).toEqual({ test: 'value' });
    });

    it('should handle mixed comments and complex JSON', async () => {
      const complexJsonc = `{
        // Global configuration
        "hooks": {
          /* Notification hooks for
             different events */
          "notification": ["existing-hook"],
          "stop": ["stop-hook"] // End-of-task notifications
        },
        "other": "value" // Other setting
      }`;
      const result = await merger.parseJsonc(complexJsonc);
      expect(result).toEqual({
        hooks: {
          notification: ['existing-hook'],
          stop: ['stop-hook'],
        },
        other: 'value',
      });
    });

    it('should handle empty content', async () => {
      const result = await merger.parseJsonc('');
      expect(result).toEqual({});
    });

    it('should handle whitespace-only content', async () => {
      const result = await merger.parseJsonc('   \n  \t  ');
      expect(result).toEqual({});
    });

    it('should throw on invalid JSON structure', async () => {
      const invalidJson = '{"invalid": json}';
      await expect(merger.parseJsonc(invalidJson)).rejects.toThrow('JSONC parsing failed');
    });

    it('should validate settings structure', async () => {
      const invalidStructure = '{"hooks": "not-an-object"}';
      await expect(merger.parseJsonc(invalidStructure)).rejects.toThrow('Invalid Claude settings structure');
    });

    it('should throw error for invalid JSONC', async () => {
      const invalidJson = '{ "test": invalid }';
      await expect(merger.parseJsonc(invalidJson)).rejects.toThrow(/JSONC parsing failed/);
    });
  });

  describe('Deep Merge Algorithm', () => {
    it('should merge nested objects correctly', async () => {
      const base = { 
        hooks: { 
          notification: ['existing'] 
        } 
      };
      const updates = { 
        hooks: { 
          stop: ['stop-hook'] 
        } 
      };
      
      const result = await merger.merge(base, updates);
      expect(result.hooks?.notification).toEqual(['existing']);
      expect(result.hooks?.stop).toEqual(['stop-hook']);
    });

    it('should deduplicate arrays by default', async () => {
      const base = { hooks: { notification: ['hook1', 'hook2'] } };
      const updates = { hooks: { notification: ['hook2', 'hook3'] } };
      
      const result = await merger.merge(base, updates);
      expect(result.hooks?.notification).toEqual(['hook1', 'hook2', 'hook3']);
    });

    it('should preserve order when specified', async () => {
      const base = { hooks: { notification: ['first'] } };
      const updates = { hooks: { notification: ['second'] } };
      
      const result = await merger.merge(base, updates, { preserveOrder: true });
      expect(result.hooks?.notification).toEqual(['first', 'second']);
    });

    it('should allow duplicates when deduplication is disabled', async () => {
      const base = { hooks: { notification: ['hook1'] } };
      const updates = { hooks: { notification: ['hook1'] } };
      
      const result = await merger.merge(base, updates, { deduplicateArrays: false });
      expect(result.hooks?.notification).toEqual(['hook1', 'hook1']);
    });

    it('should preserve existing hook commands', async () => {
      const existing = { 
        hooks: { 
          notification: ['existing-hook'] 
        } 
      };
      const newHooks = { 
        hooks: { 
          notification: ['~/.claude/cctoast-wsl/show-toast.sh --notification-hook'] 
        } 
      };
      
      const result = await merger.merge(existing, newHooks);
      expect(result.hooks?.notification).toEqual([
        'existing-hook',
        '~/.claude/cctoast-wsl/show-toast.sh --notification-hook'
      ]);
    });

    it('should handle null and undefined values', async () => {
      const base = { hooks: { notification: ['hook1'] } };
      const updates = { hooks: { notification: [null, 'hook2', undefined] } };
      
      const result = await merger.merge(base, updates);
      expect(result.hooks?.notification).toEqual(['hook1', 'hook2']);
    });

    it('should handle empty objects and arrays', async () => {
      const base = {};
      const updates = { hooks: { notification: [] } };
      
      const result = await merger.merge(base, updates);
      expect(result.hooks?.notification).toEqual([]);
    });

    it('should skip undefined properties', async () => {
      const base = { existing: 'value' };
      const updates = { existing: undefined, new: 'value' };
      
      const result = await merger.merge(base, updates);
      expect(result.existing).toBe('value');
      expect(result.new).toBe('value');
    });

    it('should merge non-hook properties correctly', async () => {
      const base: ClaudeSettings = { 
        hooks: { notification: ['hook1'] },
        someOtherProp: 'value1',
      };
      const updates: Partial<ClaudeSettings> = { 
        hooks: { notification: ['hook2'] },
        someOtherProp: 'value2',
        newProp: 'newValue',
      };
      
      const result = await merger.merge(base, updates);
      
      expect(result).toEqual({
        hooks: { notification: ['hook1', 'hook2'] },
        someOtherProp: 'value2', // Primitive values get overwritten
        newProp: 'newValue',
      });
    });
  });

  describe('Atomic File Operations', () => {
    it('should read existing file and merge settings', async () => {
      const existingContent = '{"hooks": {"notification": ["existing"]}}';
      const updates = { hooks: { stop: ['new-stop'] } };
      const filePath = '/test/settings.json';

      vi.mocked(fs.readFile).mockResolvedValue(existingContent);
      vi.mocked(fs.writeFile).mockResolvedValue();
      vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);
      vi.mocked(fs.rename).mockResolvedValue();

      const result = await merger.mergeFile(filePath, updates);

      expect(result.merged.hooks?.notification).toEqual(['existing']);
      expect(result.merged.hooks?.stop).toEqual(['new-stop']);
      expect(result.changed).toBe(true);
    });

    it('should handle non-existent files', async () => {
      const updates = { hooks: { notification: ['new'] } };
      const filePath = '/test/new-settings.json';

      const notFoundError = new Error('File not found') as NodeJS.ErrnoException;
      notFoundError.code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(notFoundError);
      vi.mocked(fs.writeFile).mockResolvedValue();
      vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);
      vi.mocked(fs.rename).mockResolvedValue();

      const result = await merger.mergeFile(filePath, updates);

      expect(result.merged.hooks?.notification).toEqual(['new']);
      expect(result.changed).toBe(true);
    });

    it('should create backups when requested', async () => {
      const existingContent = '{"existing": "data"}';
      const updates = { new: 'data' };
      const filePath = '/test/settings.json';

      vi.mocked(fs.readFile).mockResolvedValue(existingContent);
      vi.mocked(fs.writeFile).mockResolvedValue();
      vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);
      vi.mocked(fs.rename).mockResolvedValue();

      const result = await merger.mergeFile(filePath, updates, { createBackup: true });

      expect(result.backupPath).toBeDefined();
      expect(result.backupPath).toMatch(/backup.*settings\.json$/);
    });

    it('should create timestamped backups when requested', async () => {
      const filePath = '/test/settings.json';
      const originalContent = '{"existing": "data"}';
      
      vi.mocked(fs.readFile).mockResolvedValue(originalContent);
      vi.mocked(fs.writeFile).mockResolvedValue();
      vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);
      vi.mocked(fs.rename).mockResolvedValue();
      
      // Mock Date.now() for consistent testing
      const mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(1640995200000); // 2022-01-01T00:00:00.000Z
      
      const updates: Partial<ClaudeSettings> = { hooks: { notification: ['new-hook'] } };
      const result = await merger.mergeFile(filePath, updates, { createBackup: true });
      
      expect(result.backupPath).toBeDefined();
      expect(result.backupPath).toMatch(/backup.*settings\.json$/);
      
      mockDateNow.mockRestore();
    });

    it('should skip writing if no changes detected', async () => {
      const existingContent = '{"test": "value"}';
      const updates = { test: 'value' }; // Same value
      const filePath = '/test/settings.json';

      vi.mocked(fs.readFile).mockResolvedValue(existingContent);

      const result = await merger.mergeFile(filePath, updates);

      expect(result.changed).toBe(false);
      expect(result.backupPath).toBeUndefined();
      expect(vi.mocked(fs.writeFile)).not.toHaveBeenCalled();
    });

    it('should clean up temp files on write failure', async () => {
      const updates = { test: 'value' };
      const filePath = '/test/settings.json';

      const notFoundError = new Error('File not found') as NodeJS.ErrnoException;
      notFoundError.code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(notFoundError);
      vi.mocked(fs.writeFile).mockResolvedValue();
      vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);
      vi.mocked(fs.rename).mockRejectedValue(new Error('Write failed'));
      vi.mocked(fs.unlink).mockResolvedValue();

      await expect(merger.mergeFile(filePath, updates)).rejects.toThrow('Failed to write settings file');
      expect(vi.mocked(fs.unlink)).toHaveBeenCalled();
    });

    it('should rollback on write failure by cleaning up temp file', async () => {
      const filePath = '/test/settings.json';
      
      const notFoundError = new Error('File not found') as NodeJS.ErrnoException;
      notFoundError.code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(notFoundError);
      
      // Mock write failure
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Write failed'));
      
      const updates: Partial<ClaudeSettings> = { hooks: { notification: ['new-hook'] } };
      
      await expect(merger.mergeFile(filePath, updates)).rejects.toThrow();
      
      // Should attempt to clean up temp file
      expect(fs.unlink).toHaveBeenCalled();
    });
  });

  describe('Hook Command Injection', () => {
    it('should inject notification hook with correct path', async () => {
      const existing = {};
      const hookCommands: HookCommands = {
        notification: '~/.claude/cctoast-wsl/show-toast.sh --notification-hook'
      };

      const result = await merger.mergeHookCommands(existing, hookCommands);
      expect(result.hooks?.notification).toEqual([
        '~/.claude/cctoast-wsl/show-toast.sh --notification-hook'
      ]);
    });

    it('should inject stop hook with correct path', async () => {
      const existing = {};
      const hookCommands: HookCommands = {
        stop: '~/.claude/cctoast-wsl/show-toast.sh --stop-hook'
      };

      const result = await merger.mergeHookCommands(existing, hookCommands);
      expect(result.hooks?.stop).toEqual([
        '~/.claude/cctoast-wsl/show-toast.sh --stop-hook'
      ]);
    });

    it('should inject both hooks simultaneously', async () => {
      const existing = {};
      const hookCommands: HookCommands = {
        notification: '~/.claude/cctoast-wsl/show-toast.sh --notification-hook',
        stop: '~/.claude/cctoast-wsl/show-toast.sh --stop-hook'
      };

      const result = await merger.mergeHookCommands(existing, hookCommands);
      expect(result.hooks?.notification).toEqual([
        '~/.claude/cctoast-wsl/show-toast.sh --notification-hook'
      ]);
      expect(result.hooks?.stop).toEqual([
        '~/.claude/cctoast-wsl/show-toast.sh --stop-hook'
      ]);
    });

    it('should preserve existing hooks when adding new ones', async () => {
      const existing = {
        hooks: {
          notification: ['existing-hook'],
          stop: ['existing-stop']
        }
      };
      const hookCommands: HookCommands = {
        notification: '~/.claude/cctoast-wsl/show-toast.sh --notification-hook'
      };

      const result = await merger.mergeHookCommands(existing, hookCommands);
      expect(result.hooks?.notification).toEqual([
        'existing-hook',
        '~/.claude/cctoast-wsl/show-toast.sh --notification-hook'
      ]);
      expect(result.hooks?.stop).toEqual(['existing-stop']);
    });

    it('should avoid duplicating hook commands', async () => {
      const existingHooks: ClaudeSettings = {
        hooks: {
          notification: ['~/.claude/cctoast-wsl/show-toast.sh --notification-hook'],
        },
      };
      
      const hookCommands: HookCommands = {
        notification: '~/.claude/cctoast-wsl/show-toast.sh --notification-hook',
      };
      
      const result = await merger.mergeHookCommands(existingHooks, hookCommands);
      
      // Should not duplicate the same hook command
      expect(result.hooks?.notification).toEqual([
        '~/.claude/cctoast-wsl/show-toast.sh --notification-hook',
      ]);
    });

    it('should use relative paths for local install correctly', async () => {
      const existing = {};
      const hookCommands: HookCommands = {
        notification: '.claude/cctoast-wsl/show-toast.sh --notification-hook',
      };
      
      const result = await merger.mergeHookCommands(existing, hookCommands);
      
      expect(result.hooks?.notification).toContain('.claude/cctoast-wsl/show-toast.sh --notification-hook');
    });
  });

  describe('Path Expansion', () => {
    it('should expand tilde in home directory paths', () => {
      const tildePathInput = '~/.claude/settings.json';
      const expandedPath = SettingsMerger.expandPath(tildePathInput);
      
      expect(expandedPath).toBe('/home/testuser/.claude/settings.json');
    });

    it('should leave absolute paths unchanged', () => {
      const absolutePath = '/usr/local/bin/settings.json';
      const result = SettingsMerger.expandPath(absolutePath);
      
      expect(result).toBe('/usr/local/bin/settings.json');
    });

    it('should leave relative paths unchanged', () => {
      const relativePath = './config/settings.json';
      const result = SettingsMerger.expandPath(relativePath);
      
      expect(result).toBe('./config/settings.json');
    });
  });

  describe('Utility Methods', () => {
    it('should validate correct settings structure', () => {
      const validSettings = {
        hooks: {
          notification: ['hook1'],
          stop: ['hook2']
        }
      };
      expect(merger.validateSettings(validSettings)).toBe(true);
    });

    it('should reject invalid settings structure', () => {
      const invalidSettings = {
        hooks: 'not-an-object'
      };
      expect(merger.validateSettings(invalidSettings)).toBe(false);
    });

    it('should detect existing hook commands', () => {
      const settings = {
        hooks: {
          notification: ['existing-hook', 'another-hook']
        }
      };
      expect(merger.hasHookCommand(settings, 'notification', 'existing-hook')).toBe(true);
      expect(merger.hasHookCommand(settings, 'notification', 'non-existent')).toBe(false);
    });

    it('should remove hook commands', () => {
      const settings = {
        hooks: {
          notification: ['keep-this', 'remove-this'],
          stop: ['keep-stop']
        }
      };

      const result = merger.removeHookCommand(settings, 'notification', 'remove-this');
      expect(result.hooks?.notification).toEqual(['keep-this']);
      expect(result.hooks?.stop).toEqual(['keep-stop']);
    });

    it('should clean up empty hook arrays and objects', () => {
      const settings = {
        hooks: {
          notification: ['only-hook']
        }
      };

      const result = merger.removeHookCommand(settings, 'notification', 'only-hook');
      expect(result.hooks).toBeUndefined();
    });

    it('should expand home directory paths', () => {
      const homePath = '~/test/path';
      const expanded = SettingsMerger.expandPath(homePath);
      expect(expanded).toMatch(/^\/.*\/test\/path$/);
      expect(expanded).not.toContain('~');
    });
  });

  describe('Merge Options', () => {
    it('should respect deduplicateArrays option', async () => {
      const base: ClaudeSettings = { hooks: { notification: ['hook1', 'hook2'] } };
      const updates: Partial<ClaudeSettings> = { hooks: { notification: ['hook2', 'hook3'] } };
      
      // With deduplication (default)
      const withDedup = await merger.merge(base, updates, { deduplicateArrays: true });
      expect(withDedup.hooks?.notification).toEqual(['hook1', 'hook2', 'hook3']);
      
      // Without deduplication
      const withoutDedup = await merger.merge(base, updates, { deduplicateArrays: false });
      expect(withoutDedup.hooks?.notification).toEqual(['hook1', 'hook2', 'hook2', 'hook3']);
    });

    it('should respect preserveOrder option', async () => {
      const base: ClaudeSettings = { hooks: { notification: ['hook1'] } };
      const updates: Partial<ClaudeSettings> = { hooks: { notification: ['hook2'] } };
      
      // With order preservation (default) - new items at end
      const withOrder = await merger.merge(base, updates, { preserveOrder: true });
      expect(withOrder.hooks?.notification).toEqual(['hook1', 'hook2']);
      
      // Without order preservation - still appends to end due to merge logic
      const withoutOrder = await merger.merge(base, updates, { preserveOrder: false });
      expect(withoutOrder.hooks?.notification).toEqual(['hook2', 'hook1']);
    });

    it('should skip backup creation when createBackup is false', async () => {
      const filePath = '/test/settings.json';
      const originalContent = '{"existing": "data"}';
      
      vi.mocked(fs.readFile).mockResolvedValue(originalContent);
      vi.mocked(fs.writeFile).mockResolvedValue();
      vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);
      vi.mocked(fs.rename).mockResolvedValue();
      
      const updates: Partial<ClaudeSettings> = { hooks: { notification: ['new-hook'] } };
      const result = await merger.mergeFile(filePath, updates, { createBackup: false });
      
      expect(result.backupPath).toBeUndefined();
      // Should not create backup directory
      const mkdirCalls = vi.mocked(fs.mkdir).mock.calls;
      expect(mkdirCalls).not.toContainEqual([expect.stringContaining('backup'), expect.any(Object)]);
    });
  });
});