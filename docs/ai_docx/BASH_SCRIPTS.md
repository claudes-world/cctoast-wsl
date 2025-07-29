# Bash Scripts Development Guide

This document provides comprehensive guidance for creating high-quality bash scripts, based on the development of `cc-worktree.sh` and established best practices for the cctoast-wsl project.

## Script Creation Methodology

### Development Process Used for cc-worktree.sh

The enhanced `cc-worktree.sh` script was developed using a systematic approach that can be replicated for future bash scripts:

1. **Requirements Analysis**
   - Interactive worktree selection with numbered menu
   - Flexible parameter handling (numeric, partial, exact matching)
   - Professional styling with colors and Unicode characters
   - Shell sourcing support for function export
   - Comprehensive error handling

2. **Architecture Planning**
   - Modular function design with single responsibilities
   - Consistent styling system using project color standards
   - Structured data parsing with clear formats
   - Error handling hierarchy with appropriate exit codes

3. **Implementation Strategy**
   - Start with color constants and styling functions
   - Build core parsing and data structures
   - Implement user interaction layers
   - Add validation and error handling
   - Create help documentation and sourcing support

## Styling and Formatting Standards

### Color Scheme (Project Standard)
```bash
# Colors and styling (consistent with project standards)
readonly RED='\033[0;31m'      # Errors, critical issues
readonly GREEN='\033[0;32m'    # Success messages, main branches
readonly YELLOW='\033[1;33m'   # Warnings, fix branches
readonly BLUE='\033[0;34m'     # Info messages, feature branches
readonly CYAN='\033[0;36m'     # Headers, UI elements
readonly BOLD='\033[1m'        # Emphasis, titles
readonly DIM='\033[2m'         # Secondary information
readonly NC='\033[0m'          # Reset to normal color
```

### Unicode Box Drawing Characters
```bash
# Unicode box-drawing characters for professional output
readonly BOX_H='─'          # Horizontal line
readonly BOX_V='│'          # Vertical line  
readonly BOX_TL='┌'         # Top-left corner
readonly BOX_TR='┐'         # Top-right corner
readonly BOX_BL='└'         # Bottom-left corner
readonly BOX_BR='┘'         # Bottom-right corner
readonly BOX_T='┬'          # Top connector
readonly BOX_B='┴'          # Bottom connector
readonly BOX_L='├'          # Left connector
readonly BOX_R='┤'          # Right connector
readonly BOX_CROSS='┼'      # Cross connector
```

### Logging Functions Template
```bash
# Standardized logging functions with consistent styling
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_debug() {
    if [[ "${DEBUG:-}" == "1" ]]; then
        echo -e "${DIM}[DEBUG]${NC} $1" >&2
    fi
}
```

### Header Template
```bash
# Print a styled header with box borders
print_header() {
    local title="$1"
    local width=60
    local title_len=${#title}
    local padding=$(( (width - title_len - 2) / 2 ))
    
    echo -e "${CYAN}${BOX_TL}$(printf "%*s" $width '' | tr ' ' "$BOX_H")${BOX_TR}${NC}"
    printf "${CYAN}${BOX_V}${NC}%*s${BOLD}%s${NC}%*s${CYAN}${BOX_V}${NC}\n" \
        $padding "" "$title" $((width - title_len - padding)) ""
    echo -e "${CYAN}${BOX_BL}$(printf "%*s" $width '' | tr ' ' "$BOX_H")${BOX_BR}${NC}"
}
```

## Best Practices for Junior Developers

### 1. Script Structure and Organization

#### File Header Template
```bash
#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# script-name.sh - Brief Description
# ==============================================================================
#
# DESCRIPTION:
#   Detailed description of what the script does and its purpose
#
# FEATURES:
#   • Feature 1 with bullet points
#   • Feature 2 with clear descriptions
#   • Feature 3 highlighting key capabilities
#
# USAGE:
#   ./script-name.sh [OPTIONS] [ARGUMENTS]
#   source ./script-name.sh  # If sourcing is supported
#
# EXAMPLES:
#   ./script-name.sh --help             # Show help
#   ./script-name.sh --verbose file.txt # Process file with verbose output
#
# ENVIRONMENT:
#   DEBUG=1                             # Enable debug output
#   VARIABLE_NAME=value                 # Other environment variables
#
# DEPENDENCIES:
#   • Required command-line tools
#   • External scripts or binaries
#   • Minimum bash version
#
# AUTHOR: Your Name / Team Name
# ==============================================================================
```

#### Script Organization Pattern
1. **Header with documentation**
2. **Constants and configuration**
3. **Utility functions (logging, styling)**
4. **Core business logic functions**
5. **Main execution logic**
6. **Sourcing detection and exports**

### 2. Security Best Practices

