#!/bin/bash

# Configuration
PROMETHEUS_URL="http://localhost:9090"
ALERTMANAGER_URL="http://localhost:9093"
TEST_DURATION=300  # 5 minutes
LOG_FILE="/var/log/alert_test.log"
TEST_RESULTS_FILE="/var/log/alert_test_results.json"

# Log function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Error handling
handle_error() {
    log "ERROR: $1"
    exit 1
}

# Function to check if Prometheus is ready
check_prometheus() {
    if ! curl -s "$PROMETHEUS_URL/-/ready" | grep -q "Ready"; then
        handle_error "Prometheus is not ready"
    fi
}

# Function to check if Alertmanager is ready
check_alertmanager() {
    if ! curl -s "$ALERTMANAGER_URL/-/healthy" | grep -q "OK"; then
        handle_error "Alertmanager is not ready"
    fi
}

# Function to simulate high error rate
simulate_high_error_rate() {
    log "Simulating high error rate..."
    # Inject 5xx errors
    for i in {1..100}; do
        curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/api/test/error" || true
        sleep 0.1
    done
}

# Function to simulate high latency
simulate_high_latency() {
    log "Simulating high latency..."
    # Inject slow requests
    for i in {1..50}; do
        curl -s "http://localhost:8080/api/test/slow?delay=2" || true
        sleep 0.2
    done
}

# Function to simulate high memory usage
simulate_high_memory() {
    log "Simulating high memory usage..."
    # Allocate memory
    python3 -c "
import time
memory = []
try:
    while True:
        memory.append(' ' * 1024 * 1024)  # Allocate 1MB
        time.sleep(0.1)
except MemoryError:
    pass
"
}

# Function to simulate high CPU usage
simulate_high_cpu() {
    log "Simulating high CPU usage..."
    # Generate CPU load
    python3 -c "
import time
while True:
    for i in range(1000000):
        pass
    time.sleep(0.1)
" &
    CPU_PID=$!
    sleep $TEST_DURATION
    kill $CPU_PID
}

# Function to simulate disk space issues
simulate_disk_space() {
    log "Simulating disk space issues..."
    # Create large temporary files
    for i in {1..5}; do
        dd if=/dev/zero of="/tmp/large_file_$i" bs=1M count=1000
        sleep 1
    done
    # Cleanup
    rm -f /tmp/large_file_*
}

# Function to simulate network issues
simulate_network_issues() {
    log "Simulating network issues..."
    # Add network latency
    tc qdisc add dev eth0 root netem delay 100ms 10ms 25%
    sleep $TEST_DURATION
    # Cleanup
    tc qdisc del dev eth0 root
}

# Function to simulate service unavailability
simulate_service_down() {
    log "Simulating service unavailability..."
    # Stop the service
    systemctl stop api-gateway
    sleep $TEST_DURATION
    # Restart the service
    systemctl start api-gateway
}

# Function to simulate high request volume
simulate_high_requests() {
    log "Simulating high request volume..."
    # Generate high number of requests
    for i in {1..1000}; do
        curl -s "http://localhost:8080/api/test/load" || true
        sleep 0.01
    done
}

# Function to simulate cache issues
simulate_cache_issues() {
    log "Simulating cache issues..."
    # Clear cache and generate cache misses
    redis-cli FLUSHALL
    for i in {1..100}; do
        curl -s "http://localhost:8080/api/test/cache-miss" || true
        sleep 0.1
    done
}

# Function to simulate database issues
simulate_database_issues() {
    log "Simulating database issues..."
    # Add latency to database queries
    mysql -e "SET GLOBAL max_connections = 1;"
    sleep $TEST_DURATION
    # Reset
    mysql -e "SET GLOBAL max_connections = 151;"
}

# Function to check alert state
check_alert_state() {
    local alert_name="$1"
    local expected_state="$2"
    
    local alert_state=$(curl -s "$ALERTMANAGER_URL/api/v2/alerts" | jq -r ".[] | select(.labels.alertname == \"$alert_name\") | .status.state")
    
    if [ "$alert_state" == "$expected_state" ]; then
        log "Alert $alert_name is in expected state: $expected_state"
        return 0
    else
        log "Alert $alert_name is in unexpected state: $alert_state (expected: $expected_state)"
        return 1
    fi
}

# Function to run alert test
run_alert_test() {
    local test_name="$1"
    local simulation_function="$2"
    local alert_name="$3"
    local expected_state="$4"
    
    log "Starting test: $test_name"
    
    # Run simulation in background
    $simulation_function &
    SIMULATION_PID=$!
    
    # Wait for alert to trigger
    sleep 30
    
    # Check alert state
    if check_alert_state "$alert_name" "$expected_state"; then
        log "Test $test_name PASSED"
        echo "{\"test\": \"$test_name\", \"status\": \"PASSED\", \"alert\": \"$alert_name\", \"state\": \"$expected_state\"}" >> "$TEST_RESULTS_FILE"
    else
        log "Test $test_name FAILED"
        echo "{\"test\": \"$test_name\", \"status\": \"FAILED\", \"alert\": \"$alert_name\", \"state\": \"$expected_state\"}" >> "$TEST_RESULTS_FILE"
    fi
    
    # Cleanup
    kill $SIMULATION_PID 2>/dev/null || true
    sleep 10  # Wait for system to stabilize
}

