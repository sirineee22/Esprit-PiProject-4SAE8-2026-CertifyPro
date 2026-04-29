// src/app/pages/jobs/core/models/api-response.model.ts

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}

export interface PageResponse<T> {
    content: T[];
    pageNo: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
}

export interface DashboardStats {
    totalOffers: number;
    draftOffers: number;
    publishedOffers: number;
    closedOffers: number;
    archivedOffers: number;
    totalApplications: number;
    pendingApplications: number;
    acceptedApplications: number;
    rejectedApplications: number;
    offersByContractType: { contractType: string; count: number }[];
    offersBySector: { sector: string; count: number }[];
    recentOffers: any[]; // we'll use JobOfferResponse below
}
