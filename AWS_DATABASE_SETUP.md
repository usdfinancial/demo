# 🗄️ AWS RDS PostgreSQL Setup for USD Financial

## 💰 Startup-Friendly Configuration

For a new project, we'll use cost-effective resources that can easily scale:

### **Recommended Starter Configuration**

- **Instance**: `db.t3.micro` (1 vCPU, 1GB RAM) - **~$13/month**
- **Storage**: 20GB General Purpose SSD (GP2) - **~$2.30/month** 
- **Backup**: 7-day retention - **Included**
- **Multi-AZ**: No (for cost savings, enable later for production)
- **Total Cost**: **~$15-16/month**

## 🚀 Step-by-Step Setup

### **Option 1: AWS Console (Recommended for beginners)**

1. **Open AWS RDS Console**
   - Go to [AWS RDS Console](https://console.aws.amazon.com/rds/)
   - Click "Create database"

2. **Choose Database Creation Method**
   - Select "Standard create"
   - Engine type: "PostgreSQL"

3. **Database Settings**
   ```
   Engine version: PostgreSQL 15.4-R2 (latest)
   Templates: Free tier (if eligible) or Dev/Test
   
   DB instance identifier: usd-financial-db
   Master username: usdfinancial
   Master password: [Generate secure password]
   ```

4. **Instance Configuration**
   ```
   DB instance class: db.t3.micro (1 vCPU, 1 GB RAM)
   Storage type: General Purpose SSD (gp2)
   Allocated storage: 20 GB
   Storage autoscaling: Enable (max 100GB)
   ```

5. **Connectivity**
   ```
   VPC: Default VPC
   Subnet group: default
   Public access: Yes (for development - change to No for production)
   VPC security group: Create new
   Database port: 5432
   ```

6. **Database Authentication**
   ```
   Database authentication: Password authentication
   ```

7. **Additional Configuration**
   ```
   Initial database name: usdfinancial
   Parameter group: default.postgres15
   Option group: default:postgres-15
   Backup retention: 7 days
   Backup window: Default
   Monitoring: Basic monitoring
   Log exports: None (to save costs)
   Maintenance window: Default
   Auto minor version upgrade: Yes
   Deletion protection: Enable
   ```

### **Option 2: AWS CLI (For advanced users)**

```bash
# Create RDS instance
aws rds create-db-instance \
    --db-instance-identifier usd-financial-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.4 \
    --master-username usdfinancial \
    --master-user-password YourSecurePassword123! \
    --allocated-storage 20 \
    --storage-type gp2 \
    --storage-encrypted \
    --vpc-security-group-ids sg-12345678 \
    --db-name usdfinancial \
    --backup-retention-period 7 \
    --port 5432 \
    --no-multi-az \
    --publicly-accessible \
    --auto-minor-version-upgrade \
    --deletion-protection
```

### **Option 3: AWS CDK/CloudFormation (Infrastructure as Code)**

```typescript
// cdk-database-stack.ts
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

const database = new rds.DatabaseInstance(this, 'UsdFinancialDB', {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_15_4,
  }),
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
  credentials: rds.Credentials.fromGeneratedSecret('usdfinancial'),
  allocatedStorage: 20,
  storageType: rds.StorageType.GP2,
  storageEncrypted: true,
  databaseName: 'usdfinancial',
  backupRetention: Duration.days(7),
  deleteAutomatedBackups: false,
  deletionProtection: true,
  multiAz: false, // Single-AZ for cost savings
});
```

## 🔐 Security Configuration

### **1. Create Security Group**

```bash
# Create security group for RDS
aws ec2 create-security-group \
    --group-name usd-financial-db-sg \
    --description "Security group for USD Financial database"

# Allow PostgreSQL access from Amplify (adjust CIDR as needed)
aws ec2 authorize-security-group-ingress \
    --group-name usd-financial-db-sg \
    --protocol tcp \
    --port 5432 \
    --cidr 0.0.0.0/0  # CHANGE THIS for production!
```

### **2. Create Database User for Application**

```sql
-- Connect to your database and create application user
CREATE USER usd_financial_app WITH PASSWORD 'secure_app_password_123!';
GRANT CONNECT ON DATABASE usdfinancial TO usd_financial_app;
GRANT CREATE ON SCHEMA public TO usd_financial_app;
```

## 📊 Connection Configuration

### **1. Get Connection Details**

After creation, get your connection details:

```bash
# Get RDS endpoint
aws rds describe-db-instances \
    --db-instance-identifier usd-financial-db \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text
```

### **2. Update Environment Variables**

Update your `.env.local`:

```bash
# Database Configuration
DATABASE_URL=postgresql://usdfinancial:YourPassword@your-rds-endpoint.us-east-1.rds.amazonaws.com:5432/usdfinancial?sslmode=require
DIRECT_URL=postgresql://usdfinancial:YourPassword@your-rds-endpoint.us-east-1.rds.amazonaws.com:5432/usdfinancial?sslmode=require
```

### **3. Test Connection**

```bash
# Test connection using psql
psql "postgresql://usdfinancial:YourPassword@your-rds-endpoint.us-east-1.rds.amazonaws.com:5432/usdfinancial?sslmode=require"
```

## 📈 Scaling Path

### **When to Scale Up:**

1. **db.t3.small** (~$26/month) - When you hit 100+ concurrent users
2. **db.t3.medium** (~$52/month) - When you hit 500+ concurrent users  
3. **Enable Multi-AZ** (+100% cost) - When you need high availability
4. **Read Replicas** (~$13+ each) - When you need better read performance

### **Storage Scaling:**

- **Auto-scaling enabled**: Will grow from 20GB to 100GB automatically
- **GP3 upgrade**: Better performance at similar cost when you need it
- **Monitor**: CloudWatch metrics for storage and IOPS usage

## 🔍 Monitoring Setup (Free Tier)

### **Basic CloudWatch Metrics (Included)**

```bash
# Enable enhanced monitoring (optional, ~$2/month)
aws rds modify-db-instance \
    --db-instance-identifier usd-financial-db \
    --monitoring-interval 60 \
    --monitoring-role-arn arn:aws:iam::account:role/rds-monitoring-role
```

### **Key Metrics to Watch:**

- **CPU Utilization**: Should stay below 80%
- **DatabaseConnections**: Monitor connection pool usage
- **FreeStorageSpace**: Ensure adequate storage
- **ReadLatency/WriteLatency**: Database performance

## 💡 Cost Optimization Tips

1. **Start Small**: db.t3.micro is perfect for development and initial launch
2. **Reserved Instances**: Save 30-60% with 1-year commitment when ready
3. **Automated Backups**: Keep 7 days, delete older manual snapshots
4. **Single-AZ**: Use Multi-AZ only when you need 99.95% uptime
5. **Monitor Usage**: Set up billing alerts for unexpected costs

## 🚨 Production Checklist

Before going live:

- [ ] Enable Multi-AZ deployment
- [ ] Set up automated backups to S3
- [ ] Configure VPC with private subnets
- [ ] Set up SSL/TLS certificates
- [ ] Enable audit logging
- [ ] Set up monitoring and alerting
- [ ] Create disaster recovery plan
- [ ] Implement database connection pooling
- [ ] Set up read replicas for scaling

## 📞 Next Steps

1. **Create the RDS instance** using the configuration above
2. **Run database migrations** to set up your schema
3. **Update Amplify environment variables**
4. **Test the connection** from your application

**Estimated Setup Time**: 15-30 minutes  
**Estimated Monthly Cost**: $15-20 (with room to scale)

This configuration will easily handle thousands of transactions per day while keeping costs minimal for a startup!