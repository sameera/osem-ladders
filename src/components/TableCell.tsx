import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownRenderer } from './MarkdownRenderer';
import { FeedbackPopup } from './FeedbackPopup';

interface TableCellProps {
  level: number;
  content: string;
  description?: string;
  isSelected: boolean;
  evidence: string;
  nextLevelFeedback: string;
  onSelect: (evidence: string, nextLevelFeedback: string) => void;
  tooltipTextLimit: number;
}

export function TableCell({ 
  level,
  content,
  description,
  isSelected, 
  evidence,
  nextLevelFeedback,
  onSelect, 
  tooltipTextLimit
}: TableCellProps) {
  const [showFeedbackPopup, setShowFeedbackPopup] = useState<boolean>(false);
  const [showFullDescriptionDialog, setShowFullDescriptionDialog] = useState<boolean>(false);
  const hasDescription: boolean = !!(description && description.trim());
  
  const shouldShowDialog = (desc: string): boolean => {
    return desc.length > tooltipTextLimit;
  };

  const getTruncatedDescription = (desc: string): string => {
    if (desc.length <= tooltipTextLimit) {
      return desc;
    }
    return desc.substring(0, tooltipTextLimit) + '...';
  };

  const handleCellClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setShowFeedbackPopup(true);
  };

  const handleFeedbackConfirm = (newEvidence: string, newNextLevelFeedback: string): void => {
    onSelect(newEvidence, newNextLevelFeedback);
    setShowFeedbackPopup(false);
  };

  const handleFeedbackCancel = (): void => {
    setShowFeedbackPopup(false);
  };

  const handleSelectFromFullDescription = (): void => {
    setShowFullDescriptionDialog(false);
    setShowFeedbackPopup(true);
  };

  const handleViewFullDescription = (): void => {
    setShowFullDescriptionDialog(true);
  };

  // Format content to show each sentence on a new line
  const formatContent = (contentText: string): JSX.Element[] => {
    return contentText
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
        "cursor-pointer min-h-[120px] flex items-start"
      )}
    >
      <div className="text-sm leading-relaxed w-full">
        {formatContent(content)}
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
          level={level}
          content={content}
          description={description}
          initialEvidence={evidence}
          initialNextLevelFeedback={nextLevelFeedback}
        />
      </>
    );
  }

  const needsDialog: boolean = shouldShowDialog(description);
  const truncatedDescription: string = getTruncatedDescription(description);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cellButton}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm p-3">
            <div className="space-y-3">
              <MarkdownRenderer 
                content={truncatedDescription}
                className="text-sm"
              />
              {needsDialog && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleViewFullDescription}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Full Description
                </Button>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Dialog moved outside tooltip provider */}
      <Dialog open={showFullDescriptionDialog} onOpenChange={setShowFullDescriptionDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{content}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="mt-4 max-h-[60vh]">
            <MarkdownRenderer 
              content={description}
              className="text-sm leading-relaxed pr-4"
            />
          </ScrollArea>
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowFullDescriptionDialog(false)} className="flex-1">
              Close
            </Button>
            <Button onClick={handleSelectFromFullDescription} className="flex-1">
              Select L{level}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <FeedbackPopup
        isOpen={showFeedbackPopup}
        onClose={handleFeedbackCancel}
        onConfirm={handleFeedbackConfirm}
        level={level}
        content={content}
        description={description}
        initialEvidence={evidence}
        initialNextLevelFeedback={nextLevelFeedback}
      />
    </>
  );
}