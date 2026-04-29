export interface FormationStats {
    formationId: number;
    formationTitle: string;
    studentCount: number;
    averageScore: number;
    successRate: number;
}

export interface Stats {
    totalStudents: number;
    totalEvaluations: number;
    averageScore: number;
    successRate: number;
    formationStats: FormationStats[];
}
