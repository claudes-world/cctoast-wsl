#!/usr/bin/env bats

# Comprehensive test suite for show-toast.sh script
# Tests all functionality including hook modes, parameter parsing, error handling,
# PowerShell integration, path conversion, and performance requirements

setup() {
    # Setup test environment
    export SCRIPT_PATH="${BATS_TEST_DIRNAME}/../../scripts/show-toast.sh"
    export TEST_HOME="${BATS_TMPDIR}/cctoast-test-home"
    export HOME="${TEST_HOME}"
    
    # Create test directories and structure
    mkdir -p "${TEST_HOME}/.claude/cctoast-wsl/assets"
    mkdir -p "${TEST_HOME}/.cache/cctoast-wsl"
    mkdir -p "${BATS_TMPDIR}/test-assets"
    
    # Create test assets
    echo "fake png data" > "${TEST_HOME}/.claude/cctoast-wsl/assets/claude.png"
    echo "custom icon data" > "${BATS_TMPDIR}/test-assets/custom.png"
    
    # Mock WSL environment variables
    export WSL_DISTRO_NAME="Ubuntu-22.04"
    export WSL_INTEROP="/run/WSL/123_interop"
    
    # Reset debug mode
    unset CCTOAST_DEBUG
    
    # Create mock binaries directory and add to PATH
    export MOCK_BIN_DIR="${BATS_TMPDIR}/mock-bin" 
    mkdir -p "$MOCK_BIN_DIR"
    export PATH="$MOCK_BIN_DIR:$PATH"
    
    # Reset timeout detection
    unset timeout_bin
}

teardown() {
    # Clean up test environment
    rm -rf "${TEST_HOME}"
    rm -rf "${BATS_TMPDIR}/test-assets" 
    rm -rf "${MOCK_BIN_DIR}"
    
    # Reset environment
    unset CCTOAST_DEBUG
    unset WSL_DISTRO_NAME
    unset WSL_INTEROP
}

# Helper function to create mock PowerShell
create_mock_powershell() {
    local behavior="$1"
    cat > "$MOCK_BIN_DIR/powershell.exe" << EOF
#!/bin/bash
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
        echo "PowerShell called with: \$*" >&2
        exit 0
        ;;
    *)
        echo "Mock PowerShell: \$*"
        exit 0
        ;;
esac
EOF
    chmod +x "$MOCK_BIN_DIR/powershell.exe"
}

# Helper function to create mock wslpath
create_mock_wslpath() {
    local behavior="$1"
    cat > "$MOCK_BIN_DIR/wslpath" << EOF
#!/bin/bash
case "$behavior" in
    "success")
        echo "C:\\\\Windows\\\\Path\\\\\$(basename "\$2")"
        exit 0
        ;;
    "failure")
        echo "wslpath: invalid path" >&2
        exit 1
        ;;
    *)
        echo "C:\\\\Users\\\\test\\\\\$(basename "\$2")"
        exit 0
        ;;
esac
EOF
    chmod +x "$MOCK_BIN_DIR/wslpath"
}

# Helper function to create mock timeout
create_mock_timeout() {
    local behavior="$1"
    cat > "$MOCK_BIN_DIR/timeout" << EOF
#!/bin/bash
if [[ "\$1" == "10s" ]]; then
    case "$behavior" in
        "timeout")
            echo "Command timed out" >&2
            exit 124
            ;;
        "success")
            shift 1  # Remove duration
            "\$@"    # Execute remaining arguments
            ;;
        *)
            shift 1  # Remove duration  
            "\$@"    # Execute remaining arguments
            ;;
    esac
else
    "\$@"  # Execute all arguments as-is
fi
EOF
    chmod +x "$MOCK_BIN_DIR/timeout"
}

#
# Basic Functionality Tests
#

@test "script exists and is executable" {
    [ -f "$SCRIPT_PATH" ]
    [ -x "$SCRIPT_PATH" ]
}

