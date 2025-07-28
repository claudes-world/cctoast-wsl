
#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# cc-worktree.sh - Enhanced Git Worktree Launcher for Claude Code
# ==============================================================================
#
# DESCRIPTION:
#   Interactive git worktree selector and Claude Code launcher with beautiful
#   terminal UI. Supports both direct execution and shell sourcing for
#   integration into development workflows.
#
# FEATURES:
#   • Interactive numbered selection menu with colored output
#   • Flexible input handling (numbers, issue IDs, partial/full names)
#   • Pretty Unicode borders and professional styling
#   • Shell sourcing support for function export
#   • Comprehensive error handling and validation
#   • Help documentation and debug mode
#
# USAGE:
#   ./cc-worktree.sh                    # Interactive selection menu
#   ./cc-worktree.sh 2                  # Select worktree #2 from list
#   ./cc-worktree.sh 10                 # Match worktree containing '10'
#   ./cc-worktree.sh worktree-issue7    # Exact worktree name match
#   ./cc-worktree.sh --help             # Show help documentation
#   source ./cc-worktree.sh             # Load functions into shell
#
# ENVIRONMENT:
#   DEBUG=1                             # Enable verbose debug output
#
# DEPENDENCIES:
#   • git (with worktree support)
#   • claude (Claude Code CLI)
#   • awk, bash 4.0+
#
# AUTHOR: Enhanced by Claude Code for cctoast-wsl project
# ==============================================================================

# Original Idea
# launch_claude_worktree() {
#   local wt="$1"
#   local repo_root
#   repo_root=$(git rev-parse --show-toplevel)
#   export GIT_DIR="$repo_root/.git/worktrees/$wt"
#   export GIT_WORK_TREE="$repo_root/$wt"
#   claude
# }

# Colors and styling (consistent with project standards)
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly BOLD='\033[1m'
readonly DIM='\033[2m'
readonly NC='\033[0m' # No Color

# Unicode box-drawing characters for pretty output
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

# Logging functions with consistent styling
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

