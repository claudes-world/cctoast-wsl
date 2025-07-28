#!/usr/bin/env bash

# Bats helper functions for cctoast-wsl shell testing
# Provides common utilities for mock creation and test assertions

# Create a comprehensive mock PowerShell environment
setup_powershell_mock() {
    local behavior="${1:-success}"
    local mock_bin_dir="${2:-${BATS_TMPDIR}/mock-bin}"
    
    mkdir -p "$mock_bin_dir"
    
    cat > "$mock_bin_dir/powershell.exe" << 'EOF'
#!/bin/bash
# Mock PowerShell for testing BurntToast functionality
# Supports multiple behaviors for comprehensive testing

behavior="$CCTOAST_MOCK_BEHAVIOR"
if [[ -z "$behavior" ]]; then
    behavior="success"
fi

case "$behavior" in
    "success")
        echo "BurntToast notification displayed successfully"
        exit 0
        ;;
    "failure")
        echo "PowerShell error occurred" >&2
        exit 1
        ;;
    "timeout")
        sleep 15
        exit 0
        ;;
    "capture_args")
        echo "PowerShell called with: $*" >&2
        exit 0
        ;;
    "missing_module")
        echo "Import-Module : The specified module 'BurntToast' was not loaded" >&2
        exit 1
        ;;
    "execution_policy")
        echo "Execution of scripts is disabled on this system" >&2
        exit 1
        ;;
    *)
        echo "Mock PowerShell: $*"
        exit 0
        ;;
esac
EOF
    chmod +x "$mock_bin_dir/powershell.exe"
    export CCTOAST_MOCK_BEHAVIOR="$behavior"
}

# Create mock wslpath with different behaviors
setup_wslpath_mock() {
    local behavior="${1:-success}"
    local mock_bin_dir="${2:-${BATS_TMPDIR}/mock-bin}"
    
    mkdir -p "$mock_bin_dir"
    
    cat > "$mock_bin_dir/wslpath" << 'EOF'
#!/bin/bash
# Mock wslpath for testing path conversion

behavior="$CCTOAST_WSLPATH_BEHAVIOR"
if [[ -z "$behavior" ]]; then
    behavior="success"
fi

case "$behavior" in
    "success")
        echo "C:\\Windows\\Path\\$(basename "$2")"
        exit 0
        ;;
    "failure")
        echo "wslpath: invalid path" >&2
        exit 1
        ;;
    "spaces")
        echo "C:\\Path With Spaces\\$(basename "$2")"
        exit 0
        ;;
    *)
        echo "C:\\Users\\test\\$(basename "$2")"
        exit 0
        ;;
esac
EOF
    chmod +x "$mock_bin_dir/wslpath"
    export CCTOAST_WSLPATH_BEHAVIOR="$behavior"
}

# Create mock timeout command
setup_timeout_mock() {
    local behavior="${1:-success}"
    local mock_bin_dir="${2:-${BATS_TMPDIR}/mock-bin}"
    
    mkdir -p "$mock_bin_dir"
    
    cat > "$mock_bin_dir/timeout" << 'EOF'
#!/bin/bash
# Mock timeout command for testing timeout behavior

behavior="$CCTOAST_TIMEOUT_BEHAVIOR"
if [[ -z "$behavior" ]]; then
    behavior="success"
fi

if [[ "$1" == "10s" ]]; then
    case "$behavior" in
        "timeout")
            echo "Command timed out" >&2
            exit 124
            ;;
        "success")
            shift 1  # Remove duration
            "$@"     # Execute remaining arguments
            ;;
        *)
            shift 1  # Remove duration  
            "$@"     # Execute remaining arguments
            ;;
    esac
else
    "$@"  # Execute all arguments as-is
fi
EOF
    chmod +x "$mock_bin_dir/timeout"
    export CCTOAST_TIMEOUT_BEHAVIOR="$behavior"
}

# Assert that error log contains specific message
assert_error_logged() {
    local expected_message="$1"
    local log_file="${HOME}/.claude/cctoast-wsl/toast-error.log"
    
    [ -f "$log_file" ] || {
        echo "Error log file does not exist: $log_file" >&2
        return 1
    }
    
    grep -q "$expected_message" "$log_file" || {
        echo "Expected message not found in error log: $expected_message" >&2
        echo "Log contents:" >&2
        cat "$log_file" >&2
        return 1
    }
}

# Assert that error log has proper timestamp format
assert_error_log_timestamp() {
    local log_file="${HOME}/.claude/cctoast-wsl/toast-error.log"
    
    [ -f "$log_file" ] || {
        echo "Error log file does not exist: $log_file" >&2
        return 1
    }
    
    grep -E '\[[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[+-][0-9]{2}:[0-9]{2}\] ERROR:' "$log_file" || {
        echo "Error log does not contain properly formatted timestamps" >&2
        echo "Log contents:" >&2
        cat "$log_file" >&2
        return 1
    }
}

# Create test assets directory with sample files
setup_test_assets() {
    local assets_dir="${1:-${BATS_TMPDIR}/test-assets}"
    
    mkdir -p "$assets_dir"
    echo "fake png data" > "$assets_dir/test.png"
    echo "custom icon data" > "$assets_dir/custom.png"
    
    # Create files with special characters
    mkdir -p "$assets_dir/path with spaces"
    echo "spaced file" > "$assets_dir/path with spaces/icon with spaces.png"
    
    # Create files with various extensions
    echo "jpeg data" > "$assets_dir/test.jpg"
    echo "gif data" > "$assets_dir/test.gif"
    echo "ico data" > "$assets_dir/test.ico"
    
    export CCTOAST_TEST_ASSETS="$assets_dir"
}

# Measure execution time of a command
measure_execution_time() {
    local start_time end_time execution_time
    start_time=$(date +%s%N)
    "$@"
    local exit_code=$?
    end_time=$(date +%s%N)
    execution_time=$(( (end_time - start_time) / 1000000 ))  # Convert to milliseconds
    
    echo "Execution time: ${execution_time}ms" >&2
    export CCTOAST_LAST_EXECUTION_TIME="$execution_time"
    return $exit_code
}

# Assert execution time is within limits
assert_execution_time_under() {
    local max_time_ms="$1"
    local actual_time="${CCTOAST_LAST_EXECUTION_TIME:-0}"
    
    [ "$actual_time" -lt "$max_time_ms" ] || {
        echo "Execution time $actual_time ms exceeds limit of $max_time_ms ms" >&2
        return 1
    }
}

# Create comprehensive mock environment
setup_full_mock_environment() {
    local mock_bin_dir="${BATS_TMPDIR}/mock-bin"
    export PATH="$mock_bin_dir:$PATH"
    
    setup_powershell_mock "success" "$mock_bin_dir"
    setup_wslpath_mock "success" "$mock_bin_dir"
    setup_timeout_mock "success" "$mock_bin_dir"
    setup_test_assets
}

# Clean up mock environment
cleanup_mock_environment() {
    unset CCTOAST_MOCK_BEHAVIOR
    unset CCTOAST_WSLPATH_BEHAVIOR
    unset CCTOAST_TIMEOUT_BEHAVIOR
    unset CCTOAST_TEST_ASSETS
    unset CCTOAST_LAST_EXECUTION_TIME
    rm -rf "${BATS_TMPDIR}/mock-bin" 2>/dev/null || true
    rm -rf "${BATS_TMPDIR}/test-assets" 2>/dev/null || true
}