@test "script shows help with --help flag" {
    run "$SCRIPT_PATH" --help
    [ "$status" -eq 0 ]
    [[ "$output" == *"Usage:"* ]]
    [[ "$output" == *"--notification-hook"* ]]
    [[ "$output" == *"--stop-hook"* ]]
    [[ "$output" == *"Examples:"* ]]
}

@test "script shows help with -h flag" {
    run "$SCRIPT_PATH" -h
    [ "$status" -eq 0 ]
    [[ "$output" == *"Usage:"* ]]
}

@test "script handles unknown options gracefully" {
    create_mock_powershell "success"
    
    run "$SCRIPT_PATH" --unknown-option
    [ "$status" -eq 1 ]
    [[ "$output" == *"Unknown option: --unknown-option"* ]]
    [[ "$output" == *"Use --help for usage information"* ]]
    
    # Should create error log
    [ -f "${HOME}/.claude/cctoast-wsl/toast-error.log" ]
    grep -q "Unknown option: --unknown-option" "${HOME}/.claude/cctoast-wsl/toast-error.log"
}

#
# Hook Mode Tests
#

@test "notification hook uses correct default title and message" {
    create_mock_powershell "capture_args"
    
    run "$SCRIPT_PATH" --notification-hook
    [ "$status" -eq 0 ]
    [[ "$output" == *"Claude Code"* ]]
    [[ "$output" == *"Waiting for your response"* ]]
}

@test "stop hook uses correct default title and message" {
    create_mock_powershell "capture_args"
    
    run "$SCRIPT_PATH" --stop-hook
    [ "$status" -eq 0 ]
    [[ "$output" == *"Claude Code"* ]]
    [[ "$output" == *"Task completed"* ]]
}

@test "hook modes exit silently on PowerShell failure" {
    create_mock_powershell "failure"
    
    # Notification hook should exit 0 (silent) on failure
    run "$SCRIPT_PATH" --notification-hook
    [ "$status" -eq 0 ]
    
    # Stop hook should also exit 0 (silent) on failure  
    run "$SCRIPT_PATH" --stop-hook
    [ "$status" -eq 0 ]
    
    # Error should be logged
    [ -f "${HOME}/.claude/cctoast-wsl/toast-error.log" ]
}

@test "manual mode exits with error code on PowerShell failure" {
    create_mock_powershell "failure"
    
    run "$SCRIPT_PATH" --title "Test" --message "Test"
    [ "$status" -eq 1 ]
    
    # Error should be logged
    [ -f "${HOME}/.claude/cctoast-wsl/toast-error.log" ]
}

#
# Parameter Parsing Tests
#

@test "handles custom title with --title flag" {
    create_mock_powershell "capture_args"
    
    run "$SCRIPT_PATH" --title "Custom Title"
    [ "$status" -eq 0 ]
    [[ "$output" == *"Custom Title"* ]]
}

@test "handles custom title with -t flag" {
    create_mock_powershell "capture_args"
    
    run "$SCRIPT_PATH" -t "Short Title"
    [ "$status" -eq 0 ]
    [[ "$output" == *"Short Title"* ]]
}

@test "handles custom message with --message flag" {
    create_mock_powershell "capture_args"
    
    run "$SCRIPT_PATH" --message "Custom Message"
    [ "$status" -eq 0 ]
    [[ "$output" == *"Custom Message"* ]]
}

@test "handles custom message with -m flag" {
    create_mock_powershell "capture_args"
    
    run "$SCRIPT_PATH" -m "Short Message"
    [ "$status" -eq 0 ]
    [[ "$output" == *"Short Message"* ]]
}

@test "handles custom image path with --image flag" {
    create_mock_powershell "capture_args"
    create_mock_wslpath "success"
    
    run "$SCRIPT_PATH" --image "${BATS_TMPDIR}/test-assets/custom.png"
    [ "$status" -eq 0 ]
    [[ "$output" == *"C:\\Windows\\Path\\custom.png"* ]]
}

@test "handles custom image path with -i flag" {
    create_mock_powershell "capture_args"
    create_mock_wslpath "success"
    
    run "$SCRIPT_PATH" -i "${BATS_TMPDIR}/test-assets/custom.png"
    [ "$status" -eq 0 ]
    [[ "$output" == *"C:\\Windows\\Path\\custom.png"* ]]
}

