export interface Comment {
    id: number;
    postId: number;
    userId: number;
    content: string;
    commentDate: string; // ISO date string
}
