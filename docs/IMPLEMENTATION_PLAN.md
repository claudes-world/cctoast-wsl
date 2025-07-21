# cctoast-wsl Implementation Plan

## Overview
This document outlines the complete implementation plan for cctoast-wsl, organized into 8 milestones with detailed subtasks and acceptance criteria. Each milestone builds upon the previous ones to deliver a secure, zero-admin utility for Windows toast notifications from WSL.

## Timeline & Priorities
- **Target Duration**: 4-6 weeks
- **Critical Path**: Milestones 1-5 (core functionality)
- **Success Metrics**: Install <30s, 90% test coverage, ≤1 kLOC TypeScript, CI <2 min

---

## Milestone 1: Foundation & Build System
**Goal**: Establish TypeScript project structure with proper build tooling
**Duration**: 2 days

### 1.1 Project Directory Structure
**Task**: Create standard directory layout per PRD section 3
**Acceptance Criteria**:
- [ ] Create directories: `src/`, `bin/`, `scripts/`, `assets/`, `__tests__/`, `fixtures/`, `.github/workflows/`
- [ ] Move `show-toast.sh` to `scripts/` directory
- [ ] Create placeholder files for main modules
- [ ] Directory structure matches PRD exactly

### 1.2 TypeScript Configuration
**Task**: Set up TypeScript with strict mode and modern ES features
**Acceptance Criteria**:
- [ ] Create `tsconfig.json` with strict mode enabled
- [ ] Target ES2022 or later
- [ ] Configure paths for clean imports
- [ ] Enable all strict type checking flags
- [ ] Configure source maps for debugging

### 1.3 Build System Setup
**Task**: Configure esbuild for fast, efficient bundling
**Acceptance Criteria**:
- [ ] Install esbuild and related dependencies
- [ ] Create build script that outputs to `bin/` directory
- [ ] Bundle size <100KB for CLI tool
- [ ] Build time <1 second
- [ ] Support both development and production builds
- [ ] Generate executable with proper shebang

### 1.4 Development Tooling
**Task**: Set up linting, formatting, and git hooks
**Acceptance Criteria**:
- [ ] Configure ESLint with TypeScript rules
- [ ] Set up Prettier with consistent formatting
- [ ] Install and configure ShellCheck for bash scripts
- [ ] Add husky for pre-commit hooks
- [ ] All tools integrated with npm scripts

### 1.5 Package.json Enhancement
**Task**: Update package.json with all required metadata and scripts
**Dependencies**: npm ≥8, Node ≥18
**Acceptance Criteria**:
- [ ] Add all required dependencies (no postinstall scripts)
- [ ] Configure as scoped package `@claude/cctoast-wsl`
- [ ] Add comprehensive scripts (build, lint, test, etc.)
- [ ] Include all metadata per PRD
- [ ] Set up proper exports for ESM

---

## Milestone 2: Core CLI Framework
**Goal**: Implement robust CLI with all required flags and interactive mode
**Duration**: 3 days

### 2.1 Command Line Parser
**Task**: Implement comprehensive argument parsing
**Acceptance Criteria**:
- [ ] Support all 14 flags from PRD section 4
- [ ] Proper flag aliases (e.g., -g/--global)
- [ ] Mutually exclusive flag validation
- [ ] Default values match PRD specifications
- [ ] Help text generation
- [ ] Version display

### 2.2 Interactive Mode
**Task**: Build interactive prompts for non-CI environments
**Acceptance Criteria**:
- [ ] Detect TTY for interactive mode
- [ ] Prompt flow: scope → hooks → sync → confirm
- [ ] Support arrow key navigation
- [ ] Validation for each prompt
- [ ] --quiet flag bypasses all prompts
- [ ] Clear, user-friendly prompt messages

### 2.3 Exit Code Management
**Task**: Implement proper exit codes per PRD
**Acceptance Criteria**:
- [ ] Exit 0: Success
- [ ] Exit 1: User abort
- [ ] Exit 2: Dependency failure
- [ ] Exit 3: I/O error
- [ ] Consistent error messages to stderr
- [ ] Proper signal handling (SIGINT, SIGTERM)

### 2.4 Output Formatting
**Task**: Implement human and machine-readable output
**Acceptance Criteria**:
- [ ] Normal output with color support
- [ ] --json flag for structured output
- [ ] Progress indicators for long operations
- [ ] --quiet suppresses non-error output
- [ ] Proper Unicode handling
- [ ] Respects NO_COLOR environment variable

### 2.5 Dry Run Mode
**Task**: Implement preview functionality without side effects
**Acceptance Criteria**:
- [ ] --dry-run shows all planned operations
- [ ] Display unified diff for file changes
- [ ] No filesystem modifications
- [ ] Clear indication of dry-run mode
- [ ] Works with all other flags

