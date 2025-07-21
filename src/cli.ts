/**
 * cctoast-wsl CLI Entry Point
 *
 * Secure, zero-admin utility for Windows toast notifications from WSL
 * via Claude Code hooks using PowerShell BurntToast module.
 */

import { Command } from 'commander';
import process from 'node:process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  intro,
  outro,
  select,
  multiselect,
  confirm,
  isCancel,
  cancel,
  log,
} from '@clack/prompts';

// Get package.json for version info
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const packagePath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

interface CliOptions {
  global: boolean;
  local: boolean;
  notification: boolean;
  stop: boolean;
  sync: boolean;
  printInstructions: boolean;
  json: boolean;
  dryRun: boolean;
  force: boolean;
  quiet: boolean;
  uninstall: boolean;
}

interface InstallationResult {
  action: 'install' | 'uninstall';
  scope: 'global' | 'local';
  hooks: {
    notification: boolean;
    stop: boolean;
  };
  settings: {
    sync: boolean;
    dryRun: boolean;
    force: boolean;
    quiet: boolean;
  };
}

/**
 * Exit codes per PRD specification
 */
export const ExitCodes = {
  SUCCESS: 0,
  USER_ABORT: 1,
  DEPENDENCY_FAILURE: 2,
  IO_ERROR: 3,
} as const;

/**
 * Initialize CLI with all flags from PRD Section 4
 */
function initializeCLI(): Command {
  const program = new Command();

  program
    .name('cctoast-wsl')
    .description(
      'Secure, zero-admin utility for Windows toast notifications from WSL via Claude Code hooks'
    )
    .version(packageJson.version, '-v, --version', 'Display version number');

  // Installation scope flags (mutually exclusive)
  program
    .option('-g, --global', 'Install to ~/.claude/... (default)')
    .option('-l, --local', 'Install to .claude/...')
    .addHelpText(
      'after',
      '\nScope Options:\n  Only one of --global or --local can be specified'
    );

  // Hook configuration flags
  program
    .option('--notification', 'Include Notification hook (default)', true)
    .option('--no-notification', 'Exclude Notification hook')
    .option('--stop', 'Include Stop hook (default)', true)
    .option('--no-stop', 'Exclude Stop hook');

  // Installation behavior flags
  program.option(
    '--sync',
    'When local, modify tracked settings.json instead of settings.local.json',
    false
  );

  // Output and behavior flags
  program
    .option('-p, --print-instructions', 'Show usage instructions and exit')
    .option('--json', 'Machine-readable JSON output', false)
    .option('-n, --dry-run', 'Preview changes without writing files')
    .option(
      '-f, --force',
      'Bypass failed dependency checks (except BurntToast)'
    )
    .option('-q, --quiet', 'Suppress interactive prompts for CI environments');

  // Uninstall flag
  program.option('--uninstall', 'Remove cctoast-wsl installation');

  return program;
}

/**
 * Validate mutually exclusive flags
 */
function validateFlags(options: CliOptions): void {
  // Handle default values first
  if (!options.global && !options.local) {
    options.global = true; // Default to global if neither specified
  }

  // Global and local are mutually exclusive (but only if both are explicitly set)
  if (options.global && options.local) {
    console.error('Error: --global and --local flags cannot be used together');
    process.exit(ExitCodes.USER_ABORT);
  }

  // At least one hook must be enabled
  if (!options.notification && !options.stop) {
    console.error(
      'Error: At least one hook (--notification or --stop) must be enabled'
    );
    process.exit(ExitCodes.USER_ABORT);
  }

  // Sync only makes sense with local install
  if (options.sync && !options.local) {
    console.error('Warning: --sync flag only applies to local installations');
  }
}

/**
 * Handle print instructions flag
 */
function handlePrintInstructions(): void {
  console.log(`
cctoast-wsl v${packageJson.version} - Usage Instructions

INSTALLATION:
  npx @claude/cctoast-wsl                    # Global install with defaults
  npx @claude/cctoast-wsl --local           # Local project install
  npx @claude/cctoast-wsl --dry-run         # Preview changes

EXAMPLES:
  npx @claude/cctoast-wsl --global --notification --stop
  npx @claude/cctoast-wsl --local --sync --no-stop
  npx @claude/cctoast-wsl --uninstall --global

HOOK USAGE:
  After installation, Claude Code will automatically trigger toast notifications:
  - Notification hook: Shows when Claude is waiting for input
  - Stop hook: Shows when Claude completes a task

MANUAL TESTING:
  ~/.claude/cctoast-wsl/show-toast.sh --notification-hook
  ~/.claude/cctoast-wsl/show-toast.sh --stop-hook

For complete documentation: https://github.com/claudes-world/cctoast-wsl
`);
  process.exit(ExitCodes.SUCCESS);
}

/**
 * Format output based on --json flag
 */
function formatOutput(data: InstallationResult, useJson: boolean): void {
  if (useJson) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    // Human-readable output will be implemented in installation logic
    console.log('Installation completed successfully');
  }
}

/**
 * Check if we're in an interactive terminal
 */
function isInteractive(): boolean {
  return process.stdin.isTTY && process.stdout.isTTY;
}

/**
 * Handle cancellation in clack prompts
 */
