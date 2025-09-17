#!/bin/bash

# USD Financial Database Constraints Deployment Script
# This script applies the critical integrity constraints identified in the audit

set -e # Exit on any error

echo "🚀 USD Financial Database Constraints Deployment"
echo "================================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set your database connection string:"
    echo "export DATABASE_URL='postgresql://user:password@host:port/database'"
    exit 1
fi

# Confirm deployment
echo "⚠️  This will add integrity constraints to your database."
echo "📍 Database: $DATABASE_URL"
echo ""
read -p "Do you want to continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "🔧 Running database integrity constraints migration..."

# Run the migration
psql "$DATABASE_URL" -f database/migrations/add_integrity_constraints.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database constraints deployed successfully!"
    echo ""
    echo "📊 Constraints added:"
    echo "  ✓ Unique active user sessions"
    echo "  ✓ Non-negative balance constraints"
    echo "  ✓ Balance consistency constraints"
    echo "  ✓ Positive investment amounts"
    echo "  ✓ Positive transaction amounts"
    echo "  ✓ Valid email format constraints"
    echo "  ✓ Valid wallet address format"
    echo "  ✓ Positive card limits"
    echo "  ✓ Unique login history constraints"
    echo "  ✓ Performance indexes"
    echo ""
    echo "🎉 Your database now has enhanced integrity protection!"
else
    echo ""
    echo "❌ Error: Migration failed!"
    echo "Please check the error messages above and resolve any issues."
    exit 1
fi