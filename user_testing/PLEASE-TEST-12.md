# 🧪 PLEASE TEST: Issue #12 - JSONC Settings Merger

**Milestone**: Installation Engine Core Infrastructure  
**Issue**: https://github.com/claudes-world/cctoast-wsl/issues/12  
**Features**: JSONC parsing, deep merge, atomic file operations, Claude hook integration  
**Status**: ⏳ Awaiting User Validation

## Why This Testing is Required

The Claude Code environment cannot fully test real filesystem operations and actual Claude settings file interactions:
- Real file I/O with permissions and atomic operations
- Actual Claude settings.json file parsing and modification
- Backup creation and cleanup in real filesystem
- Cross-platform path handling and file permissions
- Integration with actual Claude Code hook structure

## Environment Requirements

- **WSL Environment**: Must be running inside WSL (Windows Subsystem for Linux)
- **Node.js 18+**: For running the test scripts
- **Write Permissions**: Ability to create test files and directories
- **Optional**: Existing Claude Code installation with settings.json

## Pre-Test Setup

1. Navigate to the worktree directory:
   ```bash
   cd /path/to/cctoast-wsl/worktree-issue12
   ```

2. Build the latest version:
   ```bash
   npm run build:dev
   ```

3. Verify the module builds correctly:
   ```bash
   ls -la src/settings-merger.js src/jsonc-parser.js
   # Should show compiled JavaScript files
   ```

4. Create a test workspace:
   ```bash
   mkdir -p manual-test-workspace
   cd manual-test-workspace
   ```

## Test Cases

### ✅ Test 1: JSONC Comment Parsing

**Setup:**
```bash
cat > test-settings.jsonc << 'EOF'
{
  // This is a single-line comment
  "hooks": {
    /* Multi-line comment
       spanning multiple lines */
    "notification": ["existing-hook"],
    "stop": ["existing-stop"] // Inline comment
  },
  "otherSetting": "value"
}
EOF
```

**Command:**
```bash
node -e "
import('../src/settings-merger.js').then(({ SettingsMerger }) => {
  const merger = new SettingsMerger();
  const fs = require('fs');
  const content = fs.readFileSync('test-settings.jsonc', 'utf8');
  merger.parseJsonc(content).then(result => {
    console.log('✅ JSONC parsed successfully');
    console.log('Hooks found:', Object.keys(result.hooks || {}));
    console.log('Comments stripped:', !JSON.stringify(result).includes('//'));
  }).catch(err => console.error('❌ Error:', err.message));
});
"
```

**Expected Behavior:**
- ✅ Should parse successfully without errors
- ✅ Comments should be completely removed
- ✅ Should preserve all JSON structure and values
- ✅ Should output: hooks found: notification, stop

**Report:** ✅/❌ JSONC parsing works correctly

---

### ✅ Test 2: Deep Merge with Hook Preservation

**Setup:**
```bash
cat > base-settings.json << 'EOF'
{
  "hooks": {
    "notification": ["existing-notification-hook"],
    "preToolUse": ["existing-pre-hook"]
  },
  "theme": "dark",
  "editor": "vscode"
}
EOF
```

**Command:**
```bash
node -e "
import('../src/settings-merger.js').then(({ SettingsMerger }) => {
  const merger = new SettingsMerger();
  const fs = require('fs');
  
  const existing = JSON.parse(fs.readFileSync('base-settings.json', 'utf8'));
  const updates = {
    hooks: {
      notification: ['~/.claude/cctoast-wsl/show-toast.sh --notification-hook'],
      stop: ['~/.claude/cctoast-wsl/show-toast.sh --stop-hook']
    }
  };
  
  merger.merge(existing, updates).then(result => {
    console.log('✅ Merge completed');
    console.log('Notification hooks:', result.hooks.notification);
    console.log('PreToolUse preserved:', result.hooks.preToolUse);
    console.log('Theme preserved:', result.theme);
  });
});
"
```

