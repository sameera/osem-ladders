
import React, { useRef } from 'react';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { Menu } from 'lucide-react';

interface AppMenuBarProps {
  onNewAssessment: () => void;
  onOpenAssessment: (data: any) => void;
}

export function AppMenuBar({ onNewAssessment, onOpenAssessment }: AppMenuBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          onOpenAssessment(data);
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          alert('Invalid JSON file format');
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid JSON file');
    }
    // Reset the input value so the same file can be selected again
    event.target.value = '';
  };

  return (
    <>
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>
            <Menu className="h-4 w-4" />
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={onNewAssessment}>
              New assessment...
            </MenubarItem>
            <MenubarItem onClick={handleOpenClick}>
              Open assessment...
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </>
  );
}
