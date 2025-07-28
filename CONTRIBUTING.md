# Contributing to cctoast-wsl

Thank you for your interest in contributing to cctoast-wsl! This guide will help you get started with contributing code, documentation, or reporting issues.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Contribution Guidelines](#contribution-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation Guidelines](#documentation-guidelines)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

This project adheres to a code of conduct that promotes a welcoming and inclusive environment:

### Our Standards

- **Be respectful**: Treat everyone with respect and consideration
- **Be inclusive**: Welcome contributors of all backgrounds and experience levels
- **Be collaborative**: Work together constructively and help others learn
- **Be patient**: Remember that everyone is learning and growing

### Unacceptable Behavior

- Harassment, discrimination, or offensive language
- Personal attacks or trolling
- Publishing private information without consent
- Any conduct that creates an unwelcoming environment

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** and **npm 8+**
- **WSL2** with Ubuntu 20.04+ (or similar Linux distribution)
- **Windows 10 1903+** or **Windows 11**
- **Git** configured for cross-platform development
- **VS Code** with WSL Remote extension (recommended)
- **PowerShell** access from WSL
- **BurntToast** PowerShell module installed

### Fork and Clone

1. **Fork** the repository on GitHub
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/cctoast-wsl.git
   cd cctoast-wsl
   ```
3. **Add upstream** remote:
   ```bash
   git remote add upstream https://github.com/claudes-world/cctoast-wsl.git
   ```

## Development Environment

### Initial Setup

```bash
# Install dependencies
npm install

# Run initial build
npm run build:dev

# Verify setup
npm run check:env

# Install pre-commit hooks
npm run prepare
```

### Development Commands

```bash
# Build commands
npm run build:dev      # Development build with source maps
npm run build         # Production build (optimized)
npm run watch         # Watch mode for development

# Testing commands
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:shell    # Run shell script tests

# Linting and formatting
npm run lint          # Run all linters
npm run lint:fix      # Fix auto-fixable lint issues
npm run format        # Format code with Prettier
npm run typecheck     # TypeScript type checking

# Verification
npm run check:all     # Run all checks (build, lint, test, typecheck)
```

### Project Structure

```
cctoast-wsl/
├── src/                  # TypeScript source code
│   ├── cli/              # CLI argument parsing and main logic
│   ├── installer/        # Installation and dependency management
│   ├── utils/            # Shared utilities
│   └── types/            # TypeScript type definitions
├── scripts/              # Runtime bash scripts
│   └── show-toast.sh     # Main notification script
├── __tests__/            # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── fixtures/         # Test data and mocks
├── docs/                 # Documentation
├── assets/               # Static assets (icons, etc.)
└── bin/                  # Built CLI executables
```

## Contribution Guidelines

### Branch Strategy

We use **GitHub Flow** with descriptive branch names:

```bash
# Feature branches
git checkout -b feature/add-sound-support
git checkout -b feature/improve-error-handling

# Bug fix branches
git checkout -b fix/powershell-escaping-issue
git checkout -b fix/path-conversion-windows

# Documentation branches
git checkout -b docs/update-installation-guide
git checkout -b docs/add-troubleshooting-section
```

### Commit Conventions

We use **Conventional Commits** for automatic versioning and changelog generation:

```bash
# Feature commits
git commit -m "feat: add sound configuration support

- Support for different notification sounds
- Add sound parameter to show-toast.sh
- Update BurntToast integration with sound options

Closes #42"

# Bug fix commits
git commit -m "fix: resolve PowerShell parameter escaping

Special characters in notification messages were causing
PowerShell execution to fail. Added proper escaping.

Fixes #38"

# Documentation commits
git commit -m "docs: update installation troubleshooting guide

- Add PowerShell execution policy section
- Include BurntToast installation steps
- Add WSL path conversion examples

Refs #45"

# Other types
git commit -m "test: add integration tests for BurntToast module"
git commit -m "chore: update dependencies to latest versions"
git commit -m "style: fix formatting in CLI parser module"
```

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types**:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `test`: Test additions or improvements
- `chore`: Maintenance tasks
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements

## Pull Request Process

### Before Creating a PR

1. **Update your fork**:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   git push origin main
   ```

2. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** and **commit** following our conventions

4. **Run all checks**:
   ```bash
   npm run check:all
   ```

5. **Update documentation** if needed

6. **Test manually** in WSL environment

> [!TIP]  
> **Workflow Control**: Use `[skip-ci]` in commit messages for docs-only changes. To request AI code review, comment `@claude review` on your PR. See [CI/CD Workflows](docs/user-guides/CI-CD.md) for details.

### Creating the PR

1. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR** on GitHub with this template:

```markdown
## Summary
Brief description of changes and motivation

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed in WSL
- [ ] Shell scripts tested with ShellCheck
- [ ] BurntToast integration verified

## Documentation
- [ ] Code is self-documenting or includes comments
- [ ] README updated if needed
- [ ] API documentation updated if needed
- [ ] CHANGELOG.md will be updated automatically

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] No new warnings introduced
- [ ] Related issues referenced in commits
- [ ] PR description is clear and complete

## Additional Notes
Any additional information, concerns, or questions for reviewers
```

### PR Review Process

1. **Automated checks** must pass (CI, linting, tests)
2. **At least one approval** from maintainers required
3. **All conversations** must be resolved
4. **Conflicts** must be resolved before merge
5. **Squash and merge** is preferred for clean history

## Testing Requirements

### Test Categories

#### Unit Tests
```bash
# Run unit tests
npm run test:unit

# Write unit tests in __tests__/unit/
# Example: __tests__/unit/cli/parser.test.ts
```

#### Integration Tests
```bash
# Run integration tests
npm run test:integration

# Test module interactions
# Example: CLI + installer + settings merger
```

#### Shell Script Tests
```bash
# Run shell tests with Bats
npm run test:shell

# Write shell tests in __tests__/shell/
# Example: __tests__/shell/show-toast.bats
```

### Writing Tests

#### TypeScript Unit Test Example
```typescript
// __tests__/unit/utils/path-converter.test.ts
import { describe, it, expect, vi } from 'vitest';
import { convertWSLPath } from '../../../src/utils/path-converter';

describe('convertWSLPath', () => {
  it('should convert WSL path to Windows path', () => {
    // Mock wslpath command
    vi.mock('child_process');
    
    const wslPath = '/home/user/file.txt';
    const windowsPath = convertWSLPath(wslPath);
    
    expect(windowsPath).toMatch(/C:\\\\Users\\\\.*\\\\file\\.txt/);
  });
  
  it('should handle special characters in paths', () => {
    const pathWithSpaces = '/home/user/my file.txt';
    const result = convertWSLPath(pathWithSpaces);
    
    expect(result).toContain('my file.txt');
  });
});
```

#### Shell Script Test Example
```bash
# __tests__/shell/show-toast.bats
#!/usr/bin/env bats

setup() {
    # Load test helpers
    load test_helper
    
    # Create temporary directory
    export TEST_DIR="$(mktemp -d)"
    export HOME="$TEST_DIR"
}

teardown() {
    # Clean up
    rm -rf "$TEST_DIR"
}

@test "should display notification with custom title" {
    # Mock PowerShell to capture arguments
    function powershell.exe() {
        echo "Title: $4, Message: $6" > "$TEST_DIR/notification.log"
    }
    export -f powershell.exe
    
    run ./scripts/show-toast.sh --title "Test Title" --message "Test Message"
    
    assert_success
    assert_file_contains "$TEST_DIR/notification.log" "Title: Test Title"
    assert_file_contains "$TEST_DIR/notification.log" "Message: Test Message"
}

@test "should handle WSL path conversion" {
    function wslpath() {
        echo "C:\\Users\\test\\icon.png"
    }
    export -f wslpath
    
    run ./scripts/show-toast.sh --image "/home/test/icon.png"
    
    assert_success
}

@test "should auto-install BurntToast when missing" {
    # Mock PowerShell to simulate missing module
    function powershell.exe() {
        if [[ "$*" == *"Get-Module"* ]]; then
            return 1  # Module not found
        elif [[ "$*" == *"Install-Module"* ]]; then
            echo "Installing BurntToast..." > "$TEST_DIR/install.log"
            return 0  # Installation succeeded
        fi
        echo "Module installed" > "$TEST_DIR/notification.log"
    }
    export -f powershell.exe
    
    run ./scripts/show-toast.sh --title "Test"
    
    assert_success
    assert_file_contains "$TEST_DIR/install.log" "Installing BurntToast"
}
```

### Coverage Requirements

- **Overall coverage**: ≥90%
- **Critical paths**: 100% coverage
- **New features**: Must include tests
- **Bug fixes**: Must include regression tests

### BurntToast Testing Requirements

When contributing changes that affect BurntToast integration:

#### Auto-Installation Testing
```bash
# Test BurntToast detection and auto-installation
npm run test:integration -- --grep "BurntToast"

# Manual testing for auto-installation flow
node bin/cctoast-wsl --dry-run  # Should detect BurntToast status
```

#### PowerShell Module Testing
```bash
# Test module availability detection
powershell.exe -Command "Get-Module -ListAvailable -Name BurntToast"

# Test auto-installation in clean environment
# (Requires Windows environment or mocking)
```

#### Required Test Cases
- [ ] BurntToast module detection (present/missing)
- [ ] Auto-installation user consent flow
- [ ] Installation failure handling
- [ ] Module verification after installation
- [ ] PowerShell execution policy compatibility

## Documentation Guidelines

### Documentation Types

#### Code Documentation
- **JSDoc comments** for all public APIs
- **Inline comments** for complex logic
- **Type annotations** for all functions

```typescript
/**
 * Merges Claude settings with new hook configurations
 * 
 * @param existing - Current Claude settings
 * @param updates - New hook configurations to merge
 * @param options - Merge options (backup, atomic writes, etc.)
 * @returns Promise resolving to merged settings
 * 
 * @example
 * ```typescript
 * const settings = await mergeSettings(existing, {
 *   hooks: { notification: ['new-hook-command'] }
 * });
 * ```
 */
export async function mergeSettings(
  existing: ClaudeSettings,
  updates: Partial<ClaudeSettings>,
  options: MergeOptions = {}
): Promise<ClaudeSettings> {
  // Implementation
}
```

#### User Documentation
- Follow the [Documentation Style Guide](docs/ai_docx/DOCUMENTATION_STYLE_GUIDE.md)
- For LLM-facing docs, use the [Writing Docs for AI](docs/ai_docx/WRITING_DOCS_FOR_AI.md) framework
- Use **visual formatting** (alerts, tables, code blocks)
- Include **working examples**
- Test all code examples

#### Commit Documentation
- Reference issues in commit messages
- Explain **why** changes were made, not just **what**
- Include **breaking changes** in commit footers

### Documentation Checklist

- [ ] Code has appropriate comments
- [ ] Public APIs have JSDoc documentation
- [ ] README updated if user-facing changes
- [ ] CHANGELOG.md entry (automatic via conventional commits)
- [ ] Examples are tested and working
- [ ] Documentation follows style guide

## Issue Reporting

### Bug Reports

Use the bug report template:

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [Windows 11, WSL2, Ubuntu 22.04]
- Node.js version: [18.17.0]
- PowerShell version: [7.3.6]
- BurntToast version: [0.8.5]
- cctoast-wsl version: [1.0.0]

## Additional Context
- Error logs
- Screenshots
- Related issues
```

### Feature Requests

Use the feature request template:

```markdown
## Feature Description
Clear description of the proposed feature

## Use Case
Who would benefit and how

## Proposed Implementation
High-level implementation approach

## Alternatives Considered
Other approaches you've considered

## Additional Context
Examples, mockups, related features
```

### Security Issues

**Do not** create public issues for security vulnerabilities.

Instead:
1. Email: security@claudes-world.com
2. Include detailed description and reproduction steps
3. Allow time for coordinated disclosure

## Development Best Practices

### Code Quality

#### TypeScript Guidelines
- Use **strict mode** TypeScript configuration
- Prefer **const** over **let**
- Use **async/await** over callbacks
- Provide **explicit return types** for public APIs
- Use **meaningful variable names**

```typescript
// ✅ Good
export async function installBurntToast(): Promise<InstallResult> {
  const moduleStatus = await checkBurntToastModule();
  if (moduleStatus.isInstalled) {
    return { success: true, message: 'Already installed' };
  }
  
  return await performInstallation();
}

// ❌ Avoid
export function install(): any {
  return checkModule().then(status => {
    if (status) return { success: true };
    return doInstall();
  });
}
```

#### Shell Script Guidelines
- Use **shellcheck** directives
- **Quote all variables**
- Use `[[ ]]` over `[ ]`
- Include **error handling**
- Use **meaningful function names**

```bash
#!/usr/bin/env bash
set -euo pipefail

# ✅ Good
notify_with_timeout() {
    local title="$1"
    local message="$2"
    local timeout="${3:-10}"
    
    if ! command -v timeout >/dev/null 2>&1; then
        log_warning "timeout command not available"
        send_notification "$title" "$message"
        return $?
    fi
    
    timeout "${timeout}s" send_notification "$title" "$message"
}

# ❌ Avoid
notify() {
    timeout $3 send_notification $1 $2
}
```

### Security Considerations

- **Never commit secrets** or credentials
- **Validate all user input**
- **Use minimal permissions** (0o500 for scripts)
- **Avoid sudo** in all code and documentation
- **Sanitize paths** and parameters passed to PowerShell

### Performance Guidelines

- **Minimize PowerShell invocations**
- **Cache expensive operations**
- **Use async operations** where appropriate
- **Avoid blocking the main thread**
- **Profile before optimizing**

## Release Process

### Version Management

Versions follow **Semantic Versioning** (SemVer):
- `MAJOR.MINOR.PATCH` (e.g., 1.2.3)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Automated Releases

Releases are automated using **release-please**:
1. Conventional commits trigger version bumps
2. Release PR is created automatically
3. Merging release PR triggers npm publish
4. GitHub release is created with changelog

### Manual Release Steps (for maintainers)

1. **Verify all tests pass** on main branch
2. **Review and approve** release PR
3. **Merge release PR**
4. **Monitor CI/CD pipeline**
5. **Verify npm package** is published
6. **Update documentation** if needed

## Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community discussion
- **Email**: security@claudes-world.com (security issues only)

### Documentation Resources

- **[Architecture Guide](docs/ai_docx/ARCHITECTURE.md)**: Technical design and decisions
- **[Developer Workflow](docs/ai_docx/DEVELOPER_WORKFLOW.md)**: Detailed development procedures
- **[Documentation Style Guide](docs/ai_docx/DOCUMENTATION_STYLE_GUIDE.md)**: Writing guidelines for human and LLM readers
- **[Writing Docs for AI](docs/ai_docx/WRITING_DOCS_FOR_AI.md)**: Framework for creating LLM-facing documentation
- **[CI/CD Workflows](docs/user-guides/CI-CD.md)**: Optimized workflows, path filtering, and control flags
- **[FAQ](docs/user-guides/FAQ.md)**: Common questions and troubleshooting
- **[Security Guide](docs/user-guides/SECURITY.md)**: Security considerations

### Mentorship

New contributors are welcome! If you're new to:
- **Open source**: We'll help you learn the process
- **TypeScript**: We'll provide guidance and code review
- **Testing**: We'll help you write effective tests
- **Documentation**: We'll help you write clear docs

Don't hesitate to ask questions in your PR or create a discussion topic.

---

Thank you for contributing to cctoast-wsl! Your contributions help make Windows toast notifications from WSL better for everyone.