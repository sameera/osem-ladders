/**
 * ClonePlanDialog Component
 * Clone dialog with full builder
 */

import { useState, useEffect, FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { TeamSelector } from './TeamSelector';
import { PlanConfigBuilder } from './PlanConfigBuilder';
import { useCreateAssessmentPlan } from '@/hooks/useAssessmentPlans';
import { useToast } from '@/hooks/use-toast';
import type { Category } from '@/data/model';
import type { AssessmentPlan, CreateAssessmentPlanInput } from '@/types/assessments';

interface ClonePlanDialogProps {
  sourcePlan: AssessmentPlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClone?: (data: { teamId: string; input: CreateAssessmentPlanInput }) => void;
}

export function ClonePlanDialog({
  sourcePlan,
  open,
  onOpenChange,
  onClone,
}: ClonePlanDialogProps) {
  const [teamId, setTeamId] = useState(sourcePlan.teamId);
  const [season, setSeason] = useState('');
  const [name, setName] = useState(`${sourcePlan.name} (Copy)`);
  const [description, setDescription] = useState(sourcePlan.description || '');
  const [planConfig, setPlanConfig] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate: createPlan, isPending, error: mutationError } = useCreateAssessmentPlan();
  const { toast } = useToast();

  // Initialize with source plan data when dialog opens
  useEffect(() => {
    if (open) {
      setTeamId(sourcePlan.teamId);
      setSeason('');
      setName(`${sourcePlan.name} (Copy)`);
      setDescription(sourcePlan.description || '');
      // Deep clone the planConfig
      setPlanConfig(JSON.parse(JSON.stringify(sourcePlan.planConfig)));
      setErrors({});
    }
  }, [open, sourcePlan]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!teamId) newErrors.teamId = 'Team is required';
    if (!season.trim()) newErrors.season = 'Season is required (must be different from source)';
    if (!name.trim()) newErrors.name = 'Plan name is required';
    if (planConfig.length === 0) {
      newErrors.planConfig = 'At least one category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    if (!validateForm()) {
      return;
    }

    const input: CreateAssessmentPlanInput = {
      season: season.trim(),
      name: name.trim(),
      planConfig,
      description: description.trim() || undefined,
    };

    createPlan(
      { teamId, input },
      {
        onSuccess: (createdPlan) => {
          toast({
            title: 'Plan cloned successfully',
            description: `${createdPlan.name} has been created for ${createdPlan.teamId}`,
            variant: 'default',
          });
          onClone?.({ teamId, input });
          onOpenChange(false);
        },
        onError: (error: Error) => {
          let errorMessage = error.message;

          if (error.message.includes('409')) {
            errorMessage = 'A plan already exists for this team and season. Please choose a different season or team.';
          } else if (error.message.includes('FORBIDDEN') || error.message.includes('403')) {
            errorMessage = 'You do not have permission to create plans for this team.';
          } else if (error.message.includes('INVALID_PLAN_CONFIG')) {
            errorMessage = 'Invalid plan configuration. Please ensure all fields are filled correctly.';
          }

          toast({
            title: 'Failed to clone plan',
            description: errorMessage,
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Clone Assessment Plan</DialogTitle>
          <DialogDescription>
            Create a copy of "{sourcePlan.name}" for a new team or season
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error display */}
          {mutationError && (
            <div
              className="p-4 bg-red-50 border border-red-200 rounded-md"
              role="alert"
              aria-live="polite"
            >
              <p className="text-sm text-red-800">{mutationError.message}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team */}
            <div className="space-y-2">
              <Label htmlFor="clone-team">
                Team <span className="text-red-500">*</span>
              </Label>
              <TeamSelector
                value={teamId}
                onChange={(value) => {
                  setTeamId(value);
                  setErrors({ ...errors, teamId: '' });
                }}
                disabled={isPending}
              />
              {errors.teamId && (
                <p className="text-sm text-red-500" role="alert">
                  {errors.teamId}
                </p>
              )}
            </div>

            {/* Season */}
            <div className="space-y-2">
              <Label htmlFor="clone-season">
                Season <span className="text-red-500">*</span>
              </Label>
              <Input
                id="clone-season"
                type="text"
                placeholder="e.g., 2025-Q2, FY26, Summer 2025"
                value={season}
                onChange={(e) => {
                  setSeason(e.target.value);
                  setErrors({ ...errors, season: '' });
                }}
                disabled={isPending}
                required
                aria-required="true"
                aria-invalid={!!errors.season}
              />
              {errors.season && (
                <p className="text-sm text-red-500" role="alert">
                  {errors.season}
                </p>
              )}
              <p className="text-sm text-gray-500">
                Must be different from source ({sourcePlan.season})
              </p>
            </div>
          </div>

          {/* Plan Name */}
          <div className="space-y-2">
            <Label htmlFor="clone-name">
              Plan Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="clone-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors({ ...errors, name: '' });
              }}
              disabled={isPending}
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
            <Label htmlFor="clone-description">Description (Optional)</Label>
            <Textarea
              id="clone-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              rows={2}
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Cloning...' : 'Clone Plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
