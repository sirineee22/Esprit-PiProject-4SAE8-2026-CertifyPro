export interface Post {
    id: number;
    userId: number;
    title: string;
    content: string;
    imageUrl?: string;
    createdAt: string;
    reactionCount: number;
    commentCount: number;
    isLikedByCurrentUser: boolean;
}