function handleCancel(): void {
  cancel('Operation cancelled by user');
  process.exit(ExitCodes.USER_ABORT);
}

/**
 * Interactive prompt flow: scope → hooks → sync → confirm
 */
async function runInteractiveMode(): Promise<CliOptions> {
  intro('🍞 cctoast-wsl Installation');

  // Step 1: Scope selection
  const scope = await select({
    message: 'Choose installation scope:',
    options: [
      {
        value: 'global',
        label: 'Global',
        hint: 'Install to ~/.claude/ (recommended)',
      },
      {
        value: 'local',
        label: 'Local',
        hint: 'Install to current project .claude/',
      },
    ],
  });

  if (isCancel(scope)) {
    handleCancel();
  }
  const scopeValue = scope as string;

  // Step 2: Hook selection
  const hooks = await multiselect({
    message: 'Select hooks to enable:',
    options: [
      {
        value: 'notification',
        label: 'Notification hook',
        hint: 'Shows toast when Claude is waiting for input',
      },
      {
        value: 'stop',
        label: 'Stop hook',
        hint: 'Shows toast when Claude completes a task',
      },
    ],
    initialValues: ['notification', 'stop'],
    required: true,
  });

  if (isCancel(hooks)) {
    handleCancel();
  }

  // Step 3: Sync option (only for local installs)
  let sync = false;
  if (scopeValue === 'local') {
    const syncResult = await confirm({
      message: 'Modify tracked settings.json instead of settings.local.json?',
      initialValue: false,
    });

    if (isCancel(syncResult)) {
      handleCancel();
    }
    sync = syncResult as boolean;
  }

  // Step 4: Final confirmation
  const hooksList = hooks as string[];
  const summary = [
    `Scope: ${scopeValue}`,
    `Hooks: ${hooksList.join(', ')}`,
    ...(scopeValue === 'local' ? [`Sync: ${sync ? 'yes' : 'no'}`] : []),
  ];

  log.info(
    `Configuration summary:\n${summary.map(item => `  • ${item}`).join('\n')}`
  );

  const proceed = await confirm({
    message: 'Proceed with installation?',
    initialValue: true,
  });

  if (isCancel(proceed) || !proceed) {
    handleCancel();
  }

  outro('Ready to install! 🎉');

  return {
    global: scopeValue === 'global',
    local: scopeValue === 'local',
    notification: hooksList.includes('notification'),
    stop: hooksList.includes('stop'),
    sync,
    printInstructions: false,
    json: false,
    dryRun: false,
    force: false,
    quiet: false,
    uninstall: false,
  };
}

/**
 * Handle process signals gracefully
 */
function setupSignalHandlers(): void {
  process.on('SIGINT', () => {
    cancel('\nOperation cancelled by user');
    process.exit(ExitCodes.USER_ABORT);
  });

  process.on('SIGTERM', () => {
    cancel('\nOperation terminated');
    process.exit(ExitCodes.USER_ABORT);
  });
}

/**
 * Check if any CLI flags were explicitly provided (excluding defaults)
 */
function hasExplicitFlags(argv: string[]): boolean {
  const flagsToCheck = [
    '--global',
    '-g',
    '--local',
    '-l',
    '--no-notification',
    '--no-stop',
    '--sync',
    '--json',
    '--dry-run',
    '-n',
    '--force',
    '-f',
    '--quiet',
    '-q',
    '--uninstall',
  ];
  return flagsToCheck.some(flag => argv.includes(flag));
}

/**
 * Main CLI execution function
 */
async function main(): Promise<void> {
  try {
    setupSignalHandlers();

    const program = initializeCLI();

    // Parse command line arguments
    program.parse();
    let options = program.opts() as CliOptions;

    // Handle print instructions immediately
    if (options.printInstructions) {
      handlePrintInstructions();
      return;
    }

    // Determine if we should use interactive mode
    const shouldUseInteractive =
      !options.quiet && isInteractive() && !hasExplicitFlags(process.argv);

    if (shouldUseInteractive) {
      // Use interactive mode
      options = await runInteractiveMode();
    } else {
      // Use command line flags - validate them
      validateFlags(options);
    }

    // For now, just show the parsed options (implementation will come in later milestones)
    const result = {
      action: options.uninstall ? 'uninstall' : 'install',
      scope: options.local ? 'local' : 'global',
      hooks: {
        notification: options.notification,
        stop: options.stop,
      },
      settings: {
        sync: options.sync,
        dryRun: options.dryRun,
        force: options.force,
        quiet: options.quiet,
      },
    };

    if (options.dryRun) {
      console.log('DRY RUN MODE - No files will be modified\n');
    }

    if (!shouldUseInteractive) {
      formatOutput(result, options.json);
    }

    // TODO: Implement actual installation/uninstallation logic in later milestones
    if (!options.json && !shouldUseInteractive) {
      console.log('\nCLI Framework implemented successfully!');
      console.log('Installation logic will be added in Milestone 4');
    }
  } catch (error) {
    console.error(
      'Unexpected error:',
      error instanceof Error ? error.message : error
    );
    process.exit(ExitCodes.IO_ERROR);
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(ExitCodes.IO_ERROR);
  });
}

export { main, initializeCLI, validateFlags };
