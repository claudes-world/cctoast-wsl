# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Documentation References

When working on this project, always consult these key documentation files:

- @docs/PRD.md - Complete Product Requirements Document defining 14 deliverables, CLI flags, dependency checks, hook installation logic, security requirements, testing goals (90% coverage), and future enhancements. Critical for understanding scope and success metrics.
- @docs/IMPLEMENTATION_PLAN.md - 8-milestone implementation roadmap with detailed subtasks and acceptance criteria. Essential for tracking progress and understanding the simplified 2-layer architecture (CLI installer + runtime bash script).
- @docs/ARCHITECTURE.md - Technical design showing 2-layer architecture, component interactions, data flow, module structure, error handling strategy, and extension points. Key for understanding how CLI installer sets up runtime bash script.
- @docs/DEVELOPER_WORKFLOW.md - Development environment setup, branch strategy, commit conventions, testing procedures, debugging techniques, and troubleshooting guide. Required for contributing to the project.
- @docs/PROJECT_MANAGEMENT.md - Comprehensive project management guide specifically for LLM developers. Covers issue management, feature branching, PR workflows, and progress tracking. Essential for understanding how to properly start, track, and complete work on features and milestones.
- @docs/BurntToast_manpage.txt - PowerShell BurntToast module documentation for creating Windows toast notifications. Reference for understanding the underlying notification API.
- @docs/DOCUMENTATION_STYLE_GUIDE.md - Writing and formatting guidelines for all project documentation. Essential for creating engaging, scannable content with proper markdown formatting, visual elements, and structure patterns. Always reference before updating README or other user-facing docs.

Always ensure implementations align with these specifications and follow the established patterns.

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

## GitHub Issue Management

The project uses milestone-based GitHub issues to track all development work:

### Issue Structure
- **8 Milestone Issues (#2-#9)**: Each represents one of the 8 implementation milestones
- **Comprehensive Task Lists**: Each milestone issue contains detailed checkbox lists of all subtasks
- **Labels System**: Run `./labels.sh` to create the full labeling system for organization
- **Progress Tracking**: Use issue comments to provide regular progress updates

### Workflow for LLM Developers
1. **Select Issue**: Choose from milestone issues #2-#9 based on priority and dependencies
2. **Create Branch**: Use `feat/<issue-number>-<description>` naming convention
3. **Track Progress**: Update issue with comments as tasks are completed
4. **Create PR**: Link back to the milestone issue when ready for review
5. **Complete**: Close issue after successful merge

### Key Commands
```bash
# View all milestone issues
gh issue list --label "milestone"

# Assign issue to yourself
gh issue edit <number> --add-assignee @me

# Update progress
gh issue comment <number> --body "Progress update: [details]"
```

See @docs/PROJECT_MANAGEMENT.md for complete workflow details.

## Best Practices and Guidelines

- Avoid using emojis in docs unless told to