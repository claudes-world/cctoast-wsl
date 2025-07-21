# Frequently Asked Questions

This FAQ covers the most common issues users encounter when installing and using cctoast-wsl. Solutions are provided in step-by-step format for easy troubleshooting.

## Installation Issues

### ❌ Problem: "PowerShell execution policy" error during installation

**Symptom**: Installation fails with error about execution policy being restricted

**Solution**:
1. Check current execution policy:
   ```bash
   powershell.exe -Command "Get-ExecutionPolicy -List"
   ```
2. Set execution policy for current user (no admin required):
   ```bash
   powershell.exe -Command "Set-ExecutionPolicy -Scope CurrentUser RemoteSigned"
   ```
3. Retry installation:
   ```bash
   npx @claude/cctoast-wsl
   ```

**Why this works**: Sets execution policy only for your user account, avoiding the need for administrator privileges.

---

### ❌ Problem: "BurntToast module not found" error

**Symptom**: Installation succeeds but notifications fail with module not found error

**Solution**:
1. Check if BurntToast is installed:
   ```bash
   powershell.exe -Command "Get-Module -ListAvailable -Name BurntToast"
   ```
2. Install BurntToast manually:
   ```bash
   powershell.exe -Command "Install-Module BurntToast -Scope CurrentUser -Force"
   ```
3. Verify installation:
   ```bash
   powershell.exe -Command "Import-Module BurntToast; Get-Module BurntToast"
   ```
4. Test notification:
   ```bash
   ~/.claude/cctoast-wsl/show-toast.sh --title "Test" --message "BurntToast working"
   ```

**Why this works**: BurntToast auto-installation may fail due to network issues or PowerShell Gallery connectivity. Manual installation bypasses these issues.

---

### ❌ Problem: "Permission denied" when running script

**Symptom**: Hook execution fails with permission denied error

**Solution**:
1. Check script permissions:
   ```bash
   ls -la ~/.claude/cctoast-wsl/show-toast.sh
   ```
2. Fix permissions if needed:
   ```bash
   chmod 500 ~/.claude/cctoast-wsl/show-toast.sh
   ```
3. Verify you're not using sudo:
   ```bash
   # ❌ Wrong:
   sudo ~/.claude/cctoast-wsl/show-toast.sh
   
   # ✅ Correct:
   ~/.claude/cctoast-wsl/show-toast.sh --title "Test"
   ```

**Why this works**: The script needs execute permissions for the user, but should never be run as root for security reasons.

---

### ❌ Problem: Installation hangs during BurntToast auto-installation

**Symptom**: Installation stops responding during "Installing BurntToast module..." step

**Solution**:
1. Cancel the installation (Ctrl+C)
2. Install BurntToast manually first:
   ```bash
   powershell.exe -Command "Install-Module BurntToast -Scope CurrentUser -Force"
   ```
3. Retry cctoast-wsl installation:
   ```bash
   npx @claude/cctoast-wsl
   ```

**Alternative**: Use force flag to skip auto-installation:
```bash
npx @claude/cctoast-wsl --force
```

**Why this works**: PowerShell Gallery connectivity issues can cause hangs. Manual installation gives you more control over the process.

---

## Runtime Issues

### ❌ Problem: No toast notifications appearing

**Symptom**: Installation succeeded but no notifications show when Claude Code runs

**Solution**:
1. Verify you're in WSL:
   ```bash
   echo $WSL_DISTRO_NAME
   # Should output your distro name
   ```
2. Test script directly:
   ```bash
   ~/.claude/cctoast-wsl/show-toast.sh --title "Manual Test" --message "Testing notifications"
   ```
3. Check Claude Code settings:
   ```bash
   cat ~/.claude/settings.json | grep cctoast-wsl
   ```
4. Verify hook paths are absolute:
   ```json
   {
     "hooks": {
       "notification": ["/home/username/.claude/cctoast-wsl/show-toast.sh --notification-hook"]
     }
   }
   ```
5. Check error logs:
   ```bash
   cat ~/.claude/cctoast-wsl/toast-error.log
   ```

**Why this works**: Systematically tests each component to isolate where the failure occurs.

---

### ❌ Problem: Notifications appear but without custom icon

**Symptom**: Toast notifications work but show default Windows icon instead of Claude icon

**Solution**:
1. Check if icon file exists:
   ```bash
   ls -la ~/.claude/cctoast-wsl/claude.png
   ```
