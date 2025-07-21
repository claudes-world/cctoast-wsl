# 🎯 Task: Implement Milestone 5 - Runtime Components (Issue #6)

## 📋 Quick Context
You're working on the **cctoast-wsl** project - a utility that enables Windows toast notifications from WSL for Claude Code hooks. This milestone focuses on enhancing the bash runtime script that gets called directly by Claude hooks.

## 🔧 Setup Instructions

### 1. Git Worktree Setup (REQUIRED)
```bash
# Navigate to the main project directory
cd /home/liam/code/cctoast-wsl

# Create a new worktree for your work (avoid conflicts with other agents)
git worktree add worktree-issue6 main

# Switch to your worktree
cd worktree-issue6

# Create feature branch
git checkout -b feat/6-runtime-components

# Assign yourself to the issue
gh issue edit 6 --add-assignee @me
```

### 2. Project Familiarization
Read these key files to understand the project:
- `CLAUDE.md` - Project context and development guidelines
- `docs/PRD.md` - Section 7 covers the bash script requirements
- `docs/IMPLEMENTATION_PLAN.md` - Milestone 5 detailed tasks
- `docs/PROJECT_MANAGEMENT.md` - Git workflow and commit conventions
- `scripts/show-toast.sh` - Current bash script (needs enhancement)

## 🎯 Your Mission: Issue #6 - Milestone 5: Runtime Components

**Goal**: Enhance the bash script for direct hook execution with robust PowerShell integration

**Duration**: 1-2 days  
**Priority**: Critical Path

## ✅ Acceptance Criteria Checklist

### Bash Script Enhancement (`scripts/show-toast.sh`)
- [ ] Add timeout wrapper (10s max execution time)
- [ ] Implement PowerShell error handling with try-catch
- [ ] Create error log at `~/.claude/cctoast-wsl/toast-error.log`
- [ ] Add parameter validation for all inputs
- [ ] Support all toast parameters (title, message, image, attribution)
- [ ] Set script permissions to 0o500

### PowerShell Integration
- [ ] Implement try-catch error handling in embedded PowerShell
- [ ] Use `Import-Module BurntToast -ErrorAction Stop`
- [ ] Add structured error logging to the error log file
- [ ] Implement proper parameter escaping for PowerShell
- [ ] Support custom icons with proper path handling
- [ ] Handle missing image files gracefully (fallback behavior)

