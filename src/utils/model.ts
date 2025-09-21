export interface Expectation {
  level: number;
  content: string;
  description?: string;
}

export interface CoreArea {
  name: string;
  levels: Expectation[];
}

export interface Category {
  title: string;
  coreAreas: CoreArea[];
}