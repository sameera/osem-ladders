# Deploy React App to S3 using AWS CLI - Step-by-Step Guide

## Overview

This guide provides manual deployment steps for deploying the OSEM Ladders React application to AWS S3 with CloudFront CDN using the AWS CLI. The application is already set up with automated GitHub Actions deployment, but this guide enables manual deployments when needed.

## Prerequisites

### 1. AWS CLI Installation

Install AWS CLI v2: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

Verify installation:
```bash
aws --version
```

### 2. AWS Credentials Configuration

Configure AWS credentials (choose one method):

**Method 1: Using aws configure**
```bash
aws configure
# Enter: AWS Access Key ID, Secret Access Key, Region, Output format
```

**Method 2: Using environment variables**
```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"  # or your region
```

**Method 3: Using AWS profiles**
```bash
aws configure --profile osem-ladders
# Then use --profile flag in commands
```

### 3. Required AWS Resources

You'll need the following AWS resources (either existing or create them):
- **S3 Bucket** for hosting static files
- **CloudFront Distribution** for CDN (optional but recommended)
- **IAM Permissions**: S3 write access, CloudFront invalidation access

### 4. Environment Variables

Create or verify `apps/web/.env` file with:
```env
VITE_BRANDING_APP_NAME=Career Ladder Assessment
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_DOMAIN=your-domain.auth.us-east-1.amazoncognito.com
```

## Deployment Steps

### Step 1: Build the React Application

```bash
# From project root
cd /home/sameera/projects/osem-ladders

# Install dependencies (if not already installed)
pnpm install --frozen-lockfile

# Build the production application
pnpm exec nx build web --configuration=production
```

**Build Output Location**: `dist/apps/web/`

**Build Configuration**:
- Uses Vite bundler with React SWC plugin
- Output directory configured in `apps/web/vite.config.ts`
- Includes content-hashed filenames for cache busting
- Environment variables are baked into the build

### Step 2: Create S3 Bucket (if not exists)

```bash
# Set variables
export S3_BUCKET_NAME="osem-ladders-web"  # Change to your bucket name
export AWS_REGION="us-east-1"             # Change to your region

# Create S3 bucket
aws s3 mb s3://$S3_BUCKET_NAME --region $AWS_REGION

# Enable static website hosting
aws s3 website s3://$S3_BUCKET_NAME \
  --index-document index.html \
  --error-document index.html
```

### Step 3: Configure S3 Bucket Policy (Public Read)

**Option A: Public S3 bucket (not recommended if using CloudFront)**
```bash
# Create bucket policy for public access
cat > bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET_NAME/*"
    }
  ]
}
EOF

# Replace BUCKET_NAME with your actual bucket name
sed -i "s/BUCKET_NAME/$S3_BUCKET_NAME/g" bucket-policy.json

# Apply the policy
aws s3api put-bucket-policy \
  --bucket $S3_BUCKET_NAME \
  --policy file://bucket-policy.json
```

**Option B: Private bucket with CloudFront OAC (recommended)**
- Configure CloudFront Origin Access Control (OAC)
- Keep S3 bucket private
- CloudFront provides public access via CDN

### Step 4: Deploy to S3 with Optimized Caching

This matches the strategy in `.github/workflows/deploy-web-s3.yml`:

```bash
# Navigate to project root
cd /home/sameera/projects/osem-ladders

# Step 4a: Upload all files except HTML with long cache (1 year)
aws s3 sync dist/apps/web/ s3://$S3_BUCKET_NAME/ \
  --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html" \
  --exclude "*.html"

# Step 4b: Upload HTML files with no cache
aws s3 sync dist/apps/web/ s3://$S3_BUCKET_NAME/ \
  --exclude "*" \
  --include "*.html" \
  --cache-control "public,max-age=0,must-revalidate"
```

**Cache Strategy Explanation**:
- **JS/CSS/Assets**: 1-year cache (31536000 seconds) with `immutable` flag
  - Vite generates content-hashed filenames (e.g., `app-abc123.js`)
  - New builds create new filenames, so old cached files won't interfere
- **HTML Files**: No cache with `must-revalidate`
  - Always fetches fresh HTML from server
  - Ensures users get latest references to hashed assets

