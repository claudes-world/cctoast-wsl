# Advanced Usage Guide

This guide covers advanced customization options, integration examples, and power-user features for cctoast-wsl. Learn how to customize icons, sounds, integrate with other tools, and optimize performance.

## Custom Icons and Branding

### Using Custom Icons

Replace the default Claude icon with your own branding:

```bash
# Backup original icon
cp ~/.claude/cctoast-wsl/claude.png ~/.claude/cctoast-wsl/claude-original.png

# Add your custom icon (PNG format recommended)
cp /path/to/your-icon.png ~/.claude/cctoast-wsl/claude.png

# Test with custom icon
~/.claude/cctoast-wsl/show-toast.sh --title "Custom Icon" --message "Testing custom branding"
```

#### Icon Requirements
- **Format**: PNG (recommended), JPG, ICO
- **Size**: 64x64 to 256x256 pixels (Windows will scale)
- **Location**: Any path accessible from WSL
- **Permissions**: Readable by user

#### Per-Notification Icons
```bash
# Use different icons for different notification types
~/.claude/cctoast-wsl/show-toast.sh \
  --title "Error Notification" \
  --message "Something went wrong" \
  --image ~/.claude/icons/error.png

~/.claude/cctoast-wsl/show-toast.sh \
  --title "Success Notification" \
  --message "Task completed" \
  --image ~/.claude/icons/success.png
```

### Icon Management Script
Create a helper script for managing multiple icons:

```bash
# Create icon manager
cat > ~/.claude/cctoast-wsl/icon-manager.sh << 'EOF'
#!/bin/bash
set -euo pipefail

ICON_DIR="$HOME/.claude/icons"
CCTOAST_DIR="$HOME/.claude/cctoast-wsl"

case "${1:-default}" in
  "error")
    cp "$ICON_DIR/error.png" "$CCTOAST_DIR/claude.png"
    echo "✅ Error icon activated"
    ;;
  "success") 
    cp "$ICON_DIR/success.png" "$CCTOAST_DIR/claude.png"
    echo "✅ Success icon activated"
    ;;
  "warning")
    cp "$ICON_DIR/warning.png" "$CCTOAST_DIR/claude.png"
    echo "✅ Warning icon activated"
    ;;
  "default"|*)
    cp "$CCTOAST_DIR/claude-original.png" "$CCTOAST_DIR/claude.png"
    echo "✅ Default icon restored"
    ;;
esac
EOF

chmod +x ~/.claude/cctoast-wsl/icon-manager.sh

# Usage examples
~/.claude/cctoast-wsl/icon-manager.sh error    # Switch to error icon
~/.claude/cctoast-wsl/icon-manager.sh default  # Restore default
```

## Sound Configuration

### BurntToast Sound Options

BurntToast supports various notification sounds:

```bash
# Test different sounds (run in PowerShell)
powershell.exe -Command "
Import-Module BurntToast
New-BurntToastNotification -Text 'Sound Test','Default sound'
New-BurntToastNotification -Text 'Sound Test','Mail sound' -Sound Mail
New-BurntToastNotification -Text 'Sound Test','Reminder sound' -Sound Reminder
New-BurntToastNotification -Text 'Sound Test','SMS sound' -Sound SMS
"
```

### Custom Sound Wrapper
Create wrapper scripts for different sound types:

```bash
# Create sound-specific notification scripts
mkdir -p ~/.claude/cctoast-wsl/sounds

# Error notification with alert sound
cat > ~/.claude/cctoast-wsl/sounds/error.sh << 'EOF'
#!/bin/bash
powershell.exe -NoProfile -Command "
Import-Module BurntToast
New-BurntToastNotification -Text '$1','$2' -AppLogo '$3' -Sound Alarm
"
EOF

# Success notification with chime sound  
cat > ~/.claude/cctoast-wsl/sounds/success.sh << 'EOF'
#!/bin/bash
powershell.exe -NoProfile -Command "
Import-Module BurntToast
New-BurntToastNotification -Text '$1','$2' -AppLogo '$3' -Sound Default
"
EOF

chmod +x ~/.claude/cctoast-wsl/sounds/*.sh
```

## Advanced Hook Configurations

### Conditional Notifications

Create smart hooks that only notify based on context:

