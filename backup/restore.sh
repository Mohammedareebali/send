#!/bin/bash

# Configuration
BACKUP_DIR="/backups"
RESTORE_DATE=$1

# Check if restore date is provided
if [ -z "$RESTORE_DATE" ]; then
    echo "Usage: $0 <backup_date>"
    echo "Available backups:"
    ls -1 $BACKUP_DIR/manifest_*.txt | sed 's/.*manifest_\(.*\)\.txt/\1/'
    exit 1
fi

# Verify backup files exist
if [ ! -f "$BACKUP_DIR/grafana_$RESTORE_DATE.tar.gz" ] || \
   [ ! -f "$BACKUP_DIR/prometheus_$RESTORE_DATE.tar.gz" ] || \
   [ ! -f "$BACKUP_DIR/nginx_$RESTORE_DATE.tar.gz" ] || \
   [ ! -f "$BACKUP_DIR/docker_$RESTORE_DATE.tar.gz" ]; then
    echo "Error: Backup files for date $RESTORE_DATE not found!"
    exit 1
fi

# Stop services
echo "Stopping services..."
docker-compose down

# Restore Grafana data
echo "Restoring Grafana data..."
docker cp $BACKUP_DIR/grafana_$RESTORE_DATE.tar.gz grafana:/tmp/grafana_backup.tar.gz
docker exec grafana rm -rf /var/lib/grafana/*
docker exec grafana tar -xzf /tmp/grafana_backup.tar.gz -C /
docker exec grafana rm /tmp/grafana_backup.tar.gz

# Restore Prometheus data
echo "Restoring Prometheus data..."
docker cp $BACKUP_DIR/prometheus_$RESTORE_DATE.tar.gz prometheus:/tmp/prometheus_backup.tar.gz
docker exec prometheus rm -rf /prometheus/*
docker exec prometheus tar -xzf /tmp/prometheus_backup.tar.gz -C /
docker exec prometheus rm /tmp/prometheus_backup.tar.gz

# Restore Nginx configurations
echo "Restoring Nginx configurations..."
rm -rf nginx/
tar -xzf $BACKUP_DIR/nginx_$RESTORE_DATE.tar.gz

# Restore Docker configurations
echo "Restoring Docker configurations..."
tar -xzf $BACKUP_DIR/docker_$RESTORE_DATE.tar.gz

# Start services
echo "Starting services..."
docker-compose up -d

# Verify services are running
echo "Verifying services..."
sleep 10
docker-compose ps

echo "Restore completed successfully!"
echo "Restored from backup date: $RESTORE_DATE" 