**Flags Explained**:
- `--delete`: Remove files from S3 that don't exist in local build
- `--cache-control`: Set HTTP cache headers
- `--exclude`/`--include`: Filter which files to sync

### Step 5: Create CloudFront Distribution (Optional but Recommended)

```bash
# Create CloudFront origin access control
aws cloudfront create-origin-access-control \
  --origin-access-control-config \
    Name="osem-ladders-oac",\
    SigningProtocol=sigv4,\
    SigningBehavior=always,\
    OriginAccessControlOriginType=s3

# Create distribution config file
cat > cloudfront-config.json << 'EOF'
{
  "CallerReference": "osem-ladders-$(date +%s)",
  "Comment": "OSEM Ladders Web App",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-osem-ladders",
        "DomainName": "BUCKET_NAME.s3.REGION.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-osem-ladders",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "Compress": true
  },
  "Enabled": true,
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  }
}
EOF

# Create the distribution (simplified - use AWS Console for production setup)
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

**Note**: Creating CloudFront distributions is complex. Consider using AWS Console or Infrastructure as Code (CloudFormation/Terraform) for production setups.

### Step 6: Invalidate CloudFront Cache (if using CloudFront)

After deploying new builds, invalidate CloudFront cache to ensure users get the latest version:

```bash
# Set CloudFront distribution ID
export CLOUDFRONT_DISTRIBUTION_ID="E1234ABCD5678"  # Replace with your ID

# Create invalidation
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo "Created invalidation: $INVALIDATION_ID"

# Wait for invalidation to complete (optional)
aws cloudfront wait invalidation-completed \
  --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
  --id $INVALIDATION_ID