```bash
# Create intelligent notification wrapper
cat > ~/.claude/cctoast-wsl/smart-notify.sh << 'EOF'
#!/bin/bash
set -euo pipefail

# Configuration
MAX_FREQUENCY=5  # Max notifications per hour
QUIET_HOURS_START=22  # 10 PM
QUIET_HOURS_END=8     # 8 AM
COUNTER_FILE="$HOME/.claude/cctoast-wsl/notify-count"

# Check quiet hours
current_hour=$(date +%H)
if [[ $current_hour -ge $QUIET_HOURS_START || $current_hour -lt $QUIET_HOURS_END ]]; then
    echo "$(date): Skipping notification during quiet hours" >> "$HOME/.claude/cctoast-wsl/debug.log"
    exit 0
fi

# Check frequency limit
if [[ -f "$COUNTER_FILE" ]]; then
    count=$(cat "$COUNTER_FILE")
    last_reset=$(stat -c %Y "$COUNTER_FILE")
    current_time=$(date +%s)
    
    # Reset counter if more than 1 hour old
    if [[ $((current_time - last_reset)) -gt 3600 ]]; then
        echo "1" > "$COUNTER_FILE"
    else
        ((count++))
        if [[ $count -gt $MAX_FREQUENCY ]]; then
            echo "$(date): Rate limit exceeded" >> "$HOME/.claude/cctoast-wsl/debug.log"
            exit 0
        fi
        echo "$count" > "$COUNTER_FILE"
    fi
else
    echo "1" > "$COUNTER_FILE"
fi

# Send notification
~/.claude/cctoast-wsl/show-toast.sh "$@"
EOF

chmod +x ~/.claude/cctoast-wsl/smart-notify.sh
```

### Context-Aware Hooks

Use different notifications based on the current working directory:

```bash
# Create context-aware hook
cat > ~/.claude/cctoast-wsl/context-notify.sh << 'EOF'
#!/bin/bash
set -euo pipefail

# Get current directory from Claude's perspective
pwd_info="${1:-$(pwd)}"
project_name=$(basename "$pwd_info")

# Different icons for different project types
if [[ "$pwd_info" == *"/docs/"* ]]; then
    icon="$HOME/.claude/icons/docs.png"
    title="📚 Claude Code - Docs"
elif [[ "$pwd_info" == *"/tests/"* ]]; then
    icon="$HOME/.claude/icons/test.png" 
    title="🧪 Claude Code - Tests"
elif [[ -f "$pwd_info/package.json" ]]; then
    icon="$HOME/.claude/icons/nodejs.png"
    title="📦 Claude Code - Node.js"
elif [[ -f "$pwd_info/Cargo.toml" ]]; then
    icon="$HOME/.claude/icons/rust.png"
    title="🦀 Claude Code - Rust"
else
    icon="$HOME/.claude/cctoast-wsl/claude.png"
    title="🤖 Claude Code"
fi

# Send notification with context
~/.claude/cctoast-wsl/show-toast.sh \
  --title "$title" \
  --message "Working on $project_name" \
  --image "$icon"
EOF

chmod +x ~/.claude/cctoast-wsl/context-notify.sh
```

### Multiple Hook Strategies

Configure different notification strategies for different scenarios:

```json
{
  "hooks": {
    "notification": [
      "/home/user/.claude/cctoast-wsl/smart-notify.sh --notification-hook",
      "/home/user/.claude/other-tools/logger.sh notification"
    ],
    "stop": [
      "/home/user/.claude/cctoast-wsl/context-notify.sh --stop-hook", 
      "/home/user/.claude/other-tools/metrics.sh stop"
    ]
  }
}
```

## Integration with Other Tools

### VS Code Integration

Create VS Code commands for manual notifications:

```json
// .vscode/settings.json
{
  "terminal.integrated.env.linux": {
    "CCTOAST_AVAILABLE": "true"
  }
}
```

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Send Success Notification",
      "type": "shell",
      "command": "~/.claude/cctoast-wsl/show-toast.sh",
      "args": [
        "--title", "VS Code",
        "--message", "Task completed successfully",
        "--image", "${workspaceFolder}/.vscode/icons/success.png"
      ],
      "group": "build",
      "presentation": {
        "echo": false,
        "reveal": "never"
      }
    }
  ]
}
```

### GitHub Actions Integration

Use cctoast-wsl in CI/CD workflows (when running on self-hosted Windows runners):

```yaml
# .github/workflows/notify.yml
name: Build Notification
on: [push, pull_request]

jobs:
  build:
    runs-on: [self-hosted, windows, wsl]
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm install
        
      - name: Run tests
        run: npm test
        
      - name: Notify success
        if: success()
        run: |
          ~/.claude/cctoast-wsl/show-toast.sh \
            --title "✅ Build Success" \
            --message "All tests passed for ${{ github.ref_name }}"
            
      - name: Notify failure
        if: failure()
        run: |
          ~/.claude/cctoast-wsl/show-toast.sh \
            --title "❌ Build Failed" \
            --message "Build failed for ${{ github.ref_name }}" \
            --image ~/.claude/icons/error.png