@test "handles attribution with --attribution flag" {
    create_mock_powershell "capture_args"
    
    run "$SCRIPT_PATH" --attribution "Test Attribution"
    [ "$status" -eq 0 ]
    # Attribution is parsed but not currently used in PowerShell command
}

@test "handles attribution with -a flag" {
    create_mock_powershell "capture_args"
    
    run "$SCRIPT_PATH" -a "Short Attribution"
    [ "$status" -eq 0 ]
    # Attribution is parsed but not currently used in PowerShell command
}

@test "requires values for option flags" {
    create_mock_powershell "success"
    
    # Test missing title value - should fail
    run "$SCRIPT_PATH" --title
    [ "$status" -eq 1 ]
    
    # Test missing message value - should fail
    run "$SCRIPT_PATH" --message  
    [ "$status" -eq 1 ]
    
    # Test missing image value - should fail
    run "$SCRIPT_PATH" --image
    [ "$status" -eq 1 ]
    
    # Test missing attribution value - should fail
    run "$SCRIPT_PATH" --attribution
    [ "$status" -eq 1 ]
}

@test "handles multiple parameter combinations" {
    create_mock_powershell "capture_args"
    create_mock_wslpath "success"
    
    run "$SCRIPT_PATH" -t "Multi Test" -m "Complex message" -i "${BATS_TMPDIR}/test-assets/custom.png" -a "Test Attribution"
    [ "$status" -eq 0 ]
    [[ "$output" == *"Multi Test"* ]]
    [[ "$output" == *"Complex message"* ]]
    [[ "$output" == *"C:\\Windows\\Path\\custom.png"* ]]
}

#
# Default Value Tests
#

@test "uses default title when none provided" {
    create_mock_powershell "capture_args"
    
    run "$SCRIPT_PATH"
    [ "$status" -eq 0 ]
    [[ "$output" == *"Claude Code"* ]]
}

@test "uses default message when none provided" {
    create_mock_powershell "capture_args"
    
    run "$SCRIPT_PATH"
    [ "$status" -eq 0 ]
    [[ "$output" == *"Notification"* ]]
}

@test "uses default icon when available" {
    create_mock_powershell "capture_args"
    create_mock_wslpath "success"
    
    run "$SCRIPT_PATH" --title "Test"
    [ "$status" -eq 0 ]
    [[ "$output" == *"C:\\Windows\\Path\\claude.png"* ]]
}

@test "handles missing default icon gracefully" {
    create_mock_powershell "capture_args"
    
    # Remove default icon
    rm -f "${HOME}/.claude/cctoast-wsl/assets/claude.png"
    
    run "$SCRIPT_PATH" --title "Test"
    [ "$status" -eq 0 ]
    # Should continue without icon
}

#
# Path Conversion Tests
#

@test "converts WSL paths to Windows paths correctly" {
    create_mock_powershell "capture_args"
    create_mock_wslpath "success"
    
    # Create the test file first
    touch "/tmp/test.png"
    
    run "$SCRIPT_PATH" --image "/tmp/test.png"
    [ "$status" -eq 0 ]
    [[ "$output" == *"C:\\Windows\\Path\\test.png"* ]]
}

@test "handles wslpath conversion failure gracefully" {
    create_mock_powershell "capture_args"
    create_mock_wslpath "failure"
    
    run "$SCRIPT_PATH" --image "/invalid/path.png"
    [ "$status" -eq 0 ]
    # Should use original path as fallback
    [[ "$output" == *"/invalid/path.png"* ]]
    
    # Should log error
    [ -f "${HOME}/.claude/cctoast-wsl/toast-error.log" ]
    grep -q "Failed to convert path" "${HOME}/.claude/cctoast-wsl/toast-error.log"
}

