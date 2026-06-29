export interface Board {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  category: 'department' | 'interest' | 'academic';
  sortOrder: number;
  postCount: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  boardId: number;
  authorId: number;
  type: 'normal' | 'pinned' | 'announcement';
  status: 'active' | 'hidden' | 'deleted';
  viewCount: number;
  likeCount: number;
  commentCount: number;
  author?: import('./user').User;
  board?: Board;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  content: string;
  postId: number;
  authorId: number;
  parentId: number | null;
  replyToId: number | null;
  status: 'active' | 'deleted';
  author?: import('./user').User;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  boardId: number;
  type?: 'normal' | 'pinned';
}

export interface CreateCommentRequest {
  content: string;
  parentId?: number;
  replyToId?: number;
}