```

### Docker Integration

Use cctoast-wsl from within Docker containers:

```dockerfile
# Dockerfile
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y curl

# Add notification helper
COPY notify-helper.sh /usr/local/bin/notify
RUN chmod +x /usr/local/bin/notify

# Usage: docker run -v /home/user/.claude:/host-claude my-image notify "Build complete"
```

```bash
# notify-helper.sh
#!/bin/bash
if [[ -x "/host-claude/cctoast-wsl/show-toast.sh" ]]; then
    /host-claude/cctoast-wsl/show-toast.sh --title "Docker" --message "$1"
else
    echo "cctoast-wsl not available"
fi
```

### tmux Integration

Add tmux notifications for long-running commands:

```bash
# ~/.tmux.conf
# Notify when command finishes in background pane
set-hook -g pane-exited 'run-shell "~/.claude/cctoast-wsl/tmux-notify.sh #{pane_current_command} #{pane_pid}"'
```

```bash
# tmux notification script
cat > ~/.claude/cctoast-wsl/tmux-notify.sh << 'EOF'
#!/bin/bash
command_name="$1"
pid="$2"

# Only notify for long-running commands
if [[ "$command_name" =~ ^(npm|cargo|docker|pytest|make)$ ]]; then
    ~/.claude/cctoast-wsl/show-toast.sh \
      --title "tmux: $command_name" \
      --message "Command finished in background"
fi
EOF

chmod +x ~/.claude/cctoast-wsl/tmux-notify.sh
```

## Performance Optimization

### Notification Caching

Implement notification deduplication:

```bash
# Create notification cache system
cat > ~/.claude/cctoast-wsl/cached-notify.sh << 'EOF'
#!/bin/bash
set -euo pipefail

CACHE_DIR="$HOME/.claude/cctoast-wsl/cache"
CACHE_TTL=300  # 5 minutes

mkdir -p "$CACHE_DIR"

# Create cache key from notification content
cache_key=$(echo "$*" | sha256sum | cut -d' ' -f1)
cache_file="$CACHE_DIR/$cache_key"

# Check if notification was recently sent
if [[ -f "$cache_file" ]]; then
    last_sent=$(stat -c %Y "$cache_file")
    current_time=$(date +%s)
    
    if [[ $((current_time - last_sent)) -lt $CACHE_TTL ]]; then
        echo "$(date): Skipping duplicate notification" >> "$HOME/.claude/cctoast-wsl/debug.log"
        exit 0
    fi
fi

# Send notification and update cache
~/.claude/cctoast-wsl/show-toast.sh "$@"
touch "$cache_file"

# Clean old cache files
find "$CACHE_DIR" -type f -mmin +60 -delete
EOF

chmod +x ~/.claude/cctoast-wsl/cached-notify.sh
```

### Asynchronous Notifications

Prevent notifications from blocking Claude Code:

```bash
# Create async notification wrapper
cat > ~/.claude/cctoast-wsl/async-notify.sh << 'EOF'
#!/bin/bash
set -euo pipefail

# Run notification in background with timeout
timeout 10s ~/.claude/cctoast-wsl/show-toast.sh "$@" &

# Don't wait for completion
disown
EOF

chmod +x ~/.claude/cctoast-wsl/async-notify.sh
```

Update Claude settings to use async wrapper:
```json
{
  "hooks": {
    "notification": ["/home/user/.claude/cctoast-wsl/async-notify.sh --notification-hook"],
    "stop": ["/home/user/.claude/cctoast-wsl/async-notify.sh --stop-hook"]
  }
}
```

### Batch Notifications

Group multiple notifications to reduce spam:

```bash
# Create batch notification system
cat > ~/.claude/cctoast-wsl/batch-notify.sh << 'EOF'
#!/bin/bash
set -euo pipefail

BATCH_DIR="$HOME/.claude/cctoast-wsl/batch"
BATCH_INTERVAL=10  # seconds

mkdir -p "$BATCH_DIR"

# Add notification to batch
echo "$(date +%s)|$*" >> "$BATCH_DIR/pending"

# Check if batch processor is running
if [[ ! -f "$BATCH_DIR/processor.pid" ]] || ! kill -0 "$(cat "$BATCH_DIR/processor.pid")" 2>/dev/null; then
    # Start batch processor
    ~/.claude/cctoast-wsl/batch-processor.sh &
    echo $! > "$BATCH_DIR/processor.pid"
fi
EOF

