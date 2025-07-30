
export interface LevelContent {
  level: number;
  content: string;
  description?: string;
}

export interface CoreArea {
  name: string;
  levels: LevelContent[];
}

export interface Screen {
  title: string;
  coreAreas: CoreArea[];
}

export function parseConfig(markdown: string): Screen[] {
  const lines = markdown.split('\n');
  const screens: Screen[] = [];
  let currentScreen: Screen | null = null;
  let currentCoreArea: CoreArea | null = null;
  let currentLevel: LevelContent | null = null;
  let collectingDescription = false;
  let descriptionLines: string[] = [];

  console.log('Parsing markdown with', lines.length, 'lines');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) {
      if (collectingDescription) {
        // Empty line might be part of description formatting
        descriptionLines.push('');
      }
      continue;
    }
    
    // Check if we're currently collecting a description
    if (collectingDescription) {
      // Check if this line starts a new level, core area, or screen
      const isNewLevel = /^\d+\./.test(trimmed);
      const isNewCoreArea = trimmed.startsWith('## ');
      const isNewScreen = trimmed.startsWith('# ');
      
      if (isNewLevel || isNewCoreArea || isNewScreen) {
        // Finish collecting description for previous level
        if (currentLevel && descriptionLines.length > 0) {
          currentLevel.description = descriptionLines.join('\n').trim();
        }
        collectingDescription = false;
        descriptionLines = [];
        currentLevel = null;
        
        // Don't skip this line, process it normally
      } else {
        // Continue collecting description
        descriptionLines.push(line);
        continue;
      }
    }
    
    // Screen title (starts with #)
    if (trimmed.startsWith('# ')) {
      console.log('Found screen:', trimmed);
      if (currentScreen) {
        screens.push(currentScreen);
      }
      currentScreen = {
        title: trimmed.substring(2).trim(),
        coreAreas: []
      };
      currentCoreArea = null;
      currentLevel = null;
    }
    // Core area (starts with ##)
    else if (trimmed.startsWith('## ')) {
      console.log('Found core area:', trimmed);
      if (currentScreen) {
        currentCoreArea = {
          name: trimmed.substring(3).trim(),
          levels: []
        };
        currentScreen.coreAreas.push(currentCoreArea);
      }
      currentLevel = null;
    }
    // Level content (numbered list)
    else if (/^\d+\./.test(trimmed)) {
      console.log('Found level:', trimmed);
      if (currentCoreArea) {
        const match = trimmed.match(/^(\d+)\.\s*(.+)$/);
        if (match) {
          currentLevel = {
            level: parseInt(match[1], 10),
            content: match[2].trim()
          };
          currentCoreArea.levels.push(currentLevel);
          
          // Start collecting description for this level
          collectingDescription = true;
          descriptionLines = [];
        }
      }
    }
  }
  
  // Handle any remaining description at end of file
  if (collectingDescription && currentLevel && descriptionLines.length > 0) {
    currentLevel.description = descriptionLines.join('\n').trim();
  }
  
  // Add the last screen
  if (currentScreen) {
    screens.push(currentScreen);
  }
  
  console.log('Parsed', screens.length, 'screens');
  return screens;
}
