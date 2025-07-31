import { Category, CoreArea, LevelContent } from "./model";

export function parseConfig(markdown: string): Category[] {
  const lines = markdown.split('\n');
  const categories: Category[] = [];
  let currentCategory: Category | null = null;
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
      // Check if this line starts a new level, core area, or category
      const isNewLevel = /^\d+\./.test(trimmed);
      const isNewCoreArea = trimmed.startsWith('## ');
      const isNewCategory = trimmed.startsWith('# ');
      
      if (isNewLevel || isNewCoreArea || isNewCategory) {
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
    
    // Category title (starts with #)
    if (trimmed.startsWith('# ')) {
      console.log('Found category:', trimmed);
      if (currentCategory) {
        categories.push(currentCategory);
      }
      currentCategory = {
        title: trimmed.substring(2).trim(),
        coreAreas: []
      };
      currentCoreArea = null;
      currentLevel = null;
    }
    // Core area (starts with ##)
    else if (trimmed.startsWith('## ')) {
      console.log('Found core area:', trimmed);
      if (currentCategory) {
        currentCoreArea = {
          name: trimmed.substring(3).trim(),
          levels: []
        };
        currentCategory.coreAreas.push(currentCoreArea);
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
  
  // Add the last category
  if (currentCategory) {
    categories.push(currentCategory);
  }
  
  console.log('Parsed', categories.length, 'categories');
  return categories;
}
