
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownRenderer } from './MarkdownRenderer';
import { FeedbackPopup } from './FeedbackPopup';
import { CoreArea } from '@/utils/configParser';

interface TableCellProps {
  levelContent: any;
  coreArea: CoreArea;
  level: number;
  isSelected: boolean;
  onSelectionChange: (coreArea: string, level: number, evidence: string, nextLevelFeedback: string) => void;
  tooltipTextLimit: number;
  feedback?: { evidence: string; nextLevelFeedback: string };
}

export function TableCell({ 
  levelContent, 
  coreArea, 
  level, 
  isSelected, 
  onSelectionChange, 
  tooltipTextLimit,
  feedback
}: TableCellProps) {
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const hasDescription = levelContent.description && levelContent.description.trim();
  
  const shouldShowDialog = (description: string) => {
    return description.length > tooltipTextLimit;
  };

  const getTruncatedDescription = (description: string) => {
    if (description.length <= tooltipTextLimit) {
      return description;
    }
    return description.substring(0, tooltipTextLimit) + '...';
  };

  const handleCellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFeedbackPopup(true);
  };

  const handleFeedbackConfirm = (evidence: string, nextLevelFeedback: string) => {
    onSelectionChange(coreArea.name, level, evidence, nextLevelFeedback);
    setShowFeedbackPopup(false);
  };

  const handleFeedbackCancel = () => {
    setShowFeedbackPopup(false);
  };

  // Format content to show each sentence on a new line
  const formatContent = (content: string) => {
    return content
      .split(/(?<=[.!?])\s+/)
      .filter(sentence => sentence.trim())
      .map((sentence, index) => (
        <div key={index} className={index > 0 ? "mt-1" : ""}>
          {sentence.trim()}
        </div>
      ));
  };

  const cellButton = (
    <button
      onClick={handleCellClick}
      className={cn(
        "w-full h-full text-left p-3 rounded-md border transition-all duration-200",
        "hover:border-primary hover:shadow-md",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        isSelected 
          ? "border-primary bg-primary/10 text-primary shadow-md" 
          : "border-border bg-background hover:bg-accent",
        "cursor-pointer min-h-[80px] flex items-start"
      )}
    >
      <div className="text-sm leading-relaxed w-full">
        {formatContent(levelContent.content)}
      </div>
    </button>
  );

  if (!hasDescription) {
    return (
      <>
        {cellButton}
        <FeedbackPopup
          isOpen={showFeedbackPopup}
          onClose={handleFeedbackCancel}
          onConfirm={handleFeedbackConfirm}
          coreArea={coreArea}
          selectedLevel={level}
          initialEvidence={feedback?.evidence || ''}
          initialNextLevelFeedback={feedback?.nextLevelFeedback || ''}
        />
      </>
    );
  }

  const needsDialog = shouldShowDialog(levelContent.description);
  const truncatedDescription = getTruncatedDescription(levelContent.description);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cellButton}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm p-3">
            <div className="space-y-2">
              <MarkdownRenderer 
                content={truncatedDescription}
                className="text-sm"
              />
              {needsDialog && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-2">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Full Description
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>{levelContent.content}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="mt-4 max-h-[60vh]">
                      <MarkdownRenderer 
                        content={levelContent.description}
                        className="text-sm leading-relaxed pr-4"
                      />
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <FeedbackPopup
        isOpen={showFeedbackPopup}
        onClose={handleFeedbackCancel}
        onConfirm={handleFeedbackConfirm}
        coreArea={coreArea}
        selectedLevel={level}
        initialEvidence={feedback?.evidence || ''}
        initialNextLevelFeedback={feedback?.nextLevelFeedback || ''}
      />
    </>
  );
}
