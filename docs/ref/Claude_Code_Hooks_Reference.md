# Claude Code Hooks JSON Reference Manual

This reference manual provides comprehensive documentation of the JSON payload structure for all Claude Code hook types, based on official Anthropic documentation and real-world usage patterns.

## Overview

Claude Code hooks receive JSON data via stdin and can optionally return JSON to control execution flow. All hooks share common fields but include event-specific data depending on the hook type.

## Common JSON Fields

Every hook receives these standard fields via stdin:

```json
{
  "session_id": "string",           // Unique session identifier
  "transcript_path": "string",      // Path to conversation JSON file
  "cwd": "string",                 // Current working directory
  "hook_event_name": "string",     // Name of the hook event
  "timestamp": "ISO8601 string"    // When the event occurred (optional)
}
```

## Hook-Specific Payload Documentation

### 1. PreToolUse Hook

**Triggered**: Before any tool is executed by Claude Code
**Purpose**: Validate, log, or modify tool calls before execution

#### Payload Structure
```json
{
  "session_id": "abc123-session",
  "transcript_path": "/path/to/conversation.json",
  "cwd": "/current/working/directory",
  "hook_event_name": "PreToolUse",
  "tool_name": "ToolName",
  "tool_input": {
    // Tool-specific parameters (see examples below)
  }
}
```

#### Tool-Specific Examples

**Bash Tool**:
```json
{
  "session_id": "abc123",
  "transcript_path": "/home/user/.claude/transcripts/2024-01-15.json",
  "cwd": "/home/user/project",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "ls -la",
    "description": "List files in current directory",
    "timeout": 120000
  }
}
```

**Edit Tool**:
```json
{
  "session_id": "abc123",
  "transcript_path": "/home/user/.claude/transcripts/2024-01-15.json",
  "cwd": "/home/user/project",
  "hook_event_name": "PreToolUse",
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "/home/user/project/src/main.ts",
    "old_string": "console.log('hello')",
    "new_string": "console.log('hello world')",
    "replace_all": false
  }
}
```

**Write Tool**:
```json
{
  "session_id": "abc123",
  "transcript_path": "/home/user/.claude/transcripts/2024-01-15.json",
  "cwd": "/home/user/project",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/home/user/project/new-file.txt",
    "content": "File contents here..."
  }
}
```

**Read Tool**:
```json
{
  "session_id": "abc123",
  "transcript_path": "/home/user/.claude/transcripts/2024-01-15.json",
  "cwd": "/home/user/project",
  "hook_event_name": "PreToolUse",
  "tool_name": "Read",
  "tool_input": {
    "file_path": "/home/user/project/config.json",
    "offset": 0,
    "limit": 100
  }
}
```

#### Common Use Cases
- **Security validation**: Block dangerous commands or file access
- **Logging**: Track all tool usage for audit purposes
- **Path validation**: Ensure file operations stay within project bounds
- **Command transformation**: Modify commands before execution

### 2. PostToolUse Hook

**Triggered**: After any tool completes execution
**Purpose**: Process results, log outcomes, or trigger follow-up actions

#### Payload Structure
```json
{
  "session_id": "abc123-session",
  "transcript_path": "/path/to/conversation.json",
  "cwd": "/current/working/directory",
  "hook_event_name": "PostToolUse",
  "tool_name": "ToolName",
  "tool_input": {
    // Same structure as PreToolUse
  },
  "tool_response": {
    "success": true|false,
    "output": "tool output text",
    "error": "error message if failed",
    "exit_code": 0,
    "duration_ms": 1500
  }
}
```

#### Examples

**Successful Bash Execution**:
```json
{
  "session_id": "abc123",
  "transcript_path": "/home/user/.claude/transcripts/2024-01-15.json",
  "cwd": "/home/user/project",
  "hook_event_name": "PostToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm test",
    "description": "Run test suite"
  },
  "tool_response": {
    "success": true,
    "output": "✓ All tests passed\n20 tests, 20 passed",
    "exit_code": 0,
    "duration_ms": 3500
  }
}
```

**Failed File Edit**:
```json
{
  "session_id": "abc123",
  "transcript_path": "/home/user/.claude/transcripts/2024-01-15.json",
  "cwd": "/home/user/project",
  "hook_event_name": "PostToolUse",
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "/home/user/project/missing.txt",
    "old_string": "text",
    "new_string": "replacement"
  },
  "tool_response": {
    "success": false,
    "error": "File not found: /home/user/project/missing.txt",
    "output": "",
    "exit_code": 1
  }
}
```

#### Common Use Cases
- **Code formatting**: Auto-format files after edits
- **Test execution**: Run tests after code changes
- **Deployment**: Trigger builds or deployments
- **Notifications**: Alert on important operations
- **Error handling**: Log failures or retry operations

### 3. Notification Hook

**Triggered**: When Claude Code needs user attention or input
**Purpose**: Display notifications, send alerts, or update status

#### Payload Structure
```json
{
  "session_id": "abc123-session",
  "transcript_path": "/path/to/conversation.json",
  "cwd": "/current/working/directory",
  "hook_event_name": "Notification",
  "message": "Notification message text"
}
```

