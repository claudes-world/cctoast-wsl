#!/usr/bin/env bash
set -euo pipefail

# Detect execution context and set appropriate paths
detect_context() {
    local script_dir script_path
    script_dir="$(cd "$(dirname "${BASH_SOURCE[1]}")" && pwd)"
    script_path="$(realpath "${BASH_SOURCE[1]}")"
    
    # Debug output if enabled
    if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
        echo "DEBUG: Script directory: $script_dir" >&2
        echo "DEBUG: Script path: $script_path" >&2
    fi
    
    # Check if we're running from an installed location
    if [[ "$script_path" == "${HOME}/.claude/cctoast-wsl/"* ]]; then
        # Installed mode - use installation paths
        echo "installed:${HOME}/.claude/cctoast-wsl"
    elif [[ -f "${script_dir}/../assets/claude.png" ]]; then
        # Development mode - running from project directory
        echo "development:${script_dir}/.."
    else
        # Unknown context - use installation paths as fallback
        echo "unknown:${HOME}/.claude/cctoast-wsl"
    fi
}

# Set runtime paths based on detected context
CONTEXT_INFO=$(detect_context)
CONTEXT_TYPE="${CONTEXT_INFO%%:*}"
CONTEXT_ROOT="${CONTEXT_INFO#*:}"

readonly LOG="${HOME}/.claude/cctoast-wsl/toast-error.log"
readonly timeout_bin=$(command -v timeout || true)

# Set default icon path based on context
if [[ "$CONTEXT_TYPE" == "development" ]]; then
    readonly DEFAULT_ICON="${CONTEXT_ROOT}/assets/claude.png"
else
    readonly DEFAULT_ICON="${HOME}/.claude/cctoast-wsl/assets/claude.png"
fi

# Debug output for context detection
if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
    echo "DEBUG: Context: $CONTEXT_TYPE" >&2
    echo "DEBUG: Root: $CONTEXT_ROOT" >&2
    echo "DEBUG: Default icon: $DEFAULT_ICON" >&2
fi

# Hook mode defaults - notification mode
readonly NOTIFICATION_TITLE="Claude Code"
readonly NOTIFICATION_MESSAGE="Waiting for your response"

# Hook mode defaults - stop mode  
readonly STOP_TITLE="Claude Code"
readonly STOP_MESSAGE="Task completed"

# PowerShell script embedded as heredoc with parameter handling
get_ps_script() {
    local title="$1"
    local message="$2" 
    local icon="$3"
    local log="$4"
    
    cat <<PS
try {
    Import-Module BurntToast -ErrorAction Stop
    New-BurntToastNotification -Text '$title', '$message' -AppLogo '$icon'
} catch {
    \$_ | Out-File -Append -FilePath '$log'
    exit 1
}
PS
}

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
    local input="$1"
    
    # Debug output if enabled
    if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
        echo "DEBUG: Escaping PowerShell string: $input" >&2
    fi
    
    # Escape single quotes for PowerShell single-quoted strings
    # In PowerShell single-quoted strings, single quotes are escaped by doubling them
    local escaped
    escaped=$(printf '%s' "$input" | sed "s/'/''/g")
    
    if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
        echo "DEBUG: Escaped result: $escaped" >&2
    fi
    
    printf '%s' "$escaped"
}

# Path conversion function with comprehensive error handling
convert_path() {
    local input_path="$1"
    local converted_path
    
    # Debug output if enabled
    if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
        echo "DEBUG: Converting path: $input_path" >&2
    fi
    
    # Handle empty or null input
    if [[ -z "$input_path" ]]; then
        if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
            echo "DEBUG: Empty path provided, returning empty string" >&2
        fi
        echo ""
        return 0
    fi
    
    # Skip conversion if path looks like it's already Windows format
    # Match patterns like C:, D:\, \\server\share
    if [[ "$input_path" =~ ^[A-Za-z]:[\\\/] ]] || [[ "$input_path" =~ ^\\\\[^\\]+ ]]; then
        if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
            echo "DEBUG: Path already in Windows format: $input_path" >&2
        fi
        echo "$input_path"
        return 0
    fi
    
    # Check if wslpath command is available
    if ! command -v wslpath >/dev/null 2>&1; then
        log_error "wslpath command not available - not running in WSL?"
        if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
            echo "DEBUG: wslpath not available, returning original path: $input_path" >&2
        fi
        echo "$input_path"
        return 1
    fi
    
    # Convert WSL path to Windows path with better error handling
    if converted_path=$(wslpath -w "$input_path" 2>/dev/null); then
        # Validate the converted path is not empty
        if [[ -n "$converted_path" ]]; then
            if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
                echo "DEBUG: Successfully converted '$input_path' to '$converted_path'" >&2
            fi
            echo "$converted_path"
            return 0
        else
            log_error "wslpath returned empty result for: $input_path"
            if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
                echo "DEBUG: wslpath returned empty result, using original path" >&2
            fi
        fi
    else
        local exit_code=$?
        log_error "wslpath failed (exit $exit_code) for path: $input_path"
        if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
            echo "DEBUG: wslpath command failed with exit code $exit_code" >&2
        fi
    fi
    
    # Fallback: return original path
    if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
        echo "DEBUG: Using fallback - returning original path: $input_path" >&2
    fi
    echo "$input_path"
    return 1
}

