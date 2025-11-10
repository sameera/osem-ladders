export interface Expectation {
    level: number;
    content: string;
    description?: string;
}

export interface Competence {
    name: string;
    levels: Expectation[];
}

export interface Category {
    title: string;
    competencies: Competence[];
}
