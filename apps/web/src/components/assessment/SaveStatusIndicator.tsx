/**
 * Save Status Indicator Component
 * Displays auto-save status with appropriate visual feedback
 */

import React from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { SaveStatus } from '@/hooks/useAssessmentReviewLogic';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSavedAt: number | null;
  onRetry?: () => void;
}

export function SaveStatusIndicator({ status, lastSavedAt, onRetry }: SaveStatusIndicatorProps) {
  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (status === 'idle') {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {status === 'saving' && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-muted-foreground">Saving...</span>
        </>
      )}

      {status === 'saved' && lastSavedAt && (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-muted-foreground">
            Saved {getTimeAgo(lastSavedAt)}
          </span>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-600">Failed to save</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Retry
            </button>
          )}
        </>
      )}
    </div>
  );
}
