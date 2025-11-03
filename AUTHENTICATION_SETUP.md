# Authentication Setup Guide

This application uses AWS Cognito with Microsoft 365 (Azure AD) for authentication.

## Prerequisites

-   AWS Account with access to AWS Cognito
-   Microsoft 365 Azure AD account with admin access
-   Node.js and npm installed

## Setup Steps

### 1. Configure Microsoft Azure AD

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure the application:
    - Name: `Growth Planner` (or your preferred name)
    - Supported account types: Choose based on your needs
    - Redirect URI: Leave blank for now (will be configured later)
5. Click **Register**
6. Note down the following values:
    - **Application (client) ID**
    - **Directory (tenant) ID**
7. Go to **Certificates & secrets**
8. Click **New client secret**
9. Add a description and expiration period
10. Copy the **Value** (client secret) - you won't be able to see it again

### 2. Create AWS Cognito User Pool

1. Go to [AWS Console](https://console.aws.amazon.com)
2. Navigate to **Amazon Cognito**
3. Click **Create user pool**
4. Configure the user pool:

    **Step 1: Authentication providers**

    - Select **Federated identity providers**
    - Choose **OpenID Connect (OIDC)**

    **Step 2: Sign-in experience**

    - Configure as needed for your use case

    **Step 3: Security requirements**

    - Configure MFA and password policies as needed

    **Step 4: Sign-up experience**

    - Configure user attributes as needed

    **Step 5: Message delivery**

    - Configure email settings

    **Step 6: Integrate your app**

    - User pool name: `career-ladder-assessment` (or your preferred name)
    - Domain:
        - Choose **Use a Cognito domain**
        - Enter a unique domain prefix (e.g., `your-company-ladders`)
        - Note this domain: `your-prefix.auth.region.amazoncognito.com`
    - Initial app client:
        - App client name: `career-ladder-web-client`
        - Client secret: **Generate a client secret**
        - Allowed callback URLs: `http://localhost:8080,https://your-production-domain.com`
        - Allowed sign-out URLs: `http://localhost:8080,https://your-production-domain.com`
        - Identity providers: Select the OIDC provider you'll create next
        - OAuth 2.0 grant types: **Authorization code grant**
        - OpenID Connect scopes: **openid, email, profile**

5. Click **Create user pool**
6. Note down:
    - **User Pool ID** (e.g., `us-east-1_XXXXXXXXX`)
    - **App Client ID**

### 3. Configure OIDC Identity Provider in Cognito

1. In your Cognito User Pool, go to **Sign-in experience** tab
2. Click **Add identity provider**
3. Select **OpenID Connect**
4. Configure the provider:
    - Provider name: `Microsoft` (must be exactly this)
    - Client ID: Your Azure AD **Application (client) ID**
    - Client secret: Your Azure AD **Client secret**
    - Authorized scopes: `openid email profile`
    - Issuer URL: `https://login.microsoftonline.com/{tenant-id}/v2.0`
        - Replace `{tenant-id}` with your Azure AD **Directory (tenant) ID**
    - Attribute mapping:
        - `email` → `email`
        - `name` → `name`
        - `sub` → `sub`
5. Click **Create**

### 4. Update Azure AD Redirect URIs

1. Go back to your Azure AD App Registration
2. Navigate to **Authentication**
3. Click **Add a platform** > **Web**
4. Add redirect URIs:
    - `https://your-cognito-domain.auth.region.amazoncognito.com/oauth2/idpresponse`
    - Replace `your-cognito-domain` with your Cognito domain prefix
    - Replace `region` with your AWS region
5. Configure token settings:
    - Access tokens: ✓
    - ID tokens: ✓
6. Click **Configure**

### 5. Configure Application Environment Variables

1. Copy `.env.example` to `.env`:

    ```bash
    cp .env.example .env
    ```

2. Edit `.env` and add your configuration:

    ```env
    VITE_COGNITO_REGION=us-east-1
    VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
    VITE_COGNITO_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
    VITE_COGNITO_DOMAIN=your-prefix.auth.us-east-1.amazoncognito.com
    ```

3. Replace the values with your actual Cognito configuration

### 6. Test Authentication

1. Install dependencies:

    ```bash
    npm install
    ```

2. Start the development server:

    ```bash
    npm run dev
    ```

3. Open your browser to `http://localhost:8080`
4. You should be redirected to the login page
5. Click **Sign in with Microsoft**
6. You should be redirected to Microsoft login
7. After successful authentication, you should be redirected back to the application

## Troubleshooting

### Common Issues

**Issue: "redirect_uri_mismatch" error**

-   Solution: Verify that the redirect URI in Azure AD matches exactly with your Cognito domain

**Issue: "Invalid client" error**

-   Solution: Double-check your Cognito App Client ID and Client Secret

**Issue: "CORS error" during authentication**

-   Solution: Ensure your Cognito domain is correctly configured and accessible

**Issue: Application doesn't redirect after login**

-   Solution: Check browser console for errors and verify callback URLs in Cognito

**Issue: "Invalid issuer" error**

-   Solution: Verify the issuer URL in Cognito OIDC provider configuration includes your correct tenant ID

### Verification Steps

1. Verify Cognito User Pool is active
2. Verify App Client has correct callback URLs
3. Verify OIDC provider is correctly configured with Microsoft
4. Verify Azure AD app has correct redirect URIs
5. Verify environment variables are loaded (check browser dev tools > Application > Local Storage)

## Production Deployment

Before deploying to production:

1. Update Cognito callback URLs to include your production domain
2. Update Azure AD redirect URIs to include your production domain
3. Ensure `.env` file is not committed to version control (it's in `.gitignore`)
4. Set environment variables in your production hosting platform
5. Consider implementing additional security measures:
    - Enable MFA in Cognito
    - Configure advanced security features
    - Set up CloudWatch monitoring
    - Implement rate limiting

## Security Best Practices

-   Never commit `.env` file to version control
-   Rotate client secrets regularly
-   Use HTTPS in production
-   Enable MFA for sensitive operations
-   Monitor authentication logs in CloudWatch
-   Set up alerts for failed authentication attempts
-   Review and update IAM policies regularly

## Additional Resources

-   [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
-   [Azure AD Documentation](https://docs.microsoft.com/en-us/azure/active-directory/)
-   [AWS Amplify Documentation](https://docs.amplify.aws/)