---

## Milestone 3: Dependency Management System
**Goal**: Create robust dependency checker with intelligent caching
**Duration**: 2 days

### 3.1 WSL Detection
**Task**: Verify WSL environment (fatal check)
**Acceptance Criteria**:
- [ ] Check `/proc/version` for WSL markers
- [ ] Detect WSL1 vs WSL2
- [ ] Clear error message if not in WSL
- [ ] Exit code 2 on failure
- [ ] No false positives

### 3.2 PowerShell Verification
**Task**: Ensure powershell.exe accessibility (fatal check)
**Acceptance Criteria**:
- [ ] Check PATH for powershell.exe
- [ ] Verify executable permissions
- [ ] Test basic command execution
- [ ] Handle path case sensitivity
- [ ] Timeout after 5 seconds

### 3.3 BurntToast Module Check
**Task**: Verify BurntToast installation (fatal check)
**Acceptance Criteria**:
- [ ] Run PowerShell module check
- [ ] Parse version information
- [ ] Provide installation command on failure
- [ ] Check for minimum version compatibility
- [ ] Handle module loading errors

### 3.4 Optional Dependency Checks
**Task**: Check for jq and Claude directory (warnings only)
**Acceptance Criteria**:
- [ ] Check jq binary availability
- [ ] Verify Claude directory exists
- [ ] Show warnings but continue
- [ ] Suggest installation/creation steps
- [ ] --force flag suppresses warnings

### 3.5 Caching System
**Task**: Implement 24-hour cache for check results
**Acceptance Criteria**:
- [ ] Store results in `~/.cache/cctoast-wsl/checks.json`
- [ ] Include timestamps for each check
- [ ] Automatic cache invalidation after 24h
- [ ] Force refresh option
- [ ] Handle corrupted cache gracefully
- [ ] Atomic cache updates

---

## Milestone 4: Installation Engine
**Goal**: Build robust installer with JSONC-aware settings merger
**Duration**: 4 days

