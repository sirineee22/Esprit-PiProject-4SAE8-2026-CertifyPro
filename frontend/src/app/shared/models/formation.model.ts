export type ProgressStatus = 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';

export interface Progression {
    id?: number;
    status: ProgressStatus;
    lastUpdated?: string;
    formation?: { id: number };
}

export interface Training {
    id?: number;
    title: string;
    description: string;
    level: string;
    duration: string;
    trainingType: 'PDF' | 'VIDEO';
    contentUrl?: string;
    progression?: Progression;
}
