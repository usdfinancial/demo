# Persona KYC Implementation Guide

This document outlines the complete implementation of Persona KYC integration for the USD Financial platform.

## Overview

We have successfully implemented Persona's hosted flow solution for KYC (Know Your Customer) verification. This integration uses Persona's sandbox environment for development and testing.

## Implementation Components

### 1. Environment Configuration

**File:** `.env.local.example`

Added the following environment variables:
```bash
# Persona KYC Configuration
PERSONA_API_KEY=your_persona_api_key_here
PERSONA_ENVIRONMENT_ID=env_ueeK7hhHJWCQ4X491rPxwy3jMVGM
PERSONA_TEMPLATE_ID=itmpl_5aKCN8nrmDhNoSSQV8Y4WKA13UK8
PERSONA_WEBHOOK_SECRET=your_persona_webhook_secret_here
NEXT_PUBLIC_PERSONA_ENVIRONMENT_ID=env_ueeK7hhHJWCQ4X491rPxwy3jMVGM
```

### 2. API Route Implementation

**File:** `src/app/api/user/kyc/route.ts`

Features:
- **GET**: Retrieve user KYC status
- **POST**: Update KYC status and handle Persona webhooks
- Authentication and authorization checks
- Rate limiting protection
- Comprehensive error handling
- Webhook signature verification (ready for implementation)

### 3. Frontend KYC Page

**File:** `src/app/kyc/page.tsx`

Features:
- Persona hosted flow integration
- Modern, responsive UI with Tailwind CSS
- Multiple KYC status states (unverified, pending, approved, rejected)
- Loading states and error handling
- Popup window management for Persona flow
- URL parameter handling for redirects

### 4. Database Schema Enhancements

**File:** `database/migrations/009_persona_kyc_integration.sql`

Enhancements:
- Optimized indexes for KYC queries
- KYC analytics view
- Constraints for unique inquiry IDs
- System settings for Persona configuration
- Updated notification preferences

### 5. User Service Extensions

**File:** `src/lib/services/userService.ts`

Added methods:
- `updateUserKycStatus()`: Update user KYC status with Persona data
- `findUserByKycInquiryId()`: Find user by Persona inquiry ID
- Enhanced getUserProfile to support KYC fields

## Persona Hosted Flow Integration

### Configuration
- **Template ID**: `itmpl_5aKCN8nrmDhNoSSQV8Y4WKA13UK8` (GovID + Selfie)
- **Environment**: `env_ueeK7hhHJWCQ4X491rPxwy3jMVGM` (Sandbox)
- **Flow URL**: `https://withpersona.com/verify`

### Flow Process
1. User clicks "Start Verification Process"
2. Popup opens with Persona hosted flow
3. User completes identity verification
4. Persona processes verification
5. Status updates via API call or webhook
6. User sees updated verification status

## KYC Status States

1. **unverified**: Initial state, user needs to start KYC
2. **pending**: KYC submitted and under review
3. **approved**: KYC approved, user has full access
4. **rejected**: KYC rejected, user needs to retry or contact support
5. **expired**: KYC expired, user needs to reverify

## Security Features

- User authentication required for all KYC operations
- Resource access control (users can only access their own KYC data)
- Rate limiting on API endpoints
- Input validation and sanitization
- Webhook signature verification (placeholder for production)

## Database Structure

The KYC data is stored in the existing `users` table:
- `kyc_status`: Enum field for status tracking
- `metadata`: JSONB field for Persona inquiry data and additional information

## Testing in Sandbox

The implementation is ready for sandbox testing with the provided Persona credentials:

### Test Flow
1. Navigate to `/kyc` page
2. Click "Start Verification Process"
3. Complete the Persona flow in sandbox mode
4. Verify status updates correctly

### Webhook Testing
Set up webhook endpoint in Persona Dashboard:
- URL: `https://your-domain.com/api/user/kyc`
- Include `x-persona-signature` header

## Production Deployment Checklist

### 1. Environment Variables
- [ ] Set production Persona API key
- [ ] Update environment ID for production
- [ ] Configure webhook secret
- [ ] Set production template ID if different

### 2. Webhook Configuration
- [ ] Set up production webhook URL in Persona Dashboard
- [ ] Implement webhook signature verification
- [ ] Test webhook delivery and processing

### 3. Database Migration
- [ ] Run migration `009_persona_kyc_integration.sql`
- [ ] Verify indexes and constraints
- [ ] Test KYC analytics view

### 4. Compliance
- [ ] Review KYC workflow with compliance team
- [ ] Ensure data retention policies
- [ ] Configure notification templates
- [ ] Set up monitoring and alerting

## API Endpoints

### GET `/api/user/kyc`
Retrieve user KYC status
```bash
curl -H "Authorization: Bearer <token>" \
     https://your-domain.com/api/user/kyc?userId=<user-id>
```

### POST `/api/user/kyc`
Update KYC status (user-initiated)
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"inquiryId": "inq_xxx", "status": "approved"}' \
     https://your-domain.com/api/user/kyc
```

### POST `/api/user/kyc` (Webhook)
Receive Persona webhook updates
```bash
curl -X POST \
     -H "x-persona-signature: <signature>" \
     -H "Content-Type: application/json" \
     -d '<persona-webhook-payload>' \
     https://your-domain.com/api/user/kyc
```

## Monitoring and Analytics

### KYC Analytics View
The database includes a `kyc_analytics` view for monitoring:
- User counts by KYC status
- Average processing times
- Completion rates

### Key Metrics to Monitor
- KYC conversion rate (started vs completed)
- Average verification time
- Rejection reasons
- Webhook delivery success rate

## Troubleshooting

### Common Issues
1. **Popup blocked**: Ensure users allow popups for KYC flow
2. **Status not updating**: Check API connectivity and webhook delivery
3. **Template issues**: Verify Persona template configuration

### Debug Information
- Check browser console for Persona flow errors
- Monitor API logs for webhook processing
- Verify database KYC metadata structure

## Support and Documentation

- **Persona Documentation**: https://docs.withpersona.com/hosted-flow
- **API Reference**: https://docs.withpersona.com/api-introduction
- **Support**: Contact Persona support for integration issues

---

**Implementation Status**: ✅ Complete - Ready for sandbox testing
**Next Steps**: Configure production environment and test webhook integration