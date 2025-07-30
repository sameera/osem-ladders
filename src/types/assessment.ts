export interface LevelContent {
  level: number;
  content: string;
  description?: string;
}

export interface CoreArea {
  id: string;
  name: string;
  levels: LevelContent[];
}

export interface Category {
  id: string;
  title: string;
  coreAreas: CoreArea[];
}

export interface AssessmentSelection {
  id: string;
  categoryId: string;
  coreAreaId: string;
  level: number;
  evidence: string;
  nextLevelFeedback: string;
}

export interface AssessmentState {
  teamMemberName: string;
  currentLevel: number;
  selections: AssessmentSelection[];
}

export interface CategoryLookup {
  [categoryId: string]: Category;
}

export interface CoreAreaLookup {
  [coreAreaId: string]: CoreArea;
}