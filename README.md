# cctoast-wsl

[![CI Status](https://github.com/claudes-world/cctoast-wsl/workflows/CI/badge.svg)](https://github.com/claudes-world/cctoast-wsl/actions)
[![Coverage](https://codecov.io/gh/claudes-world/cctoast-wsl/badge.svg)](https://codecov.io/gh/claudes-world/cctoast-wsl)
[![npm version](https://badge.fury.io/js/%40claude%2Fcctoast-wsl.svg)](https://www.npmjs.com/package/@claude/cctoast-wsl)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Secure, zero-admin utility** that enables Windows toast notifications from WSL for Claude Code hooks using PowerShell's BurntToast module.

Transform your Claude Code workflow with native Windows notifications that appear when Claude is waiting for input or completes tasks - all from within WSL with no system-level changes required.

## Demo
<!-- GIF placeholder - TODO: Record toast notification demo -->
<div style="text-align: center;">
  <img src="./docs/assets/demo.gif" alt="Product Demo Recording" style="width: 90%; max-width: 600px;" >
  <p style="font-size: 12px; color: #666;">Product Demo</p>
</div>

## How It Works

```mermaid
graph TB
    A[Claude Code Hook] --> B[show-toast.sh]
    B --> C[PowerShell.exe]
    C --> D[BurntToast Module]
    D --> E[Windows Toast Notification]
    
    F[cctoast-wsl CLI Installer] -.->|Copies script| B
    F -.->|Updates settings.json| A
    F -.->|Installs if needed| D
```

## Quick Start

Get Windows toast notifications working in under 2 minutes:

1. **Install**: `npx @claude/cctoast-wsl`
2. **Test**: Run Claude Code - notifications appear automatically  
3. **Done**: Toast notifications now work from WSL!

> [!TIP]  
> Installation completes in under 30 seconds and requires no admin privileges

### One-line installation
```bash
# Recommended: Global installation with interactive prompts
npx @claude/cctoast-wsl

# Alternative: Quiet install for CI/scripts
npx @claude/cctoast-wsl --global --quiet
```

<!-- placeholder for screen recording of install CLI options -->
<div style="text-align: center;">
  <img src="./docs/assets/demo2.gif" alt="Installation CLI Demo Recording" style="width: 90%; max-width: 600px;" >
  <p style="font-size: 12px; color: #666;">CLI Installer Demo</p>
</div>

## CLI Reference

Complete list of available flags and options:

| Flag | Default | Description |
|------|---------|-------------|
| `--global/-g` | ✓ | Install to `~/.claude/…` |
| `--local/-l` | | Install to `.claude/…` |
| `--notification / --no-notification` | on | Include Notification hook |
| `--stop / --no-stop` | on | Include Stop hook |
| `--sync` | off | When local, modify tracked `settings.json` |
| `--print-instructions/-p` | | Show usage & exit |
| `--json` | off | Machine-readable summary |
| `--dry-run/-n` | | Preview without writes |
| `--force/-f` | | Bypass failed checks (except BurntToast) |
| `--quiet/-q` | | Suppress prompts for CI |
| `--uninstall` | | Remove install (scope prompts) |
| `--version/-v` `--help/-h` | | Meta commands |

> [!NOTE]  
> **Defaults**: Global installation + both hooks enabled + no sync  
> **Exit codes**: `0` success · `1` abort · `2` dependency failure · `3` I/O error

### Common usage examples

```bash
# Global installation (recommended)
npx @claude/cctoast-wsl

# Local project installation  
npx @claude/cctoast-wsl --local

# Install only notification hook
npx @claude/cctoast-wsl --no-stop

# Preview changes without installing
npx @claude/cctoast-wsl --dry-run

# Uninstall
npx @claude/cctoast-wsl --uninstall
```

## Manual Installation

>[!CAUTION]
> * **Only place the script outside your project directory, for security.** Executable hook files in project directories (editable by Claude Code) pose risks including from prompt injection.
> * **Never use `sudo` in hook commands/scripts.** This will cause the script to run as root, which is a security risk.

1. **Download the script**:
   ```bash
   # Create hooks directory
   mkdir -p ~/.claude/hooks
   
   # Download show-toast.sh to hooks directory
   curl -o ~/.claude/hooks/show-toast.sh https://raw.githubusercontent.com/claudes-world/cctoast/main/scripts/show-toast.sh
   
   # Make executable
   chmod 500 ~/.claude/hooks/show-toast.sh

   # (Optional) Add alias to PATH
   # Temporary
   alias cctoast="~/.claude/hooks/show-toast.sh"
   # Permanent
   echo 'alias cctoast="~/.claude/hooks/show-toast.sh"' >> ~/.bashrc
   source ~/.bashrc
   ```

2. **Add to Claude settings**:
   Edit `~/.claude/settings.json`:
   ```json
   {
     "hooks": {
       "notification": [
         "/home/username/.claude/hooks/show-toast.sh --notification-hook"
       ],
       "stop": [
         "/home/username/.claude/hooks/show-toast.sh --stop-hook"
       ]
     }
   }
   ```

## Troubleshooting

### Quick fixes for common issues

#### ❌ "PowerShell execution policy" error
```bash
# Fix execution policy for current user only (no admin required)
powershell.exe -Command "Set-ExecutionPolicy -Scope CurrentUser RemoteSigned"
```

#### ❌ "BurntToast module not found"
```bash
# Install BurntToast module for current user
powershell.exe -Command "Install-Module BurntToast -Scope CurrentUser -Force"
```

#### ❌ No notifications appearing
1. Check that you're in WSL: `echo $WSL_DISTRO_NAME`
2. Test notification manually: `~/.claude/cctoast-wsl/show-toast.sh --title "Test"`
3. Verify Claude hooks: Check `~/.claude/settings.json`

> [!TIP]  
> For more detailed troubleshooting, see the [FAQ](docs/FAQ.md)

## Documentation

### Getting Help
- **[FAQ](docs/FAQ.md)** - Common issues and solutions
- **[Manual Installation](docs/MANUAL.md)** - Step-by-step installation without npm
- **[Security Guide](docs/SECURITY.md)** - Security considerations and best practices
- **[Advanced Usage](docs/ADVANCED.md)** - Customization and integration examples

### For Developers
- **[Contributing Guide](CONTRIBUTING.md)** - Development environment and contribution guidelines
- **[Architecture](docs/ARCHITECTURE.md)** - System design and technical decisions
- **[Developer Workflow](docs/DEVELOPER_WORKFLOW.md)** - Setup, testing, and debugging

### Technical Specifications
- **[Product Requirements](docs/PRD.md)** - Complete specifications and success metrics
- **[Implementation Plan](docs/IMPLEMENTATION_PLAN.md)** - 8-milestone development roadmap
- **[BurntToast Reference](docs/BurntToast_manpage.txt)** - PowerShell module documentation


---

## Future TODOs
- [ ] add hook for PreCompact
- [ ] contributing guide
- [ ] package CI/CD
- [ ] colored text reference in DOCUMENTATION_STYLE_GUIDE.md using mathjax https://raw.githubusercontent.com/lifeparticle/Markdown-Cheatsheet/refs/heads/main/MathJax.md)

---

<div style="text-align: center;">
  <h3>
    <b>Claude's World</b><br/>
  <h6>
    <a href="https://chaintail.xyz">
      <img src="./docs/assets/claudes-world-logo.png" alt="Claude's World Logo" style="width: 90%; max-width: 200px;" >
      <p style="font-size: 12px; color: #666;">
      <a href="https://github.com/claudes-world">@claudes-world</a> | 
      <a href="https://claude.do">claude.do</a>
      </p>
    </a>
  </h6>
  </h3> 

  an experimental project by 
  <br/>
  <a href="https://github.com/mcorrig4">@mcorrig4</a> & <a href="https://github.com/chaintail">@chaintail</a>
  <br/>
  <br/>
  <a href="https://chaintail.xyz">

  <img src="./docs/assets/chaintail-logo.png" alt="Chaintail Labs Logo" style="width: 90%; max-width: 200px;" >
  <p style="font-size: 12px; color: #666;">Chaintail Labs</p>
  </a>
  <p style="font-size: 12px; color: #666;">Copyright (c) 2025 Chaintail Labs</p>
</div>