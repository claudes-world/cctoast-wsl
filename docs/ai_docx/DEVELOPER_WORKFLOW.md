# Developer Workflow Guidelines

## Getting Started

### Prerequisites
Before starting development on cctoast-wsl, ensure you have:
- Node.js 18+ and npm 8+
- WSL2 with Ubuntu 20.04+ (or similar)
- Windows 10 1903+ or Windows 11
- Git configured for cross-platform development
- VS Code with WSL Remote extension (recommended)

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/claudes-world/cctoast-wsl.git
cd cctoast-wsl

# Install dependencies
npm install

# Run initial build
npm run build:dev

# Verify setup
npm run check:env
```

### **MANDATORY for LLM Agents**: Git Worktree Setup
**CRITICAL**: If you are an LLM agent, you MUST create a git worktree to avoid conflicts with other agents:

```bash
# Navigate to main project directory
cd cctoast-wsl

# Get the absolute latest code from remote
git fetch origin

# Create isolated worktree from latest remote main
git worktree add worktree-issue<NUMBER> origin/main

# Switch to your worktree
cd worktree-issue<NUMBER>

# Example for working on Issue #8:
git fetch origin
git worktree add worktree-issue8 origin/main
cd worktree-issue8

# Now you can work safely without conflicts, starting from latest code
```

**Cleanup after work is complete:**
```bash
# Return to main directory
cd ..

# Remove worktree when done
git worktree remove worktree-issue8
```

## Development Workflow

### 1. Branch Strategy
We follow GitHub Flow with these conventions:
- `main` - Stable, release-ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `test/*` - Test improvements

```bash
# Create a feature branch
git checkout -b feature/auto-install-burnttoast

# Create a fix branch  
git checkout -b fix/powershell-escaping
```

### 2. Commit Conventions
We use Conventional Commits for automatic versioning:

```bash
# Features
git commit -m "feat: add BurntToast auto-installation"
git commit -m "feat(cli): add --timeout flag"

# Fixes
git commit -m "fix: escape PowerShell special characters"
git commit -m "fix(installer): handle missing claude directory"

# Documentation
git commit -m "docs: update manual installation guide"
git commit -m "docs(api): clarify hook parameters"

# Tests
git commit -m "test: add PowerShell escaping tests"
git commit -m "test(e2e): verify installation flow"

# Chores (no release)
git commit -m "chore: update dependencies"
git commit -m "chore(ci): optimize build cache"
```

### 3. Development Commands

#### Building
```bash
# Development build (fast, with source maps)
npm run build:dev

# Production build (optimized)
npm run build

# Watch mode
npm run watch
```

#### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- src/cli/parser.test.ts

# Generate coverage report
npm run test:coverage

# Run shell script tests
npm run test:shell
```

#### Linting & Formatting
```bash
# Run all linters
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type checking
npm run typecheck
```

### 4. Testing Guidelines

#### Test Organization
```
__tests__/
├── unit/           # Unit tests for individual functions
├── integration/    # Module interaction tests
├── e2e/            # End-to-end scenarios
└── fixtures/       # Test data and mocks
```

#### Writing Tests
```typescript
// Use descriptive test names
describe('SettingsMerger', () => {
  describe('merge', () => {
    it('should preserve existing hooks when adding new ones', () => {
      // Arrange
      const existing = { hooks: { notification: ['existing'] } };
      const updates = { hooks: { notification: ['new'] } };
      
      // Act
      const result = merger.merge(existing, updates);
      
      // Assert
      expect(result.hooks.notification).toEqual(['existing', 'new']);
    });
  });
});
```

#### Shell Script Testing
```bash
# test/show-toast.bats
@test "converts WSL paths to Windows paths" {
  run ./scripts/show-toast.sh --image /home/user/icon.png
  assert_output --partial "C:\\Users\\user\\icon.png"
}

@test "auto-installs BurntToast when missing" {
  # Mock PowerShell to simulate missing module
  function powershell.exe() {
    if [[ "$*" == *"Get-Module"* ]]; then
      return 1
    fi
    echo "Module installed"
  }
  export -f powershell.exe
  
  run ./scripts/show-toast.sh --title "Test"
  assert_output --partial "Module installed"
}
```

### 5. Debugging

#### TypeScript Debugging
1. Use VS Code's built-in debugger
2. Set breakpoints in source files
3. Launch with F5 using provided configuration

#### Bash Script Debugging
```bash
# Enable debug mode
set -x
bash -x scripts/show-toast.sh --title "Debug"

# Or add to script
#!/bin/bash
set -euxo pipefail  # Debug mode

# Test with verbose output
CCTOAST_DEBUG=1 ./scripts/show-toast.sh --title "Debug Test"
```

#### PowerShell Debugging
```powershell
# Test PowerShell components directly
$DebugPreference = "Continue"
Import-Module BurntToast -ErrorAction Stop
# Test your PowerShell snippets

# Test BurntToast installation
Get-Module -ListAvailable -Name BurntToast
```

### 6. Manual Testing

#### Installation Testing
```bash
# Test global installation
npm run build && node bin/cctoast-wsl --dry-run

# Test local installation
npm run build && node bin/cctoast-wsl --local --dry-run

# Test with different flags
node bin/cctoast-wsl --no-notification --stop-only

# Test BurntToast auto-installation prompt
node bin/cctoast-wsl --force
```

#### Hook Testing
```bash
# Test notification hook directly using the script
~/.claude/cctoast-wsl/scripts/show-toast.sh --notification-hook

# Test stop hook
~/.claude/cctoast-wsl/scripts/show-toast.sh --stop-hook

# Test with custom parameters
~/.claude/cctoast-wsl/scripts/show-toast.sh --title "Test" --message "Custom message"

# Test with image
~/.claude/cctoast-wsl/scripts/show-toast.sh --title "Test" --message "With icon" --image ~/icon.png
```

#### BurntToast Auto-Installation Testing
```bash
# Test detection of missing BurntToast
powershell.exe -Command "Get-Module -ListAvailable -Name BurntToast"

# Test auto-installation flow (in PowerShell)
powershell.exe -NoProfile -Command "
  if (-not (Get-Module -ListAvailable -Name BurntToast)) {
    Install-Module BurntToast -Scope CurrentUser -Force
  }
"

# Verify installation succeeded
~/.claude/cctoast-wsl/scripts/show-toast.sh --title "BurntToast Test"
```

### 7. Performance Profiling

#### Build Performance
```bash
# Measure build time
time npm run build

# Analyze bundle size
npm run analyze
```

#### Runtime Performance
```bash
# Profile CLI startup
node --prof bin/cctoast-wsl --help
node --prof-process isolate-*.log

# Measure script execution time
time ~/.claude/cctoast-wsl/scripts/show-toast.sh --notification-hook

# Test with multiple rapid calls
for i in {1..10}; do
  ~/.claude/cctoast-wsl/scripts/show-toast.sh --title "Test $i" &
done
wait
```

## Code Style Guidelines

### TypeScript Style
- Use functional programming where appropriate
- Prefer `const` over `let`
- Use async/await over callbacks
- Explicit return types for public APIs
- Comprehensive JSDoc comments

```typescript
/**
 * Merges Claude settings with new hook configurations
 * @param existing - Current settings object
 * @param updates - New settings to merge
 * @returns Merged settings with preserved comments
 */