# Create batch processor
cat > ~/.claude/cctoast-wsl/batch-processor.sh << 'EOF'
#!/bin/bash
set -euo pipefail

BATCH_DIR="$HOME/.claude/cctoast-wsl/batch"
BATCH_INTERVAL=10

while true; do
    sleep "$BATCH_INTERVAL"
    
    if [[ -f "$BATCH_DIR/pending" ]]; then
        count=$(wc -l < "$BATCH_DIR/pending")
        
        if [[ $count -gt 1 ]]; then
            # Send summary notification
            ~/.claude/cctoast-wsl/show-toast.sh \
              --title "Claude Code" \
              --message "$count notifications pending"
        else
            # Send single notification
            notification=$(tail -n1 "$BATCH_DIR/pending" | cut -d'|' -f2-)
            ~/.claude/cctoast-wsl/show-toast.sh $notification
        fi
        
        rm "$BATCH_DIR/pending"
    fi
done
EOF

chmod +x ~/.claude/cctoast-wsl/batch-notify.sh ~/.claude/cctoast-wsl/batch-processor.sh
```

## Localization and Internationalization

### Multi-Language Support

Create language-specific notification wrappers:

```bash
# Create language configuration
cat > ~/.claude/cctoast-wsl/lang/en.conf << 'EOF'
NOTIFICATION_TITLE="Claude Code"
NOTIFICATION_MESSAGE="Waiting for your response"
STOP_TITLE="Claude Code"
STOP_MESSAGE="Task completed"
EOF

cat > ~/.claude/cctoast-wsl/lang/es.conf << 'EOF'
NOTIFICATION_TITLE="Claude Code"
NOTIFICATION_MESSAGE="Esperando tu respuesta"
STOP_TITLE="Claude Code" 
STOP_MESSAGE="Tarea completada"
EOF

# Create localized wrapper
cat > ~/.claude/cctoast-wsl/localized-notify.sh << 'EOF'
#!/bin/bash
set -euo pipefail

# Detect language from environment
lang="${LANG:-en}"
lang_code="${lang:0:2}"

# Load language configuration
lang_file="$HOME/.claude/cctoast-wsl/lang/${lang_code}.conf"
if [[ -f "$lang_file" ]]; then
    source "$lang_file"
else
    source "$HOME/.claude/cctoast-wsl/lang/en.conf"
fi

# Use localized messages as defaults
case "${1:-notification}" in
    "--notification-hook")
        ~/.claude/cctoast-wsl/show-toast.sh \
          --title "$NOTIFICATION_TITLE" \
          --message "$NOTIFICATION_MESSAGE"
        ;;
    "--stop-hook")
        ~/.claude/cctoast-wsl/show-toast.sh \
          --title "$STOP_TITLE" \
          --message "$STOP_MESSAGE"
        ;;
    *)
        ~/.claude/cctoast-wsl/show-toast.sh "$@"
        ;;
esac
EOF

chmod +x ~/.claude/cctoast-wsl/localized-notify.sh
```

## Monitoring and Analytics

### Notification Metrics

Track notification patterns and effectiveness:

```bash
# Create metrics collector
cat > ~/.claude/cctoast-wsl/metrics.sh << 'EOF'
#!/bin/bash
set -euo pipefail

METRICS_FILE="$HOME/.claude/cctoast-wsl/metrics.json"

# Initialize metrics file if not exists
if [[ ! -f "$METRICS_FILE" ]]; then
    echo '{"notifications": {"sent": 0, "failed": 0}, "last_sent": 0}' > "$METRICS_FILE"
fi

# Update metrics
current_time=$(date +%s)
if ~/.claude/cctoast-wsl/show-toast.sh "$@"; then
    jq --arg time "$current_time" '.notifications.sent += 1 | .last_sent = ($time | tonumber)' "$METRICS_FILE" > "$METRICS_FILE.tmp"
    mv "$METRICS_FILE.tmp" "$METRICS_FILE"
else
    jq '.notifications.failed += 1' "$METRICS_FILE" > "$METRICS_FILE.tmp"
    mv "$METRICS_FILE.tmp" "$METRICS_FILE"
fi
EOF

# Create metrics reporter
cat > ~/.claude/cctoast-wsl/report-metrics.sh << 'EOF'
#!/bin/bash
set -euo pipefail

METRICS_FILE="$HOME/.claude/cctoast-wsl/metrics.json"