### 4.1 JSONC Parser
**Task**: Implement JSON with Comments parser
**Acceptance Criteria**:
- [ ] Parse standard JSON
- [ ] Handle single-line comments (//)
- [ ] Handle multi-line comments (/* */)
- [ ] Preserve formatting where possible
- [ ] Error recovery for malformed JSON
- [ ] Line/column error reporting

### 4.2 Deep Merge Algorithm
**Task**: Create idempotent settings merger
**Acceptance Criteria**:
- [ ] Deep merge nested objects
- [ ] Array append with deduplication
- [ ] Preserve existing hook commands
- [ ] Handle null/undefined gracefully
- [ ] Maintain key order
- [ ] Type-safe merge operations

### 4.3 Atomic File Operations
**Task**: Implement safe file writing with backups
**Acceptance Criteria**:
- [ ] Write to temp file first
- [ ] fsync before rename
- [ ] Atomic rename operation
- [ ] Create timestamped backups
- [ ] Rollback on failure
- [ ] Handle permission errors

### 4.4 Global Installation
**Task**: Install to user home directory
**Acceptance Criteria**:
- [ ] Target: `~/.claude/settings.json`
- [ ] Create directories if missing
- [ ] Copy scripts to `~/.claude/cctoast-wsl/`
- [ ] Set permissions to 0o500
- [ ] Update PATH in shell profile
- [ ] Create uninstall manifest

### 4.5 Local Installation
**Task**: Project-specific installation
**Acceptance Criteria**:
- [ ] Target: `.claude/settings.local.json` (default)
- [ ] Option for `.claude/settings.json` with --sync
- [ ] Detect project root
- [ ] Relative path handling
- [ ] Git ignore recommendations
- [ ] Workspace-specific wrapper

### 4.6 Hook Command Injection
**Task**: Add notification and stop hooks
**Acceptance Criteria**:
- [ ] Append `cctoast-wsl --notification-hook` if selected
- [ ] Append `cctoast-wsl --stop-hook` if selected
- [ ] Avoid duplicate commands
- [ ] Preserve existing hooks
- [ ] Maintain array order
- [ ] Handle missing hook arrays

---

## Milestone 5: Runtime Components
**Goal**: Enhance bash script and implement hook handlers
**Duration**: 2 days

### 5.1 Bash Script Enhancement
**Task**: Update show-toast.sh to match PRD specifications
**Acceptance Criteria**:
- [ ] Add timeout wrapper (10s max)
- [ ] Implement PowerShell error handling
- [ ] Create error log at `~/.claude/cctoast-wsl/toast-error.log`
- [ ] Add parameter validation
- [ ] Support all toast parameters
- [ ] Set permissions to 0o500

### 5.2 PowerShell Integration
**Task**: Create robust PowerShell script
**Acceptance Criteria**:
- [ ] Try-catch error handling
- [ ] Import-Module with -ErrorAction Stop
- [ ] Structured error logging
- [ ] Parameter escaping
- [ ] Support custom icons
- [ ] Handle missing image gracefully

### 5.3 Notification Hook Handler
**Task**: Implement --notification-hook command
**Acceptance Criteria**:
- [ ] Parse hook payload if available
- [ ] Extract title/message from context
- [ ] Default: "Claude Code" / "Waiting for your response"
- [ ] Support custom attribution
- [ ] Log errors silently
- [ ] Complete within 2 seconds

### 5.4 Stop Hook Handler  
**Task**: Implement --stop-hook command
**Acceptance Criteria**:
- [ ] Show completion notification
- [ ] Include task duration if available
- [ ] Custom stop message
- [ ] Different icon/sound
- [ ] Non-blocking execution
- [ ] Handle rapid successive calls

### 5.5 Path Helper
**Task**: Create path conversion utilities
**Acceptance Criteria**:
- [ ] WSL to Windows path conversion
- [ ] Handle special characters
- [ ] Support network paths
- [ ] Validate path existence
- [ ] Cache conversion results
- [ ] Handle symlinks correctly

---

## Milestone 6: Testing Infrastructure
**Goal**: Achieve 90% test coverage with comprehensive test suites
**Duration**: 3 days

### 6.1 Unit Test Framework
**Task**: Set up Vitest for TypeScript testing
**Acceptance Criteria**:
- [ ] Configure Vitest with TypeScript
- [ ] Set up coverage reporting with C8
- [ ] Mock filesystem operations
- [ ] Mock external commands
- [ ] Parallel test execution
- [ ] Watch mode for development

### 6.2 CLI Test Suite
**Task**: Test all CLI flags and combinations
**Acceptance Criteria**:
- [ ] Test each flag individually
- [ ] Test flag combinations
- [ ] Test invalid inputs
- [ ] Test interactive prompts
- [ ] Verify exit codes
- [ ] 85% branch coverage

### 6.3 Merge Algorithm Tests
**Task**: Comprehensive JSON merge testing
**Acceptance Criteria**:
- [ ] Test deep merge scenarios
- [ ] Test array deduplication
- [ ] Test JSONC parsing
- [ ] Test error cases
- [ ] Golden file comparisons
- [ ] 100% coverage for merge module

### 6.4 Shell Script Tests
**Task**: Bats-core tests for bash scripts
**Acceptance Criteria**:
- [ ] Test show-toast.sh parameters
- [ ] Test error conditions
- [ ] Test timeout behavior
- [ ] Mock PowerShell calls
- [ ] Verify permissions
- [ ] Test path conversions

### 6.5 Integration Tests
**Task**: End-to-end installation tests
**Acceptance Criteria**:
- [ ] Test full installation flow
- [ ] Test uninstallation
- [ ] Test upgrade scenarios
- [ ] Verify file permissions
- [ ] Check PATH updates
- [ ] Test in CI environment

### 6.6 Coverage Enforcement
**Task**: Set up coverage gates
**Acceptance Criteria**:
- [ ] Overall: 90% line coverage
- [ ] Critical paths: 100% coverage
- [ ] Branch coverage: 85%
- [ ] Fail CI if below thresholds
- [ ] Generate coverage badges
- [ ] Codecov integration

---

## Milestone 7: Documentation & User Experience
**Goal**: Create comprehensive documentation suite
**Duration**: 2 days

### 7.1 README Enhancement
**Task**: Create professional README with all sections
**Acceptance Criteria**:
- [ ] Badges (CI, coverage, npm, license)
- [ ] Animated GIF demo
- [ ] Quick start section
- [ ] Complete flags table
- [ ] Installation methods
- [ ] Troubleshooting links

### 7.2 Manual Installation Guide
**Task**: Create docs/MANUAL.md
**Acceptance Criteria**:
- [ ] Step-by-step instructions
- [ ] SHA-256 checksums for all files
- [ ] Verification script
- [ ] PATH configuration details
- [ ] Permissions guide
- [ ] Offline installation steps

### 7.3 Security Documentation
**Task**: Create docs/SECURITY.md
**Acceptance Criteria**:
- [ ] Threat model
- [ ] Security considerations
- [ ] Reporting vulnerabilities
- [ ] Permission rationale
- [ ] PowerShell execution policy
- [ ] Best practices

### 7.4 FAQ Document
**Task**: Create docs/FAQ.md
**Acceptance Criteria**:
- [ ] Top 10 common issues
- [ ] Detailed solutions
- [ ] PowerShell errors
- [ ] WSL configuration
- [ ] PATH troubleshooting
- [ ] BurntToast issues

### 7.5 Advanced Usage Guide
**Task**: Create docs/ADVANCED.md
**Acceptance Criteria**:
- [ ] Custom icons guide
- [ ] Sound configuration
- [ ] Localization support
- [ ] Hook customization
- [ ] Performance tuning
- [ ] Integration examples

### 7.6 Contributing Guidelines
**Task**: Create CONTRIBUTING.md and ARCHITECTURE.md
**Acceptance Criteria**:
- [ ] Development setup
- [ ] Code style guide
- [ ] PR process
- [ ] Architecture overview
- [ ] Design decisions
- [ ] Future roadmap

---

## Milestone 8: CI/CD & Release Pipeline
**Goal**: Automated testing, building, and publishing
**Duration**: 2 days

### 8.1 CI Workflow
**Task**: Create comprehensive GitHub Actions CI
**Acceptance Criteria**:
- [ ] Trigger on PR and push
- [ ] Matrix: Ubuntu Node 18/20, Windows Node 20
- [ ] Run all tests
- [ ] Check coverage thresholds
- [ ] Lint and type checking
- [ ] Build verification
- [ ] < 2 minute runtime

### 8.2 Release Workflow
**Task**: Automated npm publishing pipeline
**Acceptance Criteria**:
- [ ] Trigger on version tags
- [ ] Build and test
- [ ] Generate provenance
- [ ] Sign with GPG
- [ ] Publish to npm
- [ ] Create GitHub release

### 8.3 Windows CI Testing
**Task**: Mock BurntToast for Windows CI
**Acceptance Criteria**:
- [ ] Mock PowerShell module
- [ ] Test toast command generation
- [ ] Verify path conversions
- [ ] Check execution policy
- [ ] Integration smoke tests
- [ ] Performance benchmarks

### 8.4 Release Automation
**Task**: Set up release-please
**Acceptance Criteria**:
- [ ] Conventional commits enforcement
- [ ] Automatic CHANGELOG.md
- [ ] Version bumping
- [ ] PR creation for releases
- [ ] Tag management
- [ ] Release notes generation

### 8.5 Documentation Site
**Task**: Docusaurus GitHub Pages setup
**Acceptance Criteria**:
- [ ] Auto-deploy on main branch
- [ ] Version documentation
- [ ] Search functionality
- [ ] Mobile responsive
- [ ] Analytics integration
- [ ] Custom domain setup

### 8.6 Package Security
**Task**: Supply chain security measures
**Acceptance Criteria**:
- [ ] npm provenance enabled
- [ ] SLSA-3 attestation
- [ ] 2FA on npm account
- [ ] Signed git tags
- [ ] Security policy
- [ ] Dependabot configuration

---

## Risk Mitigation Strategies

### Technical Risks
1. **PowerShell Execution Policy**: Pre-flight checks with clear remediation
2. **BurntToast Compatibility**: Version detection and compatibility matrix
3. **WSL Path Translation**: Comprehensive testing and fallback mechanisms
4. **Race Conditions**: Atomic operations and proper locking

### Project Risks
1. **Scope Creep**: Strict adherence to PRD, backlog for future features
2. **Testing Coverage**: Incremental testing during development
3. **Documentation Lag**: Documentation written alongside code
4. **CI Complexity**: Start simple, iterate on CI configuration

---

## Success Criteria Checklist

### Performance
- [ ] Installation completes in <30 seconds
- [ ] Toast notifications appear in <2 seconds
- [ ] CLI startup time <100ms
- [ ] Build time <1 second
- [ ] CI pipeline <2 minutes

### Quality
- [ ] 90% test coverage achieved
- [ ] 0 ESLint warnings
- [ ] 0 TypeScript errors
- [ ] All ShellCheck issues resolved
- [ ] Documentation complete

### Security
- [ ] No postinstall scripts
- [ ] All scripts have 0o500 permissions
- [ ] Refuses to run as root
- [ ] Signed releases
- [ ] Security documentation

### Usability
- [ ] Works on first try for 90% of users
- [ ] Clear error messages
- [ ] Comprehensive --help output
- [ ] Interactive mode intuitive
- [ ] Uninstall completely clean

---

## Next Steps
1. Begin with Milestone 1 to establish foundation
2. Daily progress updates against acceptance criteria  
3. Testing throughout, not just at end
4. Documentation written during implementation
5. Regular PRD compliance checks