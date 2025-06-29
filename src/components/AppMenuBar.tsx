
import React from 'react';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar';

interface AppMenuBarProps {
  onNewAssessment: () => void;
}

export function AppMenuBar({ onNewAssessment }: AppMenuBarProps) {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>Assessment</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={onNewAssessment}>
            New assessment...
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
