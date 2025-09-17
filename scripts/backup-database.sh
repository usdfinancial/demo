#!/bin/bash

# USD Financial Database Backup Script
# Automated backup solution for Netlify DB (Neon)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="usd_financial_backup_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

# S3 Configuration (optional)
AWS_S3_BUCKET="${BACKUP_S3_BUCKET:-}"
AWS_REGION="${AWS_REGION:-us-east-1}"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL environment variable is not set!"
        exit 1
    fi
    
    # Check if pg_dump is available
    if ! command -v pg_dump &> /dev/null; then
        print_error "pg_dump is not installed!"
        print_warning "Please install PostgreSQL client tools"
        exit 1
    fi
    
    # Check if backup directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        print_status "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
    
    print_success "Prerequisites check passed"
}

# Function to create database backup
create_backup() {
    print_status "Creating database backup..."
    print_status "Backup file: $BACKUP_PATH"
    
    # Create the backup with compression
    if pg_dump "$DATABASE_URL" \
        --verbose \
        --no-owner \
        --no-privileges \
        --format=custom \
        --compress=9 \
        --file="$BACKUP_PATH.dump"; then
        
        print_success "Database backup created successfully"
        
        # Also create a SQL text backup for easier inspection
        if pg_dump "$DATABASE_URL" \
            --verbose \
            --no-owner \
            --no-privileges \
            --format=plain \
            --file="$BACKUP_PATH"; then
            
            print_success "SQL text backup created successfully"
            
            # Compress the SQL file
            if command -v gzip &> /dev/null; then
                gzip "$BACKUP_PATH"
                BACKUP_PATH="${BACKUP_PATH}.gz"
                print_success "Backup compressed with gzip"
            fi
        fi
        
        # Get backup file size
        if [ -f "$BACKUP_PATH" ]; then
            BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
            print_status "Backup size: $BACKUP_SIZE"
        fi
        
    else
        print_error "Database backup failed!"
        exit 1
    fi
}

# Function to upload backup to S3 (optional)
upload_to_s3() {
    if [ -n "$AWS_S3_BUCKET" ]; then
        print_status "Uploading backup to S3..."
        
        # Check if AWS CLI is available
        if ! command -v aws &> /dev/null; then
            print_warning "AWS CLI not found, skipping S3 upload"
            return 0
        fi
        
        # Upload both files
        for file in "${BACKUP_PATH}.dump" "$BACKUP_PATH"; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                s3_path="s3://${AWS_S3_BUCKET}/database-backups/${filename}"
                
                if aws s3 cp "$file" "$s3_path" --region "$AWS_REGION"; then
                    print_success "Uploaded $filename to S3"
                else
                    print_warning "Failed to upload $filename to S3"
                fi
            fi
        done
    else
        print_status "S3 backup not configured, skipping upload"
    fi
}

# Function to clean up old backups
cleanup_old_backups() {
    print_status "Cleaning up backups older than $BACKUP_RETENTION_DAYS days..."
    
    # Find and delete old local backups
    if [ -d "$BACKUP_DIR" ]; then
        old_backups=$(find "$BACKUP_DIR" -name "usd_financial_backup_*.sql*" -type f -mtime +$BACKUP_RETENTION_DAYS 2>/dev/null || true)
        old_dumps=$(find "$BACKUP_DIR" -name "usd_financial_backup_*.dump" -type f -mtime +$BACKUP_RETENTION_DAYS 2>/dev/null || true)
        
        if [ -n "$old_backups" ] || [ -n "$old_dumps" ]; then
            echo "$old_backups" | while read -r file; do
                if [ -n "$file" ]; then
                    rm -f "$file"
                    print_status "Deleted old backup: $(basename "$file")"
                fi
            done
            
            echo "$old_dumps" | while read -r file; do
                if [ -n "$file" ]; then
                    rm -f "$file"
                    print_status "Deleted old dump: $(basename "$file")"
                fi
            done
        else
            print_status "No old backups to clean up"
        fi
    fi
    
    # Clean up old S3 backups (if configured)
    if [ -n "$AWS_S3_BUCKET" ] && command -v aws &> /dev/null; then
        print_status "Cleaning up old S3 backups..."
        
        # List and delete old S3 objects
        cutoff_date=$(date -d "$BACKUP_RETENTION_DAYS days ago" +%Y-%m-%d 2>/dev/null || date -v-${BACKUP_RETENTION_DAYS}d +%Y-%m-%d 2>/dev/null || echo "")
        
        if [ -n "$cutoff_date" ]; then
            aws s3api list-objects-v2 \
                --bucket "$AWS_S3_BUCKET" \
                --prefix "database-backups/" \
                --query "Contents[?LastModified<='$cutoff_date'].Key" \
                --output text | while read -r key; do
                if [ -n "$key" ] && [ "$key" != "None" ]; then
                    aws s3 rm "s3://${AWS_S3_BUCKET}/$key"
                    print_status "Deleted old S3 backup: $key"
                fi
            done
        fi
    fi
    
    print_success "Cleanup completed"
}

