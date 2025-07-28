#!/bin/bash

# Set an environment variable to maintain the current working directory for the 'claude' command.
export CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR=1

# Function to print colored log messages
log_info() {
    echo -e "\033[1;34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

log_warning() {
    echo -e "\033[1;33m[WARNING]\033[0m $1"
}

log_error() {
    echo -e "\033[1;31m[ERROR]\033[0m $1"
}

# Function to show help
show_help() {
    echo "Usage: kimi [OPTIONS] [COMMAND]"
    echo ""
    echo "Kimi CLI - A wrapper for Claude with Moonshot AI integration"
    echo ""
    echo "OPTIONS:"
    echo "  -h, --help     Show this help message"
    echo "  --version      Show version information"
    echo ""
    echo "COMMAND:"
    echo "  Any command that claude supports"
    echo ""
    echo "ENVIRONMENT:"
    echo "  The script will source .env files in the following order:"
    echo "  1. .env in project root"
    echo "  2. .env in .kimi directory (if exists)"
    echo ""
    echo "EXAMPLE:"
    echo "  kimi --help"
    echo "  kimi 'Explain this code'"
    echo "  kimi --file src/main.js 'Optimize this function'"
}

# Function to show version
show_version() {
    echo "kimi.sh v1.0.0"
    echo "Claude wrapper for Moonshot AI"
}

# Source environment files with logging
log_info "Loading environment variables..."

# Source .env in project root if it exists
if [[ -f ".env" ]]; then
    log_info "Sourcing .env from project root..."
    source .env
    log_success "Loaded .env from project root"
else
    log_warning "No .env file found in project root"
fi

# Source .env in .kimi directory if it exists
if [[ -f ".kimi/.env" ]]; then
    log_info "Sourcing .env from .kimi directory..."
    source .kimi/.env
    log_success "Loaded .env from .kimi directory"
else
    log_info "No .env file found in .kimi directory"
fi

# Check if KIMI_API_KEY is set
if [[ -z "$KIMI_API_KEY" ]]; then
    log_error "KIMI_API_KEY is not set. Please add it to your .env file:"
    echo "  KIMI_API_KEY=your-api-key-here"
    exit 1
fi

log_success "Environment setup complete"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --version)
            show_version
            exit 0
            ;;
        *)
            break
            ;;
    esac
    shift
done

# Define a shell function named 'kimi'.
kimi() {
    # Set the base URL to point to the Moonshot AI API endpoint.
    export ANTHROPIC_BASE_URL=https://api.moonshot.ai/anthropic
    
    # Set the authentication token using the previously defined KIMI_API_KEY.
    export ANTHROPIC_AUTH_TOKEN=$KIMI_API_KEY
    export ANTHROPIC_MODEL="kimi-k2-0711-preview"

    export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
    # export CLAUDE_CONFIG_DIR=~/.kimi
    
    # Execute the 'claude' command, passing along all arguments given to the 'kimi' function.
    if command -v claude >/dev/null 2>&1; then
        claude "$@"
    else
        log_error "claude command not found. Please install it first:"
        echo "  npm install -g @anthropic-ai/claude"
        exit 1
    fi
}

# Make the function available in the current shell
export -f kimi

# If this script is sourced, the function is now available
# If this script is executed directly, run the kimi function with all arguments
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Script is being executed directly
    kimi "$@"
fi