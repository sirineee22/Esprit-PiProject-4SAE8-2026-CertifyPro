export interface AuditLog {
    id: number;
    action: string;
    actorId?: number;
    actorEmail?: string;
    targetType?: string;
    targetId?: string;
    details?: string;
    createdAt: string;
}
