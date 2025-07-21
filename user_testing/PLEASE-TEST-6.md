# 🧪 PLEASE TEST: Issue #6 - Runtime Components (Milestone 5)

## Environment Requirements
- WSL2 (Windows Subsystem for Linux)
- Windows 10/11 with PowerShell available
- BurntToast module installed in PowerShell (or ready to install)
- Interactive terminal for testing

## Pre-Test Setup Commands

```bash
# Navigate to the worktree directory
cd worktree-issue6

# Verify script permissions
ls -la scripts/show-toast.sh
# Should show: -r-x------ (0o500 permissions)

# Create test directory for icon
mkdir -p test-assets
echo "test" > test-assets/test-icon.png  # Create a dummy file for path testing
```

## Test Cases

### ✅ Test 1: Basic Help Output
**Command:** `./scripts/show-toast.sh --help`
**Expected Behavior:** 
- Should display comprehensive help with hook modes, manual options, and examples
- Clean formatting with proper usage information
- Exit cleanly with status 0

**Report:** ✅/❌ Does help output display correctly and comprehensively?

### ✅ Test 2: Notification Hook Mode
**Command:** `./scripts/show-toast.sh --notification-hook`
**Expected Behavior:**
- Should display Windows toast notification with title "Claude Code"
- Message should be "Waiting for your response"
- Should complete within 2 seconds
- Should exit with status 0 (even if BurntToast fails)

**Report:** ✅/❌ Does notification hook display correct toast within 2 seconds?

### ✅ Test 3: Stop Hook Mode
**Command:** `./scripts/show-toast.sh --stop-hook`
**Expected Behavior:**
- Should display Windows toast notification with title "Claude Code"
- Message should be "Task completed"
- Should complete within 2 seconds
- Should exit with status 0 (even if BurntToast fails)

**Report:** ✅/❌ Does stop hook display correct completion toast within 2 seconds?

### ✅ Test 4: Manual Notification with Custom Text
**Command:** `./scripts/show-toast.sh --title "Custom Test" --message "This is a manual test notification"`
**Expected Behavior:**
- Should display Windows toast with custom title and message
- Should use default icon (even if not present)
- Should complete successfully

**Report:** ✅/❌ Does manual notification display custom text correctly?

### ✅ Test 5: Special Character Handling
**Command:** `./scripts/show-toast.sh --title "Test with 'quotes'" --message "Message with \"double quotes\" & symbols"`
**Expected Behavior:**
- Should handle special characters (quotes, ampersands) without errors
- Toast should display the text with proper escaping
- Should not cause PowerShell syntax errors

**Report:** ✅/❌ Are special characters handled correctly without errors?

### ✅ Test 6: Path Conversion Testing
**Command:** `./scripts/show-toast.sh --title "Path Test" --message "Testing WSL path conversion" --image test-assets/test-icon.png`
**Expected Behavior:**
- Should convert WSL path to Windows path using wslpath
- Should display notification (may show warning about missing icon)
- Should not crash on path conversion

**Report:** ✅/❌ Does WSL to Windows path conversion work without crashing?

### ✅ Test 7: Missing File Handling
**Command:** `./scripts/show-toast.sh --title "Missing File Test" --image /nonexistent/file.png --message "Should fallback gracefully"`
**Expected Behavior:**
- Should log error about missing file
- Should continue execution and display notification
- Should use default icon as fallback
- Should not crash the script

**Report:** ✅/❌ Does script handle missing image files gracefully?

### ✅ Test 8: Rapid Successive Calls
**Commands:**
```bash
for i in {1..5}; do ./scripts/show-toast.sh --title "Rapid Test $i" --message "Testing rapid calls" & done; wait
```
**Expected Behavior:**
- Should execute all 5 notifications concurrently
- Should not interfere with each other
- All should complete without errors
- Should demonstrate non-blocking execution

**Report:** ✅/❌ Do rapid successive calls execute correctly without conflicts?

### ✅ Test 9: Error Handling and Logging
**Command:** `./scripts/show-toast.sh --unknown-option`
**Expected Behavior:**
- Should display error message about unknown option
- Should show usage hint
- Should exit with status 1
- Should log error if applicable

**Report:** ✅/❌ Does error handling work correctly for invalid options?

### ✅ Test 10: PowerShell Integration (If BurntToast Not Installed)
**Pre-condition:** Temporarily uninstall or disable BurntToast module
**Command:** `./scripts/show-toast.sh --notification-hook`
**Expected Behavior:**
- Should attempt to import BurntToast
- Should handle module not found gracefully
- Should log error to `~/.claude/cctoast-wsl/toast-error.log`
- Should exit with status 0 (silent failure for hook mode)

**Report:** ✅/❌ Does script handle missing BurntToast module gracefully?

## Performance Assessment

### Visual Quality
**Assess:** Do the Windows toast notifications appear with proper:
- Title and message text display
- Formatting and readability
- Professional appearance
- Consistent behavior

**Report:** ✅/❌ Do notifications have good visual quality?

### Performance Timing
**Assess:** Time the execution of several test commands
- Hook modes should complete in <2 seconds
- Manual notifications should be responsive
- No noticeable delays or hanging

**Report:** ✅/❌ Does performance meet the <2 second requirement?

## Error Log Verification

After running tests, check if error log was created:
```bash
# Check if error log exists (only created on first error)
ls -la ~/.claude/cctoast-wsl/toast-error.log

# View errors if log exists
cat ~/.claude/cctoast-wsl/toast-error.log
```

**Report:** ✅/❌ Does error logging work correctly (creates log only when needed)?

## BurntToast Module Status

Please report your BurntToast module status:
```bash
# Check BurntToast availability
powershell.exe -Command "Get-Module -ListAvailable -Name BurntToast"
```

**BurntToast Status:** [Installed/Not Installed/Version X.X.X]

## Overall Assessment

### Summary Results
- Total Tests Passed: ___/10
- Performance Acceptable: ✅/❌
- Visual Quality Good: ✅/❌
- Error Handling Robust: ✅/❌

### Any Issues Found
[Describe any problems, unexpected behavior, or suggestions]

### Environment Details
- WSL Version: [WSL1/WSL2]
- Windows Version: [10/11 + build]
- PowerShell Version: [5.1/7.x]
- Terminal Used: [Windows Terminal/CMD/Other]

## Reporting Results

Please copy this completed test report and paste it as a comment on Issue #6:
https://github.com/claudes-world/cctoast-wsl/issues/6

**Thank you for helping validate this milestone!** 🙏