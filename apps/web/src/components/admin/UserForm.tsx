/**
 * UserForm Component
 * Form for creating or editing users with email, name, and role inputs
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CreateUserRequest, UserRole } from '@/types/users';
import { EMAIL_REGEX, MAX_EMAIL_LENGTH, MAX_NAME_LENGTH } from '@/types/users';

interface UserFormProps {
  onSubmit: (data: CreateUserRequest) => void;
  isLoading?: boolean;
  error?: Error | null;
}

export function UserForm({ onSubmit, isLoading = false, error }: UserFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');

  const validateEmail = (value: string): boolean => {
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    if (!EMAIL_REGEX.test(value)) {
      setEmailError('Invalid email format');
      return false;
    }
    if (value.length > MAX_EMAIL_LENGTH) {
      setEmailError(`Email must be less than ${MAX_EMAIL_LENGTH} characters`);
      return false;
    }
    setEmailError('');
    return true;
  };

  const validateName = (value: string): boolean => {
    if (!value || value.trim().length === 0) {
      setNameError('Name is required');
      return false;
    }
    if (value.length > MAX_NAME_LENGTH) {
      setNameError(`Name must be less than ${MAX_NAME_LENGTH} characters`);
      return false;
    }
    setNameError('');
    return true;
  };

  const handleRoleToggle = (role: UserRole) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isEmailValid = validateEmail(email);
    const isNameValid = validateName(name);

    if (!isEmailValid || !isNameValid) {
      return;
    }

    onSubmit({
      email: email.trim(),
      name: name.trim(),
      roles: selectedRoles,
    });

    // Clear form on successful submit
    setEmail('');
    setName('');
    setSelectedRoles([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New User</CardTitle>
        <CardDescription>
          Create a new user account by entering their email and name. Optionally assign elevated roles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmail(e.target.value);
              }}
              onBlur={() => validateEmail(email)}
              placeholder="user@example.com"
              className={emailError ? 'border-red-500' : ''}
              disabled={isLoading}
              required
            />
            {emailError && (
              <p className="text-sm text-red-500" role="alert" aria-live="polite">
                {emailError}
              </p>
            )}
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) validateName(e.target.value);
              }}
              onBlur={() => validateName(name)}
              placeholder="John Doe"
              className={nameError ? 'border-red-500' : ''}
              disabled={isLoading}
              required
            />
            {nameError && (
              <p className="text-sm text-red-500" role="alert" aria-live="polite">
                {nameError}
              </p>
            )}
          </div>

          {/* Roles Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Elevated Roles (Optional)
            </Label>
            <p className="text-sm text-gray-500">
              Users without selected roles will have default user-level access.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="role-manager"
                  checked={selectedRoles.includes('manager')}
                  onCheckedChange={() => handleRoleToggle('manager')}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="role-manager"
                  className="text-sm font-normal cursor-pointer"
                >
                  Manager - Can manage teams and create assessments
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="role-admin"
                  checked={selectedRoles.includes('admin')}
                  onCheckedChange={() => handleRoleToggle('admin')}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="role-admin"
                  className="text-sm font-normal cursor-pointer"
                >
                  Admin - Can manage users and all system settings
                </Label>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3" role="alert" aria-live="assertive">
              <p className="text-sm text-red-600">{error.message}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEmail('');
                setName('');
                setSelectedRoles([]);
                setEmailError('');
                setNameError('');
              }}
              disabled={isLoading}
            >
              Clear
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
