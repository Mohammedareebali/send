#!/bin/bash

# Configuration
TEST_SCRIPT="/scripts/test_alerts.sh"
BACKUP_SCRIPT="/backup/backup.sh"
LOG_DIR="/var/log/automated_tests"
REPORT_DIR="/var/log/test_reports"
RETENTION_DAYS=30
NOTIFICATION_EMAIL="admin@example.com"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Test scheduling configuration
ALERT_TEST_INTERVAL=21600  # 6 hours
BACKUP_TEST_HOUR=2        # 2 AM
SUMMARY_REPORT_DAY=7      # Sunday
SUMMARY_REPORT_HOUR=3     # 3 AM

# Performance thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
DISK_THRESHOLD=80

# Ensure directories exist
mkdir -p "$LOG_DIR" "$REPORT_DIR"

# Log function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_DIR/automated_tests.log"
}

# Error handling
handle_error() {
    log "ERROR: $1"
    send_notification "Test Error" "$1"
    exit 1
}

# Function to check system resources
check_system_resources() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}')
    local memory_usage=$(free | grep Mem | awk '{print $3/$2 * 100.0}')
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if (( $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l) )); then
        log "WARNING: High CPU usage detected: $cpu_usage%"
        return 1
    fi
    
    if (( $(echo "$memory_usage > $MEMORY_THRESHOLD" | bc -l) )); then
        log "WARNING: High memory usage detected: $memory_usage%"
        return 1
    fi
    
    if [ "$disk_usage" -gt "$DISK_THRESHOLD" ]; then
        log "WARNING: High disk usage detected: $disk_usage%"
        return 1
    fi
    
    return 0
}

# Function to send notifications
send_notification() {
    local subject="$1"
    local message="$2"
    
    # Send email
    echo "$message" | mail -s "$subject" "$NOTIFICATION_EMAIL"
    
    # Send Slack notification
    curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"$subject: $message\"}" "$SLACK_WEBHOOK_URL"
}

# Function to run alert tests
run_alert_tests() {
    log "Starting alert tests..."
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local test_log="$LOG_DIR/alert_test_$timestamp.log"
    local test_report="$REPORT_DIR/alert_test_$timestamp.json"
    
    # Check system resources before running tests
    if ! check_system_resources; then
        log "Skipping alert tests due to high system resource usage"
        return
    fi
    
    # Run tests and capture output
    "$TEST_SCRIPT" > "$test_log" 2>&1
    
    # Check test results
    if [ $? -eq 0 ]; then
        log "Alert tests completed successfully"
        send_notification "Alert Tests Success" "Alert tests completed successfully. See $test_report for details."
    else
        handle_error "Alert tests failed. Check $test_log for details."
    fi
}

# Function to run backup verification
run_backup_verification() {
    log "Starting backup verification..."
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_log="$LOG_DIR/backup_$timestamp.log"
    local verification_log="$LOG_DIR/verification_$timestamp.log"
    
    # Check system resources before running backup
    if ! check_system_resources; then
        log "Skipping backup verification due to high system resource usage"
        return
    fi
    
    # Run backup and verification
    "$BACKUP_SCRIPT" > "$backup_log" 2>&1
    
    # Check backup results
    if [ $? -eq 0 ]; then
        log "Backup and verification completed successfully"
        send_notification "Backup Success" "Backup and verification completed successfully. See $backup_log for details."
    else
        handle_error "Backup or verification failed. Check $backup_log for details."
    fi
}

# Function to clean up old logs and reports
cleanup_old_files() {
    log "Cleaning up old logs and reports..."
    find "$LOG_DIR" -type f -name "*.log" -mtime +$RETENTION_DAYS -delete
    find "$REPORT_DIR" -type f -name "*.json" -mtime +$RETENTION_DAYS -delete
}

# Function to generate test summary report
generate_summary_report() {
    log "Generating test summary report..."
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local summary_file="$REPORT_DIR/summary_$timestamp.txt"
    
    # Get latest test results
    local latest_test=$(ls -t "$REPORT_DIR"/alert_test_*.json | head -n1)
    local latest_backup=$(ls -t "$LOG_DIR"/backup_*.log | head -n1)
    
    # Generate summary
    cat > "$summary_file" << EOF
Test Summary Report - $(date)
================================

Latest Alert Test Results:
$(cat "$latest_test" | jq -r '.[] | "\(.test): \(.status)"')

Latest Backup Status:
$(grep "Backup verification completed" "$latest_backup" || echo "No recent backup verification found")

System Status:
$(df -h /)
$(free -h)
$(top -bn1 | head -n5)

Resource Usage History:
$(sar -u -r -d 1 1 | tail -n +3)

Network Statistics:
$(netstat -s | head -n 20)

EOF
    
    send_notification "Test Summary Report" "Test summary report generated. See $summary_file for details."
}

# Main scheduling function
main() {
    log "Starting automated test scheduling..."
    
    # Run alert tests at configured interval
    while true; do
        run_alert_tests
        sleep $ALERT_TEST_INTERVAL
    done &
    
    # Run backup verification at configured hour
    while true; do
        current_hour=$(date +%H)
        if [ "$current_hour" = "$BACKUP_TEST_HOUR" ]; then
            run_backup_verification
        fi
        sleep 3600  # 1 hour
    done &
    
    # Generate summary report at configured day and hour
    while true; do
        current_day=$(date +%u)
        current_hour=$(date +%H)
        if [ "$current_day" = "$SUMMARY_REPORT_DAY" ] && [ "$current_hour" = "$SUMMARY_REPORT_HOUR" ]; then
            generate_summary_report
            cleanup_old_files
        fi
        sleep 3600  # 1 hour
    done &
    
    # Monitor system resources
    while true; do
        if ! check_system_resources; then
            send_notification "System Resource Warning" "High system resource usage detected"
        fi
        sleep 300  # 5 minutes
    done &
    
    # Wait for all background processes
    wait
}

# Run main function
main 