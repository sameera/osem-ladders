
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      </DialogContent>
    </Dialog>
  );
}
