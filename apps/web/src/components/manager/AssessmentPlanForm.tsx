/**
 * AssessmentPlanForm Component
 * Create plan form with visual builder
 */

import { useState, FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { TeamSelector } from './TeamSelector';
import { PlanConfigBuilder } from './PlanConfigBuilder';
import type { Category } from '@/data/model';
import type { CreateAssessmentPlanInput } from '@/types/assessments';

interface AssessmentPlanFormProps {
  onSubmit: (data: { teamId: string; input: CreateAssessmentPlanInput }) => void;
  isLoading?: boolean;
  error?: Error | null;
}

export function AssessmentPlanForm({ onSubmit, isLoading = false, error }: AssessmentPlanFormProps) {
  const [teamId, setTeamId] = useState('');
  const [season, setSeason] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [planConfig, setPlanConfig] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!teamId) newErrors.teamId = 'Team is required';
    if (!season.trim()) newErrors.season = 'Season is required';
    if (!name.trim()) newErrors.name = 'Plan name is required';
    if (planConfig.length === 0) {
      newErrors.planConfig = 'At least one category is required';
    } else {
      // Validate plan config structure
      for (const category of planConfig) {
        if (!category.title.trim()) {
          newErrors.planConfig = 'All categories must have a title';
          break;
        }
        if (category.competencies.length === 0) {
          newErrors.planConfig = 'Each category must have at least one competency';
          break;
        }
        for (const competency of category.competencies) {
          if (!competency.name.trim()) {
            newErrors.planConfig = 'All competencies must have a name';
            break;
          }
          if (competency.levels.length === 0) {
            newErrors.planConfig = 'Each competency must have at least one expectation';
            break;
          }
          for (const expectation of competency.levels) {
            if (!expectation.title.trim() || !expectation.content.trim()) {
              newErrors.planConfig = 'All expectations must have a title and description';
              break;
            }
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      teamId,
      input: {
        season: season.trim(),
        name: name.trim(),
        planConfig,
        description: description.trim() || undefined,
      },
    });
  };

  const handleClear = () => {
    setTeamId('');
    setSeason('');
    setName('');
    setDescription('');
    setPlanConfig([]);
    setErrors({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Assessment Plan</CardTitle>
        <CardDescription>
          Define a career ladder framework for a team and season
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Global error display */}
          {error && (
            <div
              className="p-4 bg-red-50 border border-red-200 rounded-md"
              role="alert"
              aria-live="polite"
            >
              <p className="text-sm text-red-800">{error.message}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team */}
            <div className="space-y-2">
              <Label htmlFor="team">
                Team <span className="text-red-500">*</span>
              </Label>
              <TeamSelector
                value={teamId}
                onChange={(value) => {
                  setTeamId(value);
                  setErrors({ ...errors, teamId: '' });
                }}
                disabled={isLoading}
              />
              {errors.teamId && (
                <p className="text-sm text-red-500" role="alert">
                  {errors.teamId}
                </p>
              )}
            </div>

            {/* Season */}
            <div className="space-y-2">
              <Label htmlFor="season">
                Season <span className="text-red-500">*</span>
              </Label>
              <Input
                id="season"
                type="text"
                placeholder="e.g., 2025-Q1, FY25, Spring 2025"
                value={season}
                onChange={(e) => {
                  setSeason(e.target.value);
                  setErrors({ ...errors, season: '' });
                }}
                disabled={isLoading}
                required
                aria-required="true"
                aria-invalid={!!errors.season}
              />
              {errors.season && (
                <p className="text-sm text-red-500" role="alert">
                  {errors.season}
                </p>
              )}
              <p className="text-sm text-gray-500">Any string identifier (no format restrictions)</p>
            </div>
          </div>

          {/* Plan Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Plan Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Engineering Ladder Q1 2025"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors({ ...errors, name: '' });
              }}
              disabled={isLoading}
              required
              aria-required="true"
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-red-500" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose of this assessment plan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Plan Config Builder */}
          <div className="space-y-2">
            <PlanConfigBuilder
              planConfig={planConfig}
              onChange={(config) => {
                setPlanConfig(config);
                setErrors({ ...errors, planConfig: '' });
              }}
            />
            {errors.planConfig && (
              <p className="text-sm text-red-500" role="alert">
                {errors.planConfig}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClear} disabled={isLoading}>
              Clear
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Assessment Plan'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
