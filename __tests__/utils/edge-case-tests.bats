#!/usr/bin/env bats

# Edge case testing suite for show-toast.sh
# Tests unusual inputs, boundary conditions, and error scenarios

load "bats-helpers"

setup() {
    export SCRIPT_PATH="${BATS_TEST_DIRNAME}/../../scripts/show-toast.sh"
    export TEST_HOME="${BATS_TMPDIR}/cctoast-test-home"
    export HOME="${TEST_HOME}"
    
    # Create test environment
    mkdir -p "${TEST_HOME}/.claude/cctoast-wsl/assets"
    echo "fake png data" > "${TEST_HOME}/.claude/cctoast-wsl/assets/claude.png"
    
    # Mock WSL environment
    export WSL_DISTRO_NAME="Ubuntu-22.04"
    export WSL_INTEROP="/run/WSL/123_interop"
    
    setup_full_mock_environment
}

teardown() {
    cleanup_mock_environment
    rm -rf "${TEST_HOME}"
}

@test "handles null bytes in input gracefully" {
    setup_powershell_mock "capture_args"
    
    # Create title with null byte (should not crash)
    local title_with_null="Test$(printf '\0')Title"
    
    run "$SCRIPT_PATH" --title "$title_with_null" --message "Test"
    [ "$status" -eq 0 ]
    # Should handle without crashing
}

@test "handles maximum argument length" {
    setup_powershell_mock "success"
    
    # Create very long arguments (approaching shell limits)
    local max_title max_message
    max_title=$(printf 'T%.0s' {1..10000})
    max_message=$(printf 'M%.0s' {1..10000})
    
    run "$SCRIPT_PATH" --title "$max_title" --message "$max_message"
    # Should handle without crashing (may succeed or fail gracefully)
    [ "$status" -le 1 ]
}

@test "handles Unicode and emoji characters" {
    setup_powershell_mock "capture_args"
    
    # Test with various Unicode characters
    local unicode_title="Test 🚀 中文 éñüñciation"
    local unicode_message="Message with émojis: 🎉🔔💻"
    
    run "$SCRIPT_PATH" --title "$unicode_title" --message "$unicode_message"
    [ "$status" -eq 0 ]
    # Should handle Unicode gracefully
}

@test "handles control characters in input" {
    setup_powershell_mock "capture_args"
    
    # Test with control characters
    local control_title="Test$(printf '\t\n\r')Title"
    local control_message="Message$(printf '\b\f\a')Text"
    
    run "$SCRIPT_PATH" --title "$control_title" --message "$control_message"
    [ "$status" -eq 0 ]
    # Should handle control characters without crashing
}

@test "handles binary data in parameters" {
    setup_powershell_mock "capture_args"
    
    # Create parameters with binary data
    local binary_data=$(printf '\x00\x01\x02\xFF\xFE\xFD')
    
    run "$SCRIPT_PATH" --title "Binary$binary_data" --message "Test"
    # Should not crash, may succeed or fail gracefully
    [ "$status" -le 1 ]
}

@test "handles extremely deep directory paths" {
    setup_powershell_mock "success"
    setup_wslpath_mock "success"
    
    # Create very deep directory structure
    local deep_path="${BATS_TMPDIR}"
    for i in {1..50}; do
        deep_path="$deep_path/very_long_directory_name_$i"
    done
    
    mkdir -p "$deep_path"
    echo "deep file" > "$deep_path/deep.png"
    
    run "$SCRIPT_PATH" --image "$deep_path/deep.png"
    # Should handle deep paths without crashing
    [ "$status" -le 1 ]
}

@test "handles symlinks and special files" {
    setup_powershell_mock "success"
    setup_wslpath_mock "success"
    
    # Create various special files
    mkdir -p "${BATS_TMPDIR}/special-files"
    
    # Regular file
    echo "normal" > "${BATS_TMPDIR}/special-files/normal.png"
    
    # Symlink
    ln -s "normal.png" "${BATS_TMPDIR}/special-files/symlink.png"
    
    # Test with symlink
    run "$SCRIPT_PATH" --image "${BATS_TMPDIR}/special-files/symlink.png"
    [ "$status" -eq 0 ]
    
    # Test with broken symlink
    ln -s "nonexistent.png" "${BATS_TMPDIR}/special-files/broken.png"
    run "$SCRIPT_PATH" --image "${BATS_TMPDIR}/special-files/broken.png"
    # Should handle broken symlink gracefully
    [ "$status" -le 1 ]
}

@test "handles files with unusual permissions" {
    setup_powershell_mock "success"
    setup_wslpath_mock "success"
    
    # Create files with various permissions
    mkdir -p "${BATS_TMPDIR}/permission-test"
    
    # Unreadable file
    echo "data" > "${BATS_TMPDIR}/permission-test/unreadable.png"
    chmod 000 "${BATS_TMPDIR}/permission-test/unreadable.png"
    
    run "$SCRIPT_PATH" --image "${BATS_TMPDIR}/permission-test/unreadable.png"
    # Should handle permission issues gracefully
    [ "$status" -le 1 ]
    
    # Restore permissions for cleanup
    chmod 644 "${BATS_TMPDIR}/permission-test/unreadable.png"
}

