# 🧪 PLEASE TEST: Issue #3 - Interactive CLI Mode

**Milestone**: Core CLI Framework  
**Issue**: https://github.com/claudes-world/cctoast-wsl/issues/3  
**Features**: Interactive prompts, TTY detection, signal handling  
**Status**: ⏳ Awaiting User Validation

## Why This Testing is Required

The Claude Code environment cannot fully test interactive terminal features like:
- TTY detection and automatic interactive mode triggering
- Real arrow key navigation and spacebar selection
- Signal handling (Ctrl+C cancellation)
- Color output and modern prompt styling
- Cross-platform terminal compatibility

## Environment Requirements

- **WSL Environment**: Must be running inside WSL (Windows Subsystem for Linux)
- **Interactive Terminal**: Windows Terminal, VS Code integrated terminal, or similar
- **Not in CI/Pipeline**: Real terminal session where you can interact

## Pre-Test Setup

1. Ensure you're in the project directory:
   ```bash
   cd /path/to/cctoast-wsl
   ```

2. Build the latest version:
   ```bash
   npm run build
   ```

3. Verify the CLI executable exists:
   ```bash
   ls -la bin/cctoast-wsl
   # Should show executable permissions (-rwxr-xr-x)
   ```

## Test Cases

### ✅ Test 1: Interactive Mode Activation

**Command:**
```bash
./bin/cctoast-wsl
```

**Expected Behavior:**
- Should detect TTY and enter interactive mode automatically
- Display intro message with 🍞 emoji: "cctoast-wsl Installation"
- Show first prompt for installation scope

**Report:** ✅/❌ Interactive mode activated correctly?

---

### ✅ Test 2: Scope Selection

**Instructions:**
1. Run `./bin/cctoast-wsl`
2. You should see: "Choose installation scope:"
3. Use **arrow keys** to navigate between "Global" and "Local"
4. Notice the helpful hints for each option
5. Press **Enter** to select "Global"

**Expected Behavior:**
- Smooth arrow key navigation
- Visual highlighting of selected option
- Helpful hints showing installation paths
- Clean transition to next prompt

**Report:** ✅/❌ Scope selection works smoothly?

---

### ✅ Test 3: Multi-Select Hook Configuration

**Instructions:**
1. After scope selection, you should see: "Select hooks to enable:"
2. Use **arrow keys** to navigate between options
3. Use **spacebar** to toggle selection (both should be pre-selected)
4. Try deselecting both hooks (should show required validation error)
5. Re-select at least one hook and press **Enter**

**Expected Behavior:**
- Both "Notification hook" and "Stop hook" start selected
- Spacebar toggles checkmarks correctly
- Cannot proceed with zero hooks selected
- Helpful hints explain what each hook does

**Report:** ✅/❌ Multi-select works correctly? Any validation issues?

---

### ✅ Test 4: Conditional Sync Prompt

**Instructions:**
1. Run `./bin/cctoast-wsl` again
2. This time select "Local" for scope
3. You should see an additional prompt: "Modify tracked settings.json instead of settings.local.json?"
4. Select your preference (default is No)

**Expected Behavior:**
- Sync prompt only appears when Local scope is selected
- Clear explanation of the choice
- Default selection is "No"

**Report:** ✅/❌ Sync prompt appears only for local install?

---

### ✅ Test 5: Configuration Summary

**Instructions:**
1. Continue through any interactive flow
2. You should see a "Configuration summary:" section
3. Review the bullet-pointed summary
4. Look for the final confirmation: "Proceed with installation?"

**Expected Behavior:**
- Clean bullet points (• symbol) showing your selections
- Accurate reflection of choices made
- Clear final confirmation prompt
- Default selection is "Yes"

**Report:** ✅/❌ Summary displays correctly and reflects your choices?

---

### ✅ Test 6: Successful Completion

**Instructions:**
1. Confirm the installation in previous test
2. Should see outro message with 🎉 emoji: "Ready to install!"
3. Then placeholder message about installation logic coming in Milestone 4

**Expected Behavior:**
- Clean completion with celebration emoji
- Informative message about current implementation status
- Exit with success (no errors)

**Report:** ✅/❌ Completion flow works smoothly?

---

### ✅ Test 7: Cancellation Handling

**Instructions:**
Test Ctrl+C at different stages:

1. Run `./bin/cctoast-wsl` and press **Ctrl+C** during scope selection
2. Run again, proceed to hook selection, then press **Ctrl+C**
3. Run again, proceed to final confirmation, then press **Ctrl+C**

**Expected Behavior:**
- Each Ctrl+C should show: "Operation cancelled by user" 
- Clean exit without errors or broken state
- Return to command prompt immediately

**Report:** ✅/❌ Cancellation works cleanly at all stages?

---

### ✅ Test 8: Non-Interactive Fallbacks

**Instructions:**
Test that explicit flags bypass interactive mode:

1. `./bin/cctoast-wsl --local --json`
2. `./bin/cctoast-wsl --quiet`
3. `echo "" | ./bin/cctoast-wsl` (piped input)

**Expected Behavior:**
- No interactive prompts should appear
- Should use command-line flags or defaults
- Output should be immediate (JSON for first command)

**Report:** ✅/❌ Non-interactive mode works when expected?

---

### ✅ Test 9: Help and Version

**Instructions:**
1. `./bin/cctoast-wsl --help`
2. `./bin/cctoast-wsl --version`
3. `./bin/cctoast-wsl --print-instructions`

**Expected Behavior:**
- Comprehensive help text with all flags
- Version number display (0.0.1)
- Usage instructions with examples

**Report:** ✅/❌ Help/version commands work correctly?

---

### ✅ Test 10: Error Cases

**Instructions:**
1. `./bin/cctoast-wsl --no-notification --no-stop`
2. Check exit code: `echo $?`

**Expected Behavior:**
- Error message: "At least one hook must be enabled"
- Exit code should be 1 (user abort)

**Report:** ✅/❌ Error handling works with correct exit codes?

---

## Visual Quality Assessment

Please also comment on:

1. **Modern UI**: Do the prompts look polished and professional?
2. **Colors**: Are colors used appropriately (if your terminal supports them)?
3. **Spacing**: Is the layout clean and readable?
4. **Performance**: Are responses to key presses immediate?
5. **Compatibility**: Any issues with your specific terminal app?

## Reporting Results

**Please reply with:**
1. ✅/❌ status for each test case
2. Any error messages or unexpected behavior
3. Screenshots (if helpful) or descriptions of the UI
4. Overall assessment of the user experience
5. Any suggestions for improvements

## If Issues Are Found

If you encounter any problems:
1. Note the exact command that failed
2. Copy any error messages
3. Describe what you expected vs what happened
4. Include your terminal/environment details

**This testing validates that Milestone 2 is truly complete and ready for production use!** 🚀

---

*Generated for Issue #3 - Core CLI Framework*  
*Testing Protocol: Interactive/TTY Features*  
*Environment: WSL + Interactive Terminal Required*