2. Test with explicit icon path:
   ```bash
   ~/.claude/cctoast-wsl/show-toast.sh --title "Icon Test" --message "Testing icon" --image ~/.claude/cctoast-wsl/claude.png
   ```
3. Verify WSL path conversion:
   ```bash
   wslpath -w ~/.claude/cctoast-wsl/claude.png
   # Should output Windows-style path
   ```
4. Download icon if missing:
   ```bash
   curl -o ~/.claude/cctoast-wsl/claude.png \
     https://raw.githubusercontent.com/claudes-world/cctoast-wsl/main/assets/claude.png
   ```

**Why this works**: Icon display depends on correct file paths and WSL-to-Windows path conversion.

---

### ❌ Problem: Multiple duplicate notifications

**Symptom**: Single Claude Code action triggers multiple identical toast notifications

**Solution**:
1. Check for duplicate hooks in settings:
   ```bash
   cat ~/.claude/settings.json | grep -A 10 -B 10 cctoast-wsl
   ```
2. Remove duplicate entries:
   ```bash
   # Edit settings to have only one cctoast-wsl hook per type
   nano ~/.claude/settings.json
   ```
3. Check for multiple installation locations:
   ```bash
   find /home -name "show-toast.sh" 2>/dev/null
   # Should only show ~/.claude/cctoast-wsl/show-toast.sh
   ```

**Why this works**: Multiple hook entries or installations can cause the same notification to fire multiple times.

---

## Configuration Issues

### ❌ Problem: Hooks work globally but not in specific projects

**Symptom**: Notifications work in some directories but not others

**Solution**:
1. Check for local Claude settings:
   ```bash
   ls -la .claude/settings*
   ```
2. If local settings exist, verify they include hooks:
   ```bash
   cat .claude/settings.local.json
   ```
3. Either add hooks to local settings or remove local settings to use global:
   ```bash
   # Option 1: Add hooks to local settings
   nano .claude/settings.local.json
   
   # Option 2: Remove local settings to use global
   rm .claude/settings.local.json
   ```

**Why this works**: Local settings override global settings. Projects with local settings need their own hook configuration.

---

### ❌ Problem: "Command not found" error in hooks

**Symptom**: Claude Code shows "command not found" error for cctoast-wsl

**Solution**:
1. Verify the hook uses absolute path:
   ```bash
   grep cctoast-wsl ~/.claude/settings.json
   # Should show full path like /home/username/.claude/cctoast-wsl/show-toast.sh
   ```
2. Fix relative paths:
   ```json
   {
     "hooks": {
       "notification": [
         "/home/username/.claude/cctoast-wsl/show-toast.sh --notification-hook"
       ]
     }
   }
   ```
3. Test the exact command from settings:
   ```bash
   /home/username/.claude/cctoast-wsl/show-toast.sh --notification-hook
   ```

**Why this works**: Hook commands run in different working directories, so absolute paths are required.

---

### ❌ Problem: Notifications stop working after Windows update

**Symptom**: Notifications worked before but stopped after Windows or WSL update

**Solution**:
1. Check PowerShell access:
   ```bash
   which powershell.exe
   ```
2. Test BurntToast module:
   ```bash
   powershell.exe -Command "Import-Module BurntToast; Get-Module BurntToast"
   ```
3. Re-run dependency checks:
   ```bash
   npx @claude/cctoast-wsl --dry-run
   ```
4. If BurntToast missing, reinstall:
   ```bash
   powershell.exe -Command "Install-Module BurntToast -Scope CurrentUser -Force"
   ```
5. Check execution policy again:
   ```bash
   powershell.exe -Command "Get-ExecutionPolicy -Scope CurrentUser"
   ```

**Why this works**: Windows updates can reset PowerShell configuration or module locations.

---

## Advanced Troubleshooting

### 🔧 Problem: Need to debug script execution

**Symptom**: Notifications not working and need detailed debugging information

**Solution**:
1. Enable debug mode:
   ```bash
   CCTOAST_DEBUG=1 ~/.claude/cctoast-wsl/show-toast.sh --title "Debug Test" --message "Testing with debug"
   ```
2. Check detailed PowerShell output:
   ```bash
   # Run PowerShell command manually
   powershell.exe -NoProfile -Command "
     try {
       Import-Module BurntToast -ErrorAction Stop
       New-BurntToastNotification -Text 'Debug','Test'
       Write-Host 'SUCCESS: Notification sent'
     } catch {
       Write-Host 'ERROR:' $_.Exception.Message
     }
   "
   ```
