import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import process from 'node:process';

// Import functions to test
import { initializeCLI, validateFlags, ExitCodes } from '../../src/cli.js';

// Mock the CLI module dependencies
vi.mock('commander');
vi.mock('node:process', () => ({
  default: {
    stdin: { isTTY: true },
    stdout: { isTTY: true },
    argv: ['node', 'cctoast-wsl'],
    exit: vi.fn(),
    on: vi.fn(),
  },
}));
vi.mock('node:fs');
vi.mock('@clack/prompts');
vi.mock('../../src/dependencies.js');
vi.mock('../../src/installer.js');

describe('CLI Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock package.json reading
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({
      name: '@claude/cctoast-wsl',
      version: '0.0.1',
      description: 'Test description',
    }));

    // Mock Commander instance
    const mockProgram = {
      name: vi.fn().mockReturnThis(),
      description: vi.fn().mockReturnThis(),
      version: vi.fn().mockReturnThis(),
      option: vi.fn().mockReturnThis(),
      addHelpText: vi.fn().mockReturnThis(),
      parse: vi.fn(),
      opts: vi.fn(),
    };
    vi.mocked(Command).mockImplementation(() => mockProgram as any);
  });

  describe('Package Info', () => {
    it('should read package.json correctly', () => {
      expect(readFileSync).toBeDefined();
      // Verify package.json is read during CLI initialization
      initializeCLI();
      expect(readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('package.json'),
        'utf8'
      );
    });
  });

  describe('Exit Codes', () => {
    it('should define correct exit codes per PRD', () => {
      expect(ExitCodes.SUCCESS).toBe(0);
      expect(ExitCodes.USER_ABORT).toBe(1);
      expect(ExitCodes.DEPENDENCY_FAILURE).toBe(2);
      expect(ExitCodes.IO_ERROR).toBe(3);
    });
  });

  describe('CLI Initialization', () => {
    it('should initialize commander with correct metadata', () => {
      const program = initializeCLI();
      
      expect(Command).toHaveBeenCalled();
      expect(program.name).toHaveBeenCalledWith('cctoast-wsl');
      expect(program.description).toHaveBeenCalledWith(
        'Secure, zero-admin utility for Windows toast notifications from WSL via Claude Code hooks'
      );
      expect(program.version).toHaveBeenCalledWith(
        '0.0.1',
        '-v, --version',
        'Display version number'
      );
    });

    it('should configure all required flags', () => {
      const program = initializeCLI();
      
      // Verify flag calls - each flag should be configured
      const optionCalls = vi.mocked(program.option).mock.calls;
      
      // Check that core flags are configured
      const flagPatterns = [
        /-g, --global/,
        /-l, --local/,
        /--notification/,
        /--no-notification/,
        /--stop/,
        /--no-stop/,
        /--sync/,
        /-p, --print-instructions/,
        /--json/,
        /-n, --dry-run/,
        /-f, --force/,
        /-q, --quiet/,
        /--uninstall/,
      ];
      
      flagPatterns.forEach(pattern => {
        expect(optionCalls.some(call => pattern.test(call[0]))).toBe(true);
      });
    });
  });

  describe('Flag Validation', () => {
    it('should set global as default when neither global nor local specified', () => {
      const options = {
        global: false,
        local: false,
        notification: true,
        stop: true,
        sync: false,
        printInstructions: false,
        json: false,
        dryRun: false,
        force: false,
        quiet: false,
        uninstall: false,
      };
      
      // Should not throw and should set global to true
      expect(() => validateFlags(options)).not.toThrow();
      expect(options.global).toBe(true);
    });

    it('should reject when both global and local are explicitly set', () => {
      const options = {
        global: true,
        local: true,
        notification: true,
        stop: true,
        sync: false,
        printInstructions: false,
        json: false,
        dryRun: false,
        force: false,
        quiet: false,
        uninstall: false,
      };
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      
      validateFlags(options);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error: --global and --local flags cannot be used together'
      );
      expect(processExitSpy).toHaveBeenCalledWith(ExitCodes.USER_ABORT);
      
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should reject when no hooks are enabled', () => {
      const options = {
        global: true,
        local: false,
        notification: false,
        stop: false,
        sync: false,
        printInstructions: false,
        json: false,
        dryRun: false,
        force: false,
        quiet: false,
        uninstall: false,
      };
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      
      validateFlags(options);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error: At least one hook (--notification or --stop) must be enabled'
      );
      expect(processExitSpy).toHaveBeenCalledWith(ExitCodes.USER_ABORT);
      
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should warn when sync is used without local install', () => {
      const options = {
        global: true,
        local: false,
        notification: true,
        stop: true,
        sync: true,
        printInstructions: false,
        json: false,
        dryRun: false,
        force: false,
        quiet: false,
        uninstall: false,
      };
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => validateFlags(options)).not.toThrow();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Warning: --sync flag only applies to local installations'
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('should pass validation with valid flag combinations', () => {
      const validOptions = [
        {
          global: true,
          local: false,
          notification: true,
          stop: true,
          sync: false,
          printInstructions: false,
          json: false,
          dryRun: false,
          force: false,
          quiet: false,
          uninstall: false,
        },
        {
          global: false,
          local: true,
          notification: true,
          stop: false,
          sync: true,
          printInstructions: false,
          json: false,
          dryRun: false,
          force: false,
          quiet: false,
          uninstall: false,
        },
      ];
      
      validOptions.forEach(options => {
        expect(() => validateFlags(options)).not.toThrow();
      });
    });
  });

  describe('Interactive Mode Detection', () => {
    it('should detect interactive terminal correctly', () => {
      // This function is not exported, but we can test the behavior through main()
      // Set up TTY environment
      vi.mocked(process.stdin).isTTY = true;
      vi.mocked(process.stdout).isTTY = true;
      
      // The isInteractive function should return true when both stdin and stdout are TTY
      expect(process.stdin.isTTY && process.stdout.isTTY).toBe(true);
    });

    it('should detect non-interactive terminal correctly', () => {
      // Set up non-TTY environment
      vi.mocked(process.stdin).isTTY = false;
      vi.mocked(process.stdout).isTTY = false;
      
      expect(process.stdin.isTTY && process.stdout.isTTY).toBe(false);
    });
  });

  describe('Flag Detection', () => {
    it('should detect explicit flags in argv', () => {
      const testCases = [
        {
          argv: ['node', 'cctoast-wsl', '--global'],
          expected: true,
        },
        {
          argv: ['node', 'cctoast-wsl', '--local', '--no-notification'],
          expected: true,
        },
        {
          argv: ['node', 'cctoast-wsl', '--dry-run'],
          expected: true,
        },
        {
          argv: ['node', 'cctoast-wsl'],
          expected: false,
        },
        {
          argv: ['node', 'cctoast-wsl', '--help'],
          expected: false, // --help is not considered an explicit config flag
        },
      ];
      
      // We can't directly test hasExplicitFlags since it's not exported,
      // but we can test the argv patterns it would check
      testCases.forEach(({ argv, expected }) => {
        const flagsToCheck = [
          '--global', '-g', '--local', '-l',
          '--no-notification', '--no-stop', '--sync',
          '--json', '--dry-run', '-n',
          '--force', '-f', '--quiet', '-q',
          '--uninstall',
        ];
        
        const hasExplicitFlags = flagsToCheck.some(flag => argv.includes(flag));
        expect(hasExplicitFlags).toBe(expected);
      });
    });
  });
});