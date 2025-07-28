# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Documentation References

When working on this project, always consult these key documentation files:

**Orchestration & Planning:**
- @docs/ai_docx/PROJECT_MANAGEMENT.md - Comprehensive project management guide specifically for LLM developers. Covers issue management, feature branching, PR workflows, and progress tracking. Essential for understanding how to properly start, track, and complete work on features and milestones.

**Planning, Implementation, & Coding:**
- @docs/ai_docx/PRD.md - Complete Product Requirements Document defining 14 deliverables, CLI flags, dependency checks, hook installation logic, security requirements, testing goals (90% coverage), and future enhancements. Critical for understanding scope and success metrics.
- @docs/ai_docx/IMPLEMENTATION_PLAN.md - 8-milestone implementation roadmap with detailed subtasks and acceptance criteria. Essential for tracking progress and understanding the simplified 2-layer architecture (CLI installer + runtime bash script).
- @docs/ai_docx/ARCHITECTURE.md - Technical design showing 2-layer architecture, component interactions, data flow, module structure, error handling strategy, and extension points. Key for understanding how CLI installer sets up runtime bash script.
- @docs/ai_docx/DEVELOPER_WORKFLOW.md - Development environment setup, branch strategy, commit conventions, testing procedures, debugging techniques, and troubleshooting guide. Required for contributing to the project.

**Documentation & Writing Text:**
- @docs/ai_docx/DOCUMENTATION_STYLE_GUIDE.md - Writing and formatting guidelines for all project documentation. Essential for creating engaging, scannable content with proper markdown formatting, visual elements, and structure patterns. Always reference before updating README or other user-facing docs.
- @docs/ai_docx/WRITING_DOCS_FOR_AI.md - Comprehensive framework for writing LLM-facing documentation. Provides fractal Information Unit pattern, three Intent Modes (Constrain/Guide/Explore), and strategic verbosity principles. Critical for creating token-efficient, context-rich documentation that enables AI agents to understand quickly and act appropriately.

**Manpage & Reference Docs:**
- @docs/ref/BurntToast_manpage.txt - PowerShell BurntToast module documentation for creating Windows toast notifications. Reference for understanding the underlying notification API.
- @docs/ref/Claude_Code_Hooks_Reference.md - Claude Code Hooks JSON Reference Manual. Reference for understanding the underlying notification API.

Always ensure implementations align with these specifications and follow the established patterns.

## Git and GitHub Guidelines

### Mandatory GitHub Practices
- **ALWAYS sign all GitHub comments and messages**
  - Ensures clear attribution and accountability
  - Helps track individual contributions
  - Demonstrates professional communication

### Required Signature Format
All git commits, GitHub issue comments, and PR comments must include:
```
🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude-do <claude@claude.do>, Claude <noreply@anthropic.com>
```

## 🧪 Interactive Feature Testing Protocol

**CRITICAL**: Before closing any milestone that includes interactive/TTY features, ALWAYS request user validation in a real terminal environment. The Claude Code environment cannot fully test interactive prompts, TTY detection, or terminal-specific behaviors.

### When to Request User Testing
- Interactive prompts (@clack/prompts)
- TTY detection logic
- Signal handling (Ctrl+C)
- Color output
- Progress indicators
- Any feature that behaves differently in CI vs interactive environments

### Testing Instructions Template
When requesting user testing, provide specific instructions:
1. **Commands to run**: Exact command-line invocations
2. **Expected behavior**: What the user should see and experience
3. **Edge cases**: Ctrl+C handling, invalid inputs, etc.
4. **Environment notes**: WSL vs native terminal requirements

### Testing Workflow:
1. **Create** `user_testing/PLEASE-TEST-<issue-number>.md` file with comprehensive test instructions. Commit and push.
2. **Tag @mcorrig4** in issue comment with friendly testing request and test file link
3. **Prompt**: also tell the user the same instructions through a message. Include a link to the issue comment at the end of your message.
4. **Wait** for user validation before closing milestone
4. **Address** any issues found and re-test if needed

### Partner Collaboration:
- **Always tag @mcorrig4** as your development partner for testing
- Use friendly, conversational tone (not formal/robotic)
- Clearly explain what you need and why
- Set realistic expectations and timeframes
- Thank them for collaboration - never pressure

### Example Files Created:
- `user_testing/PLEASE-TEST-3.md` - Interactive CLI mode validation for Milestone 2
- Future: `user_testing/PLEASE-TEST-X.md` - BurntToast integration, PowerShell execution, etc.

### Standard Test File Sections:
- Environment requirements
- Pre-test setup commands  
- Numbered test cases with ✅/❌ reporting
- Visual quality assessment
- Clear result reporting format

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
- **Labels System**: Run `./scripts/labels.sh` to create the full labeling system for organization
- **Progress Tracking**: Use issue comments to provide regular progress updates

### Workflow for LLM Developers
1. **Select Issue**: Choose from milestone issues #2-#9 based on priority and dependencies
2. **Create Branch**: Use `feat/<issue-number>-<description>` naming convention
3. **Track Progress**: Update issue with comments as tasks are completed
4. **Create PR**: Link back to the milestone issue when ready for review
5. **Complete**: Close issue after successful merge


### MANDATORY LLM Agent Git Workflow

* **ALWAYS Manage Issue Assignment & Tagging**: Proper issue assignment prevents multiple agents working on the same task
* **IMPORTANT**: If you are not currently working on an issue **STOP!**. Ask the user which issue we are working on
* **CRITICAL**: LLM agents **MUST** create isolated worktrees before starting any work to prevent conflicts
```bash
# 1. Find available issue
gh issue list --assignee "" --state open
# To find a new issue to work on, make sure the label isn't "in-progress"

# 2. Set up worktree (get latest code first)
git fetch origin && git worktree add worktree-issue<N> origin/main && cd worktree-issue<N>

# 3. Assign issue and create branch
gh issue edit <N> --add-assignee @me
git checkout -b feat/<N>-<description>

# 4. Notify start of work
gh issue comment <N> --body "🚧 Starting work in worktree-issue<N>"
gh issue edit <N> --label "in-progress"
```

**See @docs/PROJECT_MANAGEMENT.md for complete workflow details.**

## Best Practices and Guidelines

- Avoid using emojis in docs unless told to
- **Use Glob, Search built-in tools, or Bash(rg) (ripgrep) instead of using grep and find**
```