#### Input Validation
```bash
# GOOD: Validate all inputs
validate_input() {
    local input="$1"
    
    # Check for required parameters
    if [[ -z "$input" ]]; then
        log_error "Input parameter is required"
        return 1
    fi
    
    # Validate format/content
    if [[ ! "$input" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        log_error "Input contains invalid characters"
        return 1
    fi
    
    return 0
}

# BAD: Using input without validation
# eval "$user_input"  # NEVER DO THIS
```

#### Safe Command Execution
```bash
# GOOD: Quote variables and validate commands
execute_command() {
    local cmd="$1"
    local file="$2"
    
    # Validate command is in allowlist
    case "$cmd" in
        "ls"|"cat"|"grep") ;;
        *) log_error "Command not allowed: $cmd"; return 1 ;;
    esac
    
    # Quote variables properly
    "$cmd" "$file"
}

# BAD: Unquoted variables and arbitrary command execution
# $command $file  # Vulnerable to injection
```

#### File Operations
```bash
# GOOD: Safe file operations with validation
safe_write_file() {
    local file="$1"
    local content="$2"
    
    # Validate file path
    if [[ "$file" =~ \.\. ]] || [[ "$file" =~ ^/ ]]; then
        log_error "Invalid file path: $file"
        return 1
    fi
    
    # Use temporary file and atomic move
    local temp_file
    temp_file=$(mktemp) || return 1
    
    # Write to temp file first
    echo "$content" > "$temp_file" || return 1
    
    # Atomic move
    mv "$temp_file" "$file" || return 1
}
```

### 3. Error Handling Strategies

#### Comprehensive Error Handling
```bash
# Set strict error handling
set -euo pipefail

# Custom error handling function
handle_error() {
    local exit_code=$?
    local line_no=$1
    log_error "Script failed at line $line_no with exit code $exit_code"
    # Cleanup operations here
    exit $exit_code
}

# Trap errors
trap 'handle_error $LINENO' ERR

# Function-level error handling
process_file() {
    local file="$1"
    
    if [[ ! -f "$file" ]]; then
        log_error "File does not exist: $file"
        return 1
    fi
    
    if [[ ! -r "$file" ]]; then
        log_error "File is not readable: $file"
        return 1
    fi
    
    # Process file...
    return 0
}
```

#### Exit Code Standards
```bash
# Standard exit codes
readonly EXIT_SUCCESS=0
readonly EXIT_FAILURE=1
readonly EXIT_INVALID_ARGS=2
readonly EXIT_FILE_ERROR=3
readonly EXIT_PERMISSION_ERROR=4
readonly EXIT_NETWORK_ERROR=5

# Use in functions
validate_args() {
    if (( $# < 1 )); then
        log_error "At least one argument required"
        return $EXIT_INVALID_ARGS
    fi
    return $EXIT_SUCCESS
}
```

### 4. Code Quality Standards

#### Variable Naming and Scope
```bash
# GOOD: Descriptive names and proper scope
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly CONFIG_FILE="$HOME/.config/myapp/config.json"

process_user_data() {
    local username="$1"
    local user_data_file="$2"
    local temp_dir
    
    # Use local variables in functions
    temp_dir=$(mktemp -d) || return 1
    
    # Process data...
    
    # Cleanup
    rm -rf "$temp_dir"
}

# BAD: Global variables and unclear names
# user="$1"  # Global scope
# f="$2"     # Unclear name
```

#### Function Design
```bash
# GOOD: Single responsibility, clear purpose
parse_config_value() {
    local config_file="$1"
    local key="$2"
    
    # Validate inputs
    [[ -f "$config_file" ]] || return 1
    [[ -n "$key" ]] || return 1
    
    # Extract value
    grep "^$key=" "$config_file" | cut -d'=' -f2- | head -1
}

# GOOD: Return values, not echo in business logic
get_user_count() {
    local count
    count=$(wc -l < /etc/passwd) || return 1
    
    # Return via exit code for success/failure
    # Output the result
    echo "$count"
    return 0
}
```

#### Documentation Standards
```bash
# Function documentation template
# Description: What the function does
# Arguments:
#   $1 - Description of first argument
#   $2 - Description of second argument
# Returns:
#   0 - Success
#   1 - Error condition
# Output:
#   Description of what gets printed to stdout
# Example:
#   parse_user_config "/path/to/config" "username"
parse_user_config() {
    local config_file="$1"
    local key="$2"
    
    # Implementation...
}
```

### 5. Performance and Efficiency

#### Avoid External Commands in Loops
```bash
# GOOD: Process data in bulk
process_files() {
    local files=("$@")
    
    # Use array processing
    for file in "${files[@]}"; do
        # Process file
        echo "Processing: $file"
    done
}

# BAD: Calling external commands repeatedly
# for i in $(seq 1 100); do
#     date  # Called 100 times
# done
```

