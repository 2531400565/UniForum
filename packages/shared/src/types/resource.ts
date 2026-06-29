export interface Resource {
  id: number;
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  category: 'slides' | 'notes' | 'booklist' | 'exam' | 'other';
  subject: string | null;
  downloadCount: number;
  avgRating: number;
  ratingCount: number;
  status: 'active' | 'pending' | 'rejected' | 'deleted';
  uploaderId: number;
  uploader?: import('./user').User;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceRating {
  id: number;
  resourceId: number;
  userId: number;
  rating: number;
  review: string | null;
  user?: import('./user').User;
  createdAt: string;
}
