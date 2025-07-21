#!/usr/bin/env bats

# Test file for show-toast.sh script

setup() {
    # Setup test environment
    export SCRIPT_PATH="${BATS_TEST_DIRNAME}/../../scripts/show-toast.sh"
    export TEST_HOME="${BATS_TMPDIR}/cctoast-test-home"
    export HOME="${TEST_HOME}"
    
    # Create test directories
    mkdir -p "${TEST_HOME}/.claude/cctoast-wsl"
    
    # Mock WSL environment
    export WSL_DISTRO_NAME="Ubuntu-22.04"
    export WSL_INTEROP="/run/WSL/123_interop"
}

teardown() {
    # Clean up test environment
    rm -rf "${TEST_HOME}"
}

@test "script exists and is executable" {
    [ -f "$SCRIPT_PATH" ]
    [ -x "$SCRIPT_PATH" ]
}

@test "script handles --notification-hook flag" {
    # Mock powershell.exe to avoid actual execution
    function powershell.exe() {
        echo "Mock toast notification: $*"
        return 0
    }
    export -f powershell.exe
    
    run "$SCRIPT_PATH" --notification-hook
    [ "$status" -eq 0 ]
    [[ "$output" == *"Mock toast notification"* ]]
}

@test "script handles --stop-hook flag" {
    # Mock powershell.exe
    function powershell.exe() {
        echo "Mock stop notification: $*"
        return 0
    }
    export -f powershell.exe
    
    run "$SCRIPT_PATH" --stop-hook
    [ "$status" -eq 0 ]
    [[ "$output" == *"Mock stop notification"* ]]
}

@test "script handles custom title and message" {
    function powershell.exe() {
        echo "Title: $4, Message: $6"
        return 0
    }
    export -f powershell.exe
    
    run "$SCRIPT_PATH" --title "Test Title" --message "Test Message"
    [ "$status" -eq 0 ]
    [[ "$output" == *"Test Title"* ]]
    [[ "$output" == *"Test Message"* ]]
}

@test "script creates error log on failure" {
    function powershell.exe() {
        return 1
    }
    export -f powershell.exe
    
    run "$SCRIPT_PATH" --title "Test"
    
    # Should create error log
    [ -f "${HOME}/.claude/cctoast-wsl/toast-error.log" ]
}

@test "script handles WSL path conversion" {
    # Mock wslpath
    function wslpath() {
        echo "C:\\Users\\test\\icon.png"
    }
    export -f wslpath
    
    function powershell.exe() {
        echo "Icon path: $8"
        return 0
    }
    export -f powershell.exe
    
    run "$SCRIPT_PATH" --image "/home/user/icon.png"
    [[ "$output" == *"C:\\Users\\test\\icon.png"* ]]
}

@test "script times out after 10 seconds" {
    # Mock timeout command
    function timeout() {
        if [[ "$1" == "10s" ]]; then
            echo "Timeout triggered"
            return 124  # timeout exit code
        fi
    }
    export -f timeout
    
    function powershell.exe() {
        sleep 15  # Simulate long-running process
        return 0
    }
    export -f powershell.exe
    
    run "$SCRIPT_PATH" --title "Test"
    [ "$status" -eq 124 ] || [[ "$output" == *"Timeout triggered"* ]]
}