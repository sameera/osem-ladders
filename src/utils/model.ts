export interface LevelContent {
  level: number;
  content: string;
  description?: string;
}

export interface CoreArea {
  name: string;
  levels: LevelContent[];
}

export interface Category {
  title: string;
  coreAreas: CoreArea[];
}