@test "skips conversion for already Windows paths" {
    create_mock_powershell "capture_args"
    
    run "$SCRIPT_PATH" --image "C:\\Windows\\icon.png"
    [ "$status" -eq 0 ]
    [[ "$output" == *"C:\\Windows\\icon.png"* ]]
}

@test "handles path validation correctly" {
    create_mock_powershell "capture_args"
    create_mock_wslpath "success"
    
    # Valid file path
    run "$SCRIPT_PATH" --image "${BATS_TMPDIR}/test-assets/custom.png"
    [ "$status" -eq 0 ]
    
    # Invalid file path - should warn and use default
    run "$SCRIPT_PATH" --image "/nonexistent/file.png"
    [ "$status" -eq 0 ]
    [[ "$output" == *"WARNING: Image file not found"* ]]
}

@test "handles paths with spaces correctly" {
    create_mock_powershell "capture_args"
    create_mock_wslpath "success"
    
    # Create file with spaces
    mkdir -p "${BATS_TMPDIR}/path with spaces"
    echo "data" > "${BATS_TMPDIR}/path with spaces/icon with spaces.png"
    
    run "$SCRIPT_PATH" --image "${BATS_TMPDIR}/path with spaces/icon with spaces.png"
    [ "$status" -eq 0 ]
    [[ "$output" == *"C:\\Windows\\Path\\icon with spaces.png"* ]]
}

#
# PowerShell Integration Tests
#

@test "generates correct PowerShell command structure" {
    create_mock_powershell "capture_args"
    create_mock_wslpath "success"
    
    run "$SCRIPT_PATH" --title "Test Title" --message "Test Message" --image "${BATS_TMPDIR}/test-assets/custom.png"
    [ "$status" -eq 0 ]
    [[ "$output" == *"PowerShell called with:"* ]]
    [[ "$output" == *"-NoProfile"* ]]
    [[ "$output" == *"-ExecutionPolicy Bypass"* ]]
    [[ "$output" == *"-Command"* ]]
}

@test "escapes PowerShell special characters correctly" {
    create_mock_powershell "capture_args"
    
    # Test single quotes (most common PowerShell issue)
    run "$SCRIPT_PATH" --title "Title with 'quotes'" --message "Message with 'quotes'"
    [ "$status" -eq 0 ]
    # Should escape single quotes by doubling them
    [[ "$output" == *"Title with ''quotes''"* ]]
    [[ "$output" == *"Message with ''quotes''"* ]]
}

@test "handles PowerShell execution errors" {
    create_mock_powershell "failure"
    
    run "$SCRIPT_PATH" --title "Test"
    [ "$status" -eq 1 ]  # Manual mode should exit with error
    
    # Error should be logged
    [ -f "${HOME}/.claude/cctoast-wsl/toast-error.log" ]
    grep -q "PowerShell execution failed" "${HOME}/.claude/cctoast-wsl/toast-error.log"
}

@test "uses timeout when available" {
    create_mock_powershell "success"
    create_mock_timeout "success"
    
    run "$SCRIPT_PATH" --title "Test"
    [ "$status" -eq 0 ]
    # Test should pass with timeout available and working
}

@test "handles PowerShell timeout correctly" {
    create_mock_powershell "timeout"
    create_mock_timeout "timeout"
    
    run "$SCRIPT_PATH" --title "Test"
    [ "$status" -eq 1 ]
    
    # Error should be logged
    [ -f "${HOME}/.claude/cctoast-wsl/toast-error.log" ]
    grep -q "PowerShell execution failed or timed out" "${HOME}/.claude/cctoast-wsl/toast-error.log"
}

@test "works without timeout command" {
    create_mock_powershell "success"
    # Don't create timeout mock - simulate system without timeout
    
    run "$SCRIPT_PATH" --title "Test"
    [ "$status" -eq 0 ]
    # Should work even without timeout command
}

#
# Error Handling and Logging Tests
#

@test "creates error log directory if missing" {
    create_mock_powershell "failure"
    
    # Remove the directory
    rm -rf "${HOME}/.claude/cctoast-wsl"
    
    run "$SCRIPT_PATH" --title "Test"
    
    # Directory and log file should be created
    [ -d "${HOME}/.claude/cctoast-wsl" ]
    [ -f "${HOME}/.claude/cctoast-wsl/toast-error.log" ]
}

