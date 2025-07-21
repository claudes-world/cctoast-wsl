# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

cctoast-wsl is a utility that enables Windows toast notifications with sounds, messages, titles, and images from inside WSL for Claude Code hooks. It bridges WSL and Windows using PowerShell's BurntToast module.

## Development Commands

### Install Dependencies
```bash
npm install
```

### Run Tests
```bash
npm test
```
Note: Currently no tests are implemented (exits with error).

### Manual Testing
```bash
# Test the notification script directly
./show-toast.sh --title "Test" --message "Testing notification"
```

## Architecture

### Core Components

1. **Bash Wrapper (show-toast.sh)**
   - Parses command-line arguments (--title, --message, --image, --attribution)
   - Converts WSL paths to Windows paths using `wslpath`
   - Escapes PowerShell special characters
   - Invokes PowerShell with BurntToast module

2. **NPM Package Structure**
   - Main entry: index.js (to be implemented)
   - Install script: Will create wrapper executable in ~/.claude/cctoast-wsl/ or .claude/cctoast-wsl/
   - Hook integration: Updates Claude Code settings.json with notification/stop hooks

3. **Hook Commands**
   - Notification hook: `cctoast-wsl --notification-hook`
   - Stop hook: `cctoast-wsl --stop-hook`

## Implementation Requirements

### Dependency Checks
The installer must verify:
- WSL environment (fatal if not present)
- `powershell.exe` in PATH (fatal if missing)
- PowerShell execution policy (warning if restrictive)
- BurntToast module installed (fatal if missing)
- `jq` binary (optional, warn if missing)
- Claude directory exists (warn if missing)

### Installation Logic
- Global install: `~/.claude/settings.json`
- Local install: `.claude/settings.local.json` (or `settings.json` if --sync)
- Atomic JSON merge with backup creation
- Preserve existing hooks while adding new ones

### Security Considerations
- No postinstall scripts in package.json
- All scripts must have 0o500 permissions
- Refuse to run as root
- Manual installation instructions required in docs/MANUAL.md

## Key Design Decisions

1. **No Node Runtime Dependency**: The actual notification script runs in pure Bash → PowerShell
2. **Idempotent Installation**: Re-running installer should not duplicate hooks
3. **Atomic Operations**: All file writes use temp → fsync → rename pattern
4. **24-hour Cache**: Dependency check results cached in ~/.cache/cctoast-wsl/

## Future Implementation Tasks

Based on the PRD, the following components need to be implemented:
1. TypeScript CLI tool with esbuild bundling
2. JSON merge functionality with JSONC support
3. Interactive prompts for installation options
4. Comprehensive test suite (90% coverage target)
5. Documentation site with Docusaurus
6. CI/CD pipeline with GitHub Actions

## Testing Approach

When tests are implemented:
- Unit tests: Vitest for TypeScript code
- Shell tests: Bats-core for bash scripts
- Integration tests: Mock BurntToast module on Windows CI
- Coverage: C8 with Codecov integration