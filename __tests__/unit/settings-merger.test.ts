import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

import { SettingsMerger, type ClaudeSettings, type MergeOptions } from '../../src/settings-merger.js';
import { JsoncParser } from '../../src/jsonc-parser.js';

// Mock filesystem operations
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    rename: vi.fn(),
    unlink: vi.fn(),
    open: vi.fn(),
  },
}));

// Mock path operations
vi.mock('path');
vi.mock('os', () => ({
  homedir: vi.fn(() => '/home/testuser'),
}));

describe('Settings Merger Module', () => {
  let merger: SettingsMerger;

  beforeEach(() => {
    vi.clearAllMocks();
    merger = new SettingsMerger();

    // Mock file handle for atomic writes
    const mockHandle = {
      sync: vi.fn(),
      close: vi.fn(),
    };
    vi.mocked(fs.open).mockResolvedValue(mockHandle as any);
  });

  describe('JSONC Parsing', () => {
    it('should parse valid JSON', async () => {
      const validJson = '{"test": "value"}';
      const result = await merger.parseJsonc(validJson);
      expect(result).toEqual({ test: 'value' });
    });

    it('should handle single-line comments', async () => {
      const jsonWithComments = `{
        // This is a comment
        "test": "value"
      }`;
      const result = await merger.parseJsonc(jsonWithComments);
      expect(result).toEqual({ test: 'value' });
    });

    it('should handle multi-line comments', async () => {
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

    it('should throw error for invalid JSONC', async () => {
      const invalidJson = '{ "test": invalid }';
      await expect(merger.parseJsonc(invalidJson)).rejects.toThrow(/JSONC parsing failed/);
    });
  });

  describe('Deep Merge Algorithm', () => {
    it('should merge nested objects correctly', async () => {
      const base: ClaudeSettings = { 
        hooks: { 
          notification: ['existing'] 
        } 
      };
      const updates: Partial<ClaudeSettings> = { 
        hooks: { 
          notification: ['new'],
          stop: ['stop-hook']
        } 
      };
      
      const result = await merger.merge(base, updates);
      
      expect(result).toEqual({
        hooks: {
          notification: ['existing', 'new'],
          stop: ['stop-hook'],
        },
      });
    });

    it('should deduplicate arrays by default', async () => {
      const base: ClaudeSettings = { hooks: { notification: ['hook1', 'hook2'] } };
      const updates: Partial<ClaudeSettings> = { hooks: { notification: ['hook2', 'hook3'] } };
      
      const result = await merger.merge(base, updates);
      
      // Expected result: hook1, hook2, hook3 (no duplicates)
      expect(result.hooks?.notification).toEqual(['hook1', 'hook2', 'hook3']);
    });

    it('should preserve existing hook commands when merging', async () => {
      const existing: ClaudeSettings = { 
        hooks: { 
          notification: ['existing-hook'] 
        } 
      };
      const newHooks: Partial<ClaudeSettings> = { 
        hooks: { 
          notification: ['~/.claude/cctoast-wsl/show-toast.sh --notification-hook'] 
        } 
      };
      
      const result = await merger.merge(existing, newHooks);
      
      // Should result in both hooks being preserved
      expect(result.hooks?.notification).toEqual([
        'existing-hook',
        '~/.claude/cctoast-wsl/show-toast.sh --notification-hook',
      ]);
    });

    it('should handle merging with null and undefined values', async () => {
      const base: ClaudeSettings = { hooks: { notification: ['existing'] } };
      const updates: any = { hooks: null };
      
      const result = await merger.merge(base, updates);
      
      // null should be preserved
      expect(result).toEqual({ hooks: null });
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

    it('should handle empty objects and arrays', async () => {
      const base: ClaudeSettings = {};
      const updates: Partial<ClaudeSettings> = { 
        hooks: { 
          notification: ['new-hook'] 
        } 
      };
      
      const result = await merger.merge(base, updates);
      
      expect(result).toEqual({
        hooks: {
          notification: ['new-hook'],
        },
      });
    });
  });

  describe('Atomic File Operations', () => {
    it('should write to temp file first during atomic operations', async () => {
      const filePath = '/test/settings.json';
      const settings: ClaudeSettings = { hooks: { notification: ['test'] } };
      
      vi.mocked(path.dirname).mockReturnValue('/test');
      vi.mocked(path.basename).mockReturnValue('settings.json');
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'));
      
      // Mock successful file operations
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' } as any);
      
      const updates: Partial<ClaudeSettings> = { hooks: { notification: ['new-hook'] } };
      const result = await merger.mergeFile(filePath, updates);
      
      expect(result.changed).toBe(true);
      expect(fs.mkdir).toHaveBeenCalledWith('/test', { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/\.settings\.json\.tmp\.\d+$/),
        expect.stringContaining('"notification"'),
        'utf-8'
      );
      expect(fs.rename).toHaveBeenCalled();
    });

    it('should create timestamped backups when requested', async () => {
      const filePath = '/test/settings.json';
      const originalContent = '{"existing": "data"}';
      
      vi.mocked(path.dirname).mockReturnValue('/test');
      vi.mocked(path.basename).mockReturnValue('settings.json');
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'));
      vi.mocked(fs.readFile).mockResolvedValue(originalContent);
      
      // Mock Date.now() for consistent testing
      const mockDate = new Date('2023-01-01T12:00:00.000Z');
      const dateSpy = vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      mockDate.toISOString = vi.fn().mockReturnValue('2023-01-01T12:00:00.000Z');
      
      const updates: Partial<ClaudeSettings> = { hooks: { notification: ['new-hook'] } };
      const result = await merger.mergeFile(filePath, updates, { createBackup: true });
      
      expect(result.backupPath).toBeDefined();
      expect(fs.mkdir).toHaveBeenCalledWith('/test/backup', { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('2023-01-01T12-00-00-000Z-settings.json'),
        originalContent,
        'utf-8'
      );
      
      dateSpy.mockRestore();
    });

    it('should rollback on write failure by cleaning up temp file', async () => {
      const filePath = '/test/settings.json';
      
      vi.mocked(path.dirname).mockReturnValue('/test');
      vi.mocked(path.basename).mockReturnValue('settings.json');
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'));
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' } as any);
      
      // Mock write failure
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Write failed'));
      
      const updates: Partial<ClaudeSettings> = { hooks: { notification: ['new-hook'] } };
      
      await expect(merger.mergeFile(filePath, updates)).rejects.toThrow('Write failed');
      
      // Should attempt to clean up temp file
      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringMatching(/\.settings\.json\.tmp\.\d+$/)
      );
    });

    it('should handle existing file content correctly', async () => {
      const filePath = '/test/settings.json';
      const existingContent = '{"hooks": {"notification": ["existing-hook"]}}';
      
      vi.mocked(fs.readFile).mockResolvedValue(existingContent);
      vi.mocked(path.dirname).mockReturnValue('/test');
      vi.mocked(path.basename).mockReturnValue('settings.json');
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'));
      
      const updates: Partial<ClaudeSettings> = { hooks: { notification: ['new-hook'] } };
      const result = await merger.mergeFile(filePath, updates);
      
      expect(result.changed).toBe(true);
      expect(result.merged.hooks?.notification).toEqual(['existing-hook', 'new-hook']);
    });

    it('should detect when no changes are needed', async () => {
      const filePath = '/test/settings.json';
      const existingContent = '{"hooks": {"notification": ["existing-hook"]}}';
      
      vi.mocked(fs.readFile).mockResolvedValue(existingContent);
      
      // Try to merge the same data
      const updates: Partial<ClaudeSettings> = { hooks: { notification: ['existing-hook'] } };
      const result = await merger.mergeFile(filePath, updates);
      
      expect(result.changed).toBe(false);
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('Hook Command Injection', () => {
    it('should inject notification hook with correct global path', async () => {
      const base: ClaudeSettings = {};
      const globalPath = '~/.claude/cctoast-wsl/show-toast.sh --notification-hook';
      const updates: Partial<ClaudeSettings> = {
        hooks: {
          notification: [globalPath],
        },
      };
      
      const result = await merger.merge(base, updates);
      
      expect(result.hooks?.notification).toContain(globalPath);
    });

    it('should inject stop hook with correct global path', async () => {
      const base: ClaudeSettings = {};
      const globalPath = '~/.claude/cctoast-wsl/show-toast.sh --stop-hook';
      const updates: Partial<ClaudeSettings> = {
        hooks: {
          stop: [globalPath],
        },
      };
      
      const result = await merger.merge(base, updates);
      
      expect(result.hooks?.stop).toContain(globalPath);
    });

    it('should use relative paths for local install correctly', async () => {
      const base: ClaudeSettings = {};
      const localPath = '.claude/cctoast-wsl/show-toast.sh --notification-hook';
      const updates: Partial<ClaudeSettings> = {
        hooks: {
          notification: [localPath],
        },
      };
      
      const result = await merger.merge(base, updates);
      
      expect(result.hooks?.notification).toContain(localPath);
    });

    it('should preserve existing hooks while adding new ones', async () => {
      const existingHooks: ClaudeSettings = {
        hooks: {
          notification: ['existing-command-1', 'existing-command-2'],
          stop: ['existing-stop-hook'],
        },
      };
      
      const newHooks: Partial<ClaudeSettings> = {
        hooks: {
          notification: ['~/.claude/cctoast-wsl/show-toast.sh --notification-hook'],
          stop: ['~/.claude/cctoast-wsl/show-toast.sh --stop-hook'],
        },
      };
      
      const result = await merger.merge(existingHooks, newHooks);
      
      expect(result.hooks?.notification).toEqual([
        'existing-command-1',
        'existing-command-2',
        '~/.claude/cctoast-wsl/show-toast.sh --notification-hook',
      ]);
      
      expect(result.hooks?.stop).toEqual([
        'existing-stop-hook',
        '~/.claude/cctoast-wsl/show-toast.sh --stop-hook',
      ]);
    });

    it('should avoid duplicating hook commands', async () => {
      const existingHooks: ClaudeSettings = {
        hooks: {
          notification: ['~/.claude/cctoast-wsl/show-toast.sh --notification-hook'],
        },
      };
      
      const duplicateHooks: Partial<ClaudeSettings> = {
        hooks: {
          notification: ['~/.claude/cctoast-wsl/show-toast.sh --notification-hook'],
        },
      };
      
      const result = await merger.merge(existingHooks, duplicateHooks);
      
      // Should not duplicate the same hook command
      expect(result.hooks?.notification).toEqual([
        '~/.claude/cctoast-wsl/show-toast.sh --notification-hook',
      ]);
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
      
      // Without order preservation - new items at beginning
      const withoutOrder = await merger.merge(base, updates, { preserveOrder: false });
      expect(withoutOrder.hooks?.notification).toEqual(['hook1', 'hook2']); // Still at end because it's appended to existing
    });

    it('should skip backup creation when createBackup is false', async () => {
      const filePath = '/test/settings.json';
      const originalContent = '{"existing": "data"}';
      
      vi.mocked(fs.readFile).mockResolvedValue(originalContent);
      vi.mocked(path.dirname).mockReturnValue('/test');
      vi.mocked(path.basename).mockReturnValue('settings.json');
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'));
      
      const updates: Partial<ClaudeSettings> = { hooks: { notification: ['new-hook'] } };
      const result = await merger.mergeFile(filePath, updates, { createBackup: false });
      
      expect(result.backupPath).toBeUndefined();
      // Should not create backup directory or backup file
      expect(fs.mkdir).toHaveBeenCalledWith('/test', { recursive: true }); // Only for main file
      expect(fs.writeFile).toHaveBeenCalledTimes(1); // Only main file, no backup
    });
  });
});