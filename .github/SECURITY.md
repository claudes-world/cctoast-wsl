# Security Policy

## 🔒 Security Overview

The cctoast-wsl project takes security seriously. This utility bridges WSL and Windows systems, making security considerations critical for user safety.

## 🎯 Supported Versions

We provide security updates for the following versions:

| Version | Supported          | Notes                    |
| ------- | ------------------ | ------------------------ |
| 0.x.x   | ✅ Yes             | Current development      |
| < 0.1.0 | ❌ No              | Pre-release versions     |

## 🚨 Reporting a Vulnerability

### How to Report

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please report security issues by emailing: **security@claudes.world**

### What to Include

When reporting a security vulnerability, please include:

1. **Description**: Clear description of the vulnerability
2. **Impact**: Potential security impact and affected components
3. **Reproduction**: Step-by-step instructions to reproduce the issue
4. **Environment**: Operating system, WSL version, PowerShell version
5. **Suggested Fix**: If you have ideas for how to fix the issue

### Response Timeline

- **Initial Response**: Within 48 hours of report
- **Investigation**: Security team will investigate within 5 business days
- **Status Updates**: Regular updates every 5 business days during investigation
- **Resolution**: Fix timeline depends on severity and complexity

### Disclosure Process

1. **Private Investigation**: Issue investigated privately by maintainers
2. **Fix Development**: Security fix developed and tested
3. **Coordinated Disclosure**: 
   - Security advisory published on GitHub
   - Fix released as security patch
   - Public disclosure after fix is available
4. **Credit**: Reporter credited (unless anonymity requested)

## 🛡️ Security Measures

### Architecture Security

- **No Elevated Privileges**: Tool runs as regular user, never requires admin rights
- **No Network Access**: No outbound network connections during runtime
- **Minimal Attack Surface**: Direct script execution without complex wrapper layers
- **Input Validation**: All user inputs sanitized before PowerShell execution
- **Path Sanitization**: WSL → Windows path conversion validated and secured

### Build Security

- **Supply Chain**: All dependencies audited with `npm audit`
- **Provenance**: npm packages published with provenance attestation
- **Signed Releases**: Git tags and releases signed with GPG
- **SLSA-3**: Build process follows SLSA-3 attestation standards
- **Dependency Scanning**: Automated dependency vulnerability scanning

### Runtime Security

- **Script Permissions**: All installed scripts have 0o500 permissions (user execute only)
- **Atomic Operations**: File operations use atomic write patterns
- **Error Isolation**: PowerShell errors isolated and logged safely
- **Timeout Protection**: 10-second timeout prevents hanging operations
- **No Root Execution**: Explicitly refuses to run as root user

## 🔍 Security Best Practices for Users

### Installation

- **Verify Source**: Only install from official npm registry: `@claude/cctoast-wsl`
- **Check Signatures**: Verify GPG signatures on releases
- **Review Permissions**: Ensure scripts have correct permissions (0o500)
- **Scan Downloads**: Run antivirus scans on downloaded packages

### Configuration

- **Settings Location**: 
  - Global: `~/.claude/settings.json` (recommended)
  - Local: `.claude/settings.local.json` (project-specific)
- **Backup Settings**: Keep backups of Claude settings before installation
- **Review Changes**: Use `--dry-run` to preview changes before applying

### PowerShell Security

- **Execution Policy**: Set appropriate PowerShell execution policy:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```
- **BurntToast Source**: Only install BurntToast from PowerShell Gallery
- **Module Verification**: Verify BurntToast module signature:
  ```powershell
  Get-AuthenticodeSignature (Get-Module BurntToast -ListAvailable).Path
  ```

### Monitoring

- **Error Logs**: Monitor `~/.claude/cctoast-wsl/toast-error.log` for issues
- **Audit Trail**: Review installation changes in backup files
- **Dependency Updates**: Keep dependencies updated for security patches

## 🚫 Security Anti-Patterns

### DO NOT:
- ❌ Run cctoast-wsl as root or administrator
- ❌ Modify installed script permissions manually
- ❌ Install from unofficial package sources
- ❌ Disable PowerShell execution policy entirely
- ❌ Share error logs publicly (may contain sensitive paths)
- ❌ Run in production environments without testing

### DO:
- ✅ Use official installation methods only
- ✅ Keep all components updated
- ✅ Review installation changes with `--dry-run`
- ✅ Report security issues through proper channels
- ✅ Follow principle of least privilege
- ✅ Verify package integrity before installation

## 🔗 Security Resources

### External Security Guides
- [PowerShell Security Best Practices](https://docs.microsoft.com/en-us/powershell/scripting/security/security-best-practices)
- [WSL Security Considerations](https://docs.microsoft.com/en-us/windows/wsl/security)
- [npm Security Guidelines](https://docs.npmjs.com/security)

### Project Security Tools
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Dependency vulnerability scanning
- [GitHub Security Advisories](https://github.com/claudes-world/cctoast-wsl/security/advisories)
- [Dependabot](https://github.com/features/security) - Automated dependency updates

## 📞 Contact

For security-related questions or concerns:

- **Security Issues**: security@claudes.world
- **General Questions**: [GitHub Discussions](https://github.com/claudes-world/cctoast-wsl/discussions)
- **Documentation**: [Project Documentation](../docs/)

## 📋 Security Checklist for Contributors

Before contributing code:

- [ ] Run security linters and static analysis
- [ ] Ensure no secrets or sensitive data in commits
- [ ] Validate all input parameters and user data
- [ ] Follow secure coding practices for TypeScript/JavaScript
- [ ] Test with minimal privileges
- [ ] Update security documentation if needed
- [ ] Run `npm audit` and address any issues
- [ ] Sign commits with GPG key (recommended)

---

**Security is everyone's responsibility.** Thank you for helping keep cctoast-wsl secure for all users.