#### Example
```json
{
  "session_id": "abc123",
  "transcript_path": "/home/user/.claude/transcripts/2024-01-15.json",
  "cwd": "/home/user/project",
  "hook_event_name": "Notification",
  "message": "Waiting for your input"
}
```

#### Common Use Cases
- **Desktop notifications**: Show toast notifications
- **Sound alerts**: Play notification sounds
- **Status updates**: Update terminal title or status bar
- **Logging**: Record when Claude is waiting for input
- **Integration**: Notify external systems (Slack, email, etc.)

### 4. UserPromptSubmit Hook

**Triggered**: When user submits a new prompt to Claude
**Purpose**: Process, validate, or log user input

#### Payload Structure
```json
{
  "session_id": "abc123-session",
  "transcript_path": "/path/to/conversation.json",
  "cwd": "/current/working/directory",
  "hook_event_name": "UserPromptSubmit",
  "prompt": "User's submitted text"
}
```

#### Example
```json
{
  "session_id": "abc123",
  "transcript_path": "/home/user/.claude/transcripts/2024-01-15.json",
  "cwd": "/home/user/project",
  "hook_event_name": "UserPromptSubmit",
  "prompt": "Please add error handling to the main function"
}
```

#### Common Use Cases
- **Input validation**: Check for sensitive information
- **Logging**: Track user interactions
- **Context enhancement**: Add project-specific context
- **Security**: Filter or sanitize prompts
- **Analytics**: Track usage patterns

### 5. Stop Hook

**Triggered**: When Claude finishes a task or conversation
**Purpose**: Clean up, notify completion, or trigger follow-up actions

#### Payload Structure
```json
{
  "session_id": "abc123-session",
  "transcript_path": "/path/to/conversation.json",
  "cwd": "/current/working/directory",
  "hook_event_name": "Stop",
  "stop_hook_active": true|false
}
```

#### Example
```json
{
  "session_id": "abc123",
  "transcript_path": "/home/user/.claude/transcripts/2024-01-15.json",
  "cwd": "/home/user/project",
  "hook_event_name": "Stop",
  "stop_hook_active": false
}
```

#### Common Use Cases
- **Completion notifications**: Alert when tasks finish
- **Status updates**: Update project status
- **Cleanup**: Remove temporary files or reset state
- **Reporting**: Generate task completion reports
- **Integration**: Trigger external workflows

### 6. SubagentStop Hook

**Triggered**: When a Claude subagent completes its task
**Purpose**: Handle subagent completion events

#### Payload Structure
```json
{
  "session_id": "abc123-session",
  "transcript_path": "/path/to/conversation.json",
  "cwd": "/current/working/directory",
  "hook_event_name": "SubagentStop",
  "stop_hook_active": true|false
}
```

#### Example
```json
{
  "session_id": "abc123",
  "transcript_path": "/home/user/.claude/transcripts/2024-01-15.json",
  "cwd": "/home/user/project",
  "hook_event_name": "SubagentStop",
  "stop_hook_active": true
}
```

## Hook Response Format

Hooks can optionally return JSON to control Claude's behavior:

### Standard Response Structure
```json
{
  "continue": true|false,           // Whether Claude should continue (default: true)
  "stopReason": "string",          // Message when continue=false (shown to user)
  "suppressOutput": true|false,    // Hide stdout from transcript (default: false)
  "decision": "approve|block",     // For permission-based hooks
  "reason": "Explanation text"     // Explanation for decision
}
```

### Response Examples

**Allow and Continue**:
```json
{
  "continue": true,
  "suppressOutput": false
}
```

**Block with Reason**:
```json
{
  "continue": false,
  "stopReason": "Cannot modify protected files",
  "decision": "block",
  "reason": "File is in protected directory: /etc/"
}
```

**Approve but Hide Output**:
```json
{
  "continue": true,
  "suppressOutput": true,
  "decision": "approve",
  "reason": "Operation approved but output contains sensitive data"
}
```

## Environment Variables

Claude Code also provides environment variables for hooks:

| Variable | Hook Types | Description |
|----------|------------|-------------|
| `$CLAUDE_FILE_PATHS` | PreToolUse, PostToolUse | Space-separated file paths from tool calls |
| `$CLAUDE_NOTIFICATION` | Notification | Notification message content |
| `$CLAUDE_TOOL_OUTPUT` | PostToolUse | Tool execution output |
| `$CLAUDE_SESSION_ID` | All | Current session identifier |
| `$CLAUDE_CWD` | All | Current working directory |

### Example Environment Variable Usage
```bash
#!/bin/bash
# Example hook script using environment variables

echo "Session: $CLAUDE_SESSION_ID"
echo "Directory: $CLAUDE_CWD"

if [[ -n "$CLAUDE_FILE_PATHS" ]]; then
    echo "Files involved: $CLAUDE_FILE_PATHS"
fi

if [[ -n "$CLAUDE_NOTIFICATION" ]]; then
    notify-send "Claude Code" "$CLAUDE_NOTIFICATION"
fi
```

