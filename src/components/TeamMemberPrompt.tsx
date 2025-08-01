
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TeamMemberPromptProps {
  isOpen: boolean;
  onSubmit: (name: string) => void;
  onCancel?: () => void;
  title?: string;
  submitText?: string;
  cancelText?: string;
  showCancel?: boolean;
}


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

  // Check if this is a confirmation dialog (doesn't need name input)
  const isConfirmationDialog = title.includes("Start New Assessment") && showCancel;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isConfirmationDialog) {
      onSubmit('');
      return;
    }
    
    if (name.trim()) {
      onSubmit(name.trim());
      setName('');
    }
  };

  const handleCancel = () => {
    setName('');
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
            
            <div className="flex justify-end space-x-2">
              {showCancel && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  {cancelText}
                </Button>
              )}
              <Button type="submit" disabled={!name.trim()}>
                {submitText}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
