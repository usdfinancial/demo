# USD Financial Database Documentation

## Overview

This database is designed for **USD Financial**, a comprehensive stablecoin-focused financial platform powered by **Netlify DB (Neon)**. The database supports multi-chain operations, DeFi integration, investment management, and traditional financial services.

## Database Architecture

### Core Principles
- **USDC Focus**: Supports USDC exclusively across multi-chain and Layer 2 networks
- **Multi-Chain**: Native support for 5 major blockchain networks
- **DeFi Integration**: Direct protocol connections (Aave, Compound, Yearn, etc.)
- **Enterprise Ready**: Designed for high transaction volumes
- **Security First**: Row-level security and comprehensive audit trails

### Supported Networks
- **Ethereum** (Chain ID: 1)
- **Polygon** (Chain ID: 137)
- **Arbitrum** (Chain ID: 42161)
- **Optimism** (Chain ID: 10)
- **Binance Smart Chain** (Chain ID: 56)

## Database Schema Structure

### 1. User Management
- **users** - Core user accounts with KYC status
- **user_profiles** - Extended profile information
- **user_sessions** - Authentication session management
- **user_wallets** - Blockchain wallet addresses per chain

### 2. Portfolio & Balances
- **stablecoin_balances** - Real-time balance tracking per chain
- **balance_history** - Historical balance snapshots
- **transactions** - All user transactions with blockchain integration
- **transaction_references** - Links transactions to other entities

### 3. DeFi Protocol Integration
- **defi_protocols** - Supported yield farming protocols
- **protocol_configurations** - Contract addresses and APY data
- **yield_positions** - User positions in DeFi protocols

### 4. Investment Management
- **tokenized_assets** - Available investment assets
- **asset_price_history** - Historical pricing data
- **user_investments** - Individual asset holdings
- **auto_invest_plans** - Automated investment strategies
- **auto_invest_allocations** - Asset allocation for plans
- **auto_invest_executions** - Execution history

### 5. Card System
- **user_cards** - Physical and virtual debit cards
- **card_transactions** - Card spending history
- **card_spending_controls** - Limits and restrictions

### 6. Business Accounts
- **business_profiles** - Company information
- **business_team_members** - Team access management

### 7. Loans & Lending
- **loan_applications** - Crypto-collateralized loan requests
- **active_loans** - Approved and disbursed loans
- **loan_payments** - Payment history

### 8. Insurance
- **insurance_policies** - DeFi protection policies
- **insurance_claims** - Filed insurance claims

### 9. Notifications & System
- **user_notifications** - System notifications
- **price_alerts** - Custom price alerts
- **system_settings** - Global application settings
- **api_rate_limits** - Rate limiting configuration

## Migration Files

The database is set up using sequential migration files:

1. **001_initial_schema.sql** - Core tables and basic structure
2. **002_investment_tables.sql** - Investment management features
3. **003_card_system.sql** - Debit card functionality
4. **004_business_loans_insurance.sql** - Business accounts and financial services
5. **005_notifications_security.sql** - Notifications and security features

## Key Features

### Security
- **Row Level Security (RLS)** enabled on all sensitive tables
- **Password hashing** for user credentials
- **Session management** with token expiration
- **Audit trails** with comprehensive transaction logging

### Performance
- **Comprehensive indexing** for fast queries
- **Optimized for high transaction volumes**
- **Efficient balance calculation** with computed columns
- **Strategic database views** for common queries

### Data Integrity
- **Foreign key constraints** maintain referential integrity
- **Check constraints** ensure data validity
- **Unique constraints** prevent duplicates
- **Automatic timestamps** for audit trails

## Setup Instructions

### 1. Netlify DB Setup
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Create database
netlify db:create --name usd-financial-db
```

### 2. Run Migrations
```bash
# Execute migrations in order
psql $DATABASE_URL -f database/migrations/001_initial_schema.sql
psql $DATABASE_URL -f database/migrations/002_investment_tables.sql
psql $DATABASE_URL -f database/migrations/003_card_system.sql
psql $DATABASE_URL -f database/migrations/004_business_loans_insurance.sql
psql $DATABASE_URL -f database/migrations/005_notifications_security.sql
```

### 3. Environment Variables
```env
DATABASE_URL=postgresql://username:password@host:port/database
DIRECT_URL=postgresql://username:password@host:port/database
```

## Usage Examples

### User Registration
```sql
-- Create new user
INSERT INTO users (email, password_hash, first_name, last_name, account_type)
VALUES ('user@example.com', '$2b$10$...', 'John', 'Doe', 'personal');

-- Create user profile
INSERT INTO user_profiles (user_id, preferred_currency, country_code)
VALUES ('uuid', 'USDC', 'US');
```

### Balance Management
```sql
-- Get user's total portfolio
SELECT 
    SUM(balance) as total_balance,
    stablecoin,
    chain_id
FROM stablecoin_balances 
WHERE user_id = 'user-uuid'
GROUP BY stablecoin, chain_id;
```

### Investment Tracking
```sql
-- Get investment performance
SELECT 
    ta.name,
    ui.total_invested,
    ui.current_value,
    ui.unrealized_pnl,
    (ui.unrealized_pnl / ui.total_invested * 100) as return_percentage
FROM user_investments ui
JOIN tokenized_assets ta ON ui.asset_id = ta.id
WHERE ui.user_id = 'user-uuid';
```

### Transaction History
```sql
-- Get recent transactions
SELECT 
    transaction_type,
    amount,
    stablecoin,
    chain_id,
    status,
    created_at
FROM transactions 
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 50;
```

## Data Types & Enums

### Custom Enums
- `stablecoin_symbol`: 'USDC'
- `chain_id`: '1', '137', '42161', '10', '56'
- `transaction_type`: Various transaction types
- `transaction_status`: 'pending', 'completed', 'failed', 'cancelled'
- `risk_level`: 'Low', 'Medium', 'High'
- `account_type`: 'personal', 'business', 'institutional'
- `kyc_status`: 'pending', 'approved', 'rejected', 'expired'

### Precision Handling
- **Cryptocurrency amounts**: DECIMAL(36, 18) for high precision
- **USD amounts**: DECIMAL(20, 2) for financial calculations
- **Percentages**: DECIMAL(5, 2) for rates and percentages
- **Prices**: DECIMAL(18, 8) for asset pricing

## Views & Analytics

### Portfolio Summary View
```sql
SELECT * FROM user_portfolio_summary WHERE user_id = 'uuid';
```

### Transaction Analytics
```sql
SELECT * FROM user_transaction_summary WHERE user_id = 'uuid';
```

### Investment Performance
```sql
SELECT * FROM investment_performance WHERE user_id = 'uuid';
```

## Backup & Maintenance

### Daily Backups
```bash
# Automated backup script
pg_dump $DATABASE_URL > backups/usd-financial-$(date +%Y%m%d).sql
```

### Performance Monitoring
- Monitor slow queries with pg_stat_statements
- Regular vacuum and analyze operations
- Index usage monitoring

## Security Considerations

1. **Sensitive Data**: Card numbers and CVVs are hashed, not stored in plain text
2. **API Keys**: Never store API keys or private keys in the database
3. **PII Protection**: Personal information is separated into profiles table
4. **Access Control**: Row-level security ensures users only see their data
5. **Audit Trails**: All financial operations are logged with timestamps

## Integration Points

### Blockchain Integration
- Smart contract addresses stored per chain
- Transaction hashes for blockchain verification
- Multi-chain balance synchronization

### DeFi Protocols
- APY tracking and updates
- Position management
- Yield calculation

### External APIs
- Price oracle integration
- KYC/AML service connections
- Card processor integration

## Scaling Considerations

1. **Horizontal Scaling**: Read replicas for analytics
2. **Partitioning**: Transaction tables by date
3. **Archiving**: Historical data archival strategy
4. **Caching**: Redis for frequently accessed data
5. **Connection Pooling**: PgBouncer for efficient connections

This database design provides a solid foundation for USD Financial's comprehensive stablecoin financial platform while ensuring security, performance, and scalability.