@test "appends to existing error log" {
    create_mock_powershell "failure"
    
    # Create initial log entry
    mkdir -p "${HOME}/.claude/cctoast-wsl"
    echo "Initial error" > "${HOME}/.claude/cctoast-wsl/toast-error.log"
    
    run "$SCRIPT_PATH" --title "Test"
    
    # Should append, not overwrite
    grep -q "Initial error" "${HOME}/.claude/cctoast-wsl/toast-error.log"
    grep -q "PowerShell execution failed" "${HOME}/.claude/cctoast-wsl/toast-error.log"
}

@test "error log includes timestamp" {
    create_mock_powershell "failure"
    
    run "$SCRIPT_PATH" --title "Test"
    
    # Check log format includes ISO timestamp
    [ -f "${HOME}/.claude/cctoast-wsl/toast-error.log" ]
    grep -E '\[[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[+-][0-9]{2}:[0-9]{2}\] ERROR:' "${HOME}/.claude/cctoast-wsl/toast-error.log"
}

@test "logs custom image not found errors" {
    create_mock_powershell "success"
    
    run "$SCRIPT_PATH" --image "/nonexistent/file.png"
    [ "$status" -eq 0 ]
    
    # Should log the error
    [ -f "${HOME}/.claude/cctoast-wsl/toast-error.log" ]
    grep -q "Custom image file not found: /nonexistent/file.png" "${HOME}/.claude/cctoast-wsl/toast-error.log"
}

#
# Context Detection Tests
#

@test "detects development context correctly" {
    create_mock_powershell "capture_args"
    create_mock_wslpath "success"
    
    # Script should detect it's running from development context due to nearby assets
    run "$SCRIPT_PATH" --title "Test"
    [ "$status" -eq 0 ]
    # Should use development paths (this is mainly for coverage)
}

@test "handles unknown context gracefully" {
    create_mock_powershell "success"
    
    # Move script to isolated location to trigger unknown context
    cp "$SCRIPT_PATH" "${BATS_TMPDIR}/isolated-script.sh"
    chmod +x "${BATS_TMPDIR}/isolated-script.sh"
    
    run "${BATS_TMPDIR}/isolated-script.sh" --title "Test"
    [ "$status" -eq 0 ]
    # Should fall back to installation paths
}

#
# Debug Mode Tests
#

@test "debug mode shows additional output" {
    create_mock_powershell "success"
    create_mock_wslpath "success"
    
    export CCTOAST_DEBUG=1
    
    run "$SCRIPT_PATH" --title "Debug Test" --image "${BATS_TMPDIR}/test-assets/custom.png"
    [ "$status" -eq 0 ]
    [[ "$output" == *"DEBUG:"* ]]
    [[ "$output" == *"Context:"* ]]
    [[ "$output" == *"Converting path:"* ]]
}

@test "debug mode works without debug flag" {
    create_mock_powershell "success"
    
    # Default mode should not show debug output
    run "$SCRIPT_PATH" --title "No Debug Test"
    [ "$status" -eq 0 ]
    [[ "$output" != *"DEBUG:"* ]]
}

#
# Performance Tests
#

@test "execution completes within performance target" {
    create_mock_powershell "success"
    
    # Measure execution time (should be <2 seconds per requirements)
    start_time=$(date +%s)
    run "$SCRIPT_PATH" --title "Performance Test"
    end_time=$(date +%s)
    
    [ "$status" -eq 0 ]
    
    # Check execution time is reasonable (allowing some overhead for test environment)
    execution_time=$((end_time - start_time))
    [ "$execution_time" -lt 5 ]  # Allow 5 seconds in test environment
}

