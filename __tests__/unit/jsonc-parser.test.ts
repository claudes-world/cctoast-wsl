import { describe, it, expect, beforeEach } from 'vitest';
import { JsoncParser, type ParseResult, type ParseError } from '../../src/jsonc-parser.js';

describe('JsoncParser', () => {
  let parser: JsoncParser;

  beforeEach(() => {
    parser = new JsoncParser();
  });

  describe('Basic JSON Parsing', () => {
    it('should parse valid JSON without comments', () => {
      const input = '{"name": "test", "value": 123}';
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ name: 'test', value: 123 });
    });

    it('should parse empty object', () => {
      const input = '{}';
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({});
    });

    it('should parse nested objects', () => {
      const input = '{"outer": {"inner": {"deep": "value"}}}';
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({
        outer: { inner: { deep: 'value' } }
      });
    });

    it('should parse arrays', () => {
      const input = '{"items": ["one", "two", "three"]}';
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ items: ['one', 'two', 'three'] });
    });
  });

  describe('Single-Line Comment Stripping', () => {
    it('should strip single-line comments at end of line', () => {
      const input = `{
        "name": "test", // This is a comment
        "value": 123
      }`;
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ name: 'test', value: 123 });
    });

    it('should strip full-line comments', () => {
      const input = `{
        // This is a full line comment
        "name": "test",
        "value": 123
        // Another comment
      }`;
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ name: 'test', value: 123 });
    });

    it('should preserve line structure when stripping comments', () => {
      const input = `{
        "first": "line1", // comment
        // full comment line
        "second": "line3"
      }`;
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ first: 'line1', second: 'line3' });
    });

    it('should handle multiple single-line comments', () => {
      const input = `{
        "a": 1, // comment 1
        "b": 2, // comment 2
        "c": 3  // comment 3
      }`;
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ a: 1, b: 2, c: 3 });
    });
  });

  describe('Multi-Line Comment Stripping', () => {
    it('should strip simple multi-line comments', () => {
      const input = `{
        "name": "test", /* this is a
        multi-line comment */
        "value": 123
      }`;
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ name: 'test', value: 123 });
    });

    it('should strip inline multi-line comments', () => {
      const input = `{
        "name": /* inline comment */ "test",
        "value": 123
      }`;
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ name: 'test', value: 123 });
    });

    it('should preserve line structure in multi-line comments', () => {
      const input = `{
        "first": "value1",
        /*
         * Multi-line comment
         * spanning several lines
         */
        "second": "value2"
      }`;
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ first: 'value1', second: 'value2' });
    });

    it('should handle multiple multi-line comments', () => {
      const input = `{
        "a": /* comment 1 */ 1,
        "b": /* comment 2 */ 2,
        /* comment 3 */
        "c": 3
      }`;
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ a: 1, b: 2, c: 3 });
    });
  });

  describe('Mixed Comment Types', () => {
    it('should handle both single-line and multi-line comments', () => {
      const input = `{
        // Header comment
        "name": "test", /* inline */ 
        /* 
         * Block comment
         */
        "value": 123, // End comment
        "enabled": true
      }`;
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ 
        name: 'test', 
        value: 123, 
        enabled: true 
      });
    });

    it('should handle comments in arrays', () => {
      const input = `{
        "items": [
          "first", // comment 1
          /* comment 2 */ "second",
          "third" // comment 3
        ]
      }`;
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ 
        items: ['first', 'second', 'third'] 
      });
    });
  });

  describe('Comments Inside Strings', () => {
    it('should preserve // inside string values', () => {
      const input = `{
        "url": "https://example.com//path",
        "comment": "This is // not a comment"
      }`;
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ 
        url: 'https://example.com//path',
        comment: 'This is // not a comment'
      });
    });

    it('should preserve /* */ inside string values', () => {
      const input = `{
        "pattern": "/* wildcard */",
        "css": "body { /* comment */ color: red; }"
      }`;
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ 
        pattern: '/* wildcard */',
        css: 'body { /* comment */ color: red; }'
      });
    });

    it('should handle escaped quotes in strings with comments', () => {
      const input = `{
        "escaped": "She said \\"Hello // World\\"", // Real comment
        "value": "test"
      }`;
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ 
        escaped: 'She said "Hello // World"',
        value: 'test'
      });
    });
  });

  describe('Error Handling', () => {
    it('should report unterminated multi-line comments', () => {
      const input = `{
        "name": "test",
        /* unterminated comment
        "value": 123
      }`;
      const result = parser.parse(input);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Unterminated multi-line comment');
      expect(result.errors[0].line).toBeGreaterThan(0);
    });

    it('should recover from JSON syntax errors', () => {
      const input = `{
        "name": "test",
        "value": 123,
      }`;
      const result = parser.parse(input);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('JSON syntax error');
      expect(result.data).toEqual({}); // Fallback to empty object
    });

    it('should provide line and column information for errors', () => {
      const input = `{
        "name": "test"
        "value": 123
      }`;
      const result = parser.parse(input);
      
      expect(result.errors.length).toBeGreaterThan(0);
      const error = result.errors[0];
      expect(error.line).toBeGreaterThan(0);
      expect(error.column).toBeGreaterThan(0);
      expect(error.offset).toBeGreaterThanOrEqual(0);
    });

    it('should handle completely invalid input', () => {
      const input = 'not json at all';
      const result = parser.parse(input);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.data).toEqual({});
    });

    it('should handle empty input', () => {
      const input = '';
      const result = parser.parse(input);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.data).toEqual({});
    });
  });

  describe('Options Configuration', () => {
    it('should disable comment stripping when allowComments is false', () => {
      const input = `{
        "name": "test" // comment
      }`;
      const result = parser.parse(input, { allowComments: false });
      
      // Should fail to parse because comments are not stripped
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should keep comments when stripComments is false', () => {
      const input = `{
        "name": "test" // comment
      }`;
      const result = parser.parse(input, { 
        allowComments: true, 
        stripComments: false 
      });
      
      // Should fail because comments are preserved and JSON.parse can't read them
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Static Methods', () => {
    it('should validate JSONC syntax without parsing', () => {
      const validInput = `{
        "name": "test", // comment
        "value": 123
      }`;
      const errors = JsoncParser.validate(validInput);
      expect(errors).toHaveLength(0);

      const invalidInput = `{
        "name": "test"
        "value": 123
      }`;
      const errors2 = JsoncParser.validate(invalidInput);
      expect(errors2.length).toBeGreaterThan(0);
    });

    it('should parse quickly with parseQuick', () => {
      const validInput = `{
        "name": "test", // comment
        "value": 123
      }`;
      const result = JsoncParser.parseQuick(validInput);
      expect(result).toEqual({ name: 'test', value: 123 });

      const invalidInput = `{
        "name": "test"
        "value": 123
      }`;
      const result2 = JsoncParser.parseQuick(invalidInput);
      expect(result2).toBeNull();
    });
  });

  describe('Complex Real-World Scenarios', () => {
    it('should handle Claude Code settings format', () => {
      const input = `{
        // Claude Code Settings
        "hooks": {
          "notification": [
            // Toast notification hook
            "~/.claude/cctoast-wsl/show-toast.sh --notification-hook"
          ],
          /*
           * Stop hook for completion notifications
           */
          "stop": [
            "~/.claude/cctoast-wsl/show-toast.sh --stop-hook"
          ]
        },
        "preferences": {
          "theme": "dark", // User preference
          "auto_save": true
        }
      }`;
      
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({
        hooks: {
          notification: [
            '~/.claude/cctoast-wsl/show-toast.sh --notification-hook'
          ],
          stop: [
            '~/.claude/cctoast-wsl/show-toast.sh --stop-hook'
          ]
        },
        preferences: {
          theme: 'dark',
          auto_save: true
        }
      });
    });

    it('should handle package.json with comments', () => {
      const input = `{
        "name": "@claude/cctoast-wsl",
        "version": "0.0.1",
        // Development dependencies
        "devDependencies": {
          "vitest": "^2.1.4", // Testing framework
          "typescript": "^5.8.3"
        },
        /* Production dependencies */
        "dependencies": {
          "commander": "^14.0.0"
        }
      }`;
      
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({
        name: '@claude/cctoast-wsl',
        version: '0.0.1',
        devDependencies: {
          vitest: '^2.1.4',
          typescript: '^5.8.3'
        },
        dependencies: {
          commander: '^14.0.0'
        }
      });
    });

    it('should handle deeply nested structures with mixed comments', () => {
      const input = `{
        "level1": {
          // Level 1 comment
          "level2": {
            /* Level 2 comment */
            "level3": {
              "array": [
                "item1", // Array comment
                /* Block in array */ "item2"
              ],
              "value": 42
            }
          }
        }
      }`;
      
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({
        level1: {
          level2: {
            level3: {
              array: ['item1', 'item2'],
              value: 42
            }
          }
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle comments at the very beginning and end', () => {
      const input = `// Starting comment
      {
        "name": "test"
      }
      // Ending comment`;
      
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ name: 'test' });
    });

    it('should handle empty multi-line comments', () => {
      const input = `{
        "name": /**/ "test",
        "value": /*

        */ 123
      }`;
      
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ name: 'test', value: 123 });
    });

    it('should handle comments with special characters', () => {
      const input = `{
        "name": "test", // Comment with émojis 🎉 and spëcial chars
        /* Comment with 中文 and עברית */
        "value": 123
      }`;
      
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ name: 'test', value: 123 });
    });

    it('should handle very long comments', () => {
      const longComment = 'x'.repeat(10000);
      const input = `{
        "name": "test", // ${longComment}
        "value": 123
      }`;
      
      const result = parser.parse(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ name: 'test', value: 123 });
    });
  });
});