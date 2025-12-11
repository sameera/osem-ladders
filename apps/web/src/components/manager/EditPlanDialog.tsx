/**
 * EditPlanDialog Component
 * Edit dialog with full plan builder
 */

import { FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AssessmentPlanForm } from './AssessmentPlanForm';
import { useCreateAssessmentPlan, useTogglePlanStatus } from '@/hooks/useAssessmentPlans';
import { useToast } from '@/hooks/use-toast';
import type { AssessmentPlan, CreateAssessmentPlanInput } from '@/types/assessments';

interface EditPlanDialogProps {
  plan?: AssessmentPlan;  // Optional - undefined for create mode
  mode?: 'create' | 'edit';  // Defaults to 'edit' for backward compatibility
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (data: { teamId: string; input: CreateAssessmentPlanInput }) => void;
}

export function EditPlanDialog({
  plan,
  mode,
  open,
  onOpenChange,
  onEdit,
}: EditPlanDialogProps) {
  const { mutate: updatePlan, isPending, error: mutationError } = useCreateAssessmentPlan();
  const { mutate: toggleStatus, isPending: isTogglingStatus } = useTogglePlanStatus();
  const { toast } = useToast();

  // Derive mode from prop or presence of plan
  const dialogMode = mode || (plan ? 'edit' : 'create');

  const handleSubmit = (data: { teamId: string; input: CreateAssessmentPlanInput }) => {
    updatePlan(data, {
      onSuccess: (resultPlan) => {
        toast({
          title: dialogMode === 'create' ? 'Assessment plan created successfully' : 'Plan updated successfully',
          description: dialogMode === 'create'
            ? `${resultPlan.name} has been created for ${resultPlan.teamId}.`
            : `${resultPlan.name} has been updated for ${resultPlan.teamId}`,
          variant: 'default',
        });
        onEdit?.(data);
        onOpenChange(false);
      },
      onError: (error: Error) => {
        let errorMessage = error.message;

        if (error.message.includes('FORBIDDEN') || error.message.includes('403')) {
          errorMessage = dialogMode === 'create'
            ? 'You do not have permission to create plans for this team.'
            : 'You do not have permission to edit this plan.';
        } else if (error.message.includes('INVALID_PLAN_CONFIG')) {
          errorMessage = 'Invalid plan configuration. Please ensure all fields are filled correctly.';
        } else if (error.message.includes('TEAM_NOT_FOUND')) {
          errorMessage = 'Team does not exist.';
        } else if (error.message.includes('UNAUTHORIZED') || error.message.includes('401')) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (error.message.includes('409')) {
          errorMessage = 'A plan already exists for this team and season.';
        }

        toast({
          title: dialogMode === 'create' ? 'Failed to create plan' : 'Failed to update plan',
          description: errorMessage,
          variant: 'destructive',
        });
      },
    });
  };

  const handleToggleStatus = () => {
    if (!plan) return;

    toggleStatus(
      { teamId: plan.teamId, season: plan.season },
      {
        onSuccess: (updatedPlan) => {
          const action = updatedPlan.isActive ? 'activated' : 'deactivated';
          toast({
            title: `Plan ${action} successfully`,
            description: `${updatedPlan.name} has been ${action}.`,
            variant: 'default',
          });
          onEdit?.({ teamId: plan.teamId, input: { season: plan.season, name: plan.name, planConfig: plan.planConfig, description: plan.description } });
          onOpenChange(false);
        },
        onError: (error: Error) => {
          toast({
            title: 'Failed to toggle plan status',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // Prevent closing dialog during submission
        if (!isPending && !isTogglingStatus) {
          onOpenChange(newOpen);
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {dialogMode === 'create' ? 'Create Assessment Plan' : 'Edit Assessment Plan'}
          </DialogTitle>
          <DialogDescription>
            {dialogMode === 'create'
              ? 'Define a career ladder framework for a team and season'
              : `Modify "${plan?.name}" for ${plan?.teamId} - ${plan?.season}`
            }
          </DialogDescription>
        </DialogHeader>

        <AssessmentPlanForm
          key={dialogMode === 'create' ? (open ? 'open' : 'closed') : undefined}
          mode={dialogMode}
          initialData={plan}
          onSubmit={handleSubmit}
          isLoading={isPending}
          error={mutationError}
          leftActions={
            dialogMode === 'edit' && plan ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleToggleStatus}
                disabled={isPending || isTogglingStatus}
              >
                {isTogglingStatus
                  ? plan.isActive ? 'Deactivating...' : 'Activating...'
                  : plan.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            ) : undefined
          }
        />
      </DialogContent>
    </Dialog>
  );
}