@test "handles filesystem edge cases" {
    setup_powershell_mock "success"
    
    # Test with /dev/null
    run "$SCRIPT_PATH" --image "/dev/null"
    [ "$status" -le 1 ]
    
    # Test with directory instead of file
    run "$SCRIPT_PATH" --image "/tmp"
    [ "$status" -le 1 ]
    
    # Test with special device files
    run "$SCRIPT_PATH" --image "/dev/zero"
    [ "$status" -le 1 ]
}

@test "handles network interruption scenarios" {
    # Simulate PowerShell execution that gets interrupted
    setup_powershell_mock "timeout"
    setup_timeout_mock "timeout"
    
    run "$SCRIPT_PATH" --title "Network Test"
    # Should handle timeout gracefully
    [ "$status" -le 1 ]
    
    # Should log timeout error
    assert_error_logged "PowerShell execution failed or timed out"
}

@test "handles resource exhaustion gracefully" {
    setup_powershell_mock "failure"
    
    # Simulate resource exhaustion by creating many rapid calls
    # This tests the script's ability to handle system stress
    for i in {1..20}; do
        "$SCRIPT_PATH" --title "Stress Test $i" &
    done
    
    # Wait for all processes
    wait
    
    # System should remain stable (no crash)
    # Error log should exist
    [ -f "${HOME}/.claude/cctoast-wsl/toast-error.log" ]
}

@test "handles malformed command line arguments" {
    setup_powershell_mock "success"
    
    # Test with malformed arguments
    run "$SCRIPT_PATH" --title=malformed
    [ "$status" -eq 1 ]
    
    # Test with arguments that look like flags but aren't
    run "$SCRIPT_PATH" "--not-a-real-flag"
    [ "$status" -eq 1 ]
    
    # Test with mixed valid/invalid arguments
    run "$SCRIPT_PATH" --title "Valid" --invalid-flag "test"
    [ "$status" -eq 1 ]
}

@test "handles environment variable pollution" {
    setup_powershell_mock "success"
    
    # Set potentially conflicting environment variables
    export TITLE="Conflicting Title"
    export MESSAGE="Conflicting Message" 
    export IMAGE="Conflicting Image"
    export PS1="Conflicting Prompt"
    export SHELL="Conflicting Shell"
    
    # Script should not be affected by environment pollution
    run "$SCRIPT_PATH" --title "Clean Title" --message "Clean Message"
    [ "$status" -eq 0 ]
    
    # Clean up
    unset TITLE MESSAGE IMAGE PS1 SHELL
}

@test "handles signal interruption gracefully" {
    setup_powershell_mock "success"
    
    # Start long-running process and interrupt it
    "$SCRIPT_PATH" --title "Interrupt Test" &
    local pid=$!
    
    # Give it a moment to start
    sleep 0.1
    
    # Send SIGTERM
    kill -TERM $pid 2>/dev/null || true
    
    # Wait for it to finish
    wait $pid 2>/dev/null || true
    
    # Process should have been interrupted gracefully
    # No zombie processes should remain
    ! ps -p $pid > /dev/null 2>&1
}

@test "handles disk space exhaustion" {
    setup_powershell_mock "failure"
    
    # Try to create error log when disk might be full
    # This is simulated by making the log directory read-only
    chmod 444 "${HOME}/.claude/cctoast-wsl" 2>/dev/null || mkdir -p "${HOME}/.claude/cctoast-wsl"
    chmod 444 "${HOME}/.claude/cctoast-wsl"
    
    run "$SCRIPT_PATH" --title "Disk Full Test"
    # Should handle disk full scenario gracefully
    [ "$status" -le 1 ]
    
    # Restore permissions
    chmod 755 "${HOME}/.claude/cctoast-wsl"
}

@test "handles concurrent access to log file" {
    setup_powershell_mock "failure"
    
    # Start multiple processes that will try to write to log simultaneously
    "$SCRIPT_PATH" --title "Concurrent 1" &
    "$SCRIPT_PATH" --title "Concurrent 2" &
    "$SCRIPT_PATH" --title "Concurrent 3" &
    
    # Wait for all to complete
    wait
    
    # Log file should exist and be readable
    [ -f "${HOME}/.claude/cctoast-wsl/toast-error.log" ]
    [ -r "${HOME}/.claude/cctoast-wsl/toast-error.log" ]
    
    # Should contain entries from multiple processes
    local log_lines=$(wc -l < "${HOME}/.claude/cctoast-wsl/toast-error.log")
    [ "$log_lines" -gt 0 ]
}