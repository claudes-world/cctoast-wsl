# Manual Installation Guide

This guide covers manual installation of cctoast-wsl without using npm. Use this method for air-gapped environments, custom deployments, or when you prefer direct control over the installation process.

## Quick Overview

Manual installation involves:
1. **Download** and verify the runtime script
2. **Install** prerequisites (PowerShell, BurntToast)
3. **Configure** Claude Code settings
4. **Test** the installation

> [!NOTE]  
> Manual installation takes 5-10 minutes vs 30 seconds for automated installation

## Prerequisites

### Required Components
- **WSL 1 or 2** (Windows Subsystem for Linux)
- **PowerShell access** from WSL (`powershell.exe` in PATH)
- **Claude Code** installed with hooks support

### PowerShell Modules
- **BurntToast** module for Windows notifications

## Step 1: Download and Verify Files

### Download Runtime Script
```bash
# Create installation directory
mkdir -p ~/.claude/cctoast-wsl

# Download the main script
curl -o ~/.claude/cctoast-wsl/show-toast.sh \
  https://raw.githubusercontent.com/claudes-world/cctoast-wsl/main/scripts/show-toast.sh

# Download the default icon
curl -o ~/.claude/cctoast-wsl/claude.png \
  https://raw.githubusercontent.com/claudes-world/cctoast-wsl/main/assets/claude.png

# Set correct permissions (user execute only)
chmod 500 ~/.claude/cctoast-wsl/show-toast.sh
```

### File Verification

> [!IMPORTANT]  
> Always verify file integrity before execution

```bash
# Verify SHA-256 checksums (these will be updated for each release)
sha256sum ~/.claude/cctoast-wsl/show-toast.sh
# Expected: [SHA-256 hash will be provided with each release]

sha256sum ~/.claude/cctoast-wsl/claude.png  
# Expected: [SHA-256 hash will be provided with each release]
```

### Alternative: Clone Repository
```bash
# Clone the entire repository
git clone https://github.com/claudes-world/cctoast-wsl.git
cd cctoast-wsl

# Copy files to correct location
mkdir -p ~/.claude/cctoast-wsl
cp scripts/show-toast.sh ~/.claude/cctoast-wsl/
cp assets/claude.png ~/.claude/cctoast-wsl/
chmod 500 ~/.claude/cctoast-wsl/show-toast.sh
```

## Step 2: Install Prerequisites

### Check WSL Environment
```bash
# Verify you're in WSL
echo $WSL_DISTRO_NAME
# Should output your distro name (e.g., Ubuntu, Debian)

# Verify PowerShell access
which powershell.exe
# Should output: /mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe
```

### Install BurntToast Module
```bash
# Check if BurntToast is already installed
powershell.exe -Command "Get-Module -ListAvailable -Name BurntToast"

# If not installed, install it (no admin rights required)
powershell.exe -Command "Install-Module BurntToast -Scope CurrentUser -Force"

# Verify installation
powershell.exe -Command "Import-Module BurntToast; Get-Module BurntToast"
```

### Handle PowerShell Execution Policy
```bash
# Check current execution policy
powershell.exe -Command "Get-ExecutionPolicy -List"

# If restricted, set for current user only (no admin required)
powershell.exe -Command "Set-ExecutionPolicy -Scope CurrentUser RemoteSigned"
```

## Step 3: Configure Claude Code Settings

### Global Configuration (Recommended)
Edit `~/.claude/settings.json`:

```json
{
  "hooks": {
    "notification": [
      "/home/[username]/.claude/cctoast-wsl/show-toast.sh --notification-hook"
    ],
    "stop": [
      "/home/[username]/.claude/cctoast-wsl/show-toast.sh --stop-hook"  
    ]
  }
}
```

> [!IMPORTANT]  
> Replace `[username]` with your actual WSL username

### Local Project Configuration
For project-specific installation, edit `.claude/settings.local.json`:

```json
{
  "hooks": {
    "notification": [
      "/home/[username]/.claude/cctoast-wsl/show-toast.sh --notification-hook"
    ],
    "stop": [
      "/home/[username]/.claude/cctoast-wsl/show-toast.sh --stop-hook"
    ]
  }
}
```

### Merge with Existing Settings
If you already have hooks configured:

```bash
# Backup existing settings
cp ~/.claude/settings.json ~/.claude/settings.json.backup

# Edit to add cctoast-wsl to existing hook arrays
# Use your preferred editor (nano, vim, code)
nano ~/.claude/settings.json
```

Example of merging with existing hooks:
```json
{
  "hooks": {
    "notification": [
      "existing-notification-command",
      "/home/[username]/.claude/cctoast-wsl/show-toast.sh --notification-hook"
    ],
    "stop": [
      "existing-stop-command", 
      "/home/[username]/.claude/cctoast-wsl/show-toast.sh --stop-hook"
    ]
  }
}
```

## Step 4: Test Installation

### Basic Function Test
```bash
# Test the script directly
~/.claude/cctoast-wsl/show-toast.sh --title "Manual Install" --message "Testing cctoast-wsl"

# Should display a Windows toast notification
```

### Hook Integration Test
```bash
# Test notification hook
echo "Test notification" | ~/.claude/cctoast-wsl/show-toast.sh --notification-hook

# Test stop hook  
echo "Test completion" | ~/.claude/cctoast-wsl/show-toast.sh --stop-hook
```

### Claude Code Integration Test
1. Open Claude Code in WSL
2. Start any operation that would trigger notification hooks
3. Verify toast notifications appear on Windows desktop

## Troubleshooting Manual Installation

### Script Permission Issues
```bash
# If script won't execute due to permissions
ls -la ~/.claude/cctoast-wsl/show-toast.sh
# Should show: -r-x------ (500 permissions)

# Fix permissions if needed
chmod 500 ~/.claude/cctoast-wsl/show-toast.sh
```

### PowerShell Module Issues
```bash
# Check PowerShell Gallery connectivity
powershell.exe -Command "Test-Connection -ComputerName 'www.powershellgallery.com' -Count 1"

# Force reinstall BurntToast if needed
powershell.exe -Command "Uninstall-Module BurntToast -Force"
powershell.exe -Command "Install-Module BurntToast -Scope CurrentUser -Force -AllowClobber"
```

### Path Issues
```bash
# Verify absolute paths in Claude settings
cat ~/.claude/settings.json | grep cctoast-wsl

# Test path resolution
ls -la ~/.claude/cctoast-wsl/show-toast.sh

# Use full absolute path if issues persist
realpath ~/.claude/cctoast-wsl/show-toast.sh
```

### WSL Path Conversion Issues
```bash
# Test WSL path conversion
wslpath -w ~/.claude/cctoast-wsl/claude.png
# Should output Windows-style path

# Test with the script
CCTOAST_DEBUG=1 ~/.claude/cctoast-wsl/show-toast.sh --title "Path Test" --image ~/.claude/cctoast-wsl/claude.png
```

## Verification Script

Create a verification script to check installation health:

```bash
# Create verification script
cat > ~/.claude/cctoast-wsl/verify-install.sh << 'EOF'
#!/bin/bash
set -euo pipefail

echo "🔍 Verifying cctoast-wsl installation..."

# Check files exist
if [[ ! -f ~/.claude/cctoast-wsl/show-toast.sh ]]; then
    echo "❌ show-toast.sh not found"
    exit 1
fi

if [[ ! -f ~/.claude/cctoast-wsl/claude.png ]]; then
    echo "❌ claude.png not found"
    exit 1
fi

# Check permissions
if [[ ! -x ~/.claude/cctoast-wsl/show-toast.sh ]]; then
    echo "❌ show-toast.sh not executable"
    exit 1
fi

# Check PowerShell access
if ! command -v powershell.exe >/dev/null; then
    echo "❌ PowerShell not accessible"
    exit 1
fi

# Check BurntToast module
if ! powershell.exe -Command "Get-Module -ListAvailable -Name BurntToast" >/dev/null; then
    echo "❌ BurntToast module not installed"
    exit 1
fi

# Check Claude settings
if [[ ! -f ~/.claude/settings.json ]]; then
    echo "⚠️  No Claude settings.json found"
else
    if grep -q "cctoast-wsl" ~/.claude/settings.json; then
        echo "✅ Claude hooks configured"
    else
        echo "⚠️  cctoast-wsl not found in Claude settings"
    fi
fi

echo "✅ Installation verification complete"
echo "🧪 Testing notification..."

# Test notification
~/.claude/cctoast-wsl/show-toast.sh --title "Verification" --message "cctoast-wsl is working!"

echo "✅ Manual installation successful!"
EOF

chmod +x ~/.claude/cctoast-wsl/verify-install.sh
```

Run verification:
```bash
~/.claude/cctoast-wsl/verify-install.sh
```

## Uninstallation

### Remove Files
```bash
# Remove installation directory
rm -rf ~/.claude/cctoast-wsl
```

### Clean Claude Settings
```bash
# Backup settings
cp ~/.claude/settings.json ~/.claude/settings.json.backup

# Edit to remove cctoast-wsl hooks
nano ~/.claude/settings.json

# Or use sed to remove cctoast-wsl lines
sed -i '/cctoast-wsl/d' ~/.claude/settings.json
```

### Optional: Remove BurntToast Module
```bash
# Only if you don't use BurntToast elsewhere
powershell.exe -Command "Uninstall-Module BurntToast -Force"
```

## Advanced Manual Installation

### Custom Installation Directory
```bash
# Install to custom location
INSTALL_DIR="/custom/path/cctoast-wsl"
mkdir -p "$INSTALL_DIR"

# Download and set up files
curl -o "$INSTALL_DIR/show-toast.sh" \
  https://raw.githubusercontent.com/claudes-world/cctoast-wsl/main/scripts/show-toast.sh

chmod 500 "$INSTALL_DIR/show-toast.sh"

# Update Claude settings with custom path
# Edit ~/.claude/settings.json to use $INSTALL_DIR path
```

### Multi-User Installation
```bash
# System-wide installation (requires admin)
sudo mkdir -p /opt/cctoast-wsl
sudo curl -o /opt/cctoast-wsl/show-toast.sh \
  https://raw.githubusercontent.com/claudes-world/cctoast-wsl/main/scripts/show-toast.sh
sudo chmod 755 /opt/cctoast-wsl/show-toast.sh

# Each user configures their own Claude settings
# pointing to /opt/cctoast-wsl/show-toast.sh
```

### Offline Installation
```bash
# On connected machine, download files
wget https://github.com/claudes-world/cctoast-wsl/archive/main.zip
unzip main.zip

# Transfer cctoast-wsl-main/ to offline machine
# Follow standard installation steps using local files
```

## Security Considerations

> [!WARNING]  
> Security considerations for manual installation

### File Integrity
- Always verify checksums of downloaded files
- Download only from official repository
- Use HTTPS URLs for all downloads

### Permissions  
- Scripts should have 500 permissions (user execute only)
- Never use sudo for hook commands
- Install BurntToast at user scope only

### Path Security
- Use absolute paths in Claude settings
- Install outside project directories
- Verify no symlinks in installation path

## Getting Help

If you encounter issues with manual installation:

1. **Check the [FAQ](FAQ.md)** for common issues
2. **Review [Security Guide](SECURITY.md)** for security considerations  
3. **Run the verification script** to identify specific problems
4. **Check Claude Code logs** for hook execution errors

---

> [!TIP]  
> For most users, automated installation with `npx @claude/cctoast-wsl` is recommended over manual installation