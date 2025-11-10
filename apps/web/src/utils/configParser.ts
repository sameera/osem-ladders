import { Category, Competence, Expectation } from "../data/model";

export function parseLevels(markdown: string): Record<number, string> {
    const lines = markdown.split("\n");
    const levels: Record<number, string> = {};

    for (const line of lines) {
        const trimmed = line.trim();

        // Parse numbered list items (e.g., "1. Apprentice")
        const match = trimmed.match(/^(\d+)\.\s*(.+)$/);
        if (match) {
            const levelNumber = parseInt(match[1], 10);
            const levelName = match[2].trim();
            levels[levelNumber] = levelName;
        }
    }

    return levels;
}

export function parseConfig(markdown: string): Category[] {
    const lines = markdown.split("\n");
    const categories: Category[] = [];
    let currentCategory: Category | null = null;
    let currentCompetence: Competence | null = null;
    let currentLevel: Expectation | null = null;
    let collectingDescription = false;
    let descriptionLines: string[] = [];

    console.log("Parsing markdown with", lines.length, "lines");

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty lines
        if (!trimmed) {
            if (collectingDescription) {
                // Empty line might be part of description formatting
                descriptionLines.push("");
            }
            continue;
        }

        // Check if we're currently collecting a description
        if (collectingDescription) {
            // Check if this line starts a new level, competence, or category
            const isNewLevel = /^\d+\./.test(trimmed);
            const isNewCompetence = trimmed.startsWith("## ");
            const isNewCategory = trimmed.startsWith("# ");

            if (isNewLevel || isNewCompetence || isNewCategory) {
                // Finish collecting description for previous level
                if (currentLevel && descriptionLines.length > 0) {
                    currentLevel.description = descriptionLines
                        .join("\n")
                        .trim();
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
        if (trimmed.startsWith("# ")) {
            console.log("Found category:", trimmed);
            if (currentCategory) {
                categories.push(currentCategory);
            }
            currentCategory = {
                title: trimmed.substring(2).trim(),
                competencies: [],
            };
            currentCompetence = null;
            currentLevel = null;
        }
        // Competence (starts with ##)
        else if (trimmed.startsWith("## ")) {
            console.log("Found competence:", trimmed);
            if (currentCategory) {
                currentCompetence = {
                    name: trimmed.substring(3).trim(),
                    levels: [],
                };
                currentCategory.competencies.push(currentCompetence);
            }
            currentLevel = null;
        }
        // Level content (numbered list)
        else if (/^\d+\./.test(trimmed)) {
            console.log("Found level:", trimmed);
            if (currentCompetence) {
                const match = trimmed.match(/^(\d+)\.\s*(.+)$/);
                if (match) {
                    currentLevel = {
                        level: parseInt(match[1], 10),
                        content: match[2].trim(),
                    };
                    currentCompetence.levels.push(currentLevel);

                    // Start collecting description for this level
                    collectingDescription = true;
                    descriptionLines = [];
                }
            }
        }
    }

    // Handle any remaining description at end of file
    if (collectingDescription && currentLevel && descriptionLines.length > 0) {
        currentLevel.description = descriptionLines.join("\n").trim();
    }

    // Add the last category
    if (currentCategory) {
        categories.push(currentCategory);
    }

    console.log("Parsed", categories.length, "categories");
    return categories;
}