# Function to simulate API endpoint failures
simulate_api_failures() {
    log "Simulating API endpoint failures..."
    # Test different HTTP methods
    for method in GET POST PUT DELETE; do
        curl -X $method -s "http://localhost:8080/api/test/fail" || true
        sleep 0.1
    done
}

# Function to simulate authentication issues
simulate_auth_issues() {
    log "Simulating authentication issues..."
    # Test invalid tokens and credentials
    for i in {1..50}; do
        curl -H "Authorization: Bearer invalid_token" -s "http://localhost:8080/api/test/auth" || true
        curl -u "invalid:credentials" -s "http://localhost:8080/api/test/auth" || true
        sleep 0.1
    done
}

# Function to simulate rate limiting
simulate_rate_limiting() {
    log "Simulating rate limiting..."
    # Generate requests exceeding rate limit
    for i in {1..200}; do
        curl -s "http://localhost:8080/api/test/rate-limit" || true
        sleep 0.01
    done
}

# Function to simulate database connection pool exhaustion
simulate_db_pool_exhaustion() {
    log "Simulating database connection pool exhaustion..."
    # Create multiple database connections
    for i in {1..50}; do
        mysql -e "SELECT SLEEP(1);" &
    done
    sleep $TEST_DURATION
    # Cleanup
    pkill -f "mysql.*SLEEP"
}

# Function to simulate file system issues
simulate_filesystem_issues() {
    log "Simulating file system issues..."
    # Create and delete files rapidly
    for i in {1..1000}; do
        touch "/tmp/test_file_$i"
        rm "/tmp/test_file_$i"
    done
}

# Function to simulate memory leaks
simulate_memory_leaks() {
    log "Simulating memory leaks..."
    # Allocate memory without releasing it
    python3 -c "
import time
leaked_memory = []
try:
    while True:
        leaked_memory.append(' ' * 1024 * 1024)  # Allocate 1MB
        time.sleep(0.1)
except MemoryError:
    pass
"
}

# Function to simulate network packet loss
simulate_packet_loss() {
    log "Simulating network packet loss..."
    # Add packet loss to network interface
    tc qdisc add dev eth0 root netem loss 20% 10%
    sleep $TEST_DURATION
    # Cleanup
    tc qdisc del dev eth0 root
}

# Function to simulate DNS issues
simulate_dns_issues() {
    log "Simulating DNS issues..."
    # Add DNS latency
    echo "nameserver 127.0.0.1" > /etc/resolv.conf.tmp
    mv /etc/resolv.conf.tmp /etc/resolv.conf
    sleep $TEST_DURATION
    # Restore original DNS
    echo "nameserver 8.8.8.8" > /etc/resolv.conf.tmp
    mv /etc/resolv.conf.tmp /etc/resolv.conf
}

# Function to simulate SSL/TLS issues
simulate_ssl_issues() {
    log "Simulating SSL/TLS issues..."
    # Test with invalid SSL certificates
    for i in {1..50}; do
        curl -k -s "https://localhost:8443/api/test/ssl" || true
        sleep 0.1
    done
}

# Function to simulate API response time degradation
simulate_response_time_degradation() {
    log "Simulating API response time degradation..."
    # Gradually increase response time
    for delay in 1 2 3 4 5; do
        for i in {1..20}; do
            curl -s "http://localhost:8080/api/test/slow?delay=$delay" || true
            sleep 0.1
        done
    done
}

# Function to simulate database deadlocks
simulate_db_deadlocks() {
    log "Simulating database deadlocks..."
    # Create deadlock scenario
    mysql -e "
        CREATE TABLE IF NOT EXISTS test_deadlock (id INT PRIMARY KEY, value INT);
        INSERT INTO test_deadlock VALUES (1, 1), (2, 2);
        
        -- Session 1
        START TRANSACTION;
        UPDATE test_deadlock SET value = 10 WHERE id = 1;
        
        -- Session 2
        START TRANSACTION;
        UPDATE test_deadlock SET value = 20 WHERE id = 2;
        UPDATE test_deadlock SET value = 30 WHERE id = 1;
        
        -- Session 1
        UPDATE test_deadlock SET value = 40 WHERE id = 2;
    " &
    sleep $TEST_DURATION
    # Cleanup
    mysql -e "DROP TABLE IF EXISTS test_deadlock;"
}