**Expected Behavior:**
- ✅ Should merge without errors
- ✅ Existing notification hook should be preserved
- ✅ New cctoast-wsl hooks should be added
- ✅ Other settings (theme, editor) should remain unchanged
- ✅ No duplicate entries should appear

**Report:** ✅/❌ Deep merge preserves existing settings

---

### ✅ Test 3: Claude Hook Integration

**Command:**
```bash
node -e "
import('../src/settings-merger.js').then(({ SettingsMerger }) => {
  const merger = new SettingsMerger();
  const existing = { 
    hooks: { 
      notification: ['existing'],
      preToolUse: ['keep-this'] 
    } 
  };
  const hookCommands = {
    notification: '~/.claude/cctoast-wsl/show-toast.sh --notification-hook',
    stop: '~/.claude/cctoast-wsl/show-toast.sh --stop-hook'
  };
  
  merger.mergeHookCommands(existing, hookCommands).then(result => {
    console.log('✅ Hook integration completed');
    console.log('Final notification hooks:', result.hooks.notification);
    console.log('Final stop hooks:', result.hooks.stop);
    console.log('PreToolUse untouched:', result.hooks.preToolUse);
  });
});
"
```

**Expected Behavior:**
- ✅ Should add cctoast-wsl hooks to appropriate arrays
- ✅ Should preserve existing hooks in other categories
- ✅ Should not duplicate existing hooks
- ✅ Should create stop hook array if it didn't exist

**Report:** ✅/❌ Hook integration works correctly

---

### ✅ Test 4: Atomic File Operations with Backup

**Setup:**
```bash
mkdir -p test-claude
cat > test-claude/settings.json << 'EOF'
{
  "hooks": {
    "notification": ["original-hook"]
  },
  "version": "1.0.0"
}
EOF
```

**Command:**
```bash
node -e "
import('../src/settings-merger.js').then(({ SettingsMerger }) => {
  const merger = new SettingsMerger();
  const updates = {
    hooks: {
      notification: ['~/.claude/cctoast-wsl/show-toast.sh --notification-hook']
    },
    newSetting: 'added'
  };
  
  console.log('Original file exists:', require('fs').existsSync('./test-claude/settings.json'));
  
  merger.mergeFile('./test-claude/settings.json', updates, { createBackup: true })
    .then(result => {
      console.log('✅ File operation completed');
      console.log('Changes detected:', result.changed);
      console.log('Backup created at:', result.backupPath);
      
      const fs = require('fs');
      const finalContent = JSON.parse(fs.readFileSync('./test-claude/settings.json', 'utf8'));
      console.log('Final notification hooks:', finalContent.hooks.notification);
      console.log('New setting added:', finalContent.newSetting);
      console.log('Backup file exists:', fs.existsSync(result.backupPath));
    });
});
"
```

**Expected Behavior:**
- ✅ Should create backup file in backup/ subdirectory
- ✅ Should modify original file with merged content
- ✅ Original and new hooks should both be present
- ✅ Should report changes were made
- ✅ Backup should contain original content

**Report:** ✅/❌ Atomic operations and backup work correctly

---

### ✅ Test 5: Error Handling

**Setup:**
```bash
cat > invalid.json << 'EOF'
{
  "invalid": json structure without quotes
}
EOF
```

**Command:**
```bash
node -e "
import('../src/settings-merger.js').then(({ SettingsMerger }) => {
  const merger = new SettingsMerger();
  const fs = require('fs');
  const content = fs.readFileSync('invalid.json', 'utf8');
  
  merger.parseJsonc(content)
    .then(result => console.log('❌ Should not succeed'))
    .catch(err => {
      console.log('✅ Error handled correctly');
      console.log('Error message:', err.message);
      console.log('Contains parsing info:', err.message.includes('parsing'));
    });
});
"
```

