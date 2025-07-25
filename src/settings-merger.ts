/**
 * JSONC Settings Merger
 *
 * Provides idempotent deep merge functionality for Claude settings files
 * with support for JSON with Comments (JSONC) format.
 */

import { JsoncParser, type ParseResult } from './jsonc-parser.js';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export interface ClaudeSettings {
  hooks?: {
    notification?: string[];
    stop?: string[];
    [key: string]: string[] | undefined;
  };
  [key: string]: unknown;
}

export interface MergeOptions {
  deduplicateArrays?: boolean;
  preserveOrder?: boolean;
  createBackup?: boolean;
}

export interface MergeResult {
  merged: ClaudeSettings;
  changed: boolean;
  backupPath?: string;
}

/**
 * Settings merger with JSONC support and atomic operations
 */
export class SettingsMerger {
  private jsonc = new JsoncParser();

  /**
   * Parse JSONC content into ClaudeSettings
   */
  async parseJsonc(content: string): Promise<ClaudeSettings> {
    const result: ParseResult<ClaudeSettings> =
      this.jsonc.parse<ClaudeSettings>(content);

    if (result.errors.length > 0) {
      const errorMessages = result.errors.map(e => e.message).join('; ');
      throw new Error(`JSONC parsing failed: ${errorMessages}`);
    }

    return result.data;
  }

  /**
   * Deep merge two settings objects with array deduplication
   */
  async merge(
    existing: ClaudeSettings,
    updates: Partial<ClaudeSettings>,
    options: MergeOptions = {}
  ): Promise<ClaudeSettings> {
    const { deduplicateArrays = true, preserveOrder = true } = options;

    const result = this.deepMerge(existing, updates, {
      deduplicateArrays,
      preserveOrder,
    });
    return result;
  }

  /**
   * Read, merge, and write settings file atomically
   */
  async mergeFile(
    filePath: string,
    updates: Partial<ClaudeSettings>,
    options: MergeOptions = {}
  ): Promise<MergeResult> {
    const { createBackup = true } = options;

    // Read existing content
    let existing: ClaudeSettings = {};
    let originalContent = '';

    try {
      originalContent = await fs.readFile(filePath, 'utf-8');
      existing = await this.parseJsonc(originalContent);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, start with empty settings
    }

    // Perform merge
    const merged = await this.merge(existing, updates, options);
    const changed = !this.isEqual(existing, merged);

    if (!changed) {
      return { merged, changed: false };
    }

    let backupPath: string | undefined;

    // Create backup if requested
    if (createBackup && originalContent) {
      backupPath = await this.createBackup(filePath, originalContent);
    }

    // Write merged settings atomically
    await this.writeAtomic(filePath, merged);

    return { merged, changed: true, backupPath };
  }

  /**
   * Deep merge implementation with special handling for arrays
   */
  private deepMerge(
    target: unknown,
    source: unknown,
    options: { deduplicateArrays: boolean; preserveOrder: boolean }
  ): any {
    if (source === null || source === undefined) {
      return target;
    }

    if (target === null || target === undefined) {
      return this.deepClone(source);
    }

    // Handle arrays specially
    if (Array.isArray(target) && Array.isArray(source)) {
      return this.mergeArrays(target, source, options);
    }

    // Handle objects
    if (this.isObject(target) && this.isObject(source)) {
      const result = this.deepClone(target) as Record<string, unknown>;

      for (const [key, value] of Object.entries(source)) {
        result[key] = this.deepMerge(result[key], value, options);
      }

      return result;
    }

    // For primitive values, source overwrites target
    return this.deepClone(source);
  }

  /**
   * Merge arrays with deduplication and order preservation
   */
  private mergeArrays(
    target: unknown[],
    source: unknown[],
    options: { deduplicateArrays: boolean; preserveOrder: boolean }
  ): unknown[] {
    const result = [...target];

    for (const item of source) {
      if (!options.deduplicateArrays || !this.arrayIncludes(result, item)) {
        if (options.preserveOrder) {
          result.push(item);
        } else {
          result.unshift(item);
        }
      }
    }

    return result;
  }

  /**
   * Check if array includes item (deep comparison)
   */
  private arrayIncludes(array: unknown[], item: unknown): boolean {
    return array.some(existing => this.isEqual(existing, item));
  }

  /**
   * Deep equality check
   */
  private isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null || a === undefined || b === undefined)
      return false;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.isEqual(item, b[index]));
    }

    if (this.isObject(a) && this.isObject(b)) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => this.isEqual((a as any)[key], (b as any)[key]));
    }

    return false;
  }

  /**
   * Deep clone an object
   */
  private deepClone(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this.deepClone(item));

    const cloned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      cloned[key] = this.deepClone(value);
    }
    return cloned;
  }

  /**
   * Check if value is a plain object
   */
  private isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Create timestamped backup of original file
   */
  private async createBackup(
    filePath: string,
    content: string
  ): Promise<string> {
    const dir = path.dirname(filePath);
    const basename = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(dir, 'backup');
    const backupPath = path.join(backupDir, `${timestamp}-${basename}`);

    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });

    // Write backup
    await fs.writeFile(backupPath, content, 'utf-8');

    return backupPath;
  }

  /**
   * Write JSON content atomically (temp file -> fsync -> rename)
   */
  private async writeAtomic(
    filePath: string,
    data: ClaudeSettings
  ): Promise<void> {
    const dir = path.dirname(filePath);
    const tempPath = path.join(
      dir,
      `.${path.basename(filePath)}.tmp.${Date.now()}`
    );

    try {
      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true });

      // Write to temp file
      const content = JSON.stringify(data, null, 2);
      await fs.writeFile(tempPath, content, 'utf-8');

      // Sync to disk
      const handle = await fs.open(tempPath, 'r+');
      await handle.sync();
      await handle.close();

      // Atomic rename
      await fs.rename(tempPath, filePath);
    } catch (error) {
      // Clean up temp file on error
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Expand home directory in path
   */
  static expandPath(filePath: string): string {
    if (filePath.startsWith('~')) {
      return path.join(os.homedir(), filePath.slice(1));
    }
    return filePath;
  }
}
