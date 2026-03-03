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
    role?: Role;
    active?: boolean;
}
