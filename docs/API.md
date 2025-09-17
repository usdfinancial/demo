# USD Financial API Documentation

## Overview

The USD Financial API provides comprehensive endpoints for managing USDC operations across multi-chain and Layer 2 networks. This API is focused exclusively on USDC to provide a streamlined, secure financial platform.

## Base URL
```
https://api.usdfinancial.com/api/v1
```

## Authentication

All API requests require authentication using Bearer tokens:

```http
Authorization: Bearer <your_access_token>
```

## Core Concepts

### Supported Networks
- **Ethereum Mainnet** (Chain ID: 1)
- **Polygon** (Chain ID: 137) 
- **Arbitrum One** (Chain ID: 42161)
- **Optimism** (Chain ID: 10)
- **Base** (Chain ID: 8453)
- **Avalanche** (Chain ID: 43114)

### USDC Contract Addresses
- **Ethereum**: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- **Polygon**: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`
- **Arbitrum**: `0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8`
- **Optimism**: `0x7F5c764cBc14f9669B88837ca1490cCa17c31607`
- **Base**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Avalanche**: `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E`

---

## Transactions API

### GET /api/transactions

Get transaction history with filtering options.

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `userId` | string | User ID (required) | - |
| `action` | string | Action type: `list`, `summary`, `recent`, `analytics`, `export` | `list` |
| `page` | number | Page number for pagination | `1` |
| `limit` | number | Items per page | `20` |
| `transactionType` | string | Filter by type: `deposit`, `withdrawal`, `yield`, `swap`, `bridge`, `spend`, `investment` | - |
| `status` | string | Filter by status: `pending`, `completed`, `failed`, `cancelled` | - |
| `search` | string | Search in descriptions and addresses | - |
| `stablecoin` | string | Always `USDC` (for consistency) | `USDC` |
| `chainId` | string | Filter by chain ID (comma-separated) | - |
| `dateFrom` | string | Start date (ISO format) | - |
| `dateTo` | string | End date (ISO format) | - |
| `amountMin` | string | Minimum amount filter | - |
| `amountMax` | string | Maximum amount filter | - |

#### Example Request

```http
GET /api/transactions?userId=123&action=list&chainId=1,137&transactionType=deposit&limit=10
```

#### Example Response

```json
{
  "data": [
    {
      "id": "tx_123",
      "txHash": "0x1234...5678",
      "transactionType": "deposit",
      "status": "completed",
      "amount": "1000.00",
      "feeAmount": "2.50",
      "stablecoin": "USDC",
      "chainId": "1",
      "fromAddress": "0xabc...def",
      "toAddress": "0x123...456",
      "description": "USDC Deposit to Aave",
      "blockNumber": "18500000",
      "blockTimestamp": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasMore": true
  }
}
```

### POST /api/transactions

Create a new transaction record.

#### Request Body

```json
{
  "userId": "user_123",
  "txHash": "0x1234567890abcdef...",
  "transactionType": "deposit",
  "amount": "1000.00",
  "feeAmount": "2.50",
  "stablecoin": "USDC",
  "chainId": "1",
  "fromAddress": "0xabc...def",
  "toAddress": "0x123...456",
  "description": "USDC deposit via Circle CCTP",
  "metadata": {
    "protocol": "aave",
    "version": "v3"
  }
}
```

### GET /api/transactions?action=summary

Get transaction summary for a user.

#### Example Response

```json
{
  "totalTransactions": 45,
  "totalVolume": "125750.50",
  "averageAmount": "2794.46",
  "transactionsByType": {
    "deposit": 15,
    "withdrawal": 8,
    "yield": 12,
    "bridge": 6,
    "spend": 4
  },
  "transactionsByChain": {
    "1": 20,
    "137": 15,
    "42161": 10
  },
  "period": "30d"
}
```

---

## User API

### GET /api/user

Get user profile and portfolio information.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | User ID (required) |
| `include` | string | Include additional data: `balance`, `portfolio`, `preferences` |

#### Example Response

```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "accountType": "personal",
    "kycStatus": "approved",
    "createdAt": "2023-06-15T09:00:00Z"
  },
  "portfolio": {
    "totalBalance": "125750.50",
    "balanceByChain": [
      {
        "chainId": "1",
        "chainName": "Ethereum",
        "balance": "75430.25",
        "percentage": 60.0
      },
      {
        "chainId": "137", 
        "chainName": "Polygon",
        "balance": "35250.10",
        "percentage": 28.0
      }
    ],
    "monthlyGain": {
      "amount": "2156.75",
      "percentage": 8.2
    }
  },
  "preferences": {
    "currency": "USDC",
    "notifications": true,
    "twoFactorAuth": true
  }
}
```

---

## Assets API

### GET /api/assets

Get available tokenized assets for investment.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category: `treasury`, `real_estate`, `commodities`, `equities` |
| `riskLevel` | string | Filter by risk: `Low`, `Medium`, `High` |
| `minInvestment` | number | Minimum investment amount |

#### Example Response

```json
{
  "assets": [
    {
      "id": "asset_ustb",
      "symbol": "USTB",
      "name": "US Treasury Bills Token",
      "category": "treasury",
      "currentPrice": "100.25",
      "priceChange24h": "0.15",
      "minimumInvestment": "100.00",
      "expectedReturn": "4.5",
      "riskLevel": "Low",
      "currency": "USDC",
      "isActive": true
    }
  ]
}
```

---

## Investments API

### GET /api/investments

Get user investment portfolio.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | User ID (required) |
| `assetId` | string | Filter by specific asset |
| `includeHistory` | boolean | Include price history |

#### Example Response

```json
{
  "investments": [
    {
      "id": "inv_123",
      "assetId": "asset_ustb",
      "assetSymbol": "USTB",
      "quantity": "50.00",
      "averageCost": "100.25",
      "totalInvested": "5012.50",
      "currentValue": "5125.00",
      "unrealizedPnl": "112.50",
      "unrealizedPnlPercentage": 2.25,
      "currency": "USDC",
      "firstPurchase": "2023-12-01T10:00:00Z",
      "lastPurchase": "2024-01-01T15:30:00Z"
    }
  ],
  "portfolio": {
    "totalValue": "125750.50",
    "totalInvested": "120000.00",
    "totalPnl": "5750.50",
    "totalPnlPercentage": 4.79
  }
}
```

### POST /api/investments

Create a new investment.

#### Request Body

```json
{
  "userId": "user_123",
  "assetId": "asset_ustb", 
  "amount": "1000.00",
  "currency": "USDC",
  "orderType": "market"
}
```

---

## Health API

### GET /api/health

Check API health status.

#### Example Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "healthy",
    "blockchain": "healthy",
    "external_apis": "healthy"
  },
  "version": "1.0.0"
}
```