export async function mergeSettings(
  existing: ClaudeSettings,
  updates: Partial<ClaudeSettings>
): Promise<ClaudeSettings> {
  // Implementation
}
```

### Error Handling
```typescript
// Use custom error classes
class DependencyError extends Error {
  constructor(public dependency: string, public remedy: string) {
    super(`Missing dependency: ${dependency}`);
  }
}

// Provide helpful error messages
throw new DependencyError(
  'BurntToast',
  'Run: Install-Module BurntToast -Scope CurrentUser'
);
```

### Bash Style
- Use shellcheck directives
- Quote all variables
- Use `[[ ]]` over `[ ]`
- Meaningful variable names
- Error handling for all commands

```bash
#!/usr/bin/env bash
set -euo pipefail

# shellcheck disable=SC2154
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly LOG_FILE="${HOME}/.claude/cctoast-wsl/error.log"

log_error() {
  local message="$1"
  echo "[$(date -Iseconds)] ERROR: ${message}" >> "${LOG_FILE}"
}

# Check and auto-install BurntToast
check_burnttoast() {
  if ! powershell.exe -NoProfile -Command "Get-Module -ListAvailable -Name BurntToast" &>/dev/null; then
    echo "Installing BurntToast module..."
    powershell.exe -NoProfile -Command "Install-Module BurntToast -Scope CurrentUser -Force"
  fi
}
```

## Pull Request Process

### Before Creating PR
1. **Run all checks**:
   ```bash
   npm run check:all
   ```

2. **Update tests** for any new functionality

3. **Update documentation** if needed

4. **Test manually** in WSL environment

### PR Description Template
```markdown
## Summary
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Shell scripts tested
- [ ] BurntToast auto-installation tested

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process
1. Automated checks must pass
2. At least one approval required
3. Resolve all conversations
4. Squash and merge preferred

