#!/bin/bash

# USD Financial Database Setup Script
# This script helps you deploy the database schema to AWS RDS PostgreSQL

set -e  # Exit on any error

echo "🗄️  USD Financial Database Setup"
echo "================================="

# Check if required tools are installed
command -v psql >/dev/null 2>&1 || { 
    echo "❌ Error: psql is required but not installed."
    echo "💡 Install PostgreSQL client tools:"
    echo "   - macOS: brew install postgresql"
    echo "   - Ubuntu: sudo apt-get install postgresql-client"
    echo "   - Windows: Download from https://www.postgresql.org/download/"
    exit 1
}

# Check if .env.local exists and contains DATABASE_URL
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found"
    echo "💡 Please create .env.local with your database configuration"
    exit 1
fi

# Extract DATABASE_URL from .env.local
DATABASE_URL=$(grep "^DATABASE_URL=" .env.local | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not found in .env.local"
    echo "💡 Please add your AWS RDS PostgreSQL connection string to .env.local:"
    echo "   DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/usdfinancial?sslmode=require"
    exit 1
fi

echo "📡 Testing database connection..."

# Test connection
if ! psql "$DATABASE_URL" -c "SELECT version();" >/dev/null 2>&1; then
    echo "❌ Error: Cannot connect to database"
    echo "💡 Please check your connection string and ensure:"
    echo "   - RDS instance is running"
    echo "   - Security group allows connections from your IP"
    echo "   - Username and password are correct"
    echo "   - Database name exists"
    exit 1
fi

echo "✅ Database connection successful!"

# Check if schema already exists
TABLES_EXIST=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users';" | xargs)

if [ "$TABLES_EXIST" -gt 0 ]; then
    echo "⚠️  Database schema already exists"
    echo "Do you want to:"
    echo "1) Skip deployment (schema already exists)"
    echo "2) Rollback and redeploy (⚠️  THIS WILL DELETE ALL DATA!)"
    echo "3) Exit"
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            echo "✅ Skipping deployment - schema already exists"
            exit 0
            ;;
        2)
            echo "🧹 Rolling back existing schema..."
            psql "$DATABASE_URL" -f database/migrations/rollback.sql
            echo "✅ Rollback completed"
            ;;
        3)
            echo "👋 Exiting..."
            exit 0
            ;;
        *)
            echo "❌ Invalid choice"
            exit 1
            ;;
    esac
fi

echo "🚀 Deploying database schema..."

# Deploy the schema
if psql "$DATABASE_URL" -f database/migrations/deploy.sql; then
    echo "✅ Database schema deployed successfully!"
else
    echo "❌ Error: Failed to deploy database schema"
    exit 1
fi

# Verify deployment
echo "🔍 Verifying deployment..."

TABLES_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | xargs)

if [ "$TABLES_COUNT" -gt 0 ]; then
    echo "✅ Verification successful! Created $TABLES_COUNT tables"
    
    echo ""
    echo "📊 Database Summary:"
    echo "==================="
    psql "$DATABASE_URL" -c "
        SELECT 
            table_name,
            (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as columns
        FROM information_schema.tables t
        WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    "
    
    echo ""
    echo "🎉 Success! Your USD Financial database is ready!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update your Amplify environment variables with the DATABASE_URL"
    echo "2. Test your application connection"
    echo "3. Run your application: npm run dev"
    echo ""
    echo "🔗 Connection string (for Amplify environment variables):"
    echo "DATABASE_URL=$DATABASE_URL"
    
else
    echo "❌ Error: Database deployment may have failed - no tables found"
    exit 1
fi