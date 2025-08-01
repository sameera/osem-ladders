
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CoreArea } from '@/utils/model';
import { cn } from '@/lib/utils';

interface FeedbackPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (evidence: string, nextLevelFeedback: string) => void;
  coreArea: CoreArea;
  selectedLevel: number;
  initialEvidence?: string;
  initialNextLevelFeedback?: string;
}

export function FeedbackPopup({
  isOpen,
  onClose,
  onConfirm,
  coreArea,
  selectedLevel,
  initialEvidence = '',
  initialNextLevelFeedback = ''
}: FeedbackPopupProps) {
  const [evidence, setEvidence] = useState(initialEvidence);
  const [nextLevelFeedback, setNextLevelFeedback] = useState(initialNextLevelFeedback);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    setEvidence(initialEvidence);
    setNextLevelFeedback(initialNextLevelFeedback);
  }, [initialEvidence, initialNextLevelFeedback, isOpen]);

  const selectedLevelData = coreArea.levels.find(l => l.level === selectedLevel);
  const nextLevelData = coreArea.levels.find(l => l.level === selectedLevel + 1);

  const handleConfirm = () => {
    if (!evidence.trim()) {
      alert('Evidence is required');
      return;
    }
    onConfirm(evidence, nextLevelFeedback);
  };

  const handleCancel = () => {
    onClose();
  };

  if (!selectedLevelData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {coreArea.name} - L{selectedLevel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Level Content */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="font-medium text-lg mb-2">{selectedLevelData.content}</p>
            
            {/* Description (Collapsible) */}
            {selectedLevelData.description && (
              <Collapsible open={isDescriptionExpanded} onOpenChange={setIsDescriptionExpanded}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <span>Description</span>
                  {isDescriptionExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <ScrollArea className="max-h-48 pr-4 overflow-y-auto">
                    <MarkdownRenderer 
                      content={selectedLevelData.description}
                      className="text-sm text-muted-foreground"
                    />
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>

          {/* Two Column Feedback Table */}
          <div className="grid grid-cols-2 gap-4">
            {/* Evidence Column */}
            <div className="space-y-2">
              <h3 className="font-semibold text-center bg-muted/50 py-2 rounded-t-lg">
                L{selectedLevel}
              </h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Evidence for this level <span className="text-destructive">*</span>
                </label>
                <Textarea
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="Provide evidence that demonstrates this level..."
                  className="min-h-[120px] resize-none"
                  required
                />
              </div>
            </div>

            {/* Next Level Column */}
            <div className="space-y-2">
              <h3 className="font-semibold text-center bg-muted/50 py-2 rounded-t-lg">
                {nextLevelData ? `L${selectedLevel + 1}` : `L${selectedLevel + 1}+`}
              </h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  What L{selectedLevel + 1} could have looked like...
                </label>
                <Textarea
                  value={nextLevelFeedback}
                  onChange={(e) => setNextLevelFeedback(e.target.value)}
                  placeholder="Describe what the next level would look like..."
                  className="min-h-[120px] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Save Selection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