## Hook Configuration Examples

### Global Hook Configuration
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Executing bash command' >> /tmp/claude-log.txt"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command", 
            "command": "~/.claude/cctoast-wsl/show-toast.sh --notification-hook"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/cctoast-wsl/show-toast.sh --stop-hook"
          }
        ]
      }
    ]
  }
}
```

### Advanced Hook with Filtering
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/validate-file.py"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/format-code.sh"
          }
        ]
      }
    ]
  }
}
```

## Hook Development Tips

### Reading JSON in Different Languages

**Python**:
```python
#!/usr/bin/env python3
import json
import sys

try:
    data = json.load(sys.stdin)
    hook_type = data.get('hook_event_name')
    session_id = data.get('session_id')
    
    if hook_type == 'Notification':
        message = data.get('message', 'No message')
        print(f"Notification: {message}")
    
except json.JSONDecodeError as e:
    print(f"Error parsing JSON: {e}", file=sys.stderr)
    sys.exit(1)
```

**Bash with jq**:
```bash
#!/bin/bash
set -euo pipefail

# Read JSON from stdin
input=$(cat)

# Parse with jq
hook_type=$(echo "$input" | jq -r '.hook_event_name')
session_id=$(echo "$input" | jq -r '.session_id')

case "$hook_type" in
    "Notification")
        message=$(echo "$input" | jq -r '.message')
        echo "Received notification: $message"
        ;;
    "PreToolUse")
        tool_name=$(echo "$input" | jq -r '.tool_name')
        echo "About to execute: $tool_name"
        ;;
    *)
        echo "Unknown hook type: $hook_type"
        ;;
esac
```

**Node.js**:
```javascript
#!/usr/bin/env node

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
    try {
        const data = JSON.parse(input);
        const hookType = data.hook_event_name;
        
        switch (hookType) {
            case 'Notification':
                console.log(`Notification: ${data.message}`);
                break;
            case 'PreToolUse':
                console.log(`About to execute: ${data.tool_name}`);
                break;
            default:
                console.log(`Unknown hook: ${hookType}`);
        }
    } catch (error) {
        console.error('JSON parse error:', error.message);
        process.exit(1);
    }
});
```

## Security Considerations

### Input Validation
Always validate JSON input in hooks:
- Check for required fields
- Validate file paths to prevent directory traversal
- Sanitize strings before using in shell commands
- Verify tool names against allowlists

### Safe Command Execution
```bash
# Bad - vulnerable to injection
command=$(echo "$input" | jq -r '.tool_input.command')
eval "$command"

# Good - proper validation and escaping
command=$(echo "$input" | jq -r '.tool_input.command')
if [[ "$command" =~ ^[a-zA-Z0-9\ \-\_\.]+$ ]]; then
    "$command"
else
    echo "Invalid command rejected" >&2
    exit 1
fi
```

### File Path Security
```python
import os
import json

data = json.load(sys.stdin)
file_path = data.get('tool_input', {}).get('file_path', '')

# Validate path is within project
project_root = '/home/user/project'
resolved_path = os.path.realpath(file_path)

if not resolved_path.startswith(project_root):
    print("Path outside project rejected", file=sys.stderr)
    sys.exit(1)
```

## Debugging Hooks

### Enable Debug Logging
```bash
#!/bin/bash
# Add debug logging to any hook
DEBUG_LOG="/tmp/claude-hook-debug.log"

# Log all input
echo "=== $(date) ===" >> "$DEBUG_LOG"
cat >> "$DEBUG_LOG"

# Process the saved input
input=$(tail -n +2 "$DEBUG_LOG" | head -n -1)
echo "$input" | jq . >> "$DEBUG_LOG" 2>&1
```

### Test Hooks Manually
```bash
# Create test payload
echo '{
  "session_id": "test-123",
  "hook_event_name": "Notification", 
  "message": "Test notification"
}' | ~/.claude/hooks/notification-hook.sh
```

## Best Practices

1. **Error Handling**: Always handle JSON parsing errors gracefully
2. **Performance**: Keep hooks lightweight and fast (< 1 second)
3. **Logging**: Log important events but avoid sensitive data
4. **Exit Codes**: Use proper exit codes (0=success, 1=error, 2=block)
5. **Validation**: Validate all inputs before processing
6. **Security**: Never execute unsanitized input
7. **Testing**: Test hooks with various payloads
8. **Documentation**: Document hook behavior and requirements

## Troubleshooting

### Common Issues

**JSON Parsing Errors**:
- Ensure stdin is fully read before parsing
- Handle empty input gracefully
- Check for BOM or encoding issues

**Performance Problems**:
- Avoid slow operations in hooks
- Use background processes for long tasks
- Cache expensive computations

**Permission Errors**:
- Verify hook script permissions (executable)
- Check file system permissions
- Validate user context

**Path Issues**:
- Use absolute paths in hook commands
- Handle spaces in file paths properly
- Validate path existence before use

This reference manual provides comprehensive documentation for working with Claude Code hooks. For specific implementation examples, see the cctoast-wsl project which demonstrates notification and stop hook integration.