echo "✅ CloudFront cache invalidation completed"
```

**Invalidation Details**:
- Matches pattern from `.github/workflows/deploy-web-s3.yml`
- `/*` invalidates all paths
- First 1,000 invalidation paths per month are free
- Additional paths cost $0.005 per path

## Complete Deployment Script

Create a deployment script for easy reuse:

```bash
#!/bin/bash
# File: deploy-to-s3.sh
# Deploy OSEM Ladders React app to S3 with CloudFront

set -e  # Exit on error

# Configuration
S3_BUCKET_NAME="${S3_BUCKET_NAME:-osem-ladders-web}"
AWS_REGION="${AWS_REGION:-us-east-1}"
CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}OSEM Ladders - Deploy to S3${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Step 1: Build
echo -e "\n${GREEN}[1/4] Building application...${NC}"
pnpm exec nx build web --configuration=production

# Step 2: Sync assets with long cache
echo -e "\n${GREEN}[2/4] Uploading assets to S3...${NC}"
aws s3 sync dist/apps/web/ s3://$S3_BUCKET_NAME/ \
  --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html" \
  --exclude "*.html"

# Step 3: Sync HTML with no cache
echo -e "\n${GREEN}[3/4] Uploading HTML files...${NC}"
aws s3 sync dist/apps/web/ s3://$S3_BUCKET_NAME/ \
  --exclude "*" \
  --include "*.html" \
  --cache-control "public,max-age=0,must-revalidate"

# Step 4: Invalidate CloudFront (if configured)
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo -e "\n${GREEN}[4/4] Invalidating CloudFront cache...${NC}"

  INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

  echo "Invalidation created: $INVALIDATION_ID"

  aws cloudfront wait invalidation-completed \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --id $INVALIDATION_ID

  echo -e "${GREEN}✅ CloudFront invalidation completed${NC}"
else
  echo -e "\n${BLUE}[4/4] Skipping CloudFront invalidation (not configured)${NC}"
fi

# Summary
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment Completed Successfully!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "S3 Bucket: s3://$S3_BUCKET_NAME"
[ -n "$CLOUDFRONT_DISTRIBUTION_ID" ] && echo "CloudFront: $CLOUDFRONT_DISTRIBUTION_ID"
echo ""
echo "Build size: $(du -sh dist/apps/web/ | cut -f1)"
echo "Files deployed: $(find dist/apps/web -type f | wc -l)"
echo ""
```

**Usage**:
```bash
# Make script executable
chmod +x deploy-to-s3.sh

# Run deployment
./deploy-to-s3.sh

# Or with custom values
S3_BUCKET_NAME="my-bucket" \
CLOUDFRONT_DISTRIBUTION_ID="E1234ABCD5678" \
./deploy-to-s3.sh
```

## Verification Steps

After deployment, verify everything works:

### 1. Check S3 Bucket
```bash
# List files in bucket
aws s3 ls s3://$S3_BUCKET_NAME/ --recursive

# Check file count
aws s3 ls s3://$S3_BUCKET_NAME/ --recursive | wc -l

# Check a specific file exists
aws s3 ls s3://$S3_BUCKET_NAME/index.html
```

### 2. Test S3 Website Endpoint
```bash
# Get website endpoint
echo "http://$S3_BUCKET_NAME.s3-website-$AWS_REGION.amazonaws.com"

# Test with curl
curl -I http://$S3_BUCKET_NAME.s3-website-$AWS_REGION.amazonaws.com
```

### 3. Test CloudFront Distribution
```bash
# Get CloudFront domain name
aws cloudfront get-distribution \
  --id $CLOUDFRONT_DISTRIBUTION_ID \
  --query 'Distribution.DomainName' \
  --output text

# Test with curl
curl -I https://your-distribution.cloudfront.net
```

### 4. Browser Testing
1. Open the CloudFront URL or S3 website endpoint in browser
2. Verify authentication redirects to Cognito
3. Test login flow with Microsoft 365
4. Check browser console for errors
5. Verify all static assets load correctly

## Troubleshooting

### Issue: Access Denied when uploading to S3
**Solution**: Check IAM permissions
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Required permissions: s3:PutObject, s3:DeleteObject, s3:ListBucket
```

### Issue: CloudFront shows old content after deployment
**Solution**:
- Verify invalidation completed: `aws cloudfront get-invalidation --id $INVALIDATION_ID --distribution-id $CLOUDFRONT_DISTRIBUTION_ID`
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check CloudFront behavior cache settings

### Issue: React Router routes return 404
**Solution**: Configure CloudFront custom error responses
- Error code: 404
- Response page path: /index.html
- Response code: 200
- This is already in the CloudFront config above

### Issue: Environment variables not working
**Solution**:
- Vite bakes environment variables at build time
- Must rebuild after changing .env file
- Variables must start with `VITE_` prefix
- Check build output: `grep -r "VITE_COGNITO" dist/apps/web/`

## Cost Considerations

### S3 Storage Costs
- Storage: ~$0.023 per GB/month (Standard)
- Requests: $0.0004 per 1,000 PUT requests
- Data transfer: First 100 GB/month free, then $0.09/GB

### CloudFront Costs
- Data transfer: First 1 TB/month free tier, then $0.085/GB
- HTTPS requests: First 10M requests free, then $0.0100 per 10,000 requests
- Invalidations: First 1,000 paths/month free, then $0.005/path

**Typical app size**: 2-5 MB
**Monthly costs for low traffic**: $1-5/month

## Alternative: Automated GitHub Actions Deployment

The repository already has automated deployment configured in `.github/workflows/deploy-web-s3.yml`.

**To use automated deployment**:
1. Commit the workflow file (currently untracked)
2. Configure GitHub repository secrets and variables:
   - Secrets: `VITE_BRANDING_APP_NAME`, `VITE_COGNITO_REGION`, `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_USER_POOL_CLIENT_ID`, `VITE_COGNITO_DOMAIN`, `AWS_ROLE_TO_ASSUME`
   - Variables: `AWS_REGION`, `S3_BUCKET_NAME`, `CLOUDFRONT_DISTRIBUTION_ID`
3. Push to `main` branch or trigger manual deployment

**Benefits of automated deployment**:
- Deploys automatically on every push to main
- No need to manage local AWS credentials
- Uses OIDC for secure GitHub-to-AWS authentication
- Consistent deployment environment
- Deployment logs and history in GitHub Actions

## Summary

This guide provides complete manual deployment steps using AWS CLI. The deployment follows the same strategy as the automated GitHub Actions workflow, ensuring consistency between manual and automated deployments.

**Key takeaways**:
1. Build with `pnpm exec nx build web --configuration=production`
2. Sync to S3 with optimized cache headers (1-year for assets, no-cache for HTML)
3. Invalidate CloudFront cache to ensure users get latest version
4. Use the provided script for repeatable deployments
5. Consider using automated GitHub Actions for production deployments
