# 🧪 PLEASE TEST: Issue #4 - Dependency Management System

## Environment Requirements
- **WSL2** (preferred) or WSL1 environment 
- **Windows 10/11** with PowerShell
- **Terminal**: Interactive terminal (not CI/automated environment)
- **Permissions**: User-level permissions (no admin required)

## Pre-Test Setup Commands
```bash
# Navigate to project directory
cd /path/to/cctoast-wsl

# Build the CLI (should be already built)
npm run build

# Verify the CLI can execute
./bin/cctoast-wsl --version
```

## Test Cases

### ✅ Test 1: WSL Environment Detection
**Command:** `./bin/cctoast-wsl --json --quiet`
**Expected Behavior:** 
- Should detect WSL1 or WSL2 environment
- JSON output should show WSL environment check as passed
- Should continue to other dependency checks

**Report:** ✅/❌ Did the CLI correctly detect your WSL environment?

### ✅ Test 2: PowerShell Accessibility Check  
**Command:** `powershell.exe -Command "Write-Output test"`
**Expected Behavior:**
- Should output "test" 
- If this fails, PowerShell is not accessible from WSL

**Report:** ✅/❌ Can you execute PowerShell commands from WSL?

### ✅ Test 3: Interactive Dependency Checking
**Command:** `./bin/cctoast-wsl`
**Expected Behavior:**
- Should show "🔍 Checking system dependencies..." 
- Should display checkmarks (✅) for passed checks
- Should display warnings (⚠️) for non-fatal issues  
- Should display errors (❌) for fatal issues
- Should proceed through interactive prompts after dependency checks

**Report:** ✅/❌ Did the dependency checking display correctly with proper icons?

### ✅ Test 4: BurntToast Auto-Installation (if BurntToast is missing)
**Command:** `./bin/cctoast-wsl --force`
**Expected Behavior:**
- If BurntToast is missing, should offer auto-installation
- Should prompt: "Would you like to automatically install BurntToast PowerShell module?"
- If you choose "yes", should attempt installation
- Should verify installation success

**Report:** ✅/❌ Did BurntToast auto-installation work? (Skip if already installed)

### ✅ Test 5: PowerShell Execution Policy Warning
**Command:** `powershell.exe -Command "Get-ExecutionPolicy"`
**Expected Behavior:**
- Should display current execution policy
- CLI should warn if policy is "Restricted" or "AllSigned"
- Should suggest remedy: "Set-ExecutionPolicy -Scope CurrentUser RemoteSigned"

**Report:** ✅/❌ Did the CLI properly handle execution policy checking?

### ✅ Test 6: Force Flag Behavior
**Command:** `./bin/cctoast-wsl --force --json`
**Expected Behavior:**
- Should bypass non-fatal dependency failures
- Should still fail on BurntToast if missing (fatal but auto-installable)
- JSON output should reflect force flag in settings

**Report:** ✅/❌ Did the --force flag work as expected?

### ✅ Test 7: Caching System
**Command:** Run `./bin/cctoast-wsl --json` twice in succession
**Expected Behavior:**
- First run: Should perform all dependency checks
- Second run: Should be noticeably faster (using cache)
- Cache file should exist at `~/.cache/cctoast-wsl/checks.json`

**Report:** ✅/❌ Did the second run execute faster due to caching?

### ✅ Test 8: Error Handling - Ctrl+C During BurntToast Install
**Command:** `./bin/cctoast-wsl` (if BurntToast missing), then press Ctrl+C during installation
**Expected Behavior:**
- Should handle Ctrl+C gracefully
- Should display "Operation cancelled by user"  
- Should exit with code 1

**Report:** ✅/❌ Did Ctrl+C handling work correctly?

## Visual Quality Assessment

### Overall CLI Presentation
- **Icons**: Are dependency check icons (✅⚠️❌🔍🤖) displaying correctly?
- **Formatting**: Is the output well-formatted and readable?
- **Colors**: Are there appropriate colors/styling for different message types?
- **Progress**: Does the dependency checking feel responsive?

**Report:** Rate visual quality 1-5 (5 = excellent): ___

### Interactive Experience  
- **Prompts**: Are interactive prompts clear and intuitive?
- **Flow**: Does the dependency → configuration → installation flow make sense?
- **Feedback**: Is there clear feedback for each step?

**Report:** Rate interactive experience 1-5 (5 = excellent): ___

## Reporting Results

Please test each case above and report results as:

```
Test 1: ✅ (or ❌ with description of issue)
Test 2: ✅ 
Test 3: ❌ - PowerShell execution failed with error: [error details]
...etc
```

### If You Find Issues:
1. **Copy the exact error message** 
2. **Note your environment**: WSL version, Windows version, PowerShell version
3. **Describe what you expected vs what happened**

### Quick Test Summary:
- **Total Tests**: 8
- **Passed**: ___/8  
- **Visual Quality**: ___/5
- **Interactive Experience**: ___/5
- **Overall Assessment**: Ready for milestone closure? Yes/No

## Additional Notes

- The CLI should handle missing BurntToast gracefully with auto-install
- Dependency checks should complete in under 10 seconds total
- The caching system should make subsequent runs much faster  
- All user interactions should be cancellable with Ctrl+C

Thank you for helping validate Milestone 3! 🙏