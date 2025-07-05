
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TeamMemberPromptProps {
  isOpen: boolean;
  onSubmit: (name: string, currentLevel?: number) => void;
  onCancel?: () => void;
  title?: string;
  submitText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

const levelOptions = [
  { value: 1, label: "SE1 - Software Engineer I" },
  { value: 2, label: "SE2 - Software Engineer II" },
  { value: 3, label: "SE3 - Senior Software Engineer I" },
  { value: 4, label: "SE4 - Senior Software Engineer II" },
  { value: 5, label: "SE5 - Staff Engineer" },
  { value: 6, label: "SE6 - Senior Staff Engineer" },
  { value: 7, label: "SE7 - Principal Engineer" },
];

export function TeamMemberPrompt({ 
  isOpen, 
  onSubmit, 
  onCancel,
  title = "New Assessment",
  submitText = "Start Assessment",
  cancelText = "Cancel",
  showCancel = false
}: TeamMemberPromptProps) {
  const [name, setName] = useState('');
  const [currentLevel, setCurrentLevel] = useState<number | undefined>(undefined);

  // Check if this is a confirmation dialog (doesn't need name input)
  const isConfirmationDialog = title.includes("Start New Assessment") && showCancel;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isConfirmationDialog) {
      onSubmit('');
      return;
    }
    
    if (name.trim() && currentLevel !== undefined) {
      onSubmit(name.trim(), currentLevel);
      setName('');
      setCurrentLevel(undefined);
    }
  };

  const handleCancel = () => {
    setName('');
    setCurrentLevel(undefined);
    onCancel?.();
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        </DialogHeader>
        
        {isConfirmationDialog ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to start a new assessment? This will clear all current data and cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                {cancelText}
              </Button>
              <Button type="button" onClick={() => onSubmit('')}>
                {submitText}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-member-name" className="text-sm font-medium">
                Assessment for <span className="text-destructive">*</span>
              </Label>
              <Input
                id="team-member-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter team member's name"
                className="w-full"
                required
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="current-level" className="text-sm font-medium">
                Current Level <span className="text-destructive">*</span>
              </Label>
              <Select value={currentLevel?.toString()} onValueChange={(value) => setCurrentLevel(parseInt(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select current level" />
                </SelectTrigger>
                <SelectContent>
                  {levelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              {showCancel && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  {cancelText}
                </Button>
              )}
              <Button type="submit" disabled={!name.trim() || currentLevel === undefined}>
                {submitText}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