# Function to verify backup integrity
verify_backup() {
    print_status "Verifying backup integrity..."
    
    # Verify the dump file
    if [ -f "${BACKUP_PATH}.dump" ]; then
        if pg_restore --list "${BACKUP_PATH}.dump" >/dev/null 2>&1; then
            print_success "Dump file integrity verified"
        else
            print_error "Dump file appears to be corrupted!"
            exit 1
        fi
    fi
    
    # Verify the SQL file (if not compressed)
    if [ -f "$BACKUP_PATH" ]; then
        if head -n 5 "$BACKUP_PATH" | grep -q "PostgreSQL database dump"; then
            print_success "SQL file integrity verified"
        else
            print_warning "SQL file may be corrupted"
        fi
    elif [ -f "${BACKUP_PATH}" ]; then
        # Check gzipped file
        if gunzip -t "${BACKUP_PATH}" 2>/dev/null; then
            print_success "Compressed SQL file integrity verified"
        else
            print_warning "Compressed SQL file may be corrupted"
        fi
    fi
}

# Function to send notification (optional)
send_notification() {
    local status=$1
    local message=$2
    
    # Email notification (if configured)
    if [ -n "$NOTIFICATION_EMAIL" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "USD Financial Backup $status" "$NOTIFICATION_EMAIL"
        print_status "Email notification sent"
    fi
    
    # Webhook notification (if configured)
    if [ -n "$WEBHOOK_URL" ] && command -v curl &> /dev/null; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"status\":\"$status\",\"message\":\"$message\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
            --silent --show-error || true
        print_status "Webhook notification sent"
    fi
}

# Function to generate backup report
generate_report() {
    local report_file="${BACKUP_DIR}/backup_report_${TIMESTAMP}.txt"
    
    cat > "$report_file" << EOF
USD Financial Database Backup Report
====================================

Backup Date: $(date)
Backup Files:
  - Dump: ${BACKUP_PATH}.dump
  - SQL: ${BACKUP_PATH}

Database Information:
$(psql "$DATABASE_URL" -c "SELECT version();" --quiet --tuples-only 2>/dev/null || echo "Unable to get database version")

Backup Statistics:
EOF

    # Add file sizes if files exist
    for file in "${BACKUP_PATH}.dump" "$BACKUP_PATH"; do
        if [ -f "$file" ]; then
            size=$(du -h "$file" | cut -f1)
            echo "  - $(basename "$file"): $size" >> "$report_file"
        fi
    done
    
    # Add table counts
    echo "" >> "$report_file"
    echo "Table Row Counts:" >> "$report_file"
    psql "$DATABASE_URL" -c "
        SELECT 
            schemaname || '.' || tablename as table_name,
            n_tup_ins - n_tup_del as row_count
        FROM pg_stat_user_tables 
        ORDER BY n_tup_ins - n_tup_del DESC
        LIMIT 10;
    " --quiet 2>/dev/null >> "$report_file" || echo "Unable to get table statistics" >> "$report_file"
    
    print_success "Backup report generated: $report_file"
}

# Main backup function
main() {
    local start_time=$(date +%s)
    
    print_status "🚀 Starting USD Financial database backup..."
    print_status "=========================================="
    
    # Run backup steps
    check_prerequisites
    create_backup
    verify_backup
    upload_to_s3
    cleanup_old_backups
    generate_report
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    local success_message="✅ Database backup completed successfully in ${duration} seconds
Backup files:
  - ${BACKUP_PATH}.dump
  - ${BACKUP_PATH}
Location: $BACKUP_DIR"
    
    print_success "$success_message"
    send_notification "SUCCESS" "$success_message"
}

# Error handler
error_handler() {
    local error_message="❌ Database backup failed at step: $1
Error: $2
Time: $(date)
Check logs for more details."
    
    print_error "$error_message"
    send_notification "FAILED" "$error_message"
    exit 1
}

# Set error trap
trap 'error_handler "Unknown" "$BASH_COMMAND"' ERR

# Check if running in test mode
if [ "$1" = "--test" ]; then
    print_status "Running in test mode..."
    BACKUP_DIR="./test-backups"
    BACKUP_RETENTION_DAYS=1
fi

# Check if running in dry-run mode
if [ "$1" = "--dry-run" ]; then
    print_status "Running in dry-run mode..."
    print_status "Would create backup: $BACKUP_PATH"
    print_status "Would clean up files older than $BACKUP_RETENTION_DAYS days"
    exit 0
fi

# Show help
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "USD Financial Database Backup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --test      Run in test mode with temporary settings"
    echo "  --dry-run   Show what would be done without executing"
    echo "  --help, -h  Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  DATABASE_URL              PostgreSQL connection string (required)"
    echo "  BACKUP_DIR                Backup directory (default: ./backups)"
    echo "  BACKUP_RETENTION_DAYS     Days to keep backups (default: 30)"
    echo "  BACKUP_S3_BUCKET          S3 bucket for remote backups (optional)"
    echo "  AWS_REGION                AWS region (default: us-east-1)"
    echo "  NOTIFICATION_EMAIL        Email for notifications (optional)"
    echo "  WEBHOOK_URL               Webhook for notifications (optional)"
    echo ""
    exit 0
fi

# Run main function
main "$@"