/**
 * JSONC Parser
 *
 * Parses JSON with Comments (JSONC) format while preserving formatting
 * and providing detailed error reporting with line/column information.
 */

export interface ParseResult<T = unknown> {
  data: T;
  errors: ParseError[];
}

export interface ParseError {
  message: string;
  line: number;
  column: number;
  offset: number;
}

export interface JsoncParseOptions {
  allowComments?: boolean;
  preserveFormatting?: boolean;
  stripComments?: boolean;
}

/**
 * JSONC Parser with comment support and error recovery
 */
export class JsoncParser {
  private content = '';
  private position = 0;
  private line = 1;
  private column = 1;
  private errors: ParseError[] = [];

  /**
   * Parse JSONC content with comment support
   */
  parse<T = unknown>(
    content: string,
    options: JsoncParseOptions = {}
  ): ParseResult<T> {
    const { allowComments = true, stripComments = true } = options;

    this.content = content;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.errors = [];

    // Handle empty content
    if (!content || content.trim().length === 0) {
      return { data: {} as T, errors: [] };
    }

    try {
      let processedContent = content;

      if (allowComments && stripComments) {
        processedContent = this.stripComments(content);
      }

      // Additional validation before parsing
      const trimmed = processedContent.trim();
      if (!trimmed) {
        return { data: {} as T, errors: [] };
      }

      const data = JSON.parse(processedContent) as T;
      return { data, errors: this.errors };
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.addError(this.extractJsonError(error.message));
      } else {
        this.addError(`Unknown parsing error: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // Try to recover with an empty object, but preserve the error

      return { data: {} as T, errors: this.errors };
    }
  }

  /**
   * Strip single-line and multi-line comments from JSONC
   */
  private stripComments(content: string): string {
    let result = '';
    let i = 0;
    let line = 1;
    let column = 1;

    while (i < content.length) {
      const char = content[i];
      const nextChar = content[i + 1];

      // Handle single-line comments //
      if (char === '/' && nextChar === '/') {
        // Skip to end of line
        while (i < content.length && content[i] !== '\n') {
          i++;
          column++;
        }
        // Include the newline to preserve line structure
        if (i < content.length && content[i] === '\n') {
          result += '\n';
          i++;
          line++;
          column = 1;
        }
        continue;
      }

      // Handle multi-line comments /* */
      if (char === '/' && nextChar === '*') {
        const startLine = line;
        const startColumn = column;
        i += 2; // Skip /*
        column += 2;

        // Find closing */
        let found = false;
        while (i < content.length - 1) {
          if (content[i] === '*' && content[i + 1] === '/') {
            i += 2; // Skip */
            column += 2;
            found = true;
            break;
          }
          if (content[i] === '\n') {
            result += '\n'; // Preserve line structure
            line++;
            column = 1;
          }
          i++;
          column++;
        }

        if (!found) {
          this.addError(
            `Unterminated multi-line comment starting at line ${startLine}, column ${startColumn}`
          );
        }
        continue;
      }

      // Handle strings to avoid processing comments inside them
      if (char === '"') {
        result += char;
        i++;
        column++;

        // Continue until closing quote or end of string
        while (i < content.length) {
          const stringChar = content[i];
          result += stringChar;

          if (stringChar === '"' && content[i - 1] !== '\\') {
            i++;
            column++;
            break;
          }

          if (stringChar === '\n') {
            line++;
            column = 1;
          } else {
            column++;
          }
          i++;
        }
        continue;
      }

      // Regular character
      result += char;
      if (char === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
      i++;
    }

    return result;
  }

  /**
   * Extract useful error information from JSON parsing errors
   */
  private extractJsonError(message: string): string {
    // Try to extract position information from common JSON error messages
    const positionMatch = message.match(/at position (\d+)/);
    if (positionMatch) {
      const position = parseInt(positionMatch[1]!, 10);
      const { line, column } = this.getLineColumn(position);
      return `JSON syntax error at line ${line}, column ${column}: ${message}`;
    }

    return `JSON syntax error: ${message}`;
  }

  /**
   * Convert character position to line/column
   */
  private getLineColumn(position: number): { line: number; column: number } {
    let line = 1;
    let column = 1;

    for (let i = 0; i < position && i < this.content.length; i++) {
      if (this.content[i] === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
    }

    return { line, column };
  }

  /**
   * Add parsing error with current position
   */
  private addError(message: string): void {
    this.errors.push({
      message,
      line: this.line,
      column: this.column,
      offset: this.position,
    });
  }

  /**
   * Validate JSONC syntax without parsing
   */
  static validate(content: string): ParseError[] {
    const parser = new JsoncParser();
    const result = parser.parse(content);
    return result.errors;
  }

  /**
   * Quick parse for when you just need the data and don't care about errors
   */
  static parseQuick<T = unknown>(content: string): T | null {
    const parser = new JsoncParser();
    const result = parser.parse<T>(content);
    return result.errors.length === 0 ? result.data : null;
  }
}
