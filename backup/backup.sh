#!/bin/bash

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7
ENCRYPTION_KEY_FILE="/etc/backup/encryption.key"
LOG_FILE="/var/log/backup.log"
CHECKSUM_FILE="$BACKUP_DIR/checksums_$DATE.txt"
VERIFICATION_LOG="$BACKUP_DIR/verification_$DATE.log"
MIN_BACKUP_SIZE=1000000
MAX_BACKUP_AGE=3600
REQUIRED_FILES=(
    "grafana_backup_$DATE.tar.gz.enc"
    "prometheus_backup_$DATE.tar.gz.enc"
    "nginx_backup_$DATE.tar.gz.enc"
    "env_backup_$DATE.txt.enc"
    "docker_backup_$DATE.tar.gz.enc"
    "backup_manifest_$DATE.txt.enc"
    "checksums_$DATE.txt.enc"
)

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Log function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE" | tee -a "$VERIFICATION_LOG"
}

# Error handling
handle_error() {
    log "ERROR: $1"
    exit 1
}

# Function to verify file integrity
verify_file() {
    local file="$1"
    local checksum="$2"
    
    # Check if file exists and is not empty
    if [ ! -s "$file" ]; then
        handle_error "Backup file $file is empty or does not exist"
    fi
    
    # Verify file permissions
    if [ "$(stat -c %a "$file")" != "600" ]; then
        handle_error "Incorrect permissions for $file"
    fi
    
    # Verify file ownership
    if [ "$(stat -c %U "$file")" != "root" ]; then
        handle_error "Incorrect ownership for $file"
    fi
    
    # Verify checksum
    local current_checksum=$(sha256sum "$file" | cut -d' ' -f1)
    if [ "$current_checksum" != "$checksum" ]; then
        handle_error "Checksum verification failed for $file"
    fi
    
    # Verify encryption
    if ! openssl enc -aes-256-cbc -d -in "$file" -out /dev/null -pass file:"$ENCRYPTION_KEY_FILE" 2>/dev/null; then
        handle_error "Encryption verification failed for $file"
    fi
    
    # Verify file size
    local file_size=$(stat -c %s "$file")
    if [ "$file_size" -lt 1000 ]; then
        handle_error "File $file is suspiciously small"
    fi
    
    # Verify file age
    local file_age=$(($(date +%s) - $(stat -c %Y "$file")))
    if [ "$file_age" -gt "$MAX_BACKUP_AGE" ]; then
        handle_error "Backup file $file is too old"
    fi
    
    # Verify file content (for specific file types)
    if [[ "$file" == *.tar.gz.enc ]]; then
        local temp_file=$(mktemp)
        openssl enc -aes-256-cbc -d -in "$file" -out "$temp_file" -pass file:"$ENCRYPTION_KEY_FILE"
        if ! tar -tzf "$temp_file" > /dev/null 2>&1; then
            rm "$temp_file"
            handle_error "Archive verification failed for $file"
        fi
        rm "$temp_file"
    fi
}

# Function to verify backup completeness
verify_backup_completeness() {
    log "Verifying backup completeness..."
    local missing_files=0
    
    for required_file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$BACKUP_DIR/$required_file" ]; then
            log "Missing required backup file: $required_file"
            missing_files=$((missing_files + 1))
        fi
    done
    
    if [ "$missing_files" -gt 0 ]; then
        handle_error "Backup is incomplete. Missing $missing_files required files."
    fi
}

