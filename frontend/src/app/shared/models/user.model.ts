export interface Role {
    id: number;
    name: string;
}

export interface User {
    id?: number;
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    phoneNumber?: string;
    profileImageUrl?: string;
    role?: Role;
    active?: boolean;
    lastLogin?: string;
    lastActivityAt?: string;
    isTwoFactorEnabled?: boolean;
}

export interface UserBadge {
    id: number;
    userId: number;
    badgeKey: string;
    badgeLabel: string;
    earnedAt: string;
}

export interface UserProgress {
    xpTotal: number;
    levelNumber: number;
    levelLabel: string;
    xpToNextLevel: number;
    badges: UserBadge[];
}
