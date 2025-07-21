#!/usr/bin/env bash
set -euo pipefail

# Runtime paths and configuration
readonly LOG="${HOME}/.claude/cctoast-wsl/toast-error.log"
readonly DEFAULT_ICON="${HOME}/.claude/cctoast-wsl/assets/claude.png"
readonly timeout_bin=$(command -v timeout || true)

# Hook mode defaults - notification mode
readonly NOTIFICATION_TITLE="Claude Code"
readonly NOTIFICATION_MESSAGE="Waiting for your response"

# Hook mode defaults - stop mode  
readonly STOP_TITLE="Claude Code"
readonly STOP_MESSAGE="Task completed"

# PowerShell script embedded as heredoc
readonly ps_script=$(cat <<'PS'
param($title, $message, $icon, $log)
try {
    Import-Module BurntToast -ErrorAction Stop
    New-BurntToastNotification -Text $title, $message -AppLogo $icon
} catch {
    $_ | Out-File -Append -FilePath $log
    exit 1
}
PS
)

# Logging function - creates log file only on first error
log_error() {
    local message="$1"
    local log_dir
    log_dir="$(dirname "$LOG")"
    
    # Create log directory if it doesn't exist
    [[ -d "$log_dir" ]] || mkdir -p "$log_dir"
    
    # Append error with timestamp
    echo "[$(date -Iseconds)] ERROR: ${message}" >> "$LOG"
}

# PowerShell parameter escaping function
escape_ps() {
    # Escape single quotes for PowerShell single-quoted strings
    printf '%s' "$1" | sed "s/'/''/g"
}

# Path conversion function with error handling
convert_path() {
    local input_path="$1"
    local converted_path
    
    # Skip conversion if path looks like it's already Windows format
    if [[ "$input_path" =~ ^[A-Za-z]: ]]; then
        echo "$input_path"
        return 0
    fi
    
    # Convert WSL path to Windows path
    if converted_path=$(wslpath -w "$input_path" 2>/dev/null); then
        echo "$converted_path"
    else
        log_error "Failed to convert path: $input_path"
        # Return original path as fallback
        echo "$input_path"
    fi
}

# Path validation function
validate_path() {
    local path="$1"
    
    # Check if file exists (for WSL paths)
    if [[ -f "$path" ]]; then
        return 0
    fi
    
    # For Windows paths, we can't easily validate from WSL
    # Just check if it looks like a valid Windows path
    if [[ "$path" =~ ^[A-Za-z]:[\\].* ]]; then
        return 0
    fi
    
    return 1
}

# PowerShell execution function with timeout
run_powershell() {
    local title="$1"
    local message="$2" 
    local icon="$3"
    
    # Escape parameters for PowerShell
    local esc_title esc_message esc_icon esc_log
    esc_title=$(escape_ps "$title")
    esc_message=$(escape_ps "$message")
    esc_icon=$(escape_ps "$icon")
    esc_log=$(escape_ps "$LOG")
    
    # Execute PowerShell with parameters
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ps_script" \
        -title "$esc_title" -message "$esc_message" -icon "$esc_icon" -log "$esc_log"
}

# Main execution function with timeout wrapper
execute_notification() {
    local title="$1"
    local message="$2"
    local icon="$3"
    
    # Use timeout if available, otherwise run directly
    if [[ -n "$timeout_bin" ]]; then
        if ! "$timeout_bin" 10s run_powershell "$title" "$message" "$icon"; then
            log_error "PowerShell execution failed or timed out"
            return 1
        fi
    else
        if ! run_powershell "$title" "$message" "$icon"; then
            log_error "PowerShell execution failed"
            return 1
        fi
    fi
    
    return 0
}

# Parse hook payload from stdin (future-proofing)
parse_hook_payload() {
    local payload
    # Read from stdin with timeout to avoid hanging
    if payload=$(timeout 0.1s cat 2>/dev/null); then
        # For now, just log that we received payload (future enhancement)
        log_error "Received hook payload: ${payload:0:100}..." 2>/dev/null || true
    fi
}

# Main argument parsing and execution
main() {
    local title=""
    local message=""
    local image_path=""
    local attribution=""
    local hook_mode=""
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --notification-hook)
                hook_mode="notification"
                title="$NOTIFICATION_TITLE"
                message="$NOTIFICATION_MESSAGE"
                shift
                ;;
            --stop-hook)
                hook_mode="stop"
                title="$STOP_TITLE"
                message="$STOP_MESSAGE"
                shift
                ;;
            --title|-t)
                [[ -n "${2:-}" ]] || { log_error "Missing value for --title"; exit 1; }
                title="$2"
                shift 2
                ;;
            --message|-m)
                [[ -n "${2:-}" ]] || { log_error "Missing value for --message"; exit 1; }
                message="$2"
                shift 2
                ;;
            --image|-i)
                [[ -n "${2:-}" ]] || { log_error "Missing value for --image"; exit 1; }
                image_path="$2"
                shift 2
                ;;
            --attribution|-a)
                [[ -n "${2:-}" ]] || { log_error "Missing value for --attribution"; exit 1; }
                attribution="$2"
                shift 2
                ;;
            --help|-h)
                cat <<EOF
Usage: $0 [OPTIONS]

Hook modes:
  --notification-hook    Run in notification hook mode (default: "Claude Code" / "Waiting for your response")
  --stop-hook           Run in stop hook mode (default: "Claude Code" / "Task completed")

Manual mode options:
  --title, -t TEXT      Toast notification title
  --message, -m TEXT    Toast notification message  
  --image, -i PATH      Path to image file
  --attribution, -a TEXT Attribution text

Other options:
  --help, -h            Show this help message

Examples:
  $0 --notification-hook                    # Hook mode for notifications
  $0 --stop-hook                           # Hook mode for task completion
  $0 --title "Test" --message "Hello"      # Manual notification
  $0 -t "Test" -m "With icon" -i ~/icon.png # Manual with image

EOF
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Error: Unknown option: $1" >&2
                echo "Use --help for usage information" >&2
                exit 1
                ;;
        esac
    done
    
    # Parse hook payload if in hook mode (future-proofing)
    if [[ -n "$hook_mode" ]]; then
        parse_hook_payload
    fi
    
    # Set defaults if not specified
    [[ -n "$title" ]] || title="Claude Code"
    [[ -n "$message" ]] || message="Notification"
    
    # Handle image path
    local final_icon="$DEFAULT_ICON"
    if [[ -n "$image_path" ]]; then
        if validate_path "$image_path"; then
            final_icon=$(convert_path "$image_path")
        else
            log_error "Image file not found or invalid: $image_path, using default icon"
            # Continue with default icon
        fi
    else
        # Use default icon if it exists, otherwise continue without icon
        if [[ ! -f "$DEFAULT_ICON" ]]; then
            final_icon=""
        else
            final_icon=$(convert_path "$DEFAULT_ICON")
        fi
    fi
    
    # Execute notification (silently handle errors to avoid disrupting Claude)
    if ! execute_notification "$title" "$message" "$final_icon"; then
        # Error already logged, exit silently for hook mode
        if [[ -n "$hook_mode" ]]; then
            exit 0  # Silent exit for hook mode
        else
            exit 1  # Normal exit for manual mode
        fi
    fi
    
    exit 0
}

# Run main function with all arguments
main "$@"