---

## Error Handling

All API endpoints return errors in a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Invalid value provided"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Malformed request |
| `UNAUTHORIZED` | 401 | Invalid or missing token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limits

- **General endpoints**: 1000 requests/hour per user
- **Transaction endpoints**: 500 requests/hour per user  
- **Investment endpoints**: 100 requests/hour per user

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642262400
```

---

## Circle CCTP Integration

USD Financial leverages Circle's Cross-Chain Transfer Protocol for seamless USDC transfers:

### Bridge Transaction Flow

1. **Initiate**: POST `/api/transactions` with `transactionType: "bridge"`
2. **Monitor**: GET `/api/transactions/{id}` for status updates
3. **Complete**: Automatic completion via Circle attestation

### Supported Bridge Routes

All combinations between supported networks are available with CCTP:

- Ethereum ↔ Polygon
- Ethereum ↔ Arbitrum  
- Ethereum ↔ Optimism
- Ethereum ↔ Base
- Ethereum ↔ Avalanche
- And all cross-combinations

---

## SDKs and Examples

### JavaScript/TypeScript

```javascript
import { USDFinancialAPI } from '@usd-financial/api';

const api = new USDFinancialAPI({
  apiKey: 'your_api_key',
  baseURL: 'https://api.usdfinancial.com'
});

// Get transaction history
const transactions = await api.transactions.list({
  userId: 'user_123',
  chainId: ['1', '137'],
  limit: 10
});

// Create USDC deposit
const deposit = await api.transactions.create({
  userId: 'user_123',
  transactionType: 'deposit',
  amount: '1000.00',
  stablecoin: 'USDC',
  chainId: '1'
});
```

### Python

```python
from usd_financial import USDFinancialAPI

api = USDFinancialAPI(
    api_key="your_api_key",
    base_url="https://api.usdfinancial.com"
)

# Get user portfolio
portfolio = api.user.get_portfolio(user_id="user_123")
print(f"Total USDC: {portfolio.total_balance}")
```

---

## Changelog

### v1.0.0 (Current)
- USDC-focused API with multi-chain support
- Circle CCTP integration for cross-chain transfers  
- Comprehensive transaction management
- Investment portfolio tracking
- Real-time balance synchronization

---

## Support

- **Documentation**: https://docs.usdfinancial.com
- **Status Page**: https://status.usdfinancial.com  
- **Support Email**: api-support@usdfinancial.com
- **Discord**: https://discord.gg/usdfinancial