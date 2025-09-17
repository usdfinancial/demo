#!/bin/bash

# USD Financial Database Deployment Script
# Automated deployment for Netlify DB (Neon) with CI/CD integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT="${ENVIRONMENT:-development}"
MIGRATE_ONLY="${MIGRATE_ONLY:-false}"
SEED_DATA="${SEED_DATA:-false}"
DRY_RUN="${DRY_RUN:-false}"

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

# Function to check environment
check_environment() {
    print_status "Checking deployment environment: $ENVIRONMENT"
    
    case $ENVIRONMENT in
        "production")
            if [ "$DRY_RUN" != "true" ]; then
                print_warning "⚠️  PRODUCTION DEPLOYMENT ⚠️"
                print_warning "This will deploy to the production database!"
                
                if [ -z "$FORCE_PRODUCTION" ]; then
                    read -p "Are you sure you want to continue? Type 'yes' to confirm: " -r
                    if [ "$REPLY" != "yes" ]; then
                        print_status "Deployment cancelled"
                        exit 0
                    fi
                fi
            fi
            ;;
        "preview"|"staging")
            print_status "Deploying to preview/staging environment"
            ;;
        "development")
            print_status "Deploying to development environment"
            SEED_DATA="true"  # Always seed data in development
            ;;
        *)
            print_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking deployment prerequisites..."
    
    # Check database URL
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL environment variable is not set!"
        exit 1
    fi
    
    # Check psql
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL client (psql) is not installed!"
        exit 1
    fi
    
    # Check Netlify CLI (if available)
    if command -v netlify &> /dev/null; then
        print_success "Netlify CLI available"
        
        # Get database info if possible
        if netlify db:list >/dev/null 2>&1; then
            print_status "Netlify DB connection verified"
        fi
    else
        print_warning "Netlify CLI not available (optional)"
    fi
    
    print_success "Prerequisites check passed"
}

# Function to test database connection
test_connection() {
    print_status "Testing database connection..."
    
    if [ "$DRY_RUN" = "true" ]; then
        print_status "[DRY RUN] Would test database connection"
        return 0
    fi
    
    # Test connection with timeout
    if timeout 30 psql "$DATABASE_URL" -c "SELECT version();" --quiet >/dev/null 2>&1; then
        print_success "Database connection successful"
        
        # Get database info
        DB_VERSION=$(psql "$DATABASE_URL" -c "SELECT version();" --quiet --tuples-only | head -n1)
        print_status "Database: ${DB_VERSION:0:50}..."
        
        return 0
    else
        print_error "Failed to connect to database"
        return 1
    fi
}

# Function to backup database before deployment
backup_before_deploy() {
    if [ "$ENVIRONMENT" = "production" ] && [ "$DRY_RUN" != "true" ]; then
        print_status "Creating pre-deployment backup..."
        
        BACKUP_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        BACKUP_FILE="pre_deploy_backup_${BACKUP_TIMESTAMP}.sql"
        
        if pg_dump "$DATABASE_URL" \
            --no-owner \
            --no-privileges \
            --format=custom \
            --compress=9 \
            --file="./backups/${BACKUP_FILE}.dump" 2>/dev/null; then
            
            print_success "Pre-deployment backup created: ${BACKUP_FILE}.dump"
        else
            print_error "Failed to create pre-deployment backup!"
            print_warning "Continue without backup? (y/N)"
            read -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        print_status "Skipping backup (not production or dry run)"
    fi
}

# Function to check current schema version
check_schema_version() {
    print_status "Checking current schema version..."
    
    if [ "$DRY_RUN" = "true" ]; then
        print_status "[DRY RUN] Would check schema version"
        return 0
    fi
    
    # Check if schema_migrations table exists
    if psql "$DATABASE_URL" -c "SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_migrations';" --quiet --tuples-only | grep -q 1 2>/dev/null; then
        CURRENT_VERSION=$(psql "$DATABASE_URL" -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;" --quiet --tuples-only 2>/dev/null || echo "unknown")
        print_status "Current schema version: $CURRENT_VERSION"
    else
        print_status "No schema migrations table found (fresh database)"
    fi
}

# Function to run migrations
run_migrations() {
    print_status "Running database migrations..."
    
    if [ "$DRY_RUN" = "true" ]; then
        print_status "[DRY RUN] Would run migrations:"
        for migration in database/migrations/*.sql; do
            if [ -f "$migration" ]; then
                print_status "  - $(basename "$migration")"
            fi
        done
        return 0
    fi
    
    # Create migrations tracking table if it doesn't exist
    psql "$DATABASE_URL" -c "
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMPTZ DEFAULT now()
        );
    " --quiet
    
    # Run migrations in order
    migration_count=0
    for migration in database/migrations/*.sql; do
        if [ ! -f "$migration" ]; then
            continue
        fi
        
        migration_name=$(basename "$migration" .sql)
        
        # Check if migration already applied
        if psql "$DATABASE_URL" -c "SELECT 1 FROM schema_migrations WHERE version = '$migration_name';" --quiet --tuples-only | grep -q 1; then
            print_status "Migration $migration_name already applied, skipping"
            continue
        fi
        
        print_status "Applying migration: $migration_name"
        
        # Run migration in transaction
        if psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --quiet << EOF
BEGIN;
\i $migration
INSERT INTO schema_migrations (version) VALUES ('$migration_name');
COMMIT;
EOF
        then
            print_success "Migration $migration_name applied successfully"
            migration_count=$((migration_count + 1))
        else
            print_error "Migration $migration_name failed!"
            exit 1
        fi
    done
    
    if [ $migration_count -eq 0 ]; then
        print_status "No new migrations to apply"
    else
        print_success "Applied $migration_count migrations"
    fi
}

# Function to seed data
seed_database() {
    if [ "$SEED_DATA" = "true" ] && [ -f "database/seed-data.sql" ]; then
        print_status "Seeding database with sample data..."
        
        if [ "$DRY_RUN" = "true" ]; then
            print_status "[DRY RUN] Would seed database with sample data"
            return 0
        fi
        
        # Check if database already has data
        user_count=$(psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;" --quiet --tuples-only 2>/dev/null | tr -d ' ' || echo "0")
        
        if [ "$user_count" -gt 0 ] && [ "$ENVIRONMENT" != "development" ]; then
            print_warning "Database already contains $user_count users"
            print_warning "Seeding may create duplicate data"
            read -p "Continue with seeding? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_status "Skipping database seeding"
                return 0
            fi
        fi
        
        if psql "$DATABASE_URL" -f "database/seed-data.sql" --quiet; then
            print_success "Database seeded successfully"
        else
            print_warning "Database seeding failed (non-critical)"
        fi
    else
        print_status "Skipping database seeding"
    fi
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    if [ "$DRY_RUN" = "true" ]; then
        print_status "[DRY RUN] Would verify deployment"
        return 0
    fi
    
    # Check table count
    table_count=$(psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" --quiet --tuples-only | tr -d ' ')
    
    if [ "$table_count" -gt 30 ]; then
        print_success "Verification passed: $table_count tables found"
    else
        print_error "Verification failed: only $table_count tables found"
        return 1
    fi
    
    # Test a few key queries
    print_status "Testing key database operations..."
    
    # Test user table
    if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;" --quiet >/dev/null 2>&1; then
        print_success "Users table accessible"
    else
        print_error "Users table not accessible"
        return 1
    fi
    
    # Test stablecoin_balances table
    if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM stablecoin_balances;" --quiet >/dev/null 2>&1; then
        print_success "Stablecoin balances table accessible"
    else
        print_error "Stablecoin balances table not accessible"
        return 1
    fi
    
    # Test a view
    if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM user_portfolio_summary;" --quiet >/dev/null 2>&1; then
        print_success "Portfolio summary view accessible"
    else
        print_warning "Portfolio summary view not accessible (may be expected)"
    fi
    
    print_success "Database deployment verification completed"
}

# Function to update Netlify environment variables (if needed)
update_netlify_env() {
    if command -v netlify &> /dev/null && [ "$ENVIRONMENT" != "development" ]; then
        print_status "Updating Netlify environment variables..."
        
        if [ "$DRY_RUN" = "true" ]; then
            print_status "[DRY RUN] Would update Netlify environment variables"
            return 0
        fi
        
        # Set any required environment variables
        # This is environment-specific and may need customization
        print_status "Environment variables updated (if configured)"
    fi
}

# Function to send deployment notification
send_notification() {
    local status=$1
    local duration=$2
    
    local message="🚀 USD Financial Database Deployment $status
Environment: $ENVIRONMENT
Duration: ${duration}s
Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    
    print_status "$message"
    
    # Webhook notification
    if [ -n "$DEPLOYMENT_WEBHOOK_URL" ] && command -v curl &> /dev/null; then
        curl -X POST "$DEPLOYMENT_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"status\":\"$status\",
                \"environment\":\"$ENVIRONMENT\",
                \"duration\":$duration,
                \"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
            }" \
            --silent --show-error || true
    fi
    
    # Slack notification (if configured)
    if [ -n "$SLACK_WEBHOOK_URL" ] && command -v curl &> /dev/null; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"$message\"}" \
            --silent --show-error || true
    fi
}

# Main deployment function
main() {
    local start_time=$(date +%s)
    
    print_status "🚀 Starting USD Financial database deployment..."
    print_status "Environment: $ENVIRONMENT"
    print_status "Migrate Only: $MIGRATE_ONLY"
    print_status "Seed Data: $SEED_DATA"
    print_status "Dry Run: $DRY_RUN"
    print_status "==============================================="
    
    # Run deployment steps
    check_environment
    check_prerequisites
    test_connection
    backup_before_deploy
    check_schema_version
    run_migrations
    
    if [ "$MIGRATE_ONLY" != "true" ]; then
        seed_database
        update_netlify_env
    fi
    
    verify_deployment
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ "$DRY_RUN" = "true" ]; then
        print_success "🎯 Dry run completed successfully in ${duration} seconds"
        print_status "No actual changes were made to the database"
    else
        print_success "🎉 Database deployment completed successfully in ${duration} seconds"
        send_notification "SUCCESS" "$duration"
    fi
}

# Error handler
error_handler() {
    local duration=$(($(date +%s) - start_time))
    print_error "❌ Database deployment failed"
    send_notification "FAILED" "$duration"
    exit 1
}

# Set error trap
trap error_handler ERR

# Show help
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "USD Financial Database Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --env ENV         Environment (development|preview|production)"
    echo "  --migrate-only    Only run migrations, skip seeding"
    echo "  --seed            Force seed data loading"
    echo "  --dry-run         Show what would be done without executing"
    echo "  --help, -h        Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  DATABASE_URL              PostgreSQL connection string (required)"
    echo "  ENVIRONMENT               Deployment environment"
    echo "  MIGRATE_ONLY              Only run migrations (true/false)"
    echo "  SEED_DATA                 Load seed data (true/false)"
    echo "  DRY_RUN                   Dry run mode (true/false)"
    echo "  FORCE_PRODUCTION          Skip production confirmation"
    echo "  DEPLOYMENT_WEBHOOK_URL    Webhook for deployment notifications"
    echo "  SLACK_WEBHOOK_URL         Slack webhook for notifications"
    echo ""
    echo "Examples:"
    echo "  $0 --env development           # Deploy to development with seed data"
    echo "  $0 --env production --migrate-only  # Only run migrations in production"
    echo "  $0 --dry-run                   # Preview what would be deployed"
    echo ""
    exit 0
fi

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --migrate-only)
            MIGRATE_ONLY="true"
            shift
            ;;
        --seed)
            SEED_DATA="true"
            shift
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main "$@"