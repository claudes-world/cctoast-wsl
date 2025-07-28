# 🧪 PLEASE TEST: Issue #11 - WSL to Windows Path Conversion System

## Environment Requirements
- **WSL2** (Ubuntu or similar distribution)
- **Windows 10/11** with PowerShell
- **BurntToast PowerShell module** installed
- **Interactive terminal** (not CI environment)

## Pre-Test Setup Commands
```bash
# Navigate to the worktree directory
cd worktree-issue11

# Ensure BurntToast is installed (if not already)
powershell.exe -Command "Install-Module BurntToast -Scope CurrentUser -Force"

# Create test files with special characters
mkdir -p "/tmp/test path with spaces"
touch "/tmp/test path with spaces/test'quote.png"
echo "test content" > "/tmp/test with unicode 测试.txt"

# Make script executable
chmod +x scripts/show-toast.sh
```

## Test Cases

### ✅ Test 1: Basic Path Conversion
**Command:** 
```bash
CCTOAST_DEBUG=1 ./scripts/show-toast.sh --title "Basic Test" --message "Testing basic path conversion" --image "./assets/claude.png"
```
**Expected Behavior:** 
- Should show debug output with path conversion
- Should convert `./assets/claude.png` to Windows format like `\\wsl.localhost\Ubuntu\...\assets\claude.png`
- Should display Windows toast notification with Claude icon
- No errors in output

**Report:** ✅/❌ Does the path convert correctly and show toast notification?

