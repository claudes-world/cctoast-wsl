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
git checkout -b feature/progress-toasts

# Create a fix branch  
git checkout -b fix/powershell-escaping
```

### 2. Commit Conventions
We use Conventional Commits for automatic versioning:

```bash
# Features
git commit -m "feat: add progress notification support"
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
```

#### PowerShell Debugging
```powershell
# Test PowerShell components directly
$DebugPreference = "Continue"
Import-Module BurntToast
# Test your PowerShell snippets
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
```

#### Hook Testing
```bash
# Test notification hook
~/.claude/cctoast-wsl/bin/cctoast-wsl --notification-hook

# Test stop hook
~/.claude/cctoast-wsl/bin/cctoast-wsl --stop-hook

# Test with custom parameters
cctoast-wsl --title "Test" --message "Custom message"
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

# Measure hook execution
time cctoast-wsl --notification-hook
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
  'Install-Module BurntToast -Scope CurrentUser'
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
4. Review CHANGELOG.md
5. Approve release PR
6. Monitor npm publish status

## Troubleshooting Development Issues

### Common Issues

#### WSL Path Issues
```bash
# Verify WSL environment
echo $WSL_DISTRO_NAME
echo $WSL_INTEROP

# Test path conversion
wslpath -w /home/user/file.txt
```

#### PowerShell Execution Policy
```powershell
# Check current policy
Get-ExecutionPolicy -List

# Fix for development
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
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
```

## Best Practices

### 1. Security
- Never commit sensitive data
- Validate all user input
- Use minimal permissions
- Follow principle of least privilege

### 2. Performance
- Profile before optimizing
- Keep bundle size minimal
- Cache expensive operations
- Use async I/O operations

### 3. Maintainability
- Write self-documenting code
- Keep functions small and focused
- Use meaningful names
- Add tests for bug fixes

### 4. Documentation
- Update docs with code changes
- Include examples in comments
- Document non-obvious decisions
- Keep README current

## Getting Help

### Resources
- [Project Documentation](./README.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [PRD Specification](./PRD.md)

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