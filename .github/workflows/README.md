# GitHub Actions Workflows

## Deploy API to AWS Lambda

This workflow automatically deploys the API Lambda function (`apps/api/`) to AWS when changes are merged to the `main` branch.

### Prerequisites

#### 1. AWS IAM OIDC Provider Setup (Recommended)

The workflow uses AWS OIDC for secure, keyless authentication. Follow these steps:

1. **Create an OIDC Identity Provider in AWS IAM:**

    - Go to AWS IAM Console → Identity providers → Add provider
    - Provider type: OpenID Connect
    - Provider URL: `https://token.actions.githubusercontent.com`
    - Audience: `sts.amazonaws.com`

2. **Create an IAM Role for GitHub Actions:**

    ```bash
    # Example trust policy (replace with your GitHub org/repo)
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
          },
          "Action": "sts:AssumeRoleWithWebIdentity",
          "Condition": {
            "StringEquals": {
              "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
            },
            "StringLike": {
              "token.actions.githubusercontent.com:sub": "repo:<YOUR_GITHUB_ORG>/<YOUR_REPO>:ref:refs/heads/main"
            }
          }
        }
      ]
    }
    ```

3. **Attach Lambda deployment permissions to the role:**

    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "lambda:UpdateFunctionCode",
                    "lambda:GetFunction",
                    "lambda:GetFunctionConfiguration"
                ],
                "Resource": "arn:aws:lambda:<REGION>:<ACCOUNT_ID>:function:osem-ladders-api"
            }
        ]
    }
    ```

4. **Add the role ARN to GitHub Secrets:**
    - Go to your GitHub repository → Settings → Secrets and variables → Actions
    - Add a new secret: `AWS_ROLE_TO_ASSUME`
    - Value: `arn:aws:iam::<AWS_ACCOUNT_ID>:role/<ROLE_NAME>`

#### 2. Alternative: AWS Access Keys (Less Secure)

If you prefer using access keys instead of OIDC:

1. Create an IAM user with Lambda deployment permissions
2. Generate access keys for the user
3. Add these secrets to GitHub:
    - `AWS_ACCESS_KEY_ID`
    - `AWS_SECRET_ACCESS_KEY`
4. Update the workflow file to use `aws-access-key-id` and `aws-secret-access-key` instead of `role-to-assume`

### Configuration

Update the environment variables in [deploy-api-lambda.yml](deploy-api-lambda.yml):

-   `AWS_REGION`: Your AWS region (default: us-east-1)
-   `LAMBDA_FUNCTION_NAME`: Your Lambda function name (default: osem-ladders-api)
-   `NODE_VERSION`: Node.js version (default: 18)

### Workflow Triggers

The workflow runs automatically when:

-   Changes are pushed to the `main` branch
-   Files in `apps/api/**` are modified
-   The workflow file itself is modified

You can also trigger it manually:

-   Go to Actions tab → Deploy API to AWS Lambda → Run workflow

### What the Workflow Does

1. **Checkout code** from the repository
2. **Setup Node.js** (version 18)
3. **Setup pnpm** package manager with caching
4. **Install dependencies** for the monorepo
5. **Run tests** to ensure code quality (`pnpm nx test api`)
6. **Build** the TypeScript code with esbuild in production mode
7. **Package** all Lambda handler functions into a ZIP file
8. **Configure AWS credentials** using OIDC
9. **Deploy** to AWS Lambda using `aws lambda update-function-code`
10. **Wait** for the update to complete
11. **Verify** the deployment was successful (function state is Active)

### Build Output

The build process:
- Uses esbuild to bundle TypeScript to ESM format (`.mjs`)
- Creates separate handler files for each endpoint in `dist/apps/api/`
- Excludes AWS SDK from bundle (provided by Lambda runtime)
- Minifies code and removes sourcemaps in production
- Generates a single ZIP with all handlers

### Monitoring Deployments

-   View deployment logs in the Actions tab of your GitHub repository
-   Check Lambda function updates in the AWS Lambda console
-   The workflow will fail if tests don't pass or deployment encounters errors

### Troubleshooting

**Workflow fails at "Configure AWS credentials":**

-   Verify the `AWS_ROLE_TO_ASSUME` secret is set correctly
-   Check the IAM role trust policy allows your repository
-   Ensure the OIDC provider is configured in AWS IAM

**Workflow fails at "Deploy to AWS Lambda":**

-   Verify the Lambda function exists with the correct name (`osem-ladders-api`)
-   Check the IAM role has `lambda:UpdateFunctionCode` permission
-   Ensure the AWS region is correct

**Tests fail:**

-   Review test output in the workflow logs
-   Run tests locally: `pnpm nx test api`
-   Fix failing tests before merging to main

**Build fails:**

-   Check TypeScript compilation errors in the logs
-   Run build locally: `pnpm nx build api --configuration=production`
-   Ensure all dependencies are properly declared

### Security Best Practices

-   ✅ Use OIDC instead of long-lived access keys
-   ✅ Follow principle of least privilege for IAM permissions
-   ✅ Restrict role trust policy to specific branch (main)
-   ✅ Never commit AWS credentials to the repository
-   ✅ Use GitHub environment protection rules for additional safety

---

## Deploy Cognito Post-Signup Lambda

This workflow automatically deploys the Cognito Post-Signup Lambda function to AWS when changes are merged to the `backend/cognito-post-signup/` directory.

### Prerequisites

#### 1. AWS IAM OIDC Provider Setup (Recommended)

The workflow uses AWS OIDC for secure, keyless authentication. Follow these steps:

1. **Create an OIDC Identity Provider in AWS IAM:**

    - Go to AWS IAM Console → Identity providers → Add provider
    - Provider type: OpenID Connect
    - Provider URL: `https://token.actions.githubusercontent.com`
    - Audience: `sts.amazonaws.com`

2. **Create an IAM Role for GitHub Actions:**

    ```bash
    # Example trust policy (replace with your GitHub org/repo)
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
          },
          "Action": "sts:AssumeRoleWithWebIdentity",
          "Condition": {
            "StringEquals": {
              "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
            },
            "StringLike": {
              "token.actions.githubusercontent.com:sub": "repo:<YOUR_GITHUB_ORG>/<YOUR_REPO>:ref:refs/heads/main"
            }
          }
        }
      ]
    }
    ```

3. **Attach Lambda deployment permissions to the role:**

    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "lambda:UpdateFunctionCode",
                    "lambda:GetFunction",
                    "lambda:GetFunctionConfiguration"
                ],
                "Resource": "arn:aws:lambda:<REGION>:<ACCOUNT_ID>:function:osem-ladders-cognito-post-signup"
            }
        ]
    }
    ```

4. **Add the role ARN to GitHub Secrets:**
    - Go to your GitHub repository → Settings → Secrets and variables → Actions
    - Add a new secret: `AWS_ROLE_TO_ASSUME`
    - Value: `arn:aws:iam::<AWS_ACCOUNT_ID>:role/<ROLE_NAME>`

#### 2. Alternative: AWS Access Keys (Less Secure)

If you prefer using access keys instead of OIDC:

1. Create an IAM user with Lambda deployment permissions
2. Generate access keys for the user
3. Add these secrets to GitHub:
    - `AWS_ACCESS_KEY_ID`
    - `AWS_SECRET_ACCESS_KEY`
4. Update the workflow file to use `aws-access-key-id` and `aws-secret-access-key` instead of `role-to-assume`

### Configuration

Update the environment variables in [deploy-cognito-lambda.yml](deploy-cognito-lambda.yml):

-   `AWS_REGION`: Your AWS region (default: us-east-1)
-   `LAMBDA_FUNCTION_NAME`: Your Lambda function name (default: cognito-post-signup)
-   `NODE_VERSION`: Node.js version (default: 18)

### Workflow Triggers

The workflow runs automatically when:

-   Changes are pushed to the `main` branch
-   Files in `backend/cognito-post-signup/**` are modified

You can also trigger it manually:

-   Go to Actions tab → Deploy Cognito Post-Signup Lambda → Run workflow

### What the Workflow Does

1. **Checkout code** from the repository
2. **Setup Node.js** (version 18)
3. **Setup pnpm** package manager
4. **Install dependencies** in the Lambda directory
5. **Run tests** to ensure code quality
6. **Build** the TypeScript code
7. **Package** the Lambda function with dependencies into a ZIP file
8. **Configure AWS credentials** using OIDC
9. **Deploy** to AWS Lambda using `aws lambda update-function-code`
10. **Wait** for the update to complete
11. **Verify** the deployment was successful

### Monitoring Deployments

-   View deployment logs in the Actions tab of your GitHub repository
-   Check Lambda function updates in the AWS Lambda console
-   The workflow will fail if tests don't pass or deployment encounters errors

### Troubleshooting

**Workflow fails at "Configure AWS credentials":**

-   Verify the `AWS_ROLE_TO_ASSUME` secret is set correctly
-   Check the IAM role trust policy allows your repository
-   Ensure the OIDC provider is configured in AWS IAM

**Workflow fails at "Deploy to AWS Lambda":**

-   Verify the Lambda function exists with the correct name
-   Check the IAM role has `lambda:UpdateFunctionCode` permission
-   Ensure the AWS region is correct

**Tests fail:**

-   Review test output in the workflow logs
-   Run tests locally: `cd backend/cognito-post-signup && pnpm test`
-   Fix failing tests before merging to main

### Security Best Practices

-   ✅ Use OIDC instead of long-lived access keys
-   ✅ Follow principle of least privilege for IAM permissions
-   ✅ Restrict role trust policy to specific branch (main)
-   ✅ Never commit AWS credentials to the repository
-   ✅ Use GitHub environment protection rules for additional safety