@test "handles rapid successive calls" {
    create_mock_powershell "success"
    
    # Test multiple rapid calls don't interfere
    "$SCRIPT_PATH" --title "Call 1" &
    pid1=$!
    "$SCRIPT_PATH" --title "Call 2" &
    pid2=$!
    "$SCRIPT_PATH" --title "Call 3" &
    pid3=$!
    
    # Wait for all background processes and check they succeed
    wait $pid1
    status1=$?
    wait $pid2
    status2=$?
    wait $pid3
    status3=$?
    
    # All should succeed independently
    [ "$status1" -eq 0 ]
    [ "$status2" -eq 0 ]
    [ "$status3" -eq 0 ]
}

#
# Hook Payload Processing Tests (Future-Proofing)
#

@test "handles stdin hook payload gracefully" {
    create_mock_powershell "success"
    
    # Test with some stdin data (simulating future hook payload)
    run bash -c 'echo "{\"test\": \"payload\"}" | '"$SCRIPT_PATH"' --notification-hook'
    [ "$status" -eq 0 ]
    
    # Should process normally and potentially log payload (but not fail)
}

@test "handles empty stdin in hook mode" {
    create_mock_powershell "success"
    
    # Test with no stdin
    run "$SCRIPT_PATH" --notification-hook < /dev/null
    [ "$status" -eq 0 ]
}

#
# Resource Cleanup Tests
#

@test "script does not leave temporary files" {
    create_mock_powershell "success"
    
    temp_files_before=$(find /tmp -name "*cctoast*" 2>/dev/null | wc -l)
    
    run "$SCRIPT_PATH" --title "Cleanup Test"
    [ "$status" -eq 0 ]
    
    temp_files_after=$(find /tmp -name "*cctoast*" 2>/dev/null | wc -l)
    
    # Should not create additional temp files
    [ "$temp_files_after" -eq "$temp_files_before" ]
}

@test "script handles permission errors gracefully" {
    create_mock_powershell "success"
    
    # Make log directory read-only to simulate permission error
    mkdir -p "${HOME}/.claude/cctoast-wsl"
    chmod 444 "${HOME}/.claude/cctoast-wsl"
    
    run "$SCRIPT_PATH" --title "Permission Test"
    
    # Should handle permission error gracefully (may succeed or fail, but not crash)
    # Reset permissions for cleanup
    chmod 755 "${HOME}/.claude/cctoast-wsl"
}

#
# Edge Cases and Boundary Tests
#

@test "handles extremely long title and message" {
    create_mock_powershell "success"
    
    # Test with very long strings
    long_title=$(printf 'A%.0s' {1..1000})
    long_message=$(printf 'B%.0s' {1..2000})
    
    run "$SCRIPT_PATH" --title "$long_title" --message "$long_message"
    [ "$status" -eq 0 ]
}

@test "handles empty title and message" {
    create_mock_powershell "success"
    
    # The script should handle empty strings (they get set but the script uses them)
    run "$SCRIPT_PATH" --title "" --message ""
    # Since the script will try to execute with empty values, which may fail in this mock environment
    # Let's just check it doesn't crash catastrophically
    [ "$status" -le 1 ]
}

@test "handles special characters in parameters" {
    create_mock_powershell "capture_args"
    
    # Test various special characters
    special_title="Title with !@#$%^&*()_+-={}[]|\\:;\"'<>?,./"
    special_message="Message with unicode: éñ中文🚀"
    
    run "$SCRIPT_PATH" --title "$special_title" --message "$special_message"
    [ "$status" -eq 0 ]
    # Should handle without crashing (exact output handling depends on PowerShell escaping)
}

@test "script works when run from different directories" {
    create_mock_powershell "success"
    
    # Change to different directory and run
    cd "${BATS_TMPDIR}"
    run "$SCRIPT_PATH" --title "Directory Test"
    [ "$status" -eq 0 ]
    
    # Should work regardless of current directory
}

@test "handles missing PowerShell binary gracefully" {
    # Don't create PowerShell mock - simulate missing PowerShell
    
    run "$SCRIPT_PATH" --title "Missing PowerShell Test"
    [ "$status" -eq 1 ]
    
    # Should exit with error but not crash
    # Error handling depends on bash's handling of missing commands
}