# Function to simulate cache stampede
simulate_cache_stampede() {
    log "Simulating cache stampede..."
    # Clear cache and generate concurrent requests
    redis-cli FLUSHALL
    for i in {1..10}; do
        for j in {1..50}; do
            curl -s "http://localhost:8080/api/test/cache-stampede" || true &
        done
        sleep 0.1
    done
    wait
}

# Function to simulate API version mismatch
simulate_api_version_mismatch() {
    log "Simulating API version mismatch..."
    # Test with different API versions
    for version in v1 v2 v3; do
        curl -H "Accept: application/vnd.api.$version+json" -s "http://localhost:8080/api/test/version" || true
        sleep 0.1
    done
}

# Function to simulate service dependency failure
simulate_service_dependency_failure() {
    log "Simulating service dependency failure..."
    # Stop dependent services
    systemctl stop redis
    systemctl stop mysql
    sleep $TEST_DURATION
    # Restart services
    systemctl start redis
    systemctl start mysql
}

# Function to simulate load balancer issues
simulate_load_balancer_issues() {
    log "Simulating load balancer issues..."
    # Add and remove backend servers
    for i in {1..5}; do
        nginx -s reload
        sleep 1
    done
}

# Function to simulate security scan
simulate_security_scan() {
    log "Simulating security scan..."
    # Test common security vulnerabilities
    for i in {1..50}; do
        # SQL injection
        curl -s "http://localhost:8080/api/test/search?q=' OR '1'='1" || true
        # XSS
        curl -s "http://localhost:8080/api/test/search?q=<script>alert(1)</script>" || true
        # Path traversal
        curl -s "http://localhost:8080/api/test/file?path=../../../etc/passwd" || true
        sleep 0.1
    done
}

# Function to simulate API rate limit burst
simulate_rate_limit_burst() {
    log "Simulating API rate limit burst..."
    # Generate burst of requests
    for i in {1..5}; do
        for j in {1..100}; do
            curl -s "http://localhost:8080/api/test/burst" || true &
        done
        sleep 1
    done
    wait
}

# Function to simulate database replication lag
simulate_db_replication_lag() {
    log "Simulating database replication lag..."
    # Add replication delay
    mysql -e "SET GLOBAL slave_net_timeout = 60;"
    mysql -e "STOP SLAVE;"
    sleep $TEST_DURATION
    mysql -e "START SLAVE;"
}

# Main test execution
main() {
    log "Starting alert testing..."
    
    # Check prerequisites
    check_prometheus
    check_alertmanager
    
    # Initialize test results file
    echo "[" > "$TEST_RESULTS_FILE"
    
    # Run existing tests
    run_alert_test "High Error Rate" simulate_high_error_rate "Critical Error Rate" "firing"
    run_alert_test "High Latency" simulate_high_latency "Critical Latency" "firing"
    run_alert_test "High Memory Usage" simulate_high_memory "High Memory Usage" "firing"
    run_alert_test "High CPU Usage" simulate_high_cpu "High CPU Usage" "firing"
    run_alert_test "Disk Space Warning" simulate_disk_space "Disk Space Warning" "firing"
    run_alert_test "Network Issues" simulate_network_issues "High Latency" "firing"
    run_alert_test "Service Unavailable" simulate_service_down "Service Unavailable" "firing"
    run_alert_test "High Request Volume" simulate_high_requests "High Request Volume" "firing"
    run_alert_test "Cache Issues" simulate_cache_issues "High Cache Miss Rate" "firing"
    run_alert_test "Database Issues" simulate_database_issues "Slow Database Queries" "firing"
    
    # Run new tests
    run_alert_test "Response Time Degradation" simulate_response_time_degradation "Degraded Response Time" "firing"
    run_alert_test "Database Deadlocks" simulate_db_deadlocks "Database Deadlock Detected" "firing"
    run_alert_test "Cache Stampede" simulate_cache_stampede "Cache Stampede Detected" "firing"
    run_alert_test "API Version Mismatch" simulate_api_version_mismatch "API Version Conflict" "firing"
    run_alert_test "Service Dependency Failure" simulate_service_dependency_failure "Service Dependency Unavailable" "firing"
    run_alert_test "Load Balancer Issues" simulate_load_balancer_issues "Load Balancer Unstable" "firing"
    run_alert_test "Security Scan" simulate_security_scan "Security Alert" "firing"
    run_alert_test "Rate Limit Burst" simulate_rate_limit_burst "Rate Limit Burst Detected" "firing"
    run_alert_test "Database Replication Lag" simulate_db_replication_lag "Database Replication Lag" "firing"
    
    # Close test results array
    echo "]" >> "$TEST_RESULTS_FILE"
    
    log "Alert testing completed"
    log "Results saved to $TEST_RESULTS_FILE"
}

# Run main function
main 