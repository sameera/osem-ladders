
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TeamMemberPromptProps {
  isOpen: boolean;
  onSubmit: (name: string) => void;
}

export function TeamMemberPrompt({ isOpen, onSubmit }: TeamMemberPromptProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">New Assessment</DialogTitle>
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
          
          <div className="flex justify-end">
            <Button type="submit" disabled={!name.trim()}>
              Start Assessment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
