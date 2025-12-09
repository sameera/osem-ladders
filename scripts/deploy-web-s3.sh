#!/usr/bin/env bash
# Deploy web application to AWS S3 with CloudFront invalidation
# This script mirrors the GitHub Actions deployment workflow for local usage

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
AWS_REGION="${AWS_REGION:-us-east-1}"
S3_BUCKET_NAME="${S3_BUCKET_NAME:-}"
CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"
BUILD_DIR="dist/apps/web"

# Usage information
show_usage() {
    cat << EOF
${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
${GREEN}Deploy Web Application to AWS S3${NC}
${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

${YELLOW}Usage:${NC}
    $0 [options]

${YELLOW}Options:${NC}
    --bucket <name>         S3 bucket name (required)
    --distribution <id>     CloudFront distribution ID (optional)
    --region <region>       AWS region (default: us-east-1)
    --help                  Show this help message

${YELLOW}Environment Variables:${NC}
    S3_BUCKET_NAME              S3 bucket name
    CLOUDFRONT_DISTRIBUTION_ID  CloudFront distribution ID
    AWS_REGION                  AWS region (default: us-east-1)
    AWS_PROFILE                 AWS CLI profile to use

${YELLOW}Examples:${NC}
    # Using command-line parameters
    $0 --bucket my-app-bucket --distribution E1234567890ABC

    # Using environment variables
    export S3_BUCKET_NAME=my-app-bucket
    export CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
    $0

    # Without CloudFront invalidation
    $0 --bucket my-app-bucket

    # Using a specific AWS profile
    AWS_PROFILE=production $0 --bucket my-app-bucket

${YELLOW}Prerequisites:${NC}
    1. AWS CLI installed (aws --version)
    2. AWS credentials configured (aws configure or environment variables)
    3. Build completed (pnpm build)
    4. S3 bucket exists with proper permissions
    5. CloudFront distribution configured (if using --distribution)

${YELLOW}Required AWS Permissions:${NC}
    - s3:PutObject, s3:DeleteObject, s3:ListBucket on the S3 bucket
    - cloudfront:CreateInvalidation, cloudfront:GetInvalidation (if using CloudFront)

${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
EOF
}

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --bucket)
            S3_BUCKET_NAME="$2"
            shift 2
            ;;
        --distribution)
            CLOUDFRONT_DISTRIBUTION_ID="$2"
            shift 2
            ;;
        --region)
            AWS_REGION="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Error: Unknown option $1${NC}"
            echo "Run '$0 --help' for usage information"
            exit 1
            ;;
    esac
done

# Validation
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}AWS S3 Deployment Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check for required bucket name
if [[ -z "$S3_BUCKET_NAME" ]]; then
    echo -e "${RED}Error: S3 bucket name is required${NC}"
    echo "Provide it via --bucket flag or S3_BUCKET_NAME environment variable"
    echo "Run '$0 --help' for more information"
    exit 1
fi

# Check AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

# Get AWS CLI version
AWS_CLI_VERSION=$(aws --version 2>&1 | cut -d' ' -f1 | cut -d'/' -f2)
echo -e "${BLUE}AWS CLI Version:${NC} $AWS_CLI_VERSION"

# Check AWS credentials
if ! aws sts get-caller-identity --region "$AWS_REGION" &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured or invalid${NC}"
    echo "Run 'aws configure' or set AWS environment variables"
    exit 1
fi

# Display AWS identity
AWS_IDENTITY=$(aws sts get-caller-identity --region "$AWS_REGION" --output json)
AWS_ACCOUNT=$(echo "$AWS_IDENTITY" | grep -o '"Account": "[^"]*' | cut -d'"' -f4)
AWS_ARN=$(echo "$AWS_IDENTITY" | grep -o '"Arn": "[^"]*' | cut -d'"' -f4)
echo -e "${BLUE}AWS Account:${NC} $AWS_ACCOUNT"
echo -e "${BLUE}AWS Identity:${NC} $AWS_ARN"
echo -e "${BLUE}AWS Region:${NC} $AWS_REGION"
echo ""