### Notification Hook Handler
- [ ] Recognize `--notification-hook` flag
- [ ] Parse hook payload from stdin if available (future-proofing)
- [ ] Default values: "Claude Code" title, "Waiting for your response" message
- [ ] Support custom attribution parameter
- [ ] Log errors silently (don't interrupt Claude workflows)
- [ ] Complete execution within 2 seconds

### Stop Hook Handler
- [ ] Recognize `--stop-hook` flag  
- [ ] Show completion notification with appropriate messaging
- [ ] Include task duration if available (parse from stdin)
- [ ] Use custom stop message: "Task completed" (or similar)
- [ ] Support different icon for stop vs notification if available
- [ ] Ensure non-blocking execution
- [ ] Handle rapid successive calls without conflicts

### Path Conversion System
- [ ] Use `wslpath` for WSL to Windows path conversion
- [ ] Handle special characters in paths properly (spaces, unicode, etc.)
- [ ] Support both absolute and relative paths
- [ ] Validate converted paths before use
- [ ] Add fallback behavior for unconvertible paths
- [ ] Handle missing files gracefully (don't crash)

## 📚 Key Requirements from PRD

The script should look similar to this structure (from PRD Section 7):
```bash
#!/usr/bin/env bash
set -euo pipefail
LOG="$HOME/.claude/cctoast-wsl/toast-error.log"
timeout_bin=$(command -v timeout || true)

ps_script=$(cat <<'PS'
param($title,$message,$icon,$log)
try {
  Import-Module BurntToast -ErrorAction Stop
  New-BurntToastNotification -Text $title,$message -AppLogo $icon
} catch {
  $_ | Out-File -Append -FilePath $log
  exit 1
}
PS
)

# Your enhancements go here...
```

## 🔄 Git Workflow (CRITICAL - Follow Exactly)

### Commit Conventions
Use **conventional commits** for automatic versioning:
```bash
# Feature commits
git commit -m "feat: add timeout wrapper for PowerShell execution

- Implement 10s timeout using timeout command
- Add fallback for systems without timeout binary
- Ensure script doesn't hang on PowerShell issues

Refs #6"

# Fix commits  
git commit -m "fix: handle missing image files gracefully

- Check file existence before passing to PowerShell
- Use default claude.png as fallback
- Add proper error logging for missing assets

Refs #6"
```

### Testing Before Commits
```bash
# Run linting
npm run lint

# Test your script manually
./scripts/show-toast.sh --notification-hook
./scripts/show-toast.sh --stop-hook
./scripts/show-toast.sh --title "Test" --message "Manual test"

# Check script permissions
ls -la scripts/show-toast.sh  # Should be -r-x------
```

### Progress Tracking
Update the issue regularly:
```bash
gh issue comment 6 --body "📋 **Progress Update**:
- [x] Added timeout wrapper with fallback
- [x] Enhanced PowerShell error handling  
- [ ] Working on hook flag recognition
- [ ] Next: Path conversion system

**ETA**: On track for 1-day estimate"
```

## 🧪 Testing Protocol

### Manual Testing Commands
```bash
# Test basic functionality
./scripts/show-toast.sh --title "Test" --message "Basic test"

# Test hook modes
./scripts/show-toast.sh --notification-hook
./scripts/show-toast.sh --stop-hook

# Test with custom image
./scripts/show-toast.sh --title "Test" --message "With icon" --image ~/some-icon.png

# Test error scenarios (missing image, bad paths, etc.)
./scripts/show-toast.sh --title "Test" --image /nonexistent/path.png
```

### Performance Testing
- Ensure script completes within 2 seconds
- Test rapid successive calls
- Verify timeout works (test with PowerShell hung scenario)

## 📝 Key Design Principles

1. **No Node.js Dependency**: Script runs in pure bash → PowerShell
2. **Silent Failures**: Don't interrupt Claude workflows with errors
3. **Robust Error Handling**: Log issues but continue execution
4. **Performance**: Complete within 2 seconds
5. **Security**: Proper parameter escaping for PowerShell injection prevention

## 🚨 Important Notes

- **Path Handling**: WSL paths need conversion to Windows paths using `wslpath`
- **PowerShell Security**: Always escape parameters to prevent injection
- **Error Logging**: Create log file only when first error occurs (don't pre-create)
- **Permissions**: Script must have 0o500 permissions (read/execute for owner only)
- **BurntToast**: Assume module is already installed (dependency checker handles this)

## ✅ Completion Criteria

When you've completed all tasks:

1. **Test thoroughly** with all the manual test commands above
2. **Update issue** with completion status
3. **Create PR** using this template:
   ```bash
   gh pr create --title "feat: Runtime Components (Milestone 5)" --body "$(cat <<'EOF'
   ## 📋 Summary  
   Implements Milestone 5: Enhanced bash script for direct hook execution
   
   ## 🎯 Closes Issues
   Closes #6
   
   ## ✅ All Acceptance Criteria Met
   [List completed items with checkboxes]
   EOF
   )"
   ```
4. **Tag @mcorrig4** for review and testing in WSL environment

## 🔗 References
- [PRD Section 7: Bash Script](docs/PRD.md#7--bash-script-show-toastsh)  
- [Implementation Plan Milestone 5](docs/IMPLEMENTATION_PLAN.md#milestone-5-runtime-components)
- [BurntToast Documentation](docs/BurntToast_manpage.txt)

## 🎯 Success Metrics
- Direct hook execution works reliably
- Toast notifications appear within 2 seconds  
- Error handling is robust and silent
- Path conversion works for all scenarios
- Script has no Node.js runtime dependencies

---

**Ready to start? Follow the setup instructions above, then dive into enhancing `scripts/show-toast.sh`!**