## CI/CD Pipeline & Testing

### Automated Testing Infrastructure

cctoast-wsl uses a comprehensive CI/CD pipeline with automated testing, building, and publishing. Here's how to work with it effectively:

#### Test Framework (Vitest)
```bash
# Run all tests
npm test

# Run with coverage (90% threshold required)
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch

# Run only shell script tests
npm run test:shell

# Run specific test files
npm test -- __tests__/unit/cli.test.ts
```

#### Coverage Requirements
The project enforces strict coverage thresholds:
- **Lines**: 90% minimum
- **Branches**: 85% minimum  
- **Functions**: 90% minimum
- **Statements**: 90% minimum

CI will fail if coverage drops below these thresholds.

#### Local CI Testing with Act

You can test CI workflows locally using [nektos/act](https://github.com/nektos/act):

```bash
# Install act (if not available)
# Follow: https://github.com/nektos/act#installation

# List available workflows
act -l

# Dry run the main CI workflow (validates without execution)
act -j test --dryrun

# Run the full CI test job locally
act -j test

# Run with specific platform
act -j test -P ubuntu-latest=catthehacker/ubuntu:act-latest

# Run only the benchmarking job
act -j benchmark
```

**Benefits of Local Testing:**
- ✅ Validate workflow syntax before pushing
- ✅ Test matrix configurations (Ubuntu 18/20, Windows 20)
- ✅ Verify dependency installation and caching
- ✅ Check coverage enforcement logic
- ✅ Test build verification and performance benchmarks
- ✅ Validate Windows PowerShell mocking strategy

#### CI Workflow Matrix
The CI runs on multiple environments:
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest]
    node-version: [18.x, 20.x]
    exclude:
      # Windows only tested on Node 20 per PRD
      - os: windows-latest
        node-version: 18.x
```

#### Windows CI Mocking Strategy
For Windows CI, BurntToast is mocked to avoid actual PowerShell module installation:
- Environment variable `CI=true` enables mocking
- PowerShell calls return simulated success responses
- Path conversion logic tested without actual Windows calls
- Mock scripts validate command generation accuracy

#### Performance Benchmarking
CI includes automated performance validation:
```bash
# Build time must be <1 second (target from PRD)
npm run build:prod

# CLI startup time measured (<100ms target)
time ./bin/cctoast-wsl --help

# Bundle size verified (<100KB target - currently ~26KB)
```

### Release Automation

#### Conventional Commits
Use conventional commits for automatic versioning:
```bash
# Feature (minor version bump)
git commit -m "feat: add new CLI flag for timeout"

# Bug fix (patch version bump)  
git commit -m "fix: resolve PowerShell escaping issue"

# Breaking change (major version bump)
git commit -m "feat!: change default installation location"

# Documentation (no version bump)
git commit -m "docs: update installation guide"

# CI improvements (no version bump)
git commit -m "ci: optimize workflow caching"
```

#### Automated Release Process
1. **Push to main** → Release Please analyzes commits
2. **Release PR created** → Automatically generated with changelog
3. **PR auto-merged** → When all checks pass
4. **Tagged release** → Triggers publish workflow
5. **npm published** → With provenance and SLSA-3 attestation
6. **GitHub release** → With artifacts and checksums

#### Manual Release Management
```bash
# View release-please PRs
gh pr list --author "github-actions[bot]"

# Check release workflow status
gh run list --workflow=release.yml

# View latest release info
gh release view --json tagName,publishedAt,assets

# Download release artifacts for verification
gh release download v1.0.0
```

### Quality Gates

All PRs and releases must pass:
- ✅ **TypeScript compilation** without errors
- ✅ **ESLint rules** with zero warnings  
- ✅ **ShellCheck validation** for bash scripts
- ✅ **Test suite** with 90% coverage minimum
- ✅ **Build verification** with <100KB bundle target
- ✅ **Performance benchmarks** within PRD targets
- ✅ **Security audit** passing all checks

### Troubleshooting CI Issues

#### Coverage Failures
```bash
# Generate detailed coverage report
npm run test:coverage

# Check which files need more tests
open coverage/index.html