#### Use Built-in Features
```bash
# GOOD: Use bash built-ins
get_filename() {
    local path="$1"
    echo "${path##*/}"  # Built-in basename
}

get_directory() {
    local path="$1"
    echo "${path%/*}"   # Built-in dirname
}

# GOOD: Pattern matching
validate_email() {
    local email="$1"
    if [[ "$email" =~ ^[^@]+@[^@]+\.[^@]+$ ]]; then
        return 0
    else
        return 1
    fi
}
```

### 6. Testing and Debugging

#### Debug Support
```bash
# Add debug support to all scripts
debug_print() {
    if [[ "${DEBUG:-}" == "1" ]]; then
        echo -e "${DIM}[DEBUG]${NC} $*" >&2
    fi
}

# Use debug prints strategically
process_data() {
    local data="$1"
    
    debug_print "Processing data: $data"
    
    # Process...
    
    debug_print "Processing completed successfully"
}
```

#### Function Testing
```bash
# Create testable functions
# test_script.sh
test_parse_config() {
    local test_config="/tmp/test_config"
    echo "username=testuser" > "$test_config"
    
    local result
    result=$(parse_config_value "$test_config" "username")
    
    if [[ "$result" == "testuser" ]]; then
        echo "PASS: parse_config_value"
    else
        echo "FAIL: parse_config_value - expected 'testuser', got '$result'"
    fi
    
    rm -f "$test_config"
}
```

### 7. Maintenance and Documentation

#### Change Documentation
```bash
# Version tracking in script header
# VERSION: 2.1.0
# CHANGELOG:
#   2.1.0 - Added interactive selection menu (2024-01-15)
#   2.0.0 - Major rewrite with styling support (2024-01-10)
#   1.0.0 - Initial version (2024-01-01)
```

#### Maintenance Helpers
```bash
# Self-documentation function
show_script_info() {
    echo "Script: $(basename "$0")"
    echo "Version: $(grep "^# VERSION:" "$0" | cut -d: -f2 | tr -d ' ')"
    echo "Location: $(realpath "$0")"
    echo "Dependencies: $(grep "^# DEPENDENCIES:" -A5 "$0" | tail -n +2)"
}
```

## Advanced Patterns from cc-worktree.sh

### Data Processing Pipeline
```bash
# Parse structured data from git
parse_worktrees() {
    git worktree list --porcelain | awk '
        BEGIN { path=""; branch=""; commit="" }
        /^worktree / { 
            if (path) print path "|" branch "|" commit
            path = $2; branch = ""; commit = ""
        }
        /^HEAD / { commit = $2 }
        /^branch / { 
            branch = $2
            gsub(/^refs\/heads\//, "", branch)
        }
        /^detached$/ { branch = "(detached)" }
        END { if (path) print path "|" branch "|" commit }
    '
}
```

### Interactive User Interface
```bash
# Create numbered selection menus
create_selection_menu() {
    local items=("$@")
    local count=0
    
    print_header "Select an Option"
    echo
    
    for item in "${items[@]}"; do
        count=$((count + 1))
        printf "  ${CYAN}%2d${NC}) ${BOLD}%s${NC}\n" "$count" "$item"
    done
    
    echo
    echo -n "Selection (1-$count): "
    read -r selection
    
    if [[ "$selection" =~ ^[0-9]+$ ]] && (( selection >= 1 && selection <= count )); then
        echo "${items[$((selection - 1))]}"
        return 0
    else
        log_error "Invalid selection: $selection"
        return 1
    fi
}
```

### Sourcing Detection Pattern
```bash
# Support both execution and sourcing
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Script is being executed directly
    main "$@"
else
    # Script is being sourced - export functions
    log_info "Functions loaded into shell environment"
    export -f primary_function
    export -f helper_function
fi
```

## Quality Checklist

Before considering a bash script complete, verify:

- [ ] **Header documentation** with description, usage, examples
- [ ] **Error handling** with appropriate exit codes
- [ ] **Input validation** for all parameters
- [ ] **Consistent styling** using project color standards
- [ ] **Proper quoting** of all variables
- [ ] **Security considerations** addressed
- [ ] **Debug support** with DEBUG environment variable
- [ ] **Help documentation** with --help flag
- [ ] **Function modularity** with single responsibilities
- [ ] **Comments** explaining complex logic
- [ ] **Consistent naming** conventions
- [ ] **Performance optimization** where applicable
- [ ] **Testing** with various inputs and edge cases

Following these guidelines ensures bash scripts are professional, maintainable, secure, and consistent with project standards. The `cc-worktree.sh` script serves as a reference implementation of these principles in practice.