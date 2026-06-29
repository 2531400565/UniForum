export interface LostAndFound {
  id: number;
  title: string;
  description: string;
  type: 'lost' | 'found';
  itemCategory: string;
  location: string | null;
  lostTime: string | null;
  images: string[] | null;
  contactInfo: string | null;
  status: 'open' | 'resolved' | 'closed';
  authorId: number;
  author?: import('./user').User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLostFoundRequest {
  title: string;
  description: string;
  type: 'lost' | 'found';
  itemCategory: string;
  location?: string;
  lostTime?: string;
  images?: string[];
  contactInfo?: string;
}
