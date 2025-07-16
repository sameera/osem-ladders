import React from 'react';
import { TeamMemberPrompt } from '@/components/TeamMemberPrompt';

interface AssessmentPromptsProps {
  showTeamMemberPrompt: boolean;
  showConfirmNewAssessment: boolean;
  showNewAssessmentPrompt: boolean;
  onTeamMemberSubmit: (name: string, level?: number) => void;
  onConfirmNewAssessment: () => void;
  onCancelConfirmNewAssessment: () => void;
  onStartNewAssessment: () => void;
  onCancelNewAssessment: () => void;
}

export function AssessmentPrompts({
  showTeamMemberPrompt,
  showConfirmNewAssessment,
  showNewAssessmentPrompt,
  onTeamMemberSubmit,
  onConfirmNewAssessment,
  onCancelConfirmNewAssessment,
  onStartNewAssessment,
  onCancelNewAssessment
}: AssessmentPromptsProps) {
  return (
    <>
      <TeamMemberPrompt
        isOpen={showTeamMemberPrompt}
        onSubmit={onTeamMemberSubmit}
      />
      
      <TeamMemberPrompt
        isOpen={showConfirmNewAssessment}
        onSubmit={onConfirmNewAssessment}
        onCancel={onCancelConfirmNewAssessment}
        title="Start New Assessment"
        submitText="Yes, Start New"
        cancelText="Cancel"
        showCancel={true}
      />
      
      <TeamMemberPrompt
        isOpen={showNewAssessmentPrompt}
        onSubmit={onStartNewAssessment}
        onCancel={onCancelNewAssessment}
        title="Start New Assessment"
        submitText="Start New Assessment"
        cancelText="Keep Current Assessment"
        showCancel={true}
      />
    </>
  );
}