# Function to verify backup consistency
verify_backup_consistency() {
    log "Verifying backup consistency..."
    
    # Verify manifest content
    local temp_manifest=$(mktemp)
    openssl enc -aes-256-cbc -d -in "$BACKUP_DIR/backup_manifest_$DATE.txt.enc" -out "$temp_manifest" -pass file:"$ENCRYPTION_KEY_FILE"
    
    # Check if all files in manifest exist
    while read -r line; do
        if [[ "$line" == -* ]]; then
            local file_name=$(echo "$line" | sed 's/^- //')
            if [ ! -f "$BACKUP_DIR/$file_name" ]; then
                rm "$temp_manifest"
                handle_error "File $file_name mentioned in manifest is missing"
            fi
        fi
    done < "$temp_manifest"
    rm "$temp_manifest"
    
    # Verify checksum file content
    local temp_checksum=$(mktemp)
    openssl enc -aes-256-cbc -d -in "$BACKUP_DIR/checksums_$DATE.txt.enc" -out "$temp_checksum" -pass file:"$ENCRYPTION_KEY_FILE"
    
    # Verify all files have checksums
    while read -r line; do
        local file_name=$(echo "$line" | cut -d' ' -f2)
        if [ ! -f "$file_name" ]; then
            rm "$temp_checksum"
            handle_error "File $file_name mentioned in checksum file is missing"
        fi
    done < "$temp_checksum"
    rm "$temp_checksum"
    
    # Verify file sizes are consistent
    local total_size=0
    for file in "$BACKUP_DIR"/*_$DATE.*.enc; do
        local file_size=$(stat -c %s "$file")
        total_size=$((total_size + file_size))
    done
    
    # Check if total size is within expected range
    local expected_min_size=$((MIN_BACKUP_SIZE * 0.9))  # 90% of minimum size
    local expected_max_size=$((MIN_BACKUP_SIZE * 2))    # 200% of minimum size
    if [ "$total_size" -lt "$expected_min_size" ] || [ "$total_size" -gt "$expected_max_size" ]; then
        handle_error "Total backup size $total_size is outside expected range ($expected_min_size - $expected_max_size)"
    fi
    
    # Verify file timestamps are consistent
    local backup_time=$(date -d "$DATE" +%s)
    for file in "$BACKUP_DIR"/*_$DATE.*.enc; do
        local file_time=$(stat -c %Y "$file")
        local time_diff=$((file_time - backup_time))
        if [ "$time_diff" -gt 300 ]; then  # 5 minutes
            handle_error "File $file timestamp is too far from backup time"
        fi
    done
    
    # Verify file permissions are consistent
    for file in "$BACKUP_DIR"/*_$DATE.*.enc; do
        if [ "$(stat -c %a "$file")" != "600" ]; then
            handle_error "Incorrect permissions for $file"
        fi
    done
    
    # Verify file ownership is consistent
    for file in "$BACKUP_DIR"/*_$DATE.*.enc; do
        if [ "$(stat -c %U "$file")" != "root" ]; then
            handle_error "Incorrect ownership for $file"
        fi
    done
    
    # Verify file content structure
    for file in "$BACKUP_DIR"/*_$DATE.tar.gz.enc; do
        local temp_file=$(mktemp)
        openssl enc -aes-256-cbc -d -in "$file" -out "$temp_file" -pass file:"$ENCRYPTION_KEY_FILE"
        
        # Check for required directories in archives
        case "$file" in
            *grafana*)
                if ! tar -tzf "$temp_file" | grep -q "grafana/"; then
                    rm "$temp_file"
                    handle_error "Grafana backup missing required directories"
                fi
                ;;
            *prometheus*)
                if ! tar -tzf "$temp_file" | grep -q "prometheus/"; then
                    rm "$temp_file"
                    handle_error "Prometheus backup missing required directories"
                fi
                ;;
            *nginx*)
                if ! tar -tzf "$temp_file" | grep -q "nginx/"; then
                    rm "$temp_file"
                    handle_error "Nginx backup missing required directories"
                fi
                ;;
        esac
        rm "$temp_file"
    done
    
    # Verify backup sequence
    local last_backup=$(ls -t "$BACKUP_DIR"/*_*.enc | head -n1)
    if [ "$last_backup" != "$BACKUP_DIR/backup_manifest_$DATE.txt.enc" ]; then
        handle_error "Backup sequence is incorrect"
    fi
}

# Function to verify backup security
verify_backup_security() {
    log "Verifying backup security..."
    
    # Check encryption key permissions
    if [ "$(stat -c %a "$ENCRYPTION_KEY_FILE")" != "600" ]; then
        handle_error "Incorrect permissions for encryption key"
    fi
    
    # Check backup directory permissions
    if [ "$(stat -c %a "$BACKUP_DIR")" != "700" ]; then
        handle_error "Incorrect permissions for backup directory"
    fi
    
    # Verify no sensitive data in environment backup
    local temp_env=$(mktemp)
    openssl enc -aes-256-cbc -d -in "$BACKUP_DIR/env_backup_$DATE.txt.enc" -out "$temp_env" -pass file:"$ENCRYPTION_KEY_FILE"
    if grep -q -i "password\|secret\|key\|token" "$temp_env"; then
        rm "$temp_env"
        handle_error "Sensitive data found in environment backup"
    fi
    rm "$temp_env"
    
    # Verify encryption strength
    for file in "$BACKUP_DIR"/*_$DATE.*.enc; do
        if ! openssl enc -aes-256-cbc -d -in "$file" -out /dev/null -pass file:"$ENCRYPTION_KEY_FILE" 2>/dev/null; then
            handle_error "Encryption verification failed for $file"
        fi
    done
    
    # Verify no world-readable files
    find "$BACKUP_DIR" -type f -perm -o+r -exec handle_error "World-readable file found: {}" \;
    
    # Verify no world-writable files
    find "$BACKUP_DIR" -type f -perm -o+w -exec handle_error "World-writable file found: {}" \;
    
    # Verify no world-executable files
    find "$BACKUP_DIR" -type f -perm -o+x -exec handle_error "World-executable file found: {}" \;
    
    # Verify backup isolation
    if [ "$(stat -c %G "$BACKUP_DIR")" != "root" ]; then
        handle_error "Backup directory is not properly isolated"
    fi
    
    # Verify encryption key isolation
    if [ "$(stat -c %G "$ENCRYPTION_KEY_FILE")" != "root" ]; then
        handle_error "Encryption key is not properly isolated"
    fi
}

# Function to verify backup integrity
verify_backup_integrity() {
    log "Verifying backup integrity..."
    
    # Verify file headers
    for file in "$BACKUP_DIR"/*_$DATE.*.enc; do
        if ! file "$file" | grep -q "encrypted"; then
            handle_error "File $file does not appear to be encrypted"
        fi
    done
    
    # Verify file timestamps
    local backup_time=$(date -d "$DATE" +%s)
    for file in "$BACKUP_DIR"/*_$DATE.*.enc; do
        local file_time=$(stat -c %Y "$file")
        local time_diff=$((file_time - backup_time))
        if [ "$time_diff" -gt 300 ]; then  # 5 minutes
            handle_error "File $file timestamp is too far from backup time"
        fi
    done
    
    # Verify file compression
    for file in "$BACKUP_DIR"/*_$DATE.tar.gz.enc; do
        local temp_file=$(mktemp)
        openssl enc -aes-256-cbc -d -in "$file" -out "$temp_file" -pass file:"$ENCRYPTION_KEY_FILE"
        if ! gzip -t "$temp_file" 2>/dev/null; then
            rm "$temp_file"
            handle_error "Compressed file $file is corrupted"
        fi
        rm "$temp_file"
    done
    
    # Verify file uniqueness
    local checksums=()
    for file in "$BACKUP_DIR"/*_$DATE.*.enc; do
        local checksum=$(sha256sum "$file" | cut -d' ' -f1)
        if [[ " ${checksums[@]} " =~ " ${checksum} " ]]; then
            handle_error "Duplicate files detected in backup"
        fi
        checksums+=("$checksum")
    done
    
    # Verify file content integrity
    for file in "$BACKUP_DIR"/*_$DATE.*.enc; do
        local temp_file=$(mktemp)
        openssl enc -aes-256-cbc -d -in "$file" -out "$temp_file" -pass file:"$ENCRYPTION_KEY_FILE"
        
        # Check for empty files
        if [ ! -s "$temp_file" ]; then
            rm "$temp_file"
            handle_error "Decrypted file $file is empty"
        fi
        
        # Check for corrupted archives
        if [[ "$file" == *.tar.gz.enc ]]; then
            if ! tar -tzf "$temp_file" > /dev/null 2>&1; then
                rm "$temp_file"
                handle_error "Archive $file is corrupted"
            fi
        fi
        
        rm "$temp_file"
    done
    
    # Verify backup completeness
    local required_files=(
        "grafana_backup_$DATE.tar.gz.enc"
        "prometheus_backup_$DATE.tar.gz.enc"
        "nginx_backup_$DATE.tar.gz.enc"
        "env_backup_$DATE.txt.enc"
        "docker_backup_$DATE.tar.gz.enc"
        "backup_manifest_$DATE.txt.enc"
        "checksums_$DATE.txt.enc"
    )
    
    for required_file in "${required_files[@]}"; do
        if [ ! -f "$BACKUP_DIR/$required_file" ]; then
            handle_error "Required backup file $required_file is missing"
        fi
    done
}

# Function to verify backup dependencies
verify_backup_dependencies() {
    log "Verifying backup dependencies..."
    
    # Check required commands
    local required_commands=("openssl" "tar" "gzip" "sha256sum" "stat")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            handle_error "Required command $cmd is not available"
        fi
    done
    
    # Check required services
    local required_services=("docker" "nginx")
    for service in "${required_services[@]}"; do
        if ! systemctl is-active --quiet "$service"; then
            handle_error "Required service $service is not running"
        fi
    done
    
    # Check disk space
    local required_space=$((MIN_BACKUP_SIZE * 2))  # Double the minimum size
    local available_space=$(df -B1 "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt "$required_space" ]; then
        handle_error "Insufficient disk space for backup"
    fi
}

# Function to verify backup metadata
verify_backup_metadata() {
    log "Verifying backup metadata..."
    
    # Verify manifest format
    local temp_manifest=$(mktemp)
    openssl enc -aes-256-cbc -d -in "$BACKUP_DIR/backup_manifest_$DATE.txt.enc" -out "$temp_manifest" -pass file:"$ENCRYPTION_KEY_FILE"
    
    # Check manifest structure
    if ! grep -q "Backup Date: $DATE" "$temp_manifest"; then
        rm "$temp_manifest"
        handle_error "Invalid backup date in manifest"
    fi
    
    # Verify file counts
    local manifest_files=$(grep -c "^- " "$temp_manifest")
    local actual_files=$(ls -1 "$BACKUP_DIR"/*_$DATE.*.enc | wc -l)
    if [ "$manifest_files" -ne "$actual_files" ]; then
        rm "$temp_manifest"
        handle_error "File count mismatch between manifest and actual files"
    fi
    rm "$temp_manifest"
    
    # Verify checksum file format
    local temp_checksum=$(mktemp)
    openssl enc -aes-256-cbc -d -in "$BACKUP_DIR/checksums_$DATE.txt.enc" -out "$temp_checksum" -pass file:"$ENCRYPTION_KEY_FILE"
    
    # Check checksum format
    while read -r line; do
        if ! [[ "$line" =~ ^[a-f0-9]{64}\ .+$ ]]; then
            rm "$temp_checksum"
            handle_error "Invalid checksum format in checksum file"
        fi
    done < "$temp_checksum"
    rm "$temp_checksum"
}

# Main backup verification
verify_backup() {
    log "Starting comprehensive backup verification..."
    
    # Verify backup dependencies
    verify_backup_dependencies
    
    # Verify backup completeness
    verify_backup_completeness
    
    # Verify backup consistency
    verify_backup_consistency
    
    # Verify backup security
    verify_backup_security
    
    # Verify backup integrity
    verify_backup_integrity
    
    # Verify backup metadata
    verify_backup_metadata
    
    # Verify individual files
    for file in "$BACKUP_DIR"/*_$DATE.*.enc; do
        verify_file "$file" "$(grep "$file" "$BACKUP_DIR/checksums_$DATE.txt.enc" | cut -d' ' -f1)"
    done
    
    # Verify total backup size
    local total_size=$(du -sb "$BACKUP_DIR"/*_$DATE.*.enc | awk '{total += $1} END {print total}')
    if [ "$total_size" -lt "$MIN_BACKUP_SIZE" ]; then
        handle_error "Total backup size is suspiciously small"
    fi
    
    log "Backup verification completed successfully"
    log "Total backup size: $(du -sh "$BACKUP_DIR"/*_$DATE.*.enc | awk '{print $1}')"
}

# Check for encryption key
if [ ! -f "$ENCRYPTION_KEY_FILE" ]; then
    log "Generating new encryption key..."
    openssl rand -base64 32 > "$ENCRYPTION_KEY_FILE"
    chmod 600 "$ENCRYPTION_KEY_FILE"
fi

# Function to encrypt file
encrypt_file() {
    local input_file="$1"
    local output_file="$2"
    openssl enc -aes-256-cbc -salt -in "$input_file" -out "$output_file" -pass file:"$ENCRYPTION_KEY_FILE" || handle_error "Failed to encrypt $input_file"
    chmod 600 "$output_file"
    echo "$(sha256sum "$output_file" | cut -d' ' -f1) $output_file" >> "$CHECKSUM_FILE"
}

# Backup Grafana
log "Starting Grafana backup..."
docker exec grafana grafana-cli admin backup /tmp/grafana-backup.tar.gz || handle_error "Failed to create Grafana backup"
docker cp grafana:/tmp/grafana-backup.tar.gz "$BACKUP_DIR/grafana_backup_$DATE.tar.gz" || handle_error "Failed to copy Grafana backup"
encrypt_file "$BACKUP_DIR/grafana_backup_$DATE.tar.gz" "$BACKUP_DIR/grafana_backup_$DATE.tar.gz.enc"
rm "$BACKUP_DIR/grafana_backup_$DATE.tar.gz"
log "Grafana backup completed and encrypted"

# Backup Prometheus
log "Starting Prometheus backup..."
docker exec prometheus tar -czf /tmp/prometheus-backup.tar.gz /prometheus || handle_error "Failed to create Prometheus backup"
docker cp prometheus:/tmp/prometheus-backup.tar.gz "$BACKUP_DIR/prometheus_backup_$DATE.tar.gz" || handle_error "Failed to copy Prometheus backup"
encrypt_file "$BACKUP_DIR/prometheus_backup_$DATE.tar.gz" "$BACKUP_DIR/prometheus_backup_$DATE.tar.gz.enc"
rm "$BACKUP_DIR/prometheus_backup_$DATE.tar.gz"
log "Prometheus backup completed and encrypted"

# Backup Nginx configurations
log "Starting Nginx backup..."
tar -czf "$BACKUP_DIR/nginx_backup_$DATE.tar.gz" /etc/nginx || handle_error "Failed to create Nginx backup"
encrypt_file "$BACKUP_DIR/nginx_backup_$DATE.tar.gz" "$BACKUP_DIR/nginx_backup_$DATE.tar.gz.enc"
rm "$BACKUP_DIR/nginx_backup_$DATE.tar.gz"
log "Nginx backup completed and encrypted"

# Backup environment variables (excluding sensitive data)
log "Starting environment backup..."
env | grep -v "PASSWORD\|SECRET\|KEY\|TOKEN" > "$BACKUP_DIR/env_backup_$DATE.txt"
encrypt_file "$BACKUP_DIR/env_backup_$DATE.txt" "$BACKUP_DIR/env_backup_$DATE.txt.enc"
rm "$BACKUP_DIR/env_backup_$DATE.txt"
log "Environment backup completed and encrypted"

# Backup Docker configurations
log "Starting Docker backup..."
tar -czf "$BACKUP_DIR/docker_backup_$DATE.tar.gz" /etc/docker || handle_error "Failed to create Docker backup"
encrypt_file "$BACKUP_DIR/docker_backup_$DATE.tar.gz" "$BACKUP_DIR/docker_backup_$DATE.tar.gz.enc"
rm "$BACKUP_DIR/docker_backup_$DATE.tar.gz"
log "Docker backup completed and encrypted"

# Create backup manifest
log "Creating backup manifest..."
cat > "$BACKUP_DIR/backup_manifest_$DATE.txt" << EOF
Backup Date: $DATE
Files:
- grafana_backup_$DATE.tar.gz.enc
- prometheus_backup_$DATE.tar.gz.enc
- nginx_backup_$DATE.tar.gz.enc
- env_backup_$DATE.txt.enc
- docker_backup_$DATE.tar.gz.enc
EOF
encrypt_file "$BACKUP_DIR/backup_manifest_$DATE.txt" "$BACKUP_DIR/backup_manifest_$DATE.txt.enc"
rm "$BACKUP_DIR/backup_manifest_$DATE.txt"

# Encrypt and secure checksum file
encrypt_file "$CHECKSUM_FILE" "$CHECKSUM_FILE.enc"
rm "$CHECKSUM_FILE"

# Clean up old backups
log "Cleaning up old backups..."
find "$BACKUP_DIR" -type f -name "*.enc" -mtime +$RETENTION_DAYS -delete || handle_error "Failed to clean up old backups"

# After all backups are created, run the verification
verify_backup 