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
import { AssessmentPlanForm } from './AssessmentPlanForm';
import { useCreateAssessmentPlan } from '@/hooks/useAssessmentPlans';
import { useToast } from '@/hooks/use-toast';
import type { AssessmentPlan, CreateAssessmentPlanInput } from '@/types/assessments';

interface EditPlanDialogProps {
  plan: AssessmentPlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (data: { teamId: string; input: CreateAssessmentPlanInput }) => void;
}

export function EditPlanDialog({
  plan,
  open,
  onOpenChange,
  onEdit,
}: EditPlanDialogProps) {
  const { mutate: updatePlan, isPending, error: mutationError } = useCreateAssessmentPlan();
  const { toast } = useToast();

  const handleSubmit = (data: { teamId: string; input: CreateAssessmentPlanInput }) => {
    updatePlan(data, {
      onSuccess: (updatedPlan) => {
        toast({
          title: 'Plan updated successfully',
          description: `${updatedPlan.name} has been updated for ${updatedPlan.teamId}`,
          variant: 'default',
        });
        onEdit?.(data);
        onOpenChange(false);
      },
      onError: (error: Error) => {
        let errorMessage = error.message;

        if (error.message.includes('FORBIDDEN') || error.message.includes('403')) {
          errorMessage = 'You do not have permission to edit this plan.';
        } else if (error.message.includes('INVALID_PLAN_CONFIG')) {
          errorMessage = 'Invalid plan configuration. Please ensure all fields are filled correctly.';
        } else if (error.message.includes('TEAM_NOT_FOUND')) {
          errorMessage = 'Team does not exist.';
        } else if (error.message.includes('UNAUTHORIZED') || error.message.includes('401')) {
          errorMessage = 'Authentication required. Please log in again.';
        }

        toast({
          title: 'Failed to update plan',
          description: errorMessage,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Assessment Plan</DialogTitle>
          <DialogDescription>
            Modify "{plan.name}" for {plan.teamId} - {plan.season}
          </DialogDescription>
        </DialogHeader>

        <AssessmentPlanForm
          mode="edit"
          initialData={plan}
          onSubmit={handleSubmit}
          isLoading={isPending}
          error={mutationError}
        />
      </DialogContent>
    </Dialog>
  );
}