# Parse git worktree list and return structured data
# Returns: "path|branch|commit" format, one per line
parse_worktrees() {
    git worktree list --porcelain | awk '
        BEGIN { path=""; branch=""; commit="" }
        /^worktree / { 
            if (path) print path "|" branch "|" commit
            path = $2; branch = ""; commit = ""
        }
        /^HEAD / { commit = $2 }
        /^branch / { 
            # Extract just the branch name from refs/heads/branch-name
            branch = $2
            gsub(/^refs\/heads\//, "", branch)
        }
        /^detached$/ { branch = "(detached)" }
        END { if (path) print path "|" branch "|" commit }
    '
}

# Display formatted worktree list with numbers
list_worktrees() {
    local worktrees=()
    local count=0
    
    print_header "Available Git Worktrees"
    echo
    
    while IFS='|' read -r path branch commit; do
        count=$((count + 1))
        worktrees+=("$path|$branch|$commit")
        
        local name=$(basename "$path")
        local short_commit=${commit:0:7}
        
        # Color coding based on branch type
        local branch_color="$NC"
        if [[ "$branch" == "main" || "$branch" == "master" ]]; then
            branch_color="$GREEN"
        elif [[ "$branch" =~ ^feat/ ]]; then
            branch_color="$BLUE"
        elif [[ "$branch" =~ ^fix/ ]]; then
            branch_color="$YELLOW"
        elif [[ "$branch" == "(detached)" ]]; then
            branch_color="$RED"
        fi
        
        printf "  ${CYAN}%2d${NC}) ${BOLD}%-20s${NC} ${branch_color}%-30s${NC} ${DIM}%s${NC}\n" \
            "$count" "$name" "$branch" "$short_commit"
    done < <(parse_worktrees)
    
    echo
    return $count
}

# Resolve worktree selection (number, partial name, or full name)
resolve_worktree() {
    local input="$1"
    local worktrees=()
    local count=0
    
    # Build worktree array
    while IFS='|' read -r path branch commit; do
        count=$((count + 1))
        worktrees+=("$path")
    done < <(parse_worktrees)
    
    # If input is a number and in valid range, return that worktree
    if [[ "$input" =~ ^[0-9]+$ ]] && (( input >= 1 && input <= count )); then
        echo "${worktrees[$((input - 1))]}"
        return 0
    fi
    
    # Try exact match first
    for wt_path in "${worktrees[@]}"; do
        if [[ "$(basename "$wt_path")" == "$input" ]]; then
            echo "$wt_path"
            return 0
        fi
    done
    
    # Try partial match (issue number or substring)
    local matches=()
    for wt_path in "${worktrees[@]}"; do
        local wt_name=$(basename "$wt_path")
        # Check for issue number pattern (worktree-issue<number>)
        if [[ "$wt_name" =~ ^worktree-issue${input}$ ]] || 
           [[ "$wt_name" =~ -issue${input}- ]] ||
           [[ "$wt_name" == *"$input"* ]]; then
            matches+=("$wt_path")
        fi
    done
    
    if (( ${#matches[@]} == 1 )); then
        echo "${matches[0]}"
        return 0
    elif (( ${#matches[@]} > 1 )); then
        log_error "Ambiguous match for '$input'. Matches:"
        for match in "${matches[@]}"; do
            echo "  - $(basename "$match")"
        done
        return 1
    fi
    
    log_error "No worktree found matching: $input"
    return 1
}

# Interactive worktree selection
select_worktree_interactive() {
    local count
    list_worktrees
    count=$?
    
    if (( count == 0 )); then
        log_error "No worktrees found"
        return 1
    fi
    
    echo -n "Select worktree (1-$count): "
    read -r selection
    
    if [[ -z "$selection" ]]; then
        log_warning "No selection made"
        return 1
    fi
    
    resolve_worktree "$selection"
}

# Validate worktree exists and is accessible
validate_worktree() {
    local wt_path="$1"
    
    if [[ ! -d "$wt_path" ]]; then
        log_error "Worktree directory does not exist: $wt_path"
        return 1
    fi
    
    if [[ ! -r "$wt_path" ]]; then
        log_error "Worktree directory is not readable: $wt_path"
        return 1
    fi
    
    return 0
}

# Show help information
show_help() {
    print_header "cc-worktree.sh - Git Worktree Launcher"
    cat << EOF

USAGE:
    $0 [WORKTREE]
    source $0  # For shell integration

ARGUMENTS:
    WORKTREE    Worktree identifier (number, partial name, or full name)
                If omitted, shows interactive selection menu

EXAMPLES:
    $0                    # Interactive selection
    $0 2                  # Select worktree #2 from list
    $0 10                 # Match worktree containing '10' (e.g., worktree-issue10)
    $0 worktree-issue7    # Exact worktree name

ENVIRONMENT:
    DEBUG=1               Enable debug output

EOF
}

launch_claude_worktree() {
    local wt="$1"
    local repo_root
    local wt_branch
    local wt_name
    
    log_debug "Launching Claude for worktree: $wt"
    
    # Validate worktree
    if ! validate_worktree "$wt"; then
        return 1
    fi
    
    repo_root=$(git rev-parse --show-toplevel)
    wt_name=$(basename "$wt")
    
    # Change to worktree directory to get correct branch
    (
        cd "$wt" || exit 1
        wt_branch=$(git rev-parse --abbrev-ref HEAD)
        
        log_info "Launching Claude Code for worktree: ${BOLD}$wt_name${NC}"
        log_info "Branch: ${CYAN}$wt_branch${NC}"
        log_info "Path: ${DIM}$wt${NC}"
        
        export GIT_DIR="$repo_root/.git/worktrees/$wt_name"
        export GIT_WORK_TREE="$wt"
        
        claude "Make sure to cd into the worktree directory (\`$wt\`) and do all work on the correct branch (\`$wt_branch\`)."
    )
}

# Main execution logic
main() {
    local arg="${1:-}"
    
    # Handle help flag
    if [[ "$arg" == "--help" || "$arg" == "-h" ]]; then
        show_help
        return 0
    fi
    
    # If no arguments, start interactive selection
    if [[ -z "$arg" ]]; then
        local selected_wt
        if selected_wt=$(select_worktree_interactive); then
            launch_claude_worktree "$selected_wt"
        else
            return 1
        fi
    else
        # Resolve and launch specified worktree
        local resolved_wt
        if resolved_wt=$(resolve_worktree "$arg"); then
            launch_claude_worktree "$resolved_wt"
        else
            return 1
        fi
    fi
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Script is being executed directly
    main "$@"
else
    # Script is being sourced - export the function for shell use
    log_info "cc-worktree.sh functions loaded into shell"
    log_info "Use 'launch_claude_worktree <worktree>' or just run the script directly"
    export -f launch_claude_worktree
    export -f list_worktrees
    export -f resolve_worktree
    export -f select_worktree_interactive
fi