### ✅ Test 2: Paths with Spaces and Special Characters  
**Command:**
```bash
CCTOAST_DEBUG=1 ./scripts/show-toast.sh --title "Special Test" --message "Testing paths with spaces" --image "/tmp/test path with spaces/test'quote.png"
```
**Expected Behavior:**
- Should handle spaces in path correctly
- Should escape single quote properly (becomes double quote in debug output)
- Should show successful path conversion in debug
- Toast notification should appear (may not show custom icon if file doesn't exist as valid image)

**Report:** ✅/❌ Are spaces and quotes handled correctly in debug output?

### ✅ Test 3: Path Caching Performance
Run this command **twice**:
```bash
CCTOAST_DEBUG=1 ./scripts/show-toast.sh --title "Cache Test $RANDOM" --message "Testing cache performance" --image "./assets/claude.png"
```
**Expected Behavior:**
- **First run**: Should show "Converting path" and "Successfully converted" in debug
- **Second run**: Should show "Using cached path conversion" in debug (faster execution)
- Both runs should work correctly

**Report:** ✅/❌ Does the second run show cache usage and execute faster?

### ✅ Test 4: PowerShell Escaping
**Command:**
```bash
CCTOAST_DEBUG=1 ./scripts/show-toast.sh --title "Test with 'single quotes'" --message "Test & special $ chars @" --image "./assets/claude.png"
```
**Expected Behavior:**
- Debug should show single quotes doubled: `Test with ''single quotes''`
- Special characters (&, $, @) should pass through safely
- Toast notification should display correctly with all characters

**Report:** ✅/❌ Are quotes properly escaped and special chars handled?

### ✅ Test 5: Windows Path Format Detection
**Command:**
```bash
CCTOAST_DEBUG=1 ./scripts/show-toast.sh --title "Windows Path" --message "Testing Windows format" --image "C:\\Windows\\System32\\imageres.dll"
```
**Expected Behavior:**
- Debug should show "Path already in Windows format"
- Should NOT attempt wslpath conversion
- May not show toast icon (file may not be valid image) but should not error

**Report:** ✅/❌ Does it correctly detect and skip conversion for Windows paths?

### ✅ Test 6: Hook Mode Testing
**Command:**
```bash
# Test notification hook mode with JSON message
echo '{"message": "Test notification from JSON"}' | ./scripts/show-toast.sh --notification-hook

# Test stop hook mode with JSON message
echo '{"message": "Test completion from JSON"}' | ./scripts/show-toast.sh --stop-hook

# Test notification hook mode without JSON (should use defaults)
echo '' | ./scripts/show-toast.sh --notification-hook

# Test stop hook mode without JSON (should use defaults)  
echo '' | ./scripts/show-toast.sh --stop-hook
```
**Expected Behavior:**
- First two commands should show toast notifications with custom messages from JSON
- Notification hook with JSON: "Claude Code" / "Test notification from JSON"
- Stop hook with JSON: "Claude Code" / "Test completion from JSON"
- Last two commands should show toast notifications with default messages
- Notification hook without JSON: "Claude Code" / "Waiting for your response"
- Stop hook without JSON: "Claude Code" / "Task completed"
- All should execute quickly without hanging

**Report:** ✅/❌ Do both hook modes work correctly?

### ✅ Test 7: Error Handling and Fallback
**Command:**
```bash
CCTOAST_DEBUG=1 ./scripts/show-toast.sh --title "Error Test" --message "Testing error handling" --image "/nonexistent/path.png"
```
**Expected Behavior:**
- Should show warning about image not found
- Should fall back to default icon (if available)
- Should still display toast notification successfully
- Should log error to `~/.claude/cctoast-wsl/toast-error.log`

**Report:** ✅/❌ Does error handling work gracefully with proper fallback?

### ✅ Test 8: Cache File Validation
**Command:**
```bash
# After running previous tests, check cache
cat ~/.cache/cctoast-wsl/path-cache.txt
ls -la ~/.cache/cctoast-wsl/
```
**Expected Behavior:**
- Cache file should exist and contain path mappings
- Format should be: `WSL_PATH|WINDOWS_PATH|TIMESTAMP`
- Should show multiple cached entries from previous tests
- File should be readable and properly formatted

**Report:** ✅/❌ Is the cache file properly created and formatted?

## Performance Validation

### ✅ Test 9: Performance Benchmark
**Commands:**
```bash
# Measure uncached performance
rm ~/.cache/cctoast-wsl/path-cache.txt 2>/dev/null || true
time ./scripts/show-toast.sh --title "Perf Test 1" --message "Uncached" --image "./assets/claude.png"

# Measure cached performance  
time ./scripts/show-toast.sh --title "Perf Test 2" --message "Cached" --image "./assets/claude.png"
```
**Expected Behavior:**
- First run should take longer (path conversion + PowerShell execution)
- Second run should be noticeably faster (cached path)
- Both should complete well under 100ms for path conversion portion
- Toast notifications should appear for both

**Report:** ✅/❌ Is cached execution noticeably faster than uncached?

## Visual Quality Assessment

### ✅ Test 10: Toast Notification Quality
After running the tests above, evaluate the toast notifications:

**Visual Elements to Check:**
- Toast notifications appear in Windows notification area
- Title and message text display correctly
- Claude icon appears when using default icon
- Notifications don't stack up excessively
- Text is readable and properly formatted

**Report:** ✅/❌ Do the toast notifications look professional and display correctly?

## Environment-Specific Testing

### ✅ Test 11: WSL Version Compatibility
**Commands:**
```bash
# Check WSL version
wsl.exe --version || wsl.exe -l -v

# Test path conversion in your specific WSL environment
CCTOAST_DEBUG=1 ./scripts/show-toast.sh --title "WSL Environment Test" --message "Path conversion test in WSL2" --image "./assets/claude.png"
```
**Expected Behavior:**
- Should work regardless of WSL1 or WSL2
- Path conversion should succeed in your specific WSL environment
- Debug output should show successful conversion

**Report:** ✅/❌ Does it work correctly in your WSL environment?

## Final Integration Test

### ✅ Test 12: End-to-End Integration
**Commands:**
```bash
# Test the complete hook integration workflow
echo "Testing complete integration..." 

# Multiple rapid calls (simulate real usage)
for i in {1..3}; do
  ./scripts/show-toast.sh --title "Integration Test $i" --message "Rapid fire test" --image "./assets/claude.png" &
done
wait

echo "Integration test complete"
```
**Expected Behavior:**
- All 3 notifications should appear
- No race conditions or crashes
- Cache should handle concurrent access gracefully
- System should remain stable

**Report:** ✅/❌ Does the system handle multiple rapid notifications correctly?

## Reporting Results

Please respond to the issue comment with your test results using this format:

```markdown
## 🧪 Manual Testing Results for Issue #11

**Environment:** WSL2 Ubuntu 22.04, Windows 11, PowerShell 7.x

**Test Results:**
- Test 1 (Basic Path Conversion): ✅/❌ [notes]  
- Test 2 (Special Characters): ✅/❌ [notes]
- Test 3 (Path Caching): ✅/❌ [notes]
- Test 4 (PowerShell Escaping): ✅/❌ [notes]
- Test 5 (Windows Path Detection): ✅/❌ [notes]
- Test 6 (Hook Modes): ✅/❌ [notes]
- Test 7 (Error Handling): ✅/❌ [notes]
- Test 8 (Cache Validation): ✅/❌ [notes]
- Test 9 (Performance): ✅/❌ [notes]
- Test 10 (Visual Quality): ✅/❌ [notes]
- Test 11 (WSL Compatibility): ✅/❌ [notes]
- Test 12 (Integration): ✅/❌ [notes]

**Overall Assessment:** ✅ Ready for merge / ❌ Issues found

**Notes:** [Any additional observations or issues encountered]
```

## Cleanup After Testing
```bash
# Remove test files
rm -rf "/tmp/test path with spaces"
rm "/tmp/test with unicode 测试.txt" 2>/dev/null || true

# Optional: Clear cache for clean state
# rm ~/.cache/cctoast-wsl/path-cache.txt
```

---

**Estimated Testing Time:** 15-20 minutes  
**Focus Areas:** Path conversion accuracy, PowerShell escaping, caching performance, error handling