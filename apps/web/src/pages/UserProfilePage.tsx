/**
 * User Profile Page
 * Displays basic user information including name, email, roles, and status
 */

import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User as UserIcon, Mail, Shield, Activity } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/useUser';

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { data: user, isLoading, error } = useUser(userId);

  return (
    <PageLayout
      title="User Profile"
      subtitle="View user information"
    >
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-4"
        >
          <Link to="/manager/my-teams">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Teams
          </Link>
        </Button>

        {isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-4">Loading user profile...</p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load user profile. The user may not exist or you may not have permission to view this profile.
            </AlertDescription>
          </Alert>
        )}

        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                {user.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                  <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {user.userId}
                  </code>
                </div>

                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Roles:</span>
                  {user.roles.length > 0 ? (
                    <div className="flex gap-1">
                      {user.roles.map(role => (
                        <Badge key={role} variant="secondary">{role}</Badge>
                      ))}
                    </div>
                  ) : (
                    <Badge variant="outline">User</Badge>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <Badge variant={user.isActive ? 'default' : 'destructive'}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
