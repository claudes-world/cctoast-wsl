#!/usr/bin/env bats

# Performance testing suite for show-toast.sh
# Tests execution time, resource usage, and concurrent execution scenarios

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

@test "script startup time is under 100ms" {
    # Measure just the script startup (help output)
    measure_execution_time "$SCRIPT_PATH" --help
    assert_execution_time_under 100
}

@test "notification execution is under 2 seconds" {
    # Measure notification execution time (PRD requirement)
    measure_execution_time "$SCRIPT_PATH" --notification-hook
    assert_execution_time_under 2000
}

@test "stop hook execution is under 2 seconds" {
    # Measure stop hook execution time
    measure_execution_time "$SCRIPT_PATH" --stop-hook
    assert_execution_time_under 2000
}

@test "custom notification execution is under 2 seconds" {
    # Measure custom notification with image
    measure_execution_time "$SCRIPT_PATH" --title "Performance Test" --message "Testing speed" --image "${CCTOAST_TEST_ASSETS}/test.png"
    assert_execution_time_under 2000
}

@test "handles 10 rapid successive calls efficiently" {
    local start_time end_time total_time
    start_time=$(date +%s%N)
    
    # Execute 10 notifications rapidly
    for i in {1..10}; do
        "$SCRIPT_PATH" --title "Rapid Test $i" &
    done
    
    # Wait for all to complete
    wait
    
    end_time=$(date +%s%N)
    total_time=$(( (end_time - start_time) / 1000000 ))  # Convert to milliseconds
    
    # Should complete all 10 in under 10 seconds (allowing for parallelism)
    [ "$total_time" -lt 10000 ]
}

@test "memory usage remains reasonable during execution" {
    # This is a basic check - more sophisticated memory testing would require external tools
    local before_mem after_mem
    
    # Get memory usage before (rough approximation)
    before_mem=$(ps -o pid,vsz,rss -p $$ | tail -1 | awk '{print $2}')
    
    # Execute several operations
    "$SCRIPT_PATH" --notification-hook
    "$SCRIPT_PATH" --stop-hook
    "$SCRIPT_PATH" --title "Memory Test" --message "Testing memory usage"
    
    # Get memory usage after
    after_mem=$(ps -o pid,vsz,rss -p $$ | tail -1 | awk '{print $2}')
    
    # Memory usage shouldn't increase dramatically (within 10MB)
    local mem_diff=$((after_mem - before_mem))
    [ "$mem_diff" -lt 10240 ]  # 10MB in KB
}

@test "handles concurrent executions without interference" {
    local temp_dir="${BATS_TMPDIR}/concurrent-test"
    mkdir -p "$temp_dir"
    
    # Start multiple background processes with different outputs
    "$SCRIPT_PATH" --title "Concurrent 1" > "$temp_dir/out1.txt" 2>&1 &
    local pid1=$!
    "$SCRIPT_PATH" --title "Concurrent 2" > "$temp_dir/out2.txt" 2>&1 &
    local pid2=$!
    "$SCRIPT_PATH" --title "Concurrent 3" > "$temp_dir/out3.txt" 2>&1 &
    local pid3=$!
    
    # Wait for all to complete
    wait $pid1; local status1=$?
    wait $pid2; local status2=$?
    wait $pid3; local status3=$?
    
    # All should succeed
    [ "$status1" -eq 0 ]
    [ "$status2" -eq 0 ]
    [ "$status3" -eq 0 ]
    
    # Output files should exist and be different
    [ -f "$temp_dir/out1.txt" ]
    [ -f "$temp_dir/out2.txt" ]
    [ -f "$temp_dir/out3.txt" ]
}

@test "performance degrades gracefully with large inputs" {
    local long_title long_message
    
    # Create very long title and message (1000 chars each)
    long_title=$(printf 'A%.0s' {1..1000})
    long_message=$(printf 'B%.0s' {1..1000})
    
    # Should still complete within reasonable time
    measure_execution_time "$SCRIPT_PATH" --title "$long_title" --message "$long_message"
    assert_execution_time_under 5000  # Allow extra time for large inputs
}

@test "debug mode overhead is minimal" {
    # Measure without debug mode
    measure_execution_time "$SCRIPT_PATH" --title "Debug Test"
    local normal_time="$CCTOAST_LAST_EXECUTION_TIME"
    
    # Measure with debug mode
    export CCTOAST_DEBUG=1
    measure_execution_time "$SCRIPT_PATH" --title "Debug Test"
    local debug_time="$CCTOAST_LAST_EXECUTION_TIME"
    
    # Debug mode shouldn't add more than 500ms overhead
    local overhead=$((debug_time - normal_time))
    [ "$overhead" -lt 500 ]
}

@test "error handling doesn't significantly impact performance" {
    setup_powershell_mock "failure"
    
    # Measure error case execution time
    measure_execution_time "$SCRIPT_PATH" --title "Error Test"
    
    # Should still complete quickly even with errors
    assert_execution_time_under 2000
}

@test "path conversion performance is acceptable" {
    setup_wslpath_mock "success"
    
    # Test with multiple path conversions
    measure_execution_time "$SCRIPT_PATH" --title "Path Test" --image "${CCTOAST_TEST_ASSETS}/test.png"
    assert_execution_time_under 2000
}

@test "timeout mechanism doesn't add significant overhead" {
    setup_timeout_mock "success"
    
    # Measure with timeout available
    measure_execution_time "$SCRIPT_PATH" --title "Timeout Test"
    assert_execution_time_under 2000
    
    # The timeout wrapper should not add more than a few hundred milliseconds
}