# Test specific modules to improve coverage
npm test -- __tests__/unit/settings-merger.test.ts
```

#### Build Failures
```bash
# Test build locally before pushing
npm run build:prod

# Check bundle size
ls -la bin/cctoast-wsl

# Verify executable permissions
file bin/cctoast-wsl
```

#### Windows CI Issues
```bash
# Test Windows mocking locally (if on Windows)
$env:CI = "true"
npm test

# Validate PowerShell mock scripts
powershell.exe -File .github/workflows/mock-test.ps1
```

#### Act Testing Issues
```bash
# Use verbose output for debugging
act -j test --verbose

# Test with specific Docker image
act -j test -P ubuntu-latest=catthehacker/ubuntu:act-20.04

# Skip Docker pull to use cached images
act -j test --pull=false
```

### Security & Supply Chain

#### Dependency Management
- **Dependabot**: Automatic security updates (weekly schedule)
- **Audit**: `npm audit` runs on every CI build
- **Provenance**: All releases include npm provenance attestation
- **SLSA-3**: Build process follows SLSA-3 security standards

#### Vulnerability Reporting
See [SECURITY.md](.github/SECURITY.md) for:
- Vulnerability reporting process
- Security best practices
- Threat model documentation
- Contact information for security issues

## Release Process

### Version Bumping
Handled automatically by release-please based on conventional commits:
- `fix:` → Patch version (0.0.X)
- `feat:` → Minor version (0.X.0)
- `feat!:` or `BREAKING CHANGE:` → Major version (X.0.0)

### Release Checklist
1. Ensure all tests pass on main
2. Verify documentation is current
3. Check bundle size is within limits
4. Review CHANGELOG.md (auto-generated)
5. Approve release PR (auto-created)
6. Monitor npm publish status (automatic)

## Troubleshooting Development Issues

### Common Issues

#### WSL Path Issues
```bash
# Verify WSL environment
echo $WSL_DISTRO_NAME
echo $WSL_INTEROP

# Test path conversion
wslpath -w /home/user/file.txt

# Debug path issues in script
bash -x ~/.claude/cctoast-wsl/scripts/show-toast.sh --image /test/path.png
```

#### PowerShell Execution Policy
```powershell
# Check current policy
Get-ExecutionPolicy -List

# Fix for development
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

#### BurntToast Installation Issues
```bash
# Check if BurntToast is available
powershell.exe -Command "Get-Module -ListAvailable -Name BurntToast"

# Manual installation if auto-install fails
powershell.exe -Command "Install-Module BurntToast -Scope CurrentUser -Force -AllowClobber"

# Verify PowerShell Gallery is accessible
powershell.exe -Command "Test-Connection -ComputerName 'www.powershellgallery.com' -Count 1"
```

#### Node Version Mismatch
```bash
# Use nvm to manage versions
nvm use 20
node --version
```

### Debug Logs
Enable verbose logging:
```bash
# Set environment variable
export CCTOAST_DEBUG=1

# Run with debug output
npm run build:dev

# Test script with debug output
CCTOAST_DEBUG=1 ~/.claude/cctoast-wsl/scripts/show-toast.sh --title "Debug"
```

## Best Practices

### 1. Security
- Never commit sensitive data
- Validate all user input
- Use minimal permissions
- Follow principle of least privilege
- Ensure BurntToast installation is user-scoped only

### 2. Performance
- Profile before optimizing
- Keep bundle size minimal
- Cache expensive operations (like BurntToast checks)
- Use async I/O operations
- Minimize PowerShell invocations

### 3. Maintainability
- Write self-documenting code
- Keep functions small and focused
- Use meaningful names
- Add tests for bug fixes
- Document BurntToast version compatibility

### 4. Documentation
- Update docs with code changes
- Include examples in comments
- Document non-obvious decisions
- Keep README current
- Document PowerShell requirements clearly

## Getting Help

### Resources
- [Project Documentation](./README.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [PRD Specification](./PRD.md)
- [BurntToast Documentation](https://github.com/Windos/BurntToast)

### Communication
- GitHub Issues for bugs/features
- Discussions for questions
- Pull requests for contributions
- Security issues: security@example.com

## Continuous Improvement

### Feedback Loop
1. Monitor user issues
2. Track performance metrics
3. Review error logs
4. Conduct retrospectives
5. Update workflows as needed

### Metrics to Track
- Build time trends
- Test execution time
- Bundle size changes
- Code coverage trends
- Issue resolution time
- BurntToast installation success rate
- Script execution performance