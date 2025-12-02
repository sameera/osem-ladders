/**
 * TeamForm Component
 * Form for creating teams with teamId and name inputs
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CreateTeamRequest } from '@/types/teams';
import { TEAM_ID_REGEX, MIN_TEAM_NAME_LENGTH, MAX_TEAM_NAME_LENGTH } from '@/types/teams';

interface TeamFormProps {
  onSubmit: (data: CreateTeamRequest) => void;
  isLoading?: boolean;
  error?: Error | null;
}

export function TeamForm({ onSubmit, isLoading = false, error }: TeamFormProps) {
  const [teamId, setTeamId] = useState('');
  const [name, setName] = useState('');
  const [teamIdError, setTeamIdError] = useState('');
  const [nameError, setNameError] = useState('');

  const validateTeamId = (value: string): boolean => {
    if (!value) {
      setTeamIdError('Team ID is required');
      return false;
    }
    if (!TEAM_ID_REGEX.test(value)) {
      setTeamIdError('Team ID must be 2-50 characters, lowercase alphanumeric and hyphens only');
      return false;
    }
    setTeamIdError('');
    return true;
  };

  const validateName = (value: string): boolean => {
    if (!value || value.trim().length === 0) {
      setNameError('Team name is required');
      return false;
    }
    if (value.length < MIN_TEAM_NAME_LENGTH || value.length > MAX_TEAM_NAME_LENGTH) {
      setNameError(`Team name must be between ${MIN_TEAM_NAME_LENGTH} and ${MAX_TEAM_NAME_LENGTH} characters`);
      return false;
    }
    setNameError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isTeamIdValid = validateTeamId(teamId);
    const isNameValid = validateName(name);

    if (!isTeamIdValid || !isNameValid) {
      return;
    }

    onSubmit({
      teamId: teamId.trim(),
      name: name.trim(),
    });

    // Clear form will be handled by parent component after successful submit
  };

  const handleClear = () => {
    setTeamId('');
    setName('');
    setTeamIdError('');
    setNameError('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Team</CardTitle>
        <CardDescription>
          Create a new team by entering a unique team ID and name. Teams organize users for assessments and management.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team ID Field */}
          <div className="space-y-2">
            <Label htmlFor="teamId" className="text-sm font-medium">
              Team ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="teamId"
              type="text"
              value={teamId}
              onChange={(e) => {
                setTeamId(e.target.value);
                if (teamIdError) validateTeamId(e.target.value);
              }}
              onBlur={() => validateTeamId(teamId)}
              placeholder="engineering-platform"
              className={teamIdError ? 'border-red-500' : ''}
              disabled={isLoading}
              required
            />
            {teamIdError && (
              <p className="text-sm text-red-500" role="alert" aria-live="polite">
                {teamIdError}
              </p>
            )}
            <p className="text-sm text-gray-500">
              2-50 characters, lowercase letters, numbers, and hyphens only
            </p>
          </div>

          {/* Team Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Team Name <span className="text-red-500">*</span>
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
              placeholder="Engineering - Platform Team"
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
              onClick={handleClear}
              disabled={isLoading}
            >
              Clear
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
