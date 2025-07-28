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

describe('Settings Merger Module', () => {
  let merger: SettingsMerger;
  let tempDir: string;

  beforeEach(() => {
    merger = new SettingsMerger();
    tempDir = '/tmp/test-claude';
    vi.clearAllMocks();
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
          notification: ['new'],
          stop: ['stop-hook']
        } 
      };
      
      const result = await merger.merge(base, updates);
      expect(result.hooks?.notification).toEqual(['existing', 'new']);
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
});