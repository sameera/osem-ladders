
import React from 'react';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CoreArea } from '@/utils/configParser';

interface TableCellProps {
  levelContent: any;
  coreArea: CoreArea;
  level: number;
  isSelected: boolean;
  onSelectionChange: (coreArea: string, level: number) => void;
  tooltipTextLimit: number;
}

export function TableCell({ 
  levelContent, 
  coreArea, 
  level, 
  isSelected, 
  onSelectionChange, 
  tooltipTextLimit 
}: TableCellProps) {
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

  const cellButton = (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onSelectionChange(coreArea.name, level);
      }}
      className={cn(
        "w-full text-left p-3 rounded-md border transition-all duration-200",
        "hover:border-primary hover:shadow-md",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        isSelected 
          ? "border-primary bg-primary/10 text-primary shadow-md" 
          : "border-border bg-background hover:bg-accent",
        "cursor-pointer"
      )}
    >
      <div className="text-sm leading-relaxed">
        {levelContent.content}
      </div>
    </button>
  );

  if (!hasDescription) {
    return cellButton;
  }

  const needsDialog = shouldShowDialog(levelContent.description);
  const truncatedDescription = getTruncatedDescription(levelContent.description);

  return (
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
  );
}