if [[ -f "$METRICS_FILE" ]]; then
    echo "📊 cctoast-wsl Metrics:"
    echo "  Notifications sent: $(jq -r '.notifications.sent' "$METRICS_FILE")"
    echo "  Notifications failed: $(jq -r '.notifications.failed' "$METRICS_FILE")" 
    echo "  Last notification: $(date -d @$(jq -r '.last_sent' "$METRICS_FILE") 2>/dev/null || echo 'Never')"
    echo "  Success rate: $(jq -r '(.notifications.sent / (.notifications.sent + .notifications.failed) * 100 | floor)' "$METRICS_FILE")%"
else
    echo "No metrics available"
fi
EOF

chmod +x ~/.claude/cctoast-wsl/metrics.sh ~/.claude/cctoast-wsl/report-metrics.sh
```

### Health Monitoring

Create health check system:

```bash
# Create health check script
cat > ~/.claude/cctoast-wsl/health-check.sh << 'EOF'
#!/bin/bash
set -euo pipefail

echo "🏥 cctoast-wsl Health Check"
echo "=========================="

# Check WSL environment
if [[ -n "${WSL_DISTRO_NAME:-}" ]]; then
    echo "✅ WSL environment detected ($WSL_DISTRO_NAME)"
else
    echo "❌ Not running in WSL"
    exit 1
fi

# Check PowerShell access
if command -v powershell.exe >/dev/null 2>&1; then
    echo "✅ PowerShell access available"
else
    echo "❌ PowerShell not accessible"
    exit 1
fi

# Check BurntToast module
if powershell.exe -Command "Get-Module -ListAvailable -Name BurntToast" >/dev/null 2>&1; then
    echo "✅ BurntToast module installed"
else
    echo "❌ BurntToast module not found"
    exit 1
fi

# Check script files
if [[ -x ~/.claude/cctoast-wsl/show-toast.sh ]]; then
    echo "✅ show-toast.sh executable"
else
    echo "❌ show-toast.sh missing or not executable"
    exit 1
fi

# Test notification
echo "🧪 Testing notification..."
if ~/.claude/cctoast-wsl/show-toast.sh --title "Health Check" --message "System is healthy" >/dev/null 2>&1; then
    echo "✅ Notification test passed"
else
    echo "❌ Notification test failed"
    exit 1
fi

echo "🎉 All health checks passed!"
EOF

chmod +x ~/.claude/cctoast-wsl/health-check.sh
```

## Troubleshooting Advanced Configurations

### Debug Mode for Custom Scripts

Add debug capabilities to custom wrappers:

```bash
# Add to any custom script
if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
    set -x
    exec 2> >(tee -a "$HOME/.claude/cctoast-wsl/debug-$(date +%Y%m%d).log")
fi
```

### Configuration Validation

Create configuration validator:

```bash
# Create config validator
cat > ~/.claude/cctoast-wsl/validate-config.sh << 'EOF'
#!/bin/bash
set -euo pipefail

echo "🔍 Validating cctoast-wsl configuration..."

# Check Claude settings
settings_file="$HOME/.claude/settings.json"
if [[ -f "$settings_file" ]]; then
    if jq empty "$settings_file" >/dev/null 2>&1; then
        echo "✅ Claude settings.json is valid JSON"
    else
        echo "❌ Claude settings.json has invalid JSON syntax"
        return 1
    fi
    
    if jq -r '.hooks.notification[]' "$settings_file" 2>/dev/null | grep -q cctoast-wsl; then
        echo "✅ cctoast-wsl notification hook configured"
    else
        echo "⚠️  cctoast-wsl notification hook not found"
    fi
else
    echo "⚠️  Claude settings.json not found"
fi

# Validate custom scripts
for script in ~/.claude/cctoast-wsl/*.sh; do
    if [[ -f "$script" && -x "$script" ]]; then
        echo "✅ $(basename "$script") is executable"
    fi
done

echo "✅ Configuration validation complete"
EOF

chmod +x ~/.claude/cctoast-wsl/validate-config.sh
```

---

## Summary

This advanced usage guide covers:

- **Custom Icons**: Branding and context-aware visuals
- **Sound Configuration**: Different sounds for different notification types  
- **Advanced Hooks**: Smart, conditional, and context-aware notifications
- **Tool Integration**: VS Code, GitHub Actions, Docker, tmux
- **Performance**: Caching, async execution, batching
- **Localization**: Multi-language support
- **Monitoring**: Metrics collection and health checks

> [!TIP]  
> Start with simple customizations and gradually add complexity as needed. Always test custom configurations thoroughly before relying on them in production workflows.

For more help:
- [FAQ](FAQ.md) - Common issues and solutions
- [Security Guide](SECURITY.md) - Security considerations for custom configurations
- [Manual Installation](MANUAL.md) - Alternative installation methods