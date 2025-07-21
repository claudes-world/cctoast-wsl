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
// import {
//   intro as p.intro,
//   outro as p.outro,
//   select as p.select,
//   multiselect as p.multiselect,
//   confirm as p.confirm,
//   isCancel as p.isCancel,
//   cancel as p.cancel,
//   log as p.log,
//   spinner as p.spinner,
//   tasks as p.tasks,
//   group as p.group,
// } from '@clack/prompts';
import * as p from '@clack/prompts';
import color from 'picocolors';

import { DependencyChecker, BurntToastAutoInstaller } from './dependencies.js';
import { Installer } from './installer.js';

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
    .option('-g, --global', 'Install for user to ~/.claude/... (default)')
    .option('-l, --local', 'Install for project to .claude/...')
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
    'When local, modify tracked settings.json instead of settings.local.json (not recommended for teams due to Windows-only nature of hooks)',
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
  p.cancel('Operation cancelled by user');
  process.exit(ExitCodes.USER_ABORT);
}

/**
 * Interactive prompt flow: scope → hooks → sync → confirm
 */
async function runInteractiveMode(): Promise<CliOptions> {
  p.intro('🍞 cctoast-wsl Installation');

  // Step 1: Scope selection
  const scope = await p.select({
    message: 'Choose installation scope:',
    options: [
      {
        value: 'global',
        label: 'Global',
        hint: '★ Recommended - Install to ~/.claude/',
      },
      {
        value: 'local',
        label: 'Local',
        hint: 'Install to current project .claude/',
      },
    ],
  });

  if (p.isCancel(scope)) {
    handleCancel();
  }
  const scopeValue = scope as string;

  // Step 2: Hook selection
  const hooks = await p.multiselect({
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

  if (p.isCancel(hooks)) {
    handleCancel();
  }

  // Step 3: Sync option (only for local installs)
  let sync = false;
  if (scopeValue === 'local') {
    const syncResult = await p.confirm({
      message: 'Modify tracked settings.json instead of settings.local.json?',
      initialValue: false,
    });

    if (p.isCancel(syncResult)) {
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

  p.log.info(
    `Configuration summary:\n${summary.map(item => `  • ${item}`).join('\n')}`
  );

  // Add descriptive explanation based on config
  let configExplanation = '';
  if (scopeValue === 'global') {
    configExplanation =
      `\nHooks for ${hooksList.map(h => h.charAt(0).toUpperCase() + h.slice(1)).join(' and ')} will be added to your global settings at ~/.claude/settings.json.\n` +
      'The cctoast-wsl tool will install the necessary scripts and configuration for Windows toast notifications, available to all WSL sessions for your user.';
  } else if (scopeValue === 'local') {
    if (sync) {
      configExplanation =
        `\nHooks for ${hooksList.map(h => h.charAt(0).toUpperCase() + h.slice(1)).join(' and ')} will be added to your project's tracked settings at ./.claude/settings.json.\n` +
        'This will update the main project settings (recommended only if your team is Windows-only).';
    } else {
      configExplanation =
        `\nHooks for ${hooksList.map(h => h.charAt(0).toUpperCase() + h.slice(1)).join(' and ')} will be added to your local-only settings at ./.claude/settings.local.json.\n` +
        'This keeps Windows-specific configuration out of version control, ideal for cross-platform teams.';
    }
    configExplanation +=
      '\nThe cctoast-wsl tool will install the necessary scripts and configuration for toast notifications in this project.';
  }
  // TODO: After pre-flight checks, improve this message to be more precise, descriptive, and better formatted/worded.
  // Consider including actual file paths, resolved hook actions, and a summary of what will happen next.
  if (configExplanation) {
    p.log.message(configExplanation);
  }

  const proceed = await p.confirm({
    message: 'Proceed with installation?',
    initialValue: true,
  });

  if (p.isCancel(proceed) || !proceed) {
    handleCancel();
  }

  p.outro('Ready to install! 🎉');

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
    p.cancel('\nOperation cancelled by user');
    process.exit(ExitCodes.USER_ABORT);
  });

  process.on('SIGTERM', () => {
    p.cancel('\nOperation terminated');
    process.exit(ExitCodes.USER_ABORT);
  });
}

/**
 * Run dependency checks with user-friendly output
 */
async function runDependencyChecks(options: CliOptions): Promise<void> {
  const s = p.spinner();
  s.start('Checking system dependencies...');
  if (!options.quiet) {
    console.log('🔍 Checking system dependencies...\n');
  }

  const checker = new DependencyChecker(options.force);
  const results = await checker.checkAll();
  
  // Separate fatal and non-fatal failures
  const fatalFailures = results.filter(r => !r.passed && r.fatal);
  const warnings = results.filter(r => !r.passed && !r.fatal);
  const passed = results.filter(r => r.passed);

  // Display results
  if (!options.quiet) {
    // Show passed checks
    passed.forEach(result => {
      p.log.message(`${result.message}`, { symbol: color.cyan('✔') });

    });

    // Show warnings
    warnings.forEach(result => {
      console.log(`⚠️  ${result.message}`);
      if (result.remedy) {
        console.log(`   💡 ${result.remedy}`);
      }
    });
  }

  // Handle fatal failures
  if (fatalFailures.length > 0) {
    if (!options.quiet) {
      console.log('\n❌ Fatal dependency checks failed:\n');

      fatalFailures.forEach(result => {
        console.log(`   • ${result.message}`);
        if (result.remedy) {
          console.log(`     Fix: ${result.remedy}`);
        }
      });
    }

    // Special handling for BurntToast - offer auto-install
    const burntToastFailure = fatalFailures.find(
      r => r.name === 'burnttoast-module'
    );
    if (burntToastFailure && !options.quiet) {
      const autoInstaller = new BurntToastAutoInstaller();

      try {
        console.log('\n🤖 Auto-installation available for BurntToast module');
        const consent = await p.confirm({
          message:
            'Would you like to automatically install BurntToast PowerShell module?',
          initialValue: true,
        });

        if (p.isCancel(consent)) {
          handleCancel();
        }

        if (consent) {
          await autoInstaller.install();

          // Verify installation
          if (await autoInstaller.verify()) {
            console.log(
              '✅ BurntToast module installed and verified successfully'
            );

            // Remove BurntToast from fatal failures
            const remainingFailures = fatalFailures.filter(
              r => r.name !== 'burnttoast-module'
            );
            if (remainingFailures.length === 0) {
              console.log('\n🎉 All dependency checks now pass!');
              return;
            }
          } else {
            console.log('❌ BurntToast installation verification failed');
          }
        }
      } catch (error) {
        console.log(
          `❌ Auto-installation failed: ${error instanceof Error ? error.message : error}`
        );
      }
    }

    if (
      !options.force ||
      fatalFailures.some(r => r.name === 'burnttoast-module')
    ) {
      console.log(
        '\n💡 Use --force to bypass non-fatal checks, but BurntToast is required'
      );
      process.exit(ExitCodes.DEPENDENCY_FAILURE);
    }
  }

  if (!options.quiet && warnings.length === 0 && fatalFailures.length === 0) {
    console.log('\n🎉 All dependency checks passed!');
  }
  s.stop();
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

    // Run dependency checks (Milestone 3)
    if (options.json) {
      // For JSON output, run checks silently and include in output
      const checker = new DependencyChecker(options.force);
      const depResults = await checker.checkAll();

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
        dependencies: {
          timestamp: new Date().toISOString(),
          results: depResults.map(r => ({
            name: r.name,
            passed: r.passed,
            fatal: r.fatal,
            message: r.message,
            remedy: r.remedy,
          })),
          summary: {
            total: depResults.length,
            passed: depResults.filter(r => r.passed).length,
            failed: depResults.filter(r => !r.passed).length,
            fatal: depResults.filter(r => !r.passed && r.fatal).length,
            warnings: depResults.filter(r => !r.passed && !r.fatal).length,
          },
        },
      };

      console.log(JSON.stringify(result, null, 2));

      // Exit with appropriate code if dependencies failed
      const fatalFailures = depResults.filter(r => !r.passed && r.fatal);
      if (fatalFailures.length > 0 && !options.force) {
        process.exit(ExitCodes.DEPENDENCY_FAILURE);
      }
    } else {
      // Run dependency checks with user interaction
      await runDependencyChecks(options);
    }

    if (options.dryRun && !options.json) {
      console.log('\n📋 DRY RUN MODE - No files will be modified');
    }

    // Run installation or uninstallation using the Installation Engine
    const installer = new Installer({
      global: options.global || !options.local,
      local: options.local,
      notificationHook: options.notification,
      stopHook: options.stop,
      sync: options.sync,
      dryRun: options.dryRun,
    });

    try {
      let installResult;
      if (options.uninstall) {
        installResult = await installer.uninstall();
      } else {
        installResult = await installer.install();
      }

      if (options.json) {
        // For JSON output, include installation results
        const jsonResult = {
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
          installation: {
            success: installResult.success,
            installedTo: installResult.installedTo,
            settingsPath: installResult.settingsPath,
            backupPath: installResult.backupPath,
            hooksAdded: installResult.hooksAdded,
            message: installResult.message,
          },
        };
        console.log(JSON.stringify(jsonResult, null, 2));
      } else {
        // Human-readable output
        if (installResult.success) {
          console.log(`\n${installResult.message}`);
          if (installResult.backupPath) {
            console.log(`📁 Backup created: ${installResult.backupPath}`);
          }
          if (installResult.hooksAdded.length > 0) {
            console.log(`🪝 Hooks added: ${installResult.hooksAdded.join(', ')}`);
          }
        } else {
          console.error(`\n❌ ${installResult.message}`);
          process.exit(ExitCodes.IO_ERROR);
        }
      }
    } catch (error) {
      const errorMessage = `Installation failed: ${error instanceof Error ? error.message : error}`;
      if (options.json) {
        console.log(JSON.stringify({ error: errorMessage }, null, 2));
      } else {
        console.error(`\n❌ ${errorMessage}`);
      }
      process.exit(ExitCodes.IO_ERROR);
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
