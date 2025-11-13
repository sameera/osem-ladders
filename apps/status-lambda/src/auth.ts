import { APIGatewayProxyEvent } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

interface CognitoJwtPayload {
  sub: string;
  email: string;
  'cognito:username': string;
  exp: number;
  iat: number;
}

/**
 * Validates a Cognito JWT token from the Authorization header
 * @param event API Gateway proxy event
 * @returns Decoded JWT payload if valid
 * @throws Error if token is invalid or missing
 */
export async function validateCognitoToken(
  event: APIGatewayProxyEvent
): Promise<CognitoJwtPayload> {
  // Extract token from Authorization header
  const authHeader = event.headers.Authorization || event.headers.authorization;

  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  // Extract bearer token
  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) {
    throw new Error('Invalid Authorization header format. Expected: Bearer <token>');
  }

  const token = tokenMatch[1];

  // Get Cognito configuration from environment
  const cognitoRegion = process.env.COGNITO_REGION;
  const cognitoUserPoolId = process.env.COGNITO_USER_POOL_ID;

  if (!cognitoRegion || !cognitoUserPoolId) {
    throw new Error('Missing required environment variables: COGNITO_REGION, COGNITO_USER_POOL_ID');
  }

  // Create JWKS client for Cognito
  const jwksUri = `https://cognito-idp.${cognitoRegion}.amazonaws.com/${cognitoUserPoolId}/.well-known/jwks.json`;

  const client = jwksClient({
    jwksUri,
    cache: true,
    cacheMaxAge: 600000, // 10 minutes
  });

  // Get signing key
  const getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
    client.getSigningKey(header.kid, (err, key) => {
      if (err) {
        callback(err);
        return;
      }
      const signingKey = key?.getPublicKey();
      callback(null, signingKey);
    });
  };

  // Verify and decode token
  return new Promise<CognitoJwtPayload>((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        algorithms: ['RS256'],
        issuer: `https://cognito-idp.${cognitoRegion}.amazonaws.com/${cognitoUserPoolId}`,
      },
      (err, decoded) => {
        if (err) {
          reject(new Error(`Token verification failed: ${err.message}`));
          return;
        }
        resolve(decoded as CognitoJwtPayload);
      }
    );
  });
}

/**
 * Middleware wrapper that validates authentication before executing handler
 * @param handler The Lambda handler function to execute after authentication
 * @returns Wrapped handler with authentication
 */
export function withAuth<T>(
  handler: (event: APIGatewayProxyEvent, user: CognitoJwtPayload) => Promise<T>
) {
  return async (event: APIGatewayProxyEvent): Promise<T | { statusCode: number; body: string }> => {
    try {
      const user = await validateCognitoToken(event);
      return await handler(event, user);
    } catch (error) {
      console.error('Authentication failed:', error);
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: 'Unauthorized',
          message: error instanceof Error ? error.message : 'Authentication failed',
        }),
      };
    }
  };
}
