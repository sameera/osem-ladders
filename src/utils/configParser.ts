
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
  const lines = markdown.split('\n');
  const screens: Screen[] = [];
  let currentScreen: Screen | null = null;
  let currentCoreArea: CoreArea | null = null;

  console.log('Parsing markdown with', lines.length, 'lines');

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and main headers
    if (!trimmed || trimmed.startsWith('# ')) continue;
    
    // Screen title (starts with -)
    if (trimmed.startsWith('- ') && !line.startsWith('\t')) {
      console.log('Found screen:', trimmed);
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
    else if (line.startsWith('\t- ')) {
      console.log('Found core area:', trimmed);
      if (currentScreen) {
        currentCoreArea = {
          name: trimmed.substring(2).trim(),
          levels: []
        };
        currentScreen.coreAreas.push(currentCoreArea);
      }
    }
    // Level content (numbered list with double tab)
    else if (line.startsWith('\t\t') && /^\s*\d+\./.test(trimmed)) {
      console.log('Found level:', trimmed);
      if (currentCoreArea) {
        const match = trimmed.match(/^(\d+)\.\s*(.+)$/);
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
  
  console.log('Parsed', screens.length, 'screens');
  return screens;
}
