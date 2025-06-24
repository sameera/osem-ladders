
export interface LevelContent {
  level: number;
  content: string;
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
  const lines = markdown.split('\n').filter(line => line.trim());
  const screens: Screen[] = [];
  let currentScreen: Screen | null = null;
  let currentCoreArea: CoreArea | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and headers
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // Screen title (starts with -)
    if (trimmed.startsWith('- ') && !trimmed.match(/^\s*-\s+[a-zA-Z]/)) {
      if (currentScreen) {
        screens.push(currentScreen);
      }
      currentScreen = {
        title: trimmed.substring(2).trim(),
        coreAreas: []
      };
      currentCoreArea = null;
    }
    // Core area (indented with tab and -)
    else if (trimmed.match(/^\t- /)) {
      if (currentScreen) {
        currentCoreArea = {
          name: trimmed.substring(3).trim(),
          levels: []
        };
        currentScreen.coreAreas.push(currentCoreArea);
      }
    }
    // Level content (numbered list with double tab)
    else if (trimmed.match(/^\t\t\d+\. /)) {
      if (currentCoreArea) {
        const match = trimmed.match(/^\t\t(\d+)\. (.+)$/);
        if (match) {
          currentCoreArea.levels.push({
            level: parseInt(match[1], 10),
            content: match[2].trim()
          });
        }
      }
    }
  }
  
  // Add the last screen
  if (currentScreen) {
    screens.push(currentScreen);
  }
  
  return screens;
}