# Enhanced path validation function
validate_path() {
    local path="$1"
    
    # Debug output if enabled
    if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
        echo "DEBUG: Validating path: $path" >&2
    fi
    
    # Handle empty path
    if [[ -z "$path" ]]; then
        if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
            echo "DEBUG: Empty path - validation failed" >&2
        fi        
        return 1
    fi
    
    # For WSL/Unix paths, check if file exists
    if [[ "$path" =~ ^/ ]] || [[ "$path" =~ ^\.\.?/ ]] || [[ ! "$path" =~ : ]]; then
        if [[ -f "$path" ]]; then
            if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
                echo "DEBUG: WSL path exists: $path" >&2
            fi
            return 0
        elif [[ -e "$path" ]]; then
            if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
                echo "DEBUG: WSL path exists but is not a regular file: $path" >&2
            fi
            return 1
        else
            if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
                echo "DEBUG: WSL path does not exist: $path" >&2
            fi
            return 1
        fi
    fi
    
    # For Windows paths, validate format but can't check existence from WSL
    # Valid Windows path patterns:
    # - C:\path\to\file.ext (absolute with drive letter)
    # - \\server\share\path (UNC path)
    # - C:/path/to/file.ext (forward slashes also valid in Windows)
    if [[ "$path" =~ ^[A-Za-z]:[\\\/] ]] || [[ "$path" =~ ^\\\\[^\\]+\\[^\\]+ ]]; then
        # Additional validation for Windows paths
        # Check for invalid characters in Windows filenames
        if [[ "$path" =~ [\<\>\:\"\|\?\*] ]]; then
            if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
                echo "DEBUG: Windows path contains invalid characters: $path" >&2
            fi
            return 1
        fi
        
        # Check for reserved Windows filenames (CON, PRN, AUX, NUL, etc.)
        local basename
        basename=$(basename "$path" 2>/dev/null)
        if [[ "$basename" =~ ^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$) ]]; then
            if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
                echo "DEBUG: Windows path uses reserved filename: $basename" >&2
            fi
            return 1
        fi
        
        if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
            echo "DEBUG: Windows path format appears valid: $path" >&2
        fi
        return 0
    fi
    
    if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
        echo "DEBUG: Path validation failed - unrecognized format: $path" >&2
    fi
    return 1
}

# Simple path conversion cache for performance
# Cache format: WSL_PATH|WINDOWS_PATH|TIMESTAMP
readonly PATH_CACHE_FILE="${HOME}/.cache/cctoast-wsl/path-cache.txt"
readonly PATH_CACHE_TTL=3600  # 1 hour cache TTL

# Initialize cache directory
init_path_cache() {
    local cache_dir
    cache_dir="$(dirname "$PATH_CACHE_FILE")"
    [[ -d "$cache_dir" ]] || mkdir -p "$cache_dir" 2>/dev/null || true
}

# Get cached path conversion if available and not expired
get_cached_path() {
    local input_path="$1"
    local current_time
    current_time=$(date +%s)
    
    # Return early if cache file doesn't exist
    [[ -f "$PATH_CACHE_FILE" ]] || return 1
    
    # Search for cached entry
    while IFS='|' read -r cached_wsl cached_windows cached_time; do
        if [[ "$cached_wsl" == "$input_path" ]] && [[ -n "$cached_windows" ]] && [[ -n "$cached_time" ]]; then
            # Check if cache entry is still valid
            if (( current_time - cached_time < PATH_CACHE_TTL )); then
                if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
                    echo "DEBUG: Using cached path conversion: $input_path -> $cached_windows" >&2
                fi
                echo "$cached_windows"
                return 0
            fi
        fi
    done < "$PATH_CACHE_FILE" 2>/dev/null
    
    return 1
}

# Cache a successful path conversion
cache_path() {
    local input_path="$1"
    local converted_path="$2"
    local current_time
    current_time=$(date +%s)
    
    # Initialize cache if needed
    init_path_cache
    
    # Don't cache if cache file creation failed
    [[ -w "$(dirname "$PATH_CACHE_FILE")" ]] || return 1
    
    # Clean old entries and add new one
    # This is a simple approach - more sophisticated cleanup could be added
    {
        # Keep recent entries
        if [[ -f "$PATH_CACHE_FILE" ]]; then
            while IFS='|' read -r cached_wsl cached_windows cached_time; do
                if [[ -n "$cached_time" ]] && (( current_time - cached_time < PATH_CACHE_TTL )); then
                    # Keep non-expired entries that aren't duplicates
                    if [[ "$cached_wsl" != "$input_path" ]]; then
                        echo "$cached_wsl|$cached_windows|$cached_time"
                    fi
                fi
            done < "$PATH_CACHE_FILE" 2>/dev/null
        fi
        
        # Add new entry
        echo "$input_path|$converted_path|$current_time"
    } > "$PATH_CACHE_FILE.tmp" 2>/dev/null && mv "$PATH_CACHE_FILE.tmp" "$PATH_CACHE_FILE" 2>/dev/null
    
    if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
        echo "DEBUG: Cached path conversion: $input_path -> $converted_path" >&2
    fi
}

# Enhanced path conversion with caching
convert_path_cached() {
    local input_path="$1"
    local converted_path
    
    # Try cache first
    if converted_path=$(get_cached_path "$input_path"); then
        echo "$converted_path"
        return 0
    fi
    
    # Fall back to regular conversion
    if converted_path=$(convert_path "$input_path"); then
        # Cache successful conversions (only if they're different from input)
        if [[ "$converted_path" != "$input_path" ]] && [[ -n "$converted_path" ]]; then
            cache_path "$input_path" "$converted_path"
        fi
        echo "$converted_path"
        return 0
    else
        return 1
    fi
}

# Main execution function with timeout wrapper
execute_notification() {
    local title="$1"
    local message="$2"
    local icon="$3"
    
    # Convert and escape parameters for PowerShell
    local esc_title esc_message esc_icon esc_log converted_log
    esc_title=$(escape_ps "$title")
    esc_message=$(escape_ps "$message")
    esc_icon=$(escape_ps "$icon")
    
    # Convert log path from WSL to Windows format
    converted_log=$(convert_path_cached "$LOG")
    esc_log=$(escape_ps "$converted_log")
    
    # Generate the PowerShell script with escaped parameters
    local ps_script_content
    ps_script_content=$(get_ps_script "$esc_title" "$esc_message" "$esc_icon" "$esc_log")
    
    # Use timeout if available, otherwise run directly
    if [[ -n "$timeout_bin" ]]; then
        if ! timeout 10s powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ps_script_content"; then
            log_error "PowerShell execution failed or timed out"
            return 1
        fi
    else
        if ! powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ps_script_content"; then
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
    local final_icon=""
    if [[ -n "$image_path" ]]; then
        if validate_path "$image_path"; then
            final_icon=$(convert_path_cached "$image_path")
            if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
                echo "DEBUG: Using custom image: $final_icon" >&2
            fi
        else
            echo "WARNING: Image file not found: $image_path, using default icon" >&2
            log_error "Custom image file not found: $image_path"
            # Fall through to default icon logic
        fi
    fi
    
    # If no custom icon or custom icon failed, try default icon
    if [[ -z "$final_icon" ]]; then
        if [[ -f "$DEFAULT_ICON" ]]; then
            final_icon=$(convert_path_cached "$DEFAULT_ICON")
            if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
                echo "DEBUG: Using default icon: $final_icon" >&2
            fi
        else
            if [[ "${CCTOAST_DEBUG:-}" == "1" ]]; then
                echo "DEBUG: No icon available (default icon not found at: $DEFAULT_ICON)" >&2
            fi
            # Continue without icon - PowerShell will handle this gracefully
            final_icon=""
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