# Check build directory exists
if [[ ! -d "$BUILD_DIR" ]]; then
    echo -e "${RED}Error: Build directory not found: $BUILD_DIR${NC}"
    echo "Run 'pnpm build' first to create the production build"
    exit 1
fi

# Display build information
BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
FILE_COUNT=$(find "$BUILD_DIR" -type f | wc -l)
echo -e "${GREEN}✓ Build directory found${NC}"
echo -e "${BLUE}Build size:${NC} $BUILD_SIZE"
echo -e "${BLUE}File count:${NC} $FILE_COUNT"
echo ""

# Deployment configuration
echo -e "${YELLOW}Deployment Configuration:${NC}"
echo -e "${BLUE}S3 Bucket:${NC} s3://$S3_BUCKET_NAME"
if [[ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]]; then
    echo -e "${BLUE}CloudFront Distribution:${NC} $CLOUDFRONT_DISTRIBUTION_ID"
else
    echo -e "${BLUE}CloudFront:${NC} Not configured (skipping invalidation)"
fi
echo ""

# Confirm deployment
echo -e "${YELLOW}WARNING: This will sync the build to S3 with --delete flag${NC}"
echo -e "${YELLOW}Files in S3 not present in the local build will be removed${NC}"
echo ""
read -p "Continue with deployment? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi
echo ""

# S3 Sync - Phase 1: Upload all files except HTML with long cache
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Phase 1: Syncing static assets to S3${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Cache-Control:${NC} public,max-age=31536000,immutable (1 year)"
echo ""

aws s3 sync "$BUILD_DIR/" "s3://$S3_BUCKET_NAME/" \
  --region "$AWS_REGION" \
  --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html" \
  --exclude "*.html"

echo ""
echo -e "${GREEN}✓ Static assets synced successfully${NC}"
echo ""

# S3 Sync - Phase 2: Upload HTML files with no cache
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Phase 2: Syncing HTML files to S3${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Cache-Control:${NC} public,max-age=0,must-revalidate (no cache)"
echo ""

aws s3 sync "$BUILD_DIR/" "s3://$S3_BUCKET_NAME/" \
  --region "$AWS_REGION" \
  --exclude "*" \
  --include "*.html" \
  --cache-control "public,max-age=0,must-revalidate"

echo ""
echo -e "${GREEN}✓ HTML files synced successfully${NC}"
echo ""

# CloudFront Invalidation (if distribution ID provided)
if [[ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]]; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}CloudFront Cache Invalidation${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Distribution:${NC} $CLOUDFRONT_DISTRIBUTION_ID"
    echo -e "${BLUE}Paths:${NC} /*"
    echo ""

    echo "Creating invalidation..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
      --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
      --paths "/*" \
      --query 'Invalidation.Id' \
      --output text)

    echo -e "${GREEN}✓ Invalidation created:${NC} $INVALIDATION_ID"
    echo ""
    echo -e "${YELLOW}Waiting for invalidation to complete...${NC}"
    echo "(This may take 5-15 minutes)"
    echo ""

    aws cloudfront wait invalidation-completed \
      --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
      --id "$INVALIDATION_ID"

    echo ""
    echo -e "${GREEN}✓ CloudFront cache invalidation completed${NC}"
    echo ""
fi

# Success summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Deployment Completed Successfully!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}S3 Bucket:${NC} s3://$S3_BUCKET_NAME"
if [[ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]]; then
    echo -e "${BLUE}CloudFront Distribution:${NC} $CLOUDFRONT_DISTRIBUTION_ID"
    echo -e "${BLUE}Cache Status:${NC} Invalidated and refreshed"
fi
echo ""
echo -e "${BLUE}Build size:${NC} $BUILD_SIZE"
echo -e "${BLUE}Files deployed:${NC} $FILE_COUNT"
echo ""
echo -e "${GREEN}Your application is now live!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