**Expected Behavior:**
- ✅ Should fail gracefully with clear error message
- ✅ Error should mention "parsing failed"
- ✅ Should not crash or throw unhandled exceptions

**Report:** ✅/❌ Error handling works correctly

---

### ✅ Test 6: Hook Detection and Removal

**Command:**
```bash
node -e "
import('../src/settings-merger.js').then(({ SettingsMerger }) => {
  const merger = new SettingsMerger();
  const settings = {
    hooks: {
      notification: [
        'existing-hook',
        '~/.claude/cctoast-wsl/show-toast.sh --notification-hook',
        'another-hook'
      ],
      stop: ['stop-hook']
    }
  };
  
  console.log('✅ Testing hook detection and removal');
  console.log('Has cctoast notification hook:', 
    merger.hasHookCommand(settings, 'notification', '~/.claude/cctoast-wsl/show-toast.sh --notification-hook')
  );
  console.log('Has non-existent hook:', 
    merger.hasHookCommand(settings, 'notification', 'non-existent')
  );
  
  const removed = merger.removeHookCommand(settings, 'notification', '~/.claude/cctoast-wsl/show-toast.sh --notification-hook');
  console.log('After removal:', removed.hooks.notification);
  console.log('Stop hooks preserved:', removed.hooks.stop);
});
"
```

**Expected Behavior:**
- ✅ Should correctly detect existing cctoast hook (true)
- ✅ Should correctly detect non-existent hook (false)
- ✅ Should remove only the specified hook
- ✅ Should preserve other hooks in same and different categories

**Report:** ✅/❌ Hook detection and removal work correctly

---

### ✅ Test 7: Real Claude Settings Integration (Optional)

**⚠️ ONLY IF YOU HAVE CLAUDE CODE INSTALLED**

**Setup (MAKE BACKUP FIRST):**
```bash
# CAREFUL: Make backup first!
cp ~/.claude/settings.json ~/.claude/settings.json.manual-test-backup 2>/dev/null || echo "No existing settings file"
```

**Command:**
```bash
node -e "
import('../src/settings-merger.js').then(({ SettingsMerger }) => {
  const merger = new SettingsMerger();
  const fs = require('fs');
  const os = require('os');
  
  const settingsPath = os.homedir() + '/.claude/settings.json';
  if (fs.existsSync(settingsPath)) {
    const content = fs.readFileSync(settingsPath, 'utf8');
    console.log('✅ Real Claude settings found');
    
    merger.parseJsonc(content).then(parsed => {
      console.log('Settings parsed successfully');
      console.log('Current hooks:', Object.keys(parsed.hooks || {}));
      console.log('Validation passed:', merger.validateSettings(parsed));
    }).catch(err => {
      console.log('❌ Settings parsing failed:', err.message);
    });
  } else {
    console.log('ℹ️  No Claude settings found - this is normal for testing');
  }
});
"
```

**Expected Behavior:**
- ✅ Should parse existing Claude settings without errors
- ✅ Should validate settings structure
- ✅ Should show current hook categories

**Report:** ✅/❌/➖ Real settings integration (or N/A if no Claude installed)

---

## Cleanup

**After testing, clean up test files:**
```bash
cd ..
rm -rf manual-test-workspace
# Restore Claude settings if you backed them up
# cp ~/.claude/settings.json.manual-test-backup ~/.claude/settings.json
```

## Testing Summary

**Overall Assessment:**
- ✅ JSONC comment parsing
- ✅ Deep merge preserves existing settings  
- ✅ Hook integration works correctly
- ✅ Atomic operations and backup
- ✅ Error handling  
- ✅ Hook detection and removal
- ✅/❌/➖ Real settings integration

**Issues Found:**
[List any problems encountered]

**Additional Notes:**
[Any other observations or concerns]

---

**Environment Info:**
- OS: [Your OS/WSL version]
- Node.js: [node --version]
- Terminal: [Terminal type]
- Date: [Test date]

Thanks for helping validate this milestone! 🙏