3. Test individual components:
   ```bash
   # Test WSL detection
   echo "WSL_DISTRO_NAME: $WSL_DISTRO_NAME"
   
   # Test path conversion
   wslpath -w ~/.claude/cctoast-wsl/claude.png
   
   # Test timeout command
   timeout 5s echo "Timeout test"
   ```

**Why this works**: Debug mode reveals the exact commands being executed and their output.

---

### 🔧 Problem: PowerShell Gallery connectivity issues

**Symptom**: Cannot install BurntToast due to network/proxy issues

**Solution**:
1. Test PowerShell Gallery connectivity:
   ```bash
   powershell.exe -Command "Test-Connection -ComputerName 'www.powershellgallery.com' -Count 1"
   ```
2. If behind corporate proxy, configure PowerShell:
   ```bash
   powershell.exe -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12"
   ```
3. Alternative: Download and install BurntToast manually
4. Use manual installation method instead:
   ```bash
   # Follow manual installation guide
   curl -o ~/.claude/cctoast-wsl/show-toast.sh \
     https://raw.githubusercontent.com/claudes-world/cctoast-wsl/main/scripts/show-toast.sh
   ```

**Why this works**: Corporate networks often block PowerShell Gallery. Manual methods bypass these restrictions.

---

### 🔧 Problem: Script permissions reset after each reboot

**Symptom**: Need to re-run `chmod 500` after every system restart

**Solution**:
1. Check if using Windows filesystem (avoid):
   ```bash
   df ~/.claude/cctoast-wsl/
   # Should show WSL filesystem, not /mnt/c/...
   ```
2. If on Windows filesystem, move to WSL filesystem:
   ```bash
   mkdir -p ~/.claude/cctoast-wsl-backup
   cp /mnt/c/path/to/cctoast-wsl/* ~/.claude/cctoast-wsl-backup/
   rm -rf /mnt/c/path/to/cctoast-wsl
   mv ~/.claude/cctoast-wsl-backup ~/.claude/cctoast-wsl
   chmod 500 ~/.claude/cctoast-wsl/show-toast.sh
   ```
3. Update Claude settings with new path

**Why this works**: Windows filesystems don't preserve Unix permissions properly. WSL filesystems maintain correct permissions.

---

## Getting More Help

### When FAQ doesn't help

If your issue isn't covered here:

1. **Check error logs**:
   ```bash
   cat ~/.claude/cctoast-wsl/toast-error.log
   ```

2. **Run verification**:
   ```bash
   npx @claude/cctoast-wsl --dry-run
   ```

3. **Review documentation**:
   - [Manual Installation](MANUAL.md) for detailed setup
   - [Security Guide](SECURITY.md) for permission issues
   - [Advanced Usage](ADVANCED.md) for customization

4. **Check GitHub issues**:
   - Search existing issues: https://github.com/claudes-world/cctoast-wsl/issues
   - Create new issue if needed

### Issue reporting template

When creating a GitHub issue, include:

```bash
# System information
echo "WSL Version: $(cat /proc/version)"
echo "PowerShell Version: $(powershell.exe -Command '$PSVersionTable.PSVersion')"
echo "BurntToast Status: $(powershell.exe -Command 'Get-Module -ListAvailable -Name BurntToast')"

# Configuration
echo "Hook Configuration:"
cat ~/.claude/settings.json | grep -A 5 -B 5 cctoast

# Error logs
echo "Error Logs:"
cat ~/.claude/cctoast-wsl/toast-error.log

# Test results
echo "Direct Test:"
~/.claude/cctoast-wsl/show-toast.sh --title "GitHub Issue" --message "Test for issue reporting"
```

---

> [!TIP]  
> Most issues are resolved by ensuring BurntToast is properly installed and PowerShell execution policy is set correctly

## Quick Reference

### Essential commands
```bash
# Test installation
~/.claude/cctoast-wsl/show-toast.sh --title "Test" --message "Working"

# Check BurntToast
powershell.exe -Command "Get-Module -ListAvailable -Name BurntToast"

# Fix execution policy
powershell.exe -Command "Set-ExecutionPolicy -Scope CurrentUser RemoteSigned"

# Reinstall BurntToast
powershell.exe -Command "Install-Module BurntToast -Scope CurrentUser -Force"

# View error logs
cat ~/.claude/cctoast-wsl/toast-error.log

# Verify Claude settings
cat ~/.claude/settings.json | grep cctoast-wsl
```