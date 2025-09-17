# AWS RDS Database Setup Guide for USD Financial

This guide walks you through setting up and configuring AWS RDS for the USD Financial application deployed on AWS Amplify.

## 🚀 Quick Start

### 1. Prerequisites

Before starting, ensure you have:
- [AWS CLI](https://aws.amazon.com/cli/) installed and configured
- [Amplify CLI](https://docs.amplify.aws/cli/start/install/) installed
- [PostgreSQL client](https://www.postgresql.org/download/) (for psql command)
- Node.js 18+ installed
- An AWS account with appropriate permissions

### 2. Install AWS Amplify CLI

```bash
# Install globally
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure
```

### 3. Initialize Amplify Project

```bash
# Navigate to your project directory
cd /path/to/usd-financial

# Initialize Amplify
amplify init

# Create a new database
netlify db:create --name usd-financial-db

# This will:
# - Create a new Neon database instance
# - Configure connection strings
# - Set up environment variables
```

### 4. Configure Environment Variables

The setup script will automatically configure these variables:
- `NEON_DATABASE_URL` - Main connection string (with pooling)
- `NEON_DIRECT_URL` - Direct connection (for migrations)

Copy the provided values to your `.env.local` file:

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your database URLs
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://username:password@host:port/database?sslmode=require"
```

### 5. Initialize Database

Run the automated setup script:

```bash
# Make sure the script is executable
chmod +x scripts/setup-database.sh

# Run the setup
./scripts/setup-database.sh

# Or with sample data for development
SEED_DATA=true ./scripts/setup-database.sh
```

## 📋 Manual Setup (Alternative)

If you prefer manual setup or need more control:

### 1. Create Database Manually

```bash
# Create database through Netlify dashboard or CLI
netlify db:create --name usd-financial-db --region us-east-1

# Get connection details
netlify db:list
```

### 2. Run Migrations Manually

```bash
# Set your database URL
export DATABASE_URL="your_connection_string_here"

# Run migrations in order
psql $DATABASE_URL -f database/migrations/001_initial_schema.sql
psql $DATABASE_URL -f database/migrations/002_investment_tables.sql
psql $DATABASE_URL -f database/migrations/003_card_system.sql
psql $DATABASE_URL -f database/migrations/004_business_loans_insurance.sql
psql $DATABASE_URL -f database/migrations/005_notifications_security.sql

# Optional: Load sample data
psql $DATABASE_URL -f database/seed-data.sql
```

## 🔧 Configuration Details

### Netlify Configuration

The `netlify.toml` file includes database configuration:

```toml
# Netlify DB Configuration
[[databases]]
  name = "usd-financial-db"
  engine = "neon"
  region = "us-east-1"

[context.production.environment]
  DATABASE_URL = "${NEON_DATABASE_URL}"
  DIRECT_URL = "${NEON_DIRECT_URL}"
```

### Connection Pooling

USD Financial uses PgBouncer for connection pooling:

- **Pooled Connection**: Use `DATABASE_URL` for application queries
- **Direct Connection**: Use `DIRECT_URL` for migrations and admin tasks

### Environment-Specific Setup

#### Development
```bash
# Development with sample data
ENVIRONMENT=development ./scripts/setup-database.sh
```

#### Preview/Staging
```bash
# Preview deployment
ENVIRONMENT=preview ./scripts/deploy-database.sh --migrate-only
```

#### Production
```bash
# Production deployment (with confirmation)
ENVIRONMENT=production ./scripts/deploy-database.sh --migrate-only
```

## 🛠 Database Management

### Backup Database

```bash
# Create backup
./scripts/backup-database.sh

# With S3 upload (configure AWS credentials first)
AWS_S3_BUCKET=your-backup-bucket ./scripts/backup-database.sh
```

### Deploy Changes

```bash
# Deploy migrations only
./scripts/deploy-database.sh --env production --migrate-only

# Deploy with seed data (development)
./scripts/deploy-database.sh --env development --seed
```

### Health Check

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check application health
curl http://localhost:3000/api/health
```

## 📊 Monitoring and Maintenance

### Database Statistics

```sql
-- View table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- View connection count
SELECT count(*) FROM pg_stat_activity;

-- View slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### Performance Monitoring

The database includes built-in monitoring:

1. **Connection Pool Stats**: Monitor via application logs
2. **Query Performance**: Built-in slow query logging
3. **Health Checks**: Automated endpoint at `/api/health`

### Backup Schedule

Set up automated backups:

```bash
# Add to crontab for daily backups at 2 AM
0 2 * * * /path/to/usd-financial/scripts/backup-database.sh

# With environment variables
0 2 * * * DATABASE_URL="..." BACKUP_S3_BUCKET="..." /path/to/scripts/backup-database.sh
```

## 🔒 Security Configuration

### Row Level Security (RLS)

The database implements RLS policies:

```sql
-- Example: Users can only see their own data
CREATE POLICY users_policy ON users 
FOR ALL USING (id = current_setting('app.current_user_id')::uuid);
```

### Connection Security

- **SSL Required**: All connections use SSL
- **IP Restrictions**: Configure in Netlify dashboard
- **Connection Limits**: Managed by PgBouncer

### Sensitive Data

- Card numbers and CVVs are hashed, never stored in plain text
- PII is separated into profile tables
- API keys and secrets are not stored in the database

## 🚨 Troubleshooting

### Common Issues

#### Connection Timeout
```bash
# Increase timeout in connection string
DATABASE_URL="...?connect_timeout=30"
```

#### Migration Failures
```bash
# Check current schema version
psql $DATABASE_URL -c "SELECT * FROM schema_migrations ORDER BY applied_at DESC LIMIT 5;"

# Rollback if needed (manual)
psql $DATABASE_URL -c "BEGIN; -- your rollback SQL here; COMMIT;"
```

#### Performance Issues
```bash
# Check slow queries
psql $DATABASE_URL -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Check connection pool
# Monitor application logs for pool statistics
```

### Getting Help

1. **Netlify DB Issues**: Check [Netlify docs](https://docs.netlify.com/platform/add-ons/databases/)
2. **Neon Issues**: Visit [Neon documentation](https://neon.tech/docs)
3. **Application Issues**: Check application logs and health endpoints

## 📚 Additional Resources

- [Netlify DB Documentation](https://docs.netlify.com/platform/add-ons/databases/)
- [Neon PostgreSQL Guide](https://neon.tech/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Schema Documentation](./README.md)

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Database
on:
  push:
    branches: [main]
    paths: ['database/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install Netlify CLI
        run: npm install -g netlify-cli
      - name: Deploy Database
        run: ./scripts/deploy-database.sh --env production --migrate-only
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
```

This setup provides a robust, scalable database infrastructure for USD Financial with proper security, monitoring, and maintenance procedures.