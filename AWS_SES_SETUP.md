# AWS SES Setup Guide for USD Financial

This guide will help you set up Amazon Simple Email Service (SES) for sending welcome emails and other transactional emails.

## 🚀 Quick Setup Steps

### 1. Create AWS Account & Access Keys

1. **AWS Console**: Go to [AWS Console](https://aws.amazon.com/console/)
2. **IAM User**: Create a new IAM user for SES access
3. **Permissions**: Attach `AmazonSESFullAccess` policy
4. **Access Keys**: Generate Access Key ID and Secret Access Key

### 2. Configure SES in AWS Console

1. **Navigate to SES**: Go to AWS SES console
2. **Verify Domain**: Add your domain (e.g., `usdfinancial.com`)
3. **Verify Email**: Add your FROM email (`welcome@usdfinancial.com`)
4. **DNS Records**: Add the required DNS records to your domain
5. **Request Production Access**: Submit request to move out of sandbox

### 3. Environment Variables

Add these to your `.env.local` file:

```bash
# Email Configuration
EMAIL_PROVIDER=aws-ses
FROM_EMAIL=info@usd.financial

# AWS SES Configuration  
AWS_ACCESS_KEY_ID=AKIA...your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_SES_REGION=us-west-2
```

### 4. DNS Records (Required for Domain Verification)

Add these DNS records to your domain:

**DKIM Records** (3 records):
```
_domainkey.yourdomain.com    TXT    v=DKIM1; k=rsa; p=MIGf...
```

**SPF Record**:
```
yourdomain.com    TXT    v=spf1 include:amazonses.com ~all
```

**DMARC Record**:
```
_dmarc.yourdomain.com    TXT    v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

## 🔧 Testing Your Setup

### Test Welcome Email API

```bash
curl -X POST http://localhost:3000/api/emails/welcome \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": {
      "email": "test@example.com",
      "firstName": "Test",
      "name": "Test User"
    },
    "data": {
      "firstName": "Test",
      "signupTimestamp": "'$(date -Iseconds)'"
    }
  }'
```

### Expected Response

```json
{
  "success": true,
  "message": "Welcome email sent successfully",
  "messageId": "010f017d-0e28-4d6b-b865-957241259041-000000",
  "timestamp": "2025-08-30T21:36:18.123Z"
}
```

## 📋 Troubleshooting

### Common Issues

1. **Sandbox Mode**: New AWS SES accounts are in sandbox mode
   - Can only send to verified email addresses
   - Solution: Request production access

2. **Domain Not Verified**: 
   - Error: "Email address not verified"
   - Solution: Complete domain verification in SES console

3. **Missing DNS Records**:
   - Emails marked as spam
   - Solution: Add DKIM, SPF, and DMARC records

4. **Rate Limiting**:
   - Error: "Sending quota exceeded"
   - Solution: Request quota increase in SES console

### Production Checklist

- [ ] Domain verified in SES
- [ ] DNS records configured (DKIM, SPF, DMARC)
- [ ] Production access approved
- [ ] Sending limits appropriate for your volume
- [ ] Bounce and complaint handling configured
- [ ] Environment variables set correctly

## 🔐 Security Best Practices

1. **IAM Permissions**: Use least privilege principle
2. **Credentials**: Never commit AWS keys to code
3. **Environment**: Use different AWS accounts for dev/prod
4. **Monitoring**: Enable SES sending statistics
5. **Compliance**: Follow CAN-SPAM and GDPR guidelines

## 📊 Monitoring & Analytics

SES provides built-in tracking for:
- ✅ Delivery rates
- 📧 Opens and clicks (if configured)
- ⚠️ Bounces and complaints
- 📈 Sending statistics

## 💰 Cost Estimation

AWS SES Pricing (as of 2025):
- **First 62,000 emails/month**: $0 (if sent from EC2)
- **Additional emails**: $0.10 per 1,000 emails
- **Attachments**: $0.12 per GB

**Example**: 10,000 welcome emails/month ≈ $0-1/month

---

🎉 **Your welcome email system is now ready!** New users will receive beautiful